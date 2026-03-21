import { eq, like, sql, and } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { users, roles } from '../../db/schema/index.js';
import { hashPassword } from '../../utils/password.util.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import type { CreateUserInput, UpdateUserInput } from '@spirulina/shared';

export class UsersService {
  async list(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const conditions = search
      ? like(users.email, `%${search}%`)
      : undefined;

    const [data, countResult] = await Promise.all([
      db
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
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(conditions)
        .limit(limit)
        .offset(offset)
        .orderBy(users.createdAt),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(conditions),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
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
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async create(data: CreateUserInput) {
    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const passwordHash = await hashPassword(data.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
      })
      .returning();

    return newUser;
  }

  async update(id: number, data: UpdateUserInput) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError('User not found', 404);
    }

    if (data.email) {
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, data.email), sql`${users.id} != ${id}`))
        .limit(1);
      if (emailExists) {
        throw new AppError('Email already in use', 409);
      }
    }

    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return updated;
  }

  async updateStatus(id: number, isActive: boolean) {
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new AppError('User not found', 404);
    }

    return updated;
  }

  async listRoles() {
    return db.select().from(roles).orderBy(roles.id);
  }
}
