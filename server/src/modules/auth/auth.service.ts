import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { users, roles, refreshTokens } from '../../db/schema/index.js';
import { hashPassword, comparePassword } from '../../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from '../../utils/token.util.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import type { JWTPayload, Permissions, UserRole } from '@spirulina/shared';

export class AuthService {
  async login(email: string, password: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        roleId: users.roleId,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        roleDescription: roles.description,
        permissions: roles.permissions,
        roleIsSystem: roles.isSystem,
        roleCreatedAt: roles.createdAt,
        roleUpdatedAt: roles.updatedAt,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName as UserRole,
      permissions: user.permissions as Permissions,
    };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roleId: user.roleId,
        isActive: user.isActive,
        lastLoginAt: new Date().toISOString(),
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
        role: {
          id: user.roleId,
          name: user.roleName as UserRole,
          displayName: user.roleDisplayName,
          description: user.roleDescription,
          permissions: user.permissions as Permissions,
          isSystem: user.roleIsSystem,
          createdAt: user.roleCreatedAt?.toISOString(),
          updatedAt: user.roleUpdatedAt?.toISOString(),
        },
      },
    };
  }

  async refresh(token: string) {
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.token, token), eq(refreshTokens.revoked, false)))
      .limit(1);

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (new Date() > storedToken.expiresAt) {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, storedToken.id));
      throw new AppError('Refresh token expired', 401);
    }

    // Get user with role
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        roleId: users.roleId,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Revoke old refresh token
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id));

    // Generate new tokens
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName as UserRole,
      permissions: user.permissions as Permissions,
    };

    const accessToken = generateAccessToken(jwtPayload);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, token));
  }

  async getMe(userId: number) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        roleId: users.roleId,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        roleDescription: roles.description,
        permissions: roles.permissions,
        roleIsSystem: roles.isSystem,
        roleCreatedAt: roles.createdAt,
        roleUpdatedAt: roles.updatedAt,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roleId: user.roleId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      role: {
        id: user.roleId,
        name: user.roleName,
        displayName: user.roleDisplayName,
        description: user.roleDescription,
        permissions: user.permissions,
        isSystem: user.roleIsSystem,
        createdAt: user.roleCreatedAt?.toISOString(),
        updatedAt: user.roleUpdatedAt?.toISOString(),
      },
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, userId));
  }
}
