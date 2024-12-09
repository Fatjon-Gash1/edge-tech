import { Request, Response } from 'express';
import { AnalyticsService, AdminLogsService } from '../services';
import {
    CategoryNotFoundError,
    ProductNotFoundError,
    InvalidStockStatusError,
    ReportNotFoundError,
    UserNotFoundError,
    AdminLogInvalidTargetError,
} from '../errors';
import { JwtPayload } from 'jsonwebtoken';

export class AnalyticsController {
    analyticsService: AnalyticsService;
    adminLogsService: AdminLogsService;

    constructor(
        analyticsService: AnalyticsService,
        adminLogsService: AdminLogsService
    ) {
        this.analyticsService = analyticsService;
        this.adminLogsService = adminLogsService;
    }

    public async generateSalesReport(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;

        try {
            await this.analyticsService.generateSalesReport(username);
            res.status(201).json({
                message: 'Sales report generated successfully',
            });

            await this.adminLogsService.log(username, 'sales report', 'create');
        } catch (error) {
            // Curious about the response delivery.. TEST
            if (error instanceof UserNotFoundError) {
                console.error('Error generating sales report: ', error);
                return res.status(404).json({ message: error.message });
            }
            if (error instanceof AdminLogInvalidTargetError) {
                console.error('Error generating sales report: ', error);
                return res.status(400).json({ message: error.message });
            }

            console.error('Error generating sales report: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async generateStockReport(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;

        try {
            await this.analyticsService.generateStockReport(username);
            res.status(201).json({
                message: 'Stock report generated successfully',
            });

            await this.adminLogsService.log(username, 'stock report', 'create');
        } catch (error) {
            console.error('Error generating stock report: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getTotalProductPurchases(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const { purchasesCount, products } =
                await this.analyticsService.getTotalProductPurchases();
            return res.status(200).json({ purchasesCount, products });
        } catch (error) {
            console.error('Error getting total product purchases: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getTotalProductRevenue(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const totalProductRevenue =
                await this.analyticsService.getTotalProductRevenue();
            return res.status(200).json({ totalProductRevenue });
        } catch (error) {
            console.error('Error getting total product revenue: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getTotalRevenue(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const totalRevenue = await this.analyticsService.getTotalRevenue();
            return res.status(200).json({ totalRevenue });
        } catch (error) {
            console.error('Error getting total revenue: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getAverageOrderValue(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const averageOrderValue =
                await this.analyticsService.getAverageOrderValue();
            return res.status(200).json({ averageOrderValue });
        } catch (error) {
            console.error('Error getting average order value: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getCategoryWithMostPurchases(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const { categoryName, purchaseCount } =
                await this.analyticsService.getCategoryWithMostPurchases();
            return res.status(200).json({ categoryName, purchaseCount });
        } catch (error) {
            if (error instanceof CategoryNotFoundError) {
                console.error(
                    'Error getting category with most purchases: ',
                    error
                );
                return res.status(404).json({ message: error.message });
            }

            console.error(
                'Error getting category with most purchases: ',
                error
            );
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getTotalProductPurchasesForCustomer(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const customerId: number = Number(req.params.id);

        try {
            const { totalCount, products } =
                await this.analyticsService.getTotalProductPurchasesForCustomer(
                    customerId
                );
            return res.status(200).json({ totalCount, products });
        } catch (error) {
            console.error(
                'Error getting total product purchases for customer: ',
                error
            );
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getCategoryWithMostPurchasesByCustomer(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const customerId: number = Number(req.params.id);

        try {
            const { categoryName, purchaseCount } =
                await this.analyticsService.getCategoryWithMostPurchasesByCustomer(
                    customerId
                );
            return res.status(200).json({ categoryName, purchaseCount });
        } catch (error) {
            if (error instanceof CategoryNotFoundError) {
                console.error(
                    'Error getting category with most purchases by customer: ',
                    error
                );
                return res.status(404).json({ message: error.message });
            }

            console.error(
                'Error getting category with most purchases by customer: ',
                error
            );
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getTopSellingProducts(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const limit: number = Number(req.query.limit);

        try {
            const products =
                await this.analyticsService.getTopSellingProducts(limit);
            return res.status(200).json({ products });
        } catch (error) {
            console.error('Error getting top selling products: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getProductViews(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const productId: number = Number(req.params.id);

        try {
            const productViews =
                await this.analyticsService.getProductViews(productId);
            return res.status(200).json({ productViews });
        } catch (error) {
            if (error instanceof ProductNotFoundError) {
                console.error('Error getting product views: ', error);
                return res.status(404).json({ message: error.message });
            }

            console.error('Error getting product views: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getCategoryPurchases(
        _req: Request,
        res: Response
    ): Promise<void | Response> {
        try {
            const categories =
                await this.analyticsService.getCategoryPurchases();
            return res.status(200).json({ categories });
        } catch (error) {
            console.error('Error getting category purchases: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getProductsByStockStatus(
        // might have to remove this one...
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const status: string = String(req.query.status);

        try {
            const { total, rows } =
                await this.analyticsService.getProductsByStockStatus(status);
            return res
                .status(200)
                .json({ totalProducts: total, products: rows });
        } catch (error) {
            console.error('Error getting products by stock status: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getStockDataForCategoryByStatus(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const status: string = String(req.query.status);

        try {
            const stockData =
                await this.analyticsService.getStockDataForCategoryByStatus(
                    status
                );
            return res.status(200).json({ stockData });
        } catch (error) {
            if (error instanceof InvalidStockStatusError) {
                console.error(
                    'Error getting stock data for category by status: ',
                    error
                );
                return res.status(400).json({ message: error.message });
            }

            console.error(
                'Error getting stock data for category by status: ',
                error
            );
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async getPlatformOrdersByStatus(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const status: string = String(req.query.status);

        try {
            const { total, rows } =
                await this.analyticsService.getPlatformOrdersByStatus(status);
            return res.status(200).json({ totalOrders: total, orders: rows });
        } catch (error) {
            console.error('Error getting platform orders by status: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async deleteReport(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;
        const name: string = String(req.query.name);

        try {
            await this.analyticsService.deleteReport(name);
            res.sendStatus(204);

            await this.adminLogsService.log(username, 'report', 'delete');
        } catch (error) {
            if (error instanceof ReportNotFoundError) {
                console.error('Error getting report by name: ', error);
                return res.status(404).json({ message: error.message });
            }
            console.error('Error deleting report by name: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    public async deleteAllReportsByType(
        req: Request,
        res: Response
    ): Promise<void | Response> {
        const { username } = req.user as JwtPayload;
        const type: string = String(req.query.type);

        try {
            await this.analyticsService.deleteAllReportsByType(type);
            res.sendStatus(204);

            await this.adminLogsService.log(username, 'report', 'delete');
        } catch (error) {
            if (error instanceof ReportNotFoundError) {
                console.error('Error getting report by name: ', error);
                return res.status(404).json({ message: error.message });
            }
            console.error('Error deleting report by name: ', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
}
