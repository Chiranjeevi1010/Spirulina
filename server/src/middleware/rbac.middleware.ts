import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../utils/api-response.util.js';
import type { PermissionResource, PermissionAction } from '@spirulina/shared';

/**
 * Role-based access control middleware
 * Checks if the authenticated user has the required permission
 */
export function authorize(resource: PermissionResource, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return sendForbidden(res, 'Authentication required');
    }

    const permissions = user.permissions;
    if (!permissions) {
      return sendForbidden(res, 'No permissions defined for this role');
    }

    const resourcePerms = permissions[resource];
    if (!resourcePerms || !resourcePerms.includes(action)) {
      return sendForbidden(
        res,
        `You do not have '${action}' permission on '${resource}'`,
      );
    }

    next();
  };
}

/**
 * Allow only specific roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return sendForbidden(res, 'Authentication required');
    }

    if (!roles.includes(user.roleName)) {
      return sendForbidden(res, 'Insufficient role permissions');
    }

    next();
  };
}
