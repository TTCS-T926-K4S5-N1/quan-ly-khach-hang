import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole, RolePermissionsMap } from '../../constants/permissions.constant';

export class AuthService {
  static generateToken(user: { id: string; username: string; name: string; role: UserRole; dataScope?: string; permissions?: string[] }) {
    const permissions = user.permissions || RolePermissionsMap[user.role] || [];
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions,
        dataScope: user.dataScope || 'ALL',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}
