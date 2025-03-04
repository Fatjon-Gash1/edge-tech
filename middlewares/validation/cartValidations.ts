import { body, ValidationChain } from 'express-validator';

export const validateCartItemDetails = (): ValidationChain[] => [
    body('productId')
        .notEmpty()
        .withMessage('Product is required')
        .isInt({ min: 1 })
        .withMessage('Product must be a positive number'),

    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive number'),
];
