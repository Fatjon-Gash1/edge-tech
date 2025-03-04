import { Router } from 'express';
import { UserController } from '../../controllers/User.controller';
import {
    UserService,
    PaymentService,
    NotificationService,
} from '../../services';
import authenticateRefreshToken from '../../middlewares/authentication/refreshToken';
import authenticateAccessToken from '../../middlewares/authentication/accessToken';
import authorize from '../../middlewares/authorization/authorize';
import {
    signupRateLimiter,
    loginRateLimiter,
    tokenRateLimiter,
    updateRateLimiter,
    passwordChangeRateLimiter,
} from '../../middlewares/rateLimiting';
import {
    validateRegistration,
    validateLogIn,
    validateAvailability,
    validatePasswords,
    validateCustomerDetails,
    validateUserUpdateDetails,
    validationErrors,
} from '../../middlewares/validation';
import cartRoutes from './carts.route';
import paymentRoutes from './payments.route';
import orderRoutes from './orders.route';
import shippingRoutes from './shippings.route';
import ratingRoutes from './ratings.route';
import adminRoutes from './private/admins.route';

const router: Router = Router();
const userService = new UserService(
    new PaymentService(process.env.STRIPE_KEY as string)
);
const userController = new UserController(
    userService,
    new NotificationService()
);

router.post(
    '/auth/signup',
    signupRateLimiter,
    validateRegistration(),
    validationErrors,
    userController.signUpCustomer.bind(userController)
);
router.post(
    '/auth/login',
    loginRateLimiter,
    validateLogIn(),
    validationErrors,
    userController.loginUser.bind(userController)
);
router.post(
    '/auth/tokens',
    authenticateRefreshToken,
    tokenRateLimiter,
    userController.generateTokens.bind(userController)
);
router.post(
    '/auth/logout',
    authenticateAccessToken,
    userController.logoutUser.bind(userController)
);

router.get(
    '/availability',
    validateAvailability(),
    validationErrors,
    userController.checkUserAvailability.bind(userController)
);
router.get(
    '/customers/profile',
    authenticateAccessToken,
    authorize(['customer']),
    userController.getCustomerProfile.bind(userController)
);

router.patch(
    '/password',
    authenticateAccessToken,
    passwordChangeRateLimiter,
    validatePasswords(),
    validationErrors,
    userController.changePassword.bind(userController)
);
router.patch(
    '/customers/customer-details',
    authenticateAccessToken,
    updateRateLimiter,
    authorize(['customer']),
    validateCustomerDetails(),
    validationErrors,
    userController.updateCustomerDetails.bind(userController)
);
router.patch(
    '/',
    authenticateAccessToken,
    updateRateLimiter,
    validateUserUpdateDetails(),
    validationErrors,
    userController.updateUser.bind(userController)
);

router.delete(
    '/',
    authenticateAccessToken,
    userController.deleteAccount.bind(userController)
);

router.use(
    '/customers/cart',
    authenticateAccessToken,
    authorize(['customer']),
    cartRoutes
);

router.use(
    '/customers/payments',
    authenticateAccessToken,
    authorize(['customer']),
    paymentRoutes
);

router.use(
    '/customers/orders',
    authenticateAccessToken,
    authorize(['customer']),
    orderRoutes
);

router.use('/shippings', authenticateAccessToken, shippingRoutes);

router.use(
    '/ratings',
    authenticateAccessToken,
    authorize(['customer']),
    ratingRoutes
);

router.use(
    '/admin',
    authenticateAccessToken,
    authorize(['admin', 'manager']),
    adminRoutes
);

export default router;
