import { eq, sql, and, gte, lte, ne, desc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { ponds, harvests, production, orders, expenses, chemicals, leads, batches } from '../../db/schema/index.js';

export class DashboardService {
  async getKPIs() {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = now.toISOString().slice(0, 10);

    const [
      pondsResult,
      pondsByHealthResult,
      harvestResult,
      productionResult,
      revenueResult,
      expenseResult,
      pendingOrdersResult,
      lowStockResult,
      activeLeadsResult,
      expiringBatchesResult,
    ] = await Promise.all([
      // Total active ponds
      db.select({ count: sql<number>`count(*)::int` })
        .from(ponds).where(eq(ponds.status, 'active')),

      // Ponds by health status
      db.select({
        healthStatus: ponds.healthStatus,
        count: sql<number>`count(*)::int`,
      }).from(ponds).where(eq(ponds.status, 'active')).groupBy(ponds.healthStatus),

      // Total harvest this month
      db.select({
        totalWet: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
      }).from(harvests).where(and(
        gte(harvests.harvestDate, monthStart),
        lte(harvests.harvestDate, monthEnd),
      )),

      // Total production this month
      db.select({
        totalPowder: sql<number>`coalesce(sum(${production.powderOutputKg}::numeric), 0)`,
      }).from(production).where(and(
        gte(production.productionDate, monthStart),
        lte(production.productionDate, monthEnd),
      )),

      // Revenue this month
      db.select({
        totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      }).from(orders).where(and(
        gte(orders.orderDate, monthStart),
        lte(orders.orderDate, monthEnd),
        ne(orders.status, 'cancelled'),
      )),

      // Expenses this month
      db.select({
        totalExpenses: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)`,
      }).from(expenses).where(and(
        gte(expenses.expenseDate, monthStart),
        lte(expenses.expenseDate, monthEnd),
        eq(expenses.status, 'approved'),
      )),

      // Pending orders
      db.select({ count: sql<number>`count(*)::int` })
        .from(orders).where(eq(orders.status, 'pending')),

      // Low stock chemicals
      db.select({ count: sql<number>`count(*)::int` })
        .from(chemicals).where(sql`${chemicals.currentStock}::numeric <= ${chemicals.minimumStock}::numeric`),

      // Active leads
      db.select({ count: sql<number>`count(*)::int` })
        .from(leads).where(and(
          ne(leads.status, 'won'),
          ne(leads.status, 'lost'),
        )),

      // Expiring batches (within 30 days)
      db.select({ count: sql<number>`count(*)::int` })
        .from(batches).where(and(
          eq(batches.status, 'available'),
          lte(batches.expiryDate, sql`current_date + interval '30 days'`),
          gte(batches.expiryDate, sql`current_date`),
        )),
    ]);

    return {
      totalActivePonds: pondsResult[0]?.count ?? 0,
      pondsByHealth: pondsByHealthResult,
      totalHarvestThisMonth: harvestResult[0]?.totalWet ?? 0,
      harvestCountThisMonth: harvestResult[0]?.count ?? 0,
      totalProductionThisMonth: productionResult[0]?.totalPowder ?? 0,
      totalRevenueThisMonth: revenueResult[0]?.totalRevenue ?? 0,
      totalExpensesThisMonth: expenseResult[0]?.totalExpenses ?? 0,
      pendingOrders: pendingOrdersResult[0]?.count ?? 0,
      lowStockChemicals: lowStockResult[0]?.count ?? 0,
      activeLeads: activeLeadsResult[0]?.count ?? 0,
      expiringBatches: expiringBatchesResult[0]?.count ?? 0,
    };
  }

  async getRecentActivities() {
    const [recentHarvests, recentOrders, recentExpenses] = await Promise.all([
      db.select({
        id: harvests.id,
        type: sql<string>`'harvest'`,
        description: sql<string>`'Harvested ' || ${harvests.wetHarvestKg} || ' kg wet'`,
        date: harvests.harvestDate,
        createdAt: harvests.createdAt,
      }).from(harvests).orderBy(desc(harvests.createdAt)).limit(5),

      db.select({
        id: orders.id,
        type: sql<string>`'order'`,
        description: sql<string>`'Order ' || ${orders.orderNumber} || ' - ₹' || ${orders.totalAmount}`,
        date: orders.orderDate,
        createdAt: orders.createdAt,
      }).from(orders).orderBy(desc(orders.createdAt)).limit(5),

      db.select({
        id: expenses.id,
        type: sql<string>`'expense'`,
        description: sql<string>`${expenses.description} || ' - ₹' || ${expenses.amount}`,
        date: expenses.expenseDate,
        createdAt: expenses.createdAt,
      }).from(expenses).orderBy(desc(expenses.createdAt)).limit(5),
    ]);

    // Merge and sort by createdAt
    const activities = [...recentHarvests, ...recentOrders, ...recentExpenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return activities;
  }
}
