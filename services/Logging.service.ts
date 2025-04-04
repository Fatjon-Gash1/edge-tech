import { User, Admin, AdminLog } from '@/models/relational';
import { PlatformLog } from '@/models/document';
import { AdminLogInvalidTargetError, UserNotFoundError } from '@/errors';

/**
 * Service responsible for platform logs.
 */
export class LoggingService {
    /**
     * Logs different administrative operations.
     *
     * @param username - The username of the user performing the action
     * @param target - The type of entity being acted upon
     * @param operation - The action performed
     * @returns A promise that resolves to void
     *
     * @throws {@link UserNotFoundError}
     * Thrown if the admin is not found.
     *
     * @throws {@link AdminLogInvalidTargetError}
     * Thrown if the provided target is not valid
     *
     * @throws {@link AdminLogCreationError}
     * Thrown if the log cannot be created
     */
    public async logOperation(
        username: string,
        target: string,
        operation: string = 'create'
    ): Promise<void> {
        const admin = await Admin.findOne({
            include: { model: User, as: 'user', where: { username } },
        });

        if (!admin) {
            throw new UserNotFoundError(
                `Could not log admin "${username}". Admin not found!`
            );
        }

        const categories: string[] = [
            'customer',
            'admin',
            'category',
            'product',
            'membership',
            'order',
            'shipping country',
            'shipping city',
            'shipping weight',
            'shipping method',
            'review',
            'rating',
            'sales report',
            'stock report',
            'membership',
        ];

        if (!categories.includes(target)) {
            throw new AdminLogInvalidTargetError(target);
        }

        const opMap: { [key: string]: string } = {
            create: 'created a new',
            update: 'updated an existing',
            delete: 'deleted an existing',
        };

        const op = opMap[operation];

        await AdminLog.create({
            adminId: admin.id,
            category: target,
            log: `Admin "${username}" ${op} ${target}.`,
        });
    }

    /**
     * Logs different platform events.
     *
     * @param type - The type of event
     * @param message - The message to log
     */
    public async log(type: string, message: string): Promise<void> {
        await PlatformLog.create({ type, message });
    }
}
