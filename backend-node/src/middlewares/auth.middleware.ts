import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/appError';
import { Permission, UserRole, RolePermissionsMap } from '../constants/permissions.constant';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole | string;
  permissions: string[];
  dataScope?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization: Bearer <token>
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        const role = decoded.role as UserRole;
        const permissions = decoded.permissions
          ? (Array.isArray(decoded.permissions) ? decoded.permissions : decoded.permissions.split(','))
          : (RolePermissionsMap[role] || []);

        const dataScope = decoded.dataScope || (req.headers['x-data-scope'] as string) || 'ALL';

        req.user = {
          id: decoded.id || decoded.sub || 'user_1',
          username: decoded.username || 'staff',
          name: decoded.name || 'Care Staff',
          role: role || UserRole.CARE_STAFF,
          permissions: permissions,
          dataScope,
        };
        return next();
      } catch (err) {
        throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn');
      }
    }

    // Check for dev/testing custom headers (e.g. x-user-role, x-user-permissions)
    const devRole = req.headers['x-user-role'] as string;
    const devUserId = req.headers['x-user-id'] as string;
    if (devRole) {
      const role = devRole.toUpperCase() as UserRole;
      const customPerms = req.headers['x-user-permissions'] as string;
      const permissions = customPerms
        ? customPerms.split(',').map((p) => p.trim())
        : (RolePermissionsMap[role] || []);

      const dataScope = (req.headers['x-data-scope'] as string) || 'ALL';

      req.user = {
        id: devUserId || 'user_dev',
        username: req.headers['x-user-name'] ? String(req.headers['x-user-name']) : 'dev_user',
        name: 'Dev User',
        role: role,
        permissions: permissions,
        dataScope,
      };
      return next();
    }

    throw new UnauthorizedError('Yêu cầu xác thực: Thiếu access token hoặc thông tin đăng nhập');
  } catch (error) {
    next(error);
  }
}

export function requirePermissions(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Người dùng chưa được xác thực'));
    }

    const userPerms = req.user.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPerms.includes(p));

    if (!hasAll) {
      return next(
        new ForbiddenError(
          `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: ${requiredPermissions.join(', ')}`
        )
      );
    }

    next();
  };
}
