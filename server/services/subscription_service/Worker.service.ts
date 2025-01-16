import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import type { Job } from 'bullmq';
import { Product, Subscription } from '../../models/relational';
import { sequelize } from '../../config/db';
import type { Transaction } from 'sequelize';
import { ShippingService } from '../Shipping.service';
import { PaymentService } from '../Payment.service';
import { OrderService } from '../Order.service';
import { ProductNotFoundError } from '../../errors';

interface OrderItem {
    productId: number;
    quantity: number;
}

type WeightRange = 'light' | 'standard' | 'heavy';

async function processPayment(job: Job): Promise<WeightRange> {
    const shippingService = new ShippingService();
    const paymentService = new PaymentService(process.env.STRIPE_KEY as string);

    const productTotal: number = await Promise.all(
        job.data.orderItems.map(async (item: OrderItem) => {
            const product = await Product.findByPk(item.productId, {
                attributes: ['price'],
            });

            if (!product) {
                throw new ProductNotFoundError();
            }

            return product.price * item.quantity;
        })
    ).then((prices) => prices.reduce((acc, price) => acc + price, 0));

    const { cost: shippingCost, weightRange } =
        await shippingService.calculateShippingCost(
            job.data.shippingCountry,
            'next-day',
            undefined,
            job.data.orderItems
        );

    const totalAmount: number = parseFloat(
        (productTotal + shippingCost).toFixed(2)
    );

    await paymentService.createPaymentIntent(
        job.data.userId,
        totalAmount,
        job.data.currency,
        job.data.paymentMethodId
    );

    console.log('Payment intent created successfully!');

    return weightRange;
}

export class WorkerService {
    private connection: IORedis;
    private worker: Worker;

    constructor(queueName: string) {
        this.connection = new IORedis({ maxRetriesPerRequest: null });
        this.worker = this.instantiateWorker(queueName);
    }

    private instantiateWorker(queueName: string): Worker {
        return new Worker(
            queueName,
            async (job: Job) => {
                try {
                    return await processPayment(job);
                } catch (error) {
                    console.error(error);
                    throw new Error(
                        `"${queueName}" worker couldn't process it.`
                    );
                }
            },
            {
                concurrency: 50,
                connection: this.connection,
            }
        );
    }

    public listen() {
        this.worker.on('completed', async (job: Job, returnValue) => {
            console.log(`Job: ${job.id} has completed`);

            const paymentDate = new Date().toISOString().split('T')[0];
            const nextPaymentDate = new Date(Date.now() + job.data.period)
                .toISOString()
                .split('T')[0];

            const orderService = new OrderService();

            const transaction: Transaction = await sequelize.transaction();

            try {
                const order = await orderService.createOrder(
                    job.data.userId,
                    job.data.orderItems,
                    job.data.paymentMethod,
                    job.data.shippingCountry,
                    returnValue,
                    'next-day',
                    transaction
                );

                const subscriptionData = {
                    customerId: order.customerId,
                    orderId: order.id,
                    startDate: job.data.startDate,
                    endDate: job.data.endDate,
                    lastPaymentDate: paymentDate,
                    nextPaymentDate,
                };

                await Subscription.create(subscriptionData, { transaction });

                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                console.error("Error from worker's complete event: ", error);
                // Notify admins
            }
        });

        this.worker.on('failed', (job, err) => {
            console.log(
                `Job${job ? ` with id "${job.id}"` : ''} has failed because ${err.message}`
            );
            // Admin notification operation..
        });

        this.worker.on('error', (err) => {
            console.error('Error from worker: ', err);
        });
    }
}
