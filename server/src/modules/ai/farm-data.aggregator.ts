import { eq, sql, and, gte, lte, ne, desc, asc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import {
  ponds, waterParameters, harvests, production,
  chemicals, chemicalUsage, expenses, expenseCategories,
  customers, leads, orders, orderItems,
  inventory, batches, aiAlerts,
} from '../../db/schema/index.js';

/**
 * FarmDataAggregator - Collects real-time data from ALL modules
 * to build a comprehensive farm snapshot for AI analysis.
 */
export class FarmDataAggregator {
  /**
   * Collect the full farm state across all modules.
   * Returns a structured object with every operational metric.
   */
  async collectFullSnapshot() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    const [
      pondData,
      latestWaterParams,
      harvestData,
      productionData,
      chemicalData,
      expenseData,
      salesData,
      inventoryData,
      alertData,
    ] = await Promise.all([
      this.collectPondData(),
      this.collectLatestWaterParameters(),
      this.collectHarvestData(monthStart, today, weekAgo),
      this.collectProductionData(monthStart, today),
      this.collectChemicalData(),
      this.collectExpenseData(monthStart, today, thirtyDaysAgo),
      this.collectSalesData(monthStart, today),
      this.collectInventoryData(),
      this.collectAlertData(),
    ]);

    return {
      snapshotTimestamp: now.toISOString(),
      ponds: pondData,
      waterParameters: latestWaterParams,
      harvest: harvestData,
      production: productionData,
      chemicals: chemicalData,
      expenses: expenseData,
      sales: salesData,
      inventory: inventoryData,
      alerts: alertData,
    };
  }

  // === POND DATA ===
  private async collectPondData() {
    const allPonds = await db.select({
      id: ponds.id,
      name: ponds.name,
      code: ponds.code,
      lengthM: ponds.lengthM,
      widthM: ponds.widthM,
      depthM: ponds.depthM,
      volumeLiters: ponds.volumeLiters,
      pondType: ponds.pondType,
      status: ponds.status,
      healthStatus: ponds.healthStatus,
      location: ponds.location,
    }).from(ponds).orderBy(asc(ponds.name));

    const activePonds = allPonds.filter(p => p.status === 'active');
    const healthBreakdown = activePonds.reduce((acc, p) => {
      acc[p.healthStatus || 'UNKNOWN'] = (acc[p.healthStatus || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: allPonds.length,
      active: activePonds.length,
      healthBreakdown,
      ponds: allPonds.map(p => ({
        name: `${p.name} (${p.code})`,
        volume: `${p.volumeLiters}L`,
        dimensions: `${p.lengthM}m x ${p.widthM}m x ${p.depthM}m`,
        status: p.status,
        health: p.healthStatus,
        location: p.location,
      })),
    };
  }

  // === WATER PARAMETERS - latest per pond ===
  private async collectLatestWaterParameters() {
    // Get latest water reading for each active pond
    const activePondsList = await db.select({ id: ponds.id, name: ponds.name, code: ponds.code })
      .from(ponds).where(eq(ponds.status, 'active'));

    const pondReadings = [];
    for (const pond of activePondsList) {
      const [latest] = await db.select({
        readingDate: waterParameters.readingDate,
        ph: waterParameters.ph,
        temperatureC: waterParameters.temperatureC,
        dissolvedOxygen: waterParameters.dissolvedOxygen,
        salinityPpt: waterParameters.salinityPpt,
        ammoniaNh3: waterParameters.ammoniaNh3,
        nitriteNo2: waterParameters.nitriteNo2,
        nitrateNo3: waterParameters.nitrateNo3,
        totalHardness: waterParameters.totalHardness,
        calciumCa: waterParameters.calciumCa,
        magnesiumMg: waterParameters.magnesiumMg,
        alkalinity: waterParameters.alkalinity,
        carbonateCo3: waterParameters.carbonateCo3,
        bicarbonateHco3: waterParameters.bicarbonateHco3,
        overallRisk: waterParameters.overallRisk,
        ammoniaRisk: waterParameters.ammoniaRisk,
        doRisk: waterParameters.doRisk,
        hardnessRisk: waterParameters.hardnessRisk,
      }).from(waterParameters)
        .where(eq(waterParameters.pondId, pond.id))
        .orderBy(desc(waterParameters.readingDate))
        .limit(1);

      if (latest) {
        pondReadings.push({
          pond: `${pond.name} (${pond.code})`,
          readingDate: latest.readingDate,
          ph: latest.ph,
          temperature: `${latest.temperatureC}°C`,
          dissolvedOxygen: `${latest.dissolvedOxygen} mg/L`,
          salinityPpt: latest.salinityPpt,
          ammoniaNh3: `${latest.ammoniaNh3} mg/L`,
          nitriteNo2: `${latest.nitriteNo2} mg/L`,
          nitrateNo3: `${latest.nitrateNo3} mg/L`,
          totalHardness: `${latest.totalHardness} ppm`,
          calciumCa: `${latest.calciumCa} ppm`,
          magnesiumMg: `${latest.magnesiumMg} ppm`,
          alkalinity: latest.alkalinity,
          carbonateCo3: latest.carbonateCo3,
          bicarbonateHco3: latest.bicarbonateHco3,
          overallRisk: latest.overallRisk,
          ammoniaRisk: latest.ammoniaRisk,
          doRisk: latest.doRisk,
          hardnessRisk: latest.hardnessRisk,
        });
      }
    }

    const criticalPonds = pondReadings.filter(r => r.overallRisk === 'RED');
    const warningPonds = pondReadings.filter(r => r.overallRisk === 'YELLOW');

    return {
      totalReadings: pondReadings.length,
      criticalCount: criticalPonds.length,
      warningCount: warningPonds.length,
      readings: pondReadings,
    };
  }

  // === HARVEST DATA ===
  private async collectHarvestData(monthStart: string, today: string, weekAgo: string) {
    const [monthlyStats] = await db.select({
      totalWetKg: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
      count: sql<number>`count(*)::int`,
      avgDryYieldPct: sql<number>`coalesce(round(avg(${harvests.dryYieldPercentage}::numeric), 1), 0)`,
    }).from(harvests).where(and(
      gte(harvests.harvestDate, monthStart),
      lte(harvests.harvestDate, today),
    ));

    const [weeklyStats] = await db.select({
      totalWetKg: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
      count: sql<number>`count(*)::int`,
    }).from(harvests).where(and(
      gte(harvests.harvestDate, weekAgo),
      lte(harvests.harvestDate, today),
    ));

    // Per-pond harvest this month
    const perPondHarvest = await db.select({
      pondName: ponds.name,
      pondCode: ponds.code,
      totalWetKg: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
      harvestCount: sql<number>`count(*)::int`,
    }).from(harvests)
      .leftJoin(ponds, eq(harvests.pondId, ponds.id))
      .where(and(
        gte(harvests.harvestDate, monthStart),
        lte(harvests.harvestDate, today),
      ))
      .groupBy(ponds.name, ponds.code);

    return {
      thisMonth: {
        totalWetKg: Number(monthlyStats?.totalWetKg ?? 0),
        harvestCount: monthlyStats?.count ?? 0,
        avgDryYieldPct: `${monthlyStats?.avgDryYieldPct ?? 0}%`,
      },
      thisWeek: {
        totalWetKg: Number(weeklyStats?.totalWetKg ?? 0),
        harvestCount: weeklyStats?.count ?? 0,
      },
      perPond: perPondHarvest.map(p => ({
        pond: `${p.pondName} (${p.pondCode})`,
        totalWetKg: Number(p.totalWetKg),
        harvests: p.harvestCount,
      })),
    };
  }

  // === PRODUCTION DATA ===
  private async collectProductionData(monthStart: string, today: string) {
    const [monthlyProd] = await db.select({
      totalPowderKg: sql<number>`coalesce(sum(${production.powderOutputKg}::numeric), 0)`,
      totalWetInputKg: sql<number>`coalesce(sum(${production.wetInputKg}::numeric), 0)`,
      avgEfficiencyPct: sql<number>`coalesce(round(avg(${production.efficiencyPct}::numeric), 1), 0)`,
      batchCount: sql<number>`count(*)::int`,
    }).from(production).where(and(
      gte(production.productionDate, monthStart),
      lte(production.productionDate, today),
    ));

    return {
      thisMonth: {
        powderKg: Number(monthlyProd?.totalPowderKg ?? 0),
        wetInputKg: Number(monthlyProd?.totalWetInputKg ?? 0),
        avgEfficiencyPct: Number(monthlyProd?.avgEfficiencyPct ?? 0),
        batchCount: monthlyProd?.batchCount ?? 0,
      },
    };
  }

  // === CHEMICAL DATA ===
  private async collectChemicalData() {
    const allChemicals = await db.select({
      id: chemicals.id,
      name: chemicals.name,
      category: chemicals.category,
      currentStock: chemicals.currentStock,
      minimumStock: chemicals.minimumStock,
      unit: chemicals.unit,
    }).from(chemicals).orderBy(asc(chemicals.name));

    const lowStock = allChemicals.filter(c =>
      Number(c.currentStock) <= Number(c.minimumStock)
    );

    // Recent usage (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const recentUsage = await db.select({
      chemicalName: chemicals.name,
      totalUsed: sql<number>`coalesce(sum(${chemicalUsage.quantityUsed}::numeric), 0)`,
      unit: chemicals.unit,
    }).from(chemicalUsage)
      .leftJoin(chemicals, eq(chemicalUsage.chemicalId, chemicals.id))
      .where(gte(chemicalUsage.usageDate, weekAgo))
      .groupBy(chemicals.name, chemicals.unit);

    return {
      totalChemicals: allChemicals.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map(c => ({
        name: c.name,
        current: `${c.currentStock} ${c.unit}`,
        minimum: `${c.minimumStock} ${c.unit}`,
        deficit: `${Number(c.minimumStock) - Number(c.currentStock)} ${c.unit} below minimum`,
      })),
      allStock: allChemicals.map(c => ({
        name: c.name,
        category: c.category,
        stock: `${c.currentStock} ${c.unit}`,
        minRequired: `${c.minimumStock} ${c.unit}`,
        status: Number(c.currentStock) <= Number(c.minimumStock) ? 'LOW' : 'OK',
      })),
      recentUsage7Days: recentUsage.map(u => ({
        chemical: u.chemicalName,
        used: `${u.totalUsed} ${u.unit}`,
      })),
    };
  }

  // === EXPENSE DATA ===
  private async collectExpenseData(monthStart: string, today: string, thirtyDaysAgo: string) {
    // Monthly totals by category
    const byCategory = await db.select({
      category: expenseCategories.name,
      total: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)`,
      count: sql<number>`count(*)::int`,
    }).from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(
        gte(expenses.expenseDate, monthStart),
        lte(expenses.expenseDate, today),
      ))
      .groupBy(expenseCategories.name);

    const [monthlyTotal] = await db.select({
      total: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)`,
      approved: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount}::numeric else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amount}::numeric else 0 end), 0)`,
    }).from(expenses).where(and(
      gte(expenses.expenseDate, monthStart),
      lte(expenses.expenseDate, today),
    ));

    return {
      thisMonth: {
        totalExpenses: Number(monthlyTotal?.total ?? 0),
        approved: Number(monthlyTotal?.approved ?? 0),
        pending: Number(monthlyTotal?.pending ?? 0),
      },
      byCategory: byCategory.map(c => ({
        category: c.category,
        amount: Number(c.total),
        transactions: c.count,
      })),
    };
  }

  // === SALES / CRM DATA ===
  private async collectSalesData(monthStart: string, today: string) {
    const [monthlyRevenue] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      orderCount: sql<number>`count(*)::int`,
      avgOrderValue: sql<number>`case when count(*) > 0 then round(avg(${orders.totalAmount}::numeric), 2) else 0 end`,
    }).from(orders).where(and(
      gte(orders.orderDate, monthStart),
      lte(orders.orderDate, today),
      ne(orders.status, 'cancelled'),
    ));

    const [pendingOrders] = await db.select({
      count: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
    }).from(orders).where(eq(orders.status, 'pending'));

    const [customerStats] = await db.select({
      totalCustomers: sql<number>`count(*)::int`,
      activeCustomers: sql<number>`count(*) filter (where ${customers.isActive} = true)::int`,
    }).from(customers);

    const [leadStats] = await db.select({
      totalActive: sql<number>`count(*) filter (where ${leads.status} not in ('won','lost'))::int`,
      totalWon: sql<number>`count(*) filter (where ${leads.status} = 'won')::int`,
      totalLost: sql<number>`count(*) filter (where ${leads.status} = 'lost')::int`,
      pipelineValue: sql<number>`coalesce(sum(case when ${leads.status} not in ('won','lost') then ${leads.estimatedValue}::numeric else 0 end), 0)`,
    }).from(leads);

    return {
      revenue: {
        thisMonth: Number(monthlyRevenue?.totalRevenue ?? 0),
        orderCount: monthlyRevenue?.orderCount ?? 0,
        avgOrderValue: Number(monthlyRevenue?.avgOrderValue ?? 0),
      },
      pendingOrders: {
        count: pendingOrders?.count ?? 0,
        totalValue: Number(pendingOrders?.value ?? 0),
      },
      customers: {
        total: customerStats?.totalCustomers ?? 0,
        active: customerStats?.activeCustomers ?? 0,
      },
      leads: {
        active: leadStats?.totalActive ?? 0,
        won: leadStats?.totalWon ?? 0,
        lost: leadStats?.totalLost ?? 0,
        pipelineValue: Number(leadStats?.pipelineValue ?? 0),
      },
    };
  }

  // === INVENTORY DATA ===
  private async collectInventoryData() {
    const allInventory = await db.select({
      productType: inventory.productType,
      totalQuantity: sql<number>`coalesce(sum(${inventory.currentQuantity}::numeric), 0)`,
      unit: inventory.unit,
    }).from(inventory).groupBy(inventory.productType, inventory.unit);

    const [expiringBatches] = await db.select({
      count: sql<number>`count(*)::int`,
    }).from(batches).where(and(
      eq(batches.status, 'available'),
      lte(batches.expiryDate, sql`current_date + interval '30 days'`),
      gte(batches.expiryDate, sql`current_date`),
    ));

    const [totalBatches] = await db.select({
      total: sql<number>`count(*)::int`,
      available: sql<number>`count(*) filter (where ${batches.status} = 'available')::int`,
    }).from(batches);

    return {
      stockByProduct: allInventory.map(i => ({
        product: i.productType,
        quantity: `${i.totalQuantity} ${i.unit}`,
      })),
      batches: {
        total: totalBatches?.total ?? 0,
        available: totalBatches?.available ?? 0,
        expiringWithin30Days: expiringBatches?.count ?? 0,
      },
    };
  }

  // === ALERTS DATA ===
  private async collectAlertData() {
    const unresolvedAlerts = await db.select({
      pondName: ponds.name,
      alertType: aiAlerts.alertType,
      severity: aiAlerts.severity,
      title: aiAlerts.title,
      message: aiAlerts.message,
      recommendation: aiAlerts.recommendation,
      createdAt: aiAlerts.createdAt,
    }).from(aiAlerts)
      .leftJoin(ponds, eq(aiAlerts.pondId, ponds.id))
      .where(eq(aiAlerts.isResolved, false))
      .orderBy(desc(aiAlerts.createdAt))
      .limit(20);

    return {
      unresolvedCount: unresolvedAlerts.length,
      criticalCount: unresolvedAlerts.filter(a => a.severity === 'critical').length,
      alerts: unresolvedAlerts.map(a => ({
        pond: a.pondName,
        type: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        recommendation: a.recommendation,
        date: a.createdAt,
      })),
    };
  }

  /**
   * Convert the full snapshot into a structured prompt for the AI.
   */
  buildSystemPrompt(snapshot: Awaited<ReturnType<typeof this.collectFullSnapshot>>): string {
    const lines: string[] = [];

    lines.push(`You are an expert Spirulina cultivation advisor and farm business analyst. You have access to REAL-TIME data from a commercial spirulina farm's ERP system. Analyze the data below and provide actionable, specific recommendations.`);
    lines.push(`\nData Snapshot: ${snapshot.snapshotTimestamp}`);
    lines.push(`Currency: Indian Rupees (₹)`);

    // === PONDS ===
    lines.push(`\n## POND OVERVIEW`);
    lines.push(`Active Ponds: ${snapshot.ponds.active} / ${snapshot.ponds.total}`);
    lines.push(`Health Breakdown: ${JSON.stringify(snapshot.ponds.healthBreakdown)}`);
    for (const p of snapshot.ponds.ponds) {
      lines.push(`  - ${p.name}: ${p.dimensions}, ${p.volume}, Health=${p.health}, Status=${p.status}`);
    }

    // === WATER PARAMETERS ===
    lines.push(`\n## WATER PARAMETERS (Latest Readings)`);
    lines.push(`Critical Ponds: ${snapshot.waterParameters.criticalCount}, Warning Ponds: ${snapshot.waterParameters.warningCount}`);
    for (const r of snapshot.waterParameters.readings) {
      lines.push(`  ${r.pond} [${r.readingDate}]:`);
      lines.push(`    pH=${r.ph}, Temp=${r.temperature}, DO=${r.dissolvedOxygen}, Salinity=${r.salinityPpt} ppt`);
      lines.push(`    NH3=${r.ammoniaNh3}, NO2=${r.nitriteNo2}, NO3=${r.nitrateNo3}, Hardness=${r.totalHardness}`);
      lines.push(`    Ca=${r.calciumCa}, Mg=${r.magnesiumMg}, Alkalinity=${r.alkalinity}`);
      lines.push(`    CO3=${r.carbonateCo3}, HCO3=${r.bicarbonateHco3}`);
      lines.push(`    Risk: Overall=${r.overallRisk}, Ammonia=${r.ammoniaRisk}, DO=${r.doRisk}, Hardness=${r.hardnessRisk}`);
    }

    // === HARVEST ===
    lines.push(`\n## HARVEST`);
    lines.push(`This Month: ${snapshot.harvest.thisMonth.totalWetKg} kg wet, ${snapshot.harvest.thisMonth.harvestCount} harvests`);
    lines.push(`Avg Dry Yield: ${snapshot.harvest.thisMonth.avgDryYieldPct}`);
    lines.push(`This Week: ${snapshot.harvest.thisWeek.totalWetKg} kg wet, ${snapshot.harvest.thisWeek.harvestCount} harvests`);
    if (snapshot.harvest.perPond.length > 0) {
      lines.push(`Per Pond This Month:`);
      for (const p of snapshot.harvest.perPond) {
        lines.push(`  - ${p.pond}: ${p.totalWetKg} kg (${p.harvests} harvests)`);
      }
    }

    // === PRODUCTION ===
    lines.push(`\n## PRODUCTION (This Month)`);
    lines.push(`Powder Output: ${snapshot.production.thisMonth.powderKg} kg`);
    lines.push(`Wet Input: ${snapshot.production.thisMonth.wetInputKg} kg`);
    lines.push(`Avg Efficiency: ${snapshot.production.thisMonth.avgEfficiencyPct}%`);
    lines.push(`Total Batches: ${snapshot.production.thisMonth.batchCount}`);

    // === CHEMICALS ===
    lines.push(`\n## CHEMICALS & NUTRIENTS`);
    lines.push(`Total Items: ${snapshot.chemicals.totalChemicals}, Low Stock: ${snapshot.chemicals.lowStockCount}`);
    if (snapshot.chemicals.lowStockItems.length > 0) {
      lines.push(`LOW STOCK ALERTS:`);
      for (const c of snapshot.chemicals.lowStockItems) {
        lines.push(`  ⚠️ ${c.name}: ${c.current} (min: ${c.minimum}) — ${c.deficit}`);
      }
    }
    if (snapshot.chemicals.recentUsage7Days.length > 0) {
      lines.push(`Usage (Last 7 Days):`);
      for (const u of snapshot.chemicals.recentUsage7Days) {
        lines.push(`  - ${u.chemical}: ${u.used}`);
      }
    }

    // === EXPENSES ===
    lines.push(`\n## EXPENSES (This Month)`);
    lines.push(`Total: ₹${snapshot.expenses.thisMonth.totalExpenses}`);
    lines.push(`Approved: ₹${snapshot.expenses.thisMonth.approved}, Pending: ₹${snapshot.expenses.thisMonth.pending}`);
    if (snapshot.expenses.byCategory.length > 0) {
      lines.push(`By Category:`);
      for (const c of snapshot.expenses.byCategory) {
        lines.push(`  - ${c.category}: ₹${c.amount} (${c.transactions} txns)`);
      }
    }

    // === SALES ===
    lines.push(`\n## SALES & CRM`);
    lines.push(`Revenue This Month: ₹${snapshot.sales.revenue.thisMonth} (${snapshot.sales.revenue.orderCount} orders, avg ₹${snapshot.sales.revenue.avgOrderValue})`);
    lines.push(`Pending Orders: ${snapshot.sales.pendingOrders.count} (₹${snapshot.sales.pendingOrders.totalValue})`);
    lines.push(`Customers: ${snapshot.sales.customers.total} total, ${snapshot.sales.customers.active} active`);
    lines.push(`Leads: ${snapshot.sales.leads.active} active, ${snapshot.sales.leads.won} won, ${snapshot.sales.leads.lost} lost`);
    lines.push(`Pipeline Value: ₹${snapshot.sales.leads.pipelineValue}`);

    // === P&L ===
    const revenue = snapshot.sales.revenue.thisMonth;
    const expenseTotal = snapshot.expenses.thisMonth.totalExpenses;
    const profit = revenue - expenseTotal;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
    lines.push(`\n## PROFIT & LOSS (This Month)`);
    lines.push(`Revenue: ₹${revenue}`);
    lines.push(`Expenses: ₹${expenseTotal}`);
    lines.push(`Net Profit: ₹${profit} (${margin}% margin)`);

    // === INVENTORY ===
    lines.push(`\n## INVENTORY`);
    if (snapshot.inventory.stockByProduct.length > 0) {
      for (const i of snapshot.inventory.stockByProduct) {
        lines.push(`  - ${i.product}: ${i.quantity}`);
      }
    }
    lines.push(`Batches: ${snapshot.inventory.batches.available} available / ${snapshot.inventory.batches.total} total`);
    lines.push(`Expiring Within 30 Days: ${snapshot.inventory.batches.expiringWithin30Days}`);

    // === ALERTS ===
    if (snapshot.alerts.unresolvedCount > 0) {
      lines.push(`\n## UNRESOLVED ALERTS (${snapshot.alerts.unresolvedCount} total, ${snapshot.alerts.criticalCount} critical)`);
      for (const a of snapshot.alerts.alerts) {
        lines.push(`  [${a.severity?.toUpperCase()}] ${a.pond}: ${a.title} — ${a.message}`);
        if (a.recommendation) lines.push(`    Recommendation: ${a.recommendation}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Build the auto-summary prompt that asks the AI to generate
   * a structured farm health report with actionable items.
   */
  buildSummaryUserPrompt(): string {
    return `Based on the farm data above, generate a comprehensive FARM HEALTH & OPERATIONS SUMMARY. Structure your response with these EXACT sections:

## 🏥 Overall Farm Health Score
Rate the farm's overall health from 1-10 and explain why.

## 🚨 Critical Actions Required (Do Today)
List immediate actions that need attention RIGHT NOW. Be specific — name the pond, chemical, or issue.

## ⚠️ Warnings & Watch Items
Issues that aren't critical yet but need monitoring this week.

## 📊 Production Analysis
- Analyze harvest yield vs. targets (100 kg/day target for the farm)
- Dry/wet ratio analysis
- Per-pond productivity comparison
- Production pipeline status

## 💧 Water Quality Summary
For each pond, summarize the water chemistry status:
- Identify any parameters that are out of optimal range
- Specific dosing recommendations if needed (chemical name, amount, timing)
- pH, ammonia, DO, hardness trends

## 💰 Financial Overview
- Revenue vs expenses P&L
- Cost per kg analysis if possible
- Top expense categories eating into margins
- Pending orders that need fulfillment

## 🧪 Chemical & Nutrient Status
- Which chemicals are running low and need to be ordered
- Estimated days until stockout based on recent usage rates
- Dosing optimization suggestions

## 📈 Growth Recommendations
- Top 3 specific actions to increase production this month
- Sales/lead conversion opportunities
- Cost reduction suggestions

## 🔮 7-Day Forecast & Plan
Based on current trends, what should the team focus on for the next 7 days? Create a day-by-day action plan.

Be SPECIFIC with numbers, pond names, chemical names, and amounts. Avoid generic advice. Use the actual data to make recommendations.`;
  }
}
