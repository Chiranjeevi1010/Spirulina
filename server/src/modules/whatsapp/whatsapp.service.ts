import { eq, and, sql, gte, lte, ne, desc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { whatsappLogs, orders, customers, settings } from '../../db/schema/index.js';
import { WhatsAppClient, type TemplateComponent } from './whatsapp.client.js';

interface WhatsAppConfig {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  defaultCountryCode: string;
  templateOrderConfirmation: string;
  templateOrderShipped: string;
  templateOrderDelivered: string;
  templatePaymentReceived: string;
  templatePaymentReminder: string;
}

export class WhatsAppService {
  private async getConfig(): Promise<WhatsAppConfig | null> {
    const rows = await db.select().from(settings).where(eq(settings.category, 'whatsapp'));
    if (rows.length === 0) return null;

    const configMap: Record<string, unknown> = {};
    for (const row of rows) {
      configMap[row.key] = row.value;
    }

    if (!configMap['enabled'] || !configMap['phone_number_id'] || !configMap['access_token']) {
      return null;
    }

    return {
      enabled: configMap['enabled'] as boolean,
      phoneNumberId: configMap['phone_number_id'] as string,
      accessToken: configMap['access_token'] as string,
      defaultCountryCode: (configMap['default_country_code'] as string) || '+91',
      templateOrderConfirmation: (configMap['template_order_confirmation'] as string) || 'order_confirmation',
      templateOrderShipped: (configMap['template_order_shipped'] as string) || 'order_shipped',
      templateOrderDelivered: (configMap['template_order_delivered'] as string) || 'order_delivered',
      templatePaymentReceived: (configMap['template_payment_received'] as string) || 'payment_received',
      templatePaymentReminder: (configMap['template_payment_reminder'] as string) || 'payment_reminder',
    };
  }

  private async getOrderWithCustomer(orderId: number) {
    const [result] = await db.select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      totalAmount: orders.totalAmount,
      paymentReceived: orders.paymentReceived,
      paymentDueDate: orders.paymentDueDate,
      deliveryDate: orders.deliveryDate,
      orderDate: orders.orderDate,
      customerName: customers.contactName,
      customerPhone: customers.phone,
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    return result;
  }

  private async sendAndLog(
    config: WhatsAppConfig,
    orderId: number | null,
    customerId: number,
    phone: string,
    templateName: string,
    messageType: string,
    components: TemplateComponent[],
  ): Promise<void> {
    const formattedPhone = WhatsAppClient.formatPhoneNumber(phone, config.defaultCountryCode);
    const client = new WhatsAppClient(config.phoneNumberId, config.accessToken);

    try {
      const response = await client.sendTemplate(formattedPhone, templateName, 'en', components);
      const waMessageId = response.messages?.[0]?.id || null;

      await db.insert(whatsappLogs).values({
        orderId,
        customerId,
        phoneNumber: formattedPhone,
        templateName,
        messageType,
        waMessageId,
        status: 'sent',
        payload: { components },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await db.insert(whatsappLogs).values({
        orderId,
        customerId,
        phoneNumber: formattedPhone,
        templateName,
        messageType,
        status: 'failed',
        errorMessage,
        payload: { components },
      });
      console.error(`WhatsApp ${messageType} failed for order ${orderId}:`, errorMessage);
    }
  }

  async sendOrderConfirmation(orderId: number): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const order = await this.getOrderWithCustomer(orderId);
    if (!order?.customerPhone) return;

    const components: TemplateComponent[] = [{
      type: 'body',
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: `₹${Number(order.totalAmount).toLocaleString('en-IN')}` },
        { type: 'text', text: order.deliveryDate || 'TBD' },
      ],
    }];

    await this.sendAndLog(config, orderId, order.customerId, order.customerPhone,
      config.templateOrderConfirmation, 'order_confirmation', components);
  }

  async sendOrderShipped(orderId: number): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const order = await this.getOrderWithCustomer(orderId);
    if (!order?.customerPhone) return;

    const components: TemplateComponent[] = [{
      type: 'body',
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: order.deliveryDate || 'Soon' },
      ],
    }];

    await this.sendAndLog(config, orderId, order.customerId, order.customerPhone,
      config.templateOrderShipped, 'order_shipped', components);
  }

  async sendOrderDelivered(orderId: number): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const order = await this.getOrderWithCustomer(orderId);
    if (!order?.customerPhone) return;

    const components: TemplateComponent[] = [{
      type: 'body',
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: order.orderNumber },
      ],
    }];

    await this.sendAndLog(config, orderId, order.customerId, order.customerPhone,
      config.templateOrderDelivered, 'order_delivered', components);
  }

  async sendPaymentReceived(orderId: number, amountReceived: number): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const order = await this.getOrderWithCustomer(orderId);
    if (!order?.customerPhone) return;

    const balance = Number(order.totalAmount) - Number(order.paymentReceived);

    const components: TemplateComponent[] = [{
      type: 'body',
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: `₹${amountReceived.toLocaleString('en-IN')}` },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: `₹${balance.toLocaleString('en-IN')}` },
      ],
    }];

    await this.sendAndLog(config, orderId, order.customerId, order.customerPhone,
      config.templatePaymentReceived, 'payment_received', components);
  }

  async sendPaymentReminder(orderId: number): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const order = await this.getOrderWithCustomer(orderId);
    if (!order?.customerPhone) return;

    const balance = Number(order.totalAmount) - Number(order.paymentReceived);

    const components: TemplateComponent[] = [{
      type: 'body',
      parameters: [
        { type: 'text', text: order.customerName || 'Customer' },
        { type: 'text', text: `₹${balance.toLocaleString('en-IN')}` },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: order.paymentDueDate || 'N/A' },
      ],
    }];

    await this.sendAndLog(config, orderId, order.customerId, order.customerPhone,
      config.templatePaymentReminder, 'payment_reminder', components);
  }

  async processPaymentReminders(): Promise<void> {
    const config = await this.getConfig();
    if (!config?.enabled) return;

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = threeDaysFromNow.toISOString().slice(0, 10);

    // Find orders with payment due within 3 days that are unpaid/partial
    const dueOrders = await db.select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      totalAmount: orders.totalAmount,
      paymentReceived: orders.paymentReceived,
      paymentDueDate: orders.paymentDueDate,
      customerName: customers.contactName,
      customerPhone: customers.phone,
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(
        sql`${orders.paymentStatus} IN ('unpaid', 'partial')`,
        ne(orders.status, 'cancelled'),
        gte(orders.paymentDueDate, today),
        lte(orders.paymentDueDate, futureDate),
      ));

    for (const order of dueOrders) {
      if (!order.customerPhone) continue;

      // Check if reminder already sent in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recentReminder] = await db.select({ id: whatsappLogs.id })
        .from(whatsappLogs)
        .where(and(
          eq(whatsappLogs.orderId, order.orderId),
          eq(whatsappLogs.messageType, 'payment_reminder'),
          gte(whatsappLogs.createdAt, oneDayAgo),
        ))
        .limit(1);

      if (recentReminder) continue;

      await this.sendPaymentReminder(order.orderId);
    }
  }

  async getLog(page: number, limit: number, orderId?: number) {
    const offset = (page - 1) * limit;
    const conditions = orderId ? eq(whatsappLogs.orderId, orderId) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(whatsappLogs)
        .where(conditions)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(whatsappLogs.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(whatsappLogs).where(conditions),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getLogByOrder(orderId: number) {
    return db.select().from(whatsappLogs)
      .where(eq(whatsappLogs.orderId, orderId))
      .orderBy(desc(whatsappLogs.createdAt));
  }

  async sendTestMessage(phone: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig();
    if (!config?.enabled) return { success: false, error: 'WhatsApp is not configured or enabled' };

    const formattedPhone = WhatsAppClient.formatPhoneNumber(phone, config.defaultCountryCode);
    const client = new WhatsAppClient(config.phoneNumberId, config.accessToken);

    try {
      const response = await client.sendTemplate(formattedPhone, 'hello_world', 'en_US', []);
      return { success: true, messageId: response.messages?.[0]?.id };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
