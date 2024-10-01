import { Cart, CartItem } from '../models/relational';
import { CartNotFoundError, CartItemNotFoundError } from '../errors/CartErrors';

/**
 * Service responsible for Customer Cart-related operations.
 */
export class CartService {
    /**
     * Inserts an item into the cart.
     *
     * @param customerId - The customer ID.
     * @param productId - The ID of the product to insert.
     * @param quantity - The product quantity.
     * @returns A promise resolving to a boolean value indicating
     * whether the item was inserted successfully.
     */
    public async addItemToCart(
        customerId: number,
        productId: number,
        quantity: number = 1
    ): Promise<boolean> {
        const cart = await Cart.findOne({ where: { customerId } });

        if (!cart) {
            throw new CartNotFoundError();
        }

        const [item, created] = await CartItem.findOrCreate({
            where: { productId },
            defaults: {
                cartId: cart.id,
                productId,
                quantity,
            },
        }); // Check if productId in table is unique

        if (!created) {
            item.quantity += quantity;
            await item.save();
            return true;
        }

        return true;
    }

    /**
     * Retrieves all items in the customer's cart.
     *
     * @param customerId - The customer ID
     * @returns A promise resolving to an array of CartItem instances
     */
    public async getCartItems(customerId: number): Promise<CartItem[]> {
        const cart = await Cart.findOne({ where: { customerId } });

        if (!cart) {
            throw new CartNotFoundError();
        }

        const cartItems = await CartItem.findAll({
            where: { cartId: cart.id },
        });

        if (cartItems.length === 0) {
            throw new CartItemNotFoundError('Cart items not found');
        }

        return cartItems;
    }

    /**
     *
     * Removes an item from the cart.
     * @param customerId - The customer ID
     * @param productId - The ID of the product to remove
     * @returns A promise resolving to a boolean value indicating
     * whether the item was removed successfully
     */
    public async removeItemFromCart(
        customerId: number,
        productId: number
    ): Promise<boolean> {
        const cart = await Cart.findOne({ where: { customerId } });

        if (!cart) {
            throw new CartNotFoundError();
        }

        const item = await CartItem.findOne({
            where: { cartId: cart.id, productId },
        });

        if (!item) {
            throw new CartItemNotFoundError();
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
            await item.save();
        } else {
            item.destroy();
            await item.save();
        }

        return true;
    }

    /**
     * Clears the custoemr's cart.
     *
     * @param customerId - The customer ID
     */
    public async clearCart(customerId: number): Promise<void> {
        const cart = await Cart.findOne({ where: { customerId } });

        if (!cart) {
            throw new CartNotFoundError();
        }

        await CartItem.destroy({ where: { cartId: cart.id } });
    }

    /**
     * Retrieves the total cart items amount.
     *
     * @param customerId - The customer ID
     * @returns A promise resolving to a number
     */
    public async cartCheckout(customerId: number): Promise<number> {
        const cart = await Cart.findOne({ where: { customerId } });

        if (!cart) {
            throw new CartNotFoundError();
        }

        return await cart.getTotalPrice();
    }
}

export default new CartService();