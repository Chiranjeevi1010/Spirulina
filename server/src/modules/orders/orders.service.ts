import { eq, and, sql, desc, gte, lte, between, ne } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { orders, orderItems, customers } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class OrdersService {
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`to_char(${orders.createdAt}, 'YYYYMMDD') = ${dateStr}`);
    const seq = String((result?.count ?? 0) + 1).padStart(4, '0');
    return `ORD-${dateStr}-${seq}`;
  }

  async list(page: number, limit: number, filters?: {
    customerId?: number; status?: string; paymentStatus?: string;
    startDate?: string; endDate?: string;
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.customerId) conditions.push(eq(orders.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(orders.status, filters.status));
    if (filters?.paymentStatus) conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(orders.orderDate, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(gte(orders.orderDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(orders.orderDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerName: customers.contactName,
        companyName: customers.companyName,
        orderDate: orders.orderDate,
        deliveryDate: orders.deliveryDate,
        status: orders.status,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        discountAmount: orders.discountAmount,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
        paymentDueDate: orders.paymentDueDate,
        paymentReceived: orders.paymentReceived,
        createdAt: orders.createdAt,
      })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.orderDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [order] = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.contactName,
      companyName: customers.companyName,
      orderDate: orders.orderDate,
      deliveryDate: orders.deliveryDate,
      status: orders.status,
      subtotal: orders.subtotal,
      taxAmount: orders.taxAmount,
      discountAmount: orders.discountAmount,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      paymentDueDate: orders.paymentDueDate,
      paymentReceived: orders.paymentReceived,
      shippingAddress: orders.shippingAddress,
      notes: orders.notes,
      createdBy: orders.createdBy,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) throw new AppError('Order not found', 404);

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async create(data: {
    customerId: number;
    orderDate: string;
    deliveryDate?: string;
    taxAmount?: number;
    discountAmount?: number;
    paymentDueDate?: string;
    shippingAddress?: string;
    notes?: string;
    items: Array<{
      productType: string;
      batchId?: number;
      quantity: number;
      unit: string;
      unitPrice: number;
    }>;
  }, userId?: number) {
    // Verify customer
    const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, data.customerId)).limit(1);
    if (!customer) throw new AppError('Customer not found', 404);

    const orderNumber = await this.generateOrderNumber();

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = data.taxAmount ?? 0;
    const discountAmount = data.discountAmount ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create order
    const [order] = await db.insert(orders).values({
      orderNumber,
      customerId: data.customerId,
      orderDate: data.orderDate,
      deliveryDate: data.deliveryDate,
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      discountAmount: String(discountAmount),
      totalAmount: String(totalAmount),
      paymentDueDate: data.paymentDueDate,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      createdBy: userId,
    }).returning();

    // Create order items
    const itemValues = data.items.map(item => ({
      orderId: order.id,
      productType: item.productType,
      batchId: item.batchId,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.quantity * item.unitPrice),
    }));

    const items = await db.insert(orderItems).values(itemValues).returning();

    return { ...order, items };
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) throw new AppError('Order not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.deliveryDate !== undefined) updateData.deliveryDate = data.deliveryDate;
    if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.taxAmount !== undefined) updateData.taxAmount = String(data.taxAmount);
    if (data.discountAmount !== undefined) updateData.discountAmount = String(data.discountAmount);

    const [order] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateStatus(id: number, status: string) {
    const [order] = await db.update(orders).set({
      status,
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async updatePayment(id: number, paymentData: { paymentReceived: number }) {
    const order = await this.getById(id);
    const totalReceived = paymentData.paymentReceived;
    const totalAmount = Number(order.totalAmount);

    let paymentStatus = 'unpaid';
    if (totalReceived >= totalAmount) paymentStatus = 'paid';
    else if (totalReceived > 0) paymentStatus = 'partial';

    const [updated] = await db.update(orders).set({
      paymentReceived: String(totalReceived),
      paymentStatus,
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();

    return updated;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) throw new AppError('Order not found', 404);
    // Order items cascade delete
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getRevenueSummary(startDate?: string, endDate?: string) {
    const conditions = [ne(orders.status, 'cancelled')];
    if (startDate) conditions.push(gte(orders.orderDate, startDate));
    if (endDate) conditions.push(lte(orders.orderDate, endDate));

    const [summary] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
        totalPaid: sql<number>`coalesce(sum(${orders.paymentReceived}::numeric), 0)`,
        totalOutstanding: sql<number>`coalesce(sum(${orders.totalAmount}::numeric - ${orders.paymentReceived}::numeric), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(...conditions));

    return summary;
  }
}
