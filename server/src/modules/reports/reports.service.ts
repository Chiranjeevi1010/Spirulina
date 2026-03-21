import { sql, and, gte, lte, eq, desc, ne } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { harvests, production, orders, expenses, ponds, expenseCategories, customers } from '../../db/schema/index.js';

export class ReportsService {
  async getProductionReport(startDate: string, endDate: string) {
    const [harvestStats] = await db.select({
      totalWetHarvest: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
      harvestCount: sql<number>`count(*)::int`,
      avgWetPerHarvest: sql<number>`coalesce(avg(${harvests.wetHarvestKg}::numeric), 0)`,
    }).from(harvests).where(and(gte(harvests.harvestDate, startDate), lte(harvests.harvestDate, endDate)));

    const [productionStats] = await db.select({
      totalWetInput: sql<number>`coalesce(sum(${production.wetInputKg}::numeric), 0)`,
      totalPowderOutput: sql<number>`coalesce(sum(${production.powderOutputKg}::numeric), 0)`,
      avgEfficiency: sql<number>`coalesce(avg(${production.efficiencyPct}::numeric), 0)`,
      productionRuns: sql<number>`count(*)::int`,
    }).from(production).where(and(gte(production.productionDate, startDate), lte(production.productionDate, endDate)));

    const dailyHarvest = await db.select({
      date: harvests.harvestDate,
      totalWet: sql<number>`sum(${harvests.wetHarvestKg}::numeric)`,
      count: sql<number>`count(*)::int`,
    }).from(harvests)
      .where(and(gte(harvests.harvestDate, startDate), lte(harvests.harvestDate, endDate)))
      .groupBy(harvests.harvestDate)
      .orderBy(harvests.harvestDate);

    const pondWiseHarvest = await db.select({
      pondId: harvests.pondId,
      pondName: ponds.name,
      totalWet: sql<number>`sum(${harvests.wetHarvestKg}::numeric)`,
      count: sql<number>`count(*)::int`,
    }).from(harvests)
      .leftJoin(ponds, eq(harvests.pondId, ponds.id))
      .where(and(gte(harvests.harvestDate, startDate), lte(harvests.harvestDate, endDate)))
      .groupBy(harvests.pondId, ponds.name);

    return {
      period: { startDate, endDate },
      harvest: harvestStats,
      production: productionStats,
      dailyHarvest,
      pondWiseHarvest,
    };
  }

  async getSalesReport(startDate: string, endDate: string) {
    const [revenueStats] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      totalPaid: sql<number>`coalesce(sum(${orders.paymentReceived}::numeric), 0)`,
      totalOutstanding: sql<number>`coalesce(sum(${orders.totalAmount}::numeric - ${orders.paymentReceived}::numeric), 0)`,
      orderCount: sql<number>`count(*)::int`,
    }).from(orders).where(and(
      gte(orders.orderDate, startDate),
      lte(orders.orderDate, endDate),
      ne(orders.status, 'cancelled'),
    ));

    const monthlyRevenue = await db.select({
      month: sql<string>`to_char(${orders.orderDate}::date, 'YYYY-MM')`,
      revenue: sql<number>`sum(${orders.totalAmount}::numeric)`,
      count: sql<number>`count(*)::int`,
    }).from(orders)
      .where(and(gte(orders.orderDate, startDate), lte(orders.orderDate, endDate), ne(orders.status, 'cancelled')))
      .groupBy(sql`to_char(${orders.orderDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.orderDate}::date, 'YYYY-MM')`);

    const topCustomers = await db.select({
      customerId: orders.customerId,
      customerName: customers.contactName,
      companyName: customers.companyName,
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`sum(${orders.totalAmount}::numeric)`,
    }).from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(gte(orders.orderDate, startDate), lte(orders.orderDate, endDate), ne(orders.status, 'cancelled')))
      .groupBy(orders.customerId, customers.contactName, customers.companyName)
      .orderBy(sql`sum(${orders.totalAmount}::numeric) desc`)
      .limit(10);

    return {
      period: { startDate, endDate },
      revenue: revenueStats,
      monthlyRevenue,
      topCustomers,
    };
  }

  async getExpenseReport(startDate: string, endDate: string) {
    const [totalStats] = await db.select({
      totalExpenses: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)`,
      approvedTotal: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount}::numeric else 0 end), 0)`,
      pendingTotal: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amount}::numeric else 0 end), 0)`,
      count: sql<number>`count(*)::int`,
    }).from(expenses).where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)));

    const byCategory = await db.select({
      categoryName: expenseCategories.name,
      total: sql<number>`sum(${expenses.amount}::numeric)`,
      count: sql<number>`count(*)::int`,
    }).from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)))
      .groupBy(expenseCategories.name)
      .orderBy(sql`sum(${expenses.amount}::numeric) desc`);

    const monthlyExpenses = await db.select({
      month: sql<string>`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`,
      total: sql<number>`sum(${expenses.amount}::numeric)`,
    }).from(expenses)
      .where(and(gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate), eq(expenses.status, 'approved')))
      .groupBy(sql`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${expenses.expenseDate}::date, 'YYYY-MM')`);

    return {
      period: { startDate, endDate },
      totals: totalStats,
      byCategory,
      monthlyExpenses,
    };
  }
}
