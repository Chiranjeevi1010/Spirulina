import { eq, and, desc, sql, between, gte, lte } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { waterParameters, ponds, aiAlerts } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { assessAmmoniaRisk, assessDORisk, assessHardnessRisk } from '@spirulina/shared';
import type { HealthStatus } from '@spirulina/shared';

type RiskLevel = HealthStatus; // 'RED' | 'YELLOW' | 'GREEN'

const RISK_PRIORITY: Record<RiskLevel, number> = {
  RED: 3,
  YELLOW: 2,
  GREEN: 1,
};

function worstRisk(...risks: RiskLevel[]): RiskLevel {
  let worst: RiskLevel = 'GREEN';
  for (const r of risks) {
    if (RISK_PRIORITY[r] > RISK_PRIORITY[worst]) worst = r;
  }
  return worst;
}

function assessMagnesiumRisk(magnesiumMg: number | null | undefined): RiskLevel {
  if (magnesiumMg == null) return 'GREEN';
  if (magnesiumMg > 400) return 'RED';
  if (magnesiumMg > 350) return 'YELLOW';
  return 'GREEN';
}

function healthStatusFromRisk(risk: RiskLevel): string {
  return risk; // HealthStatus matches risk values: RED, YELLOW, GREEN
}

export class WaterParametersService {
  /**
   * List water parameter readings for a pond with pagination and optional date range filter.
   */
  async list(
    pondId: number,
    page: number,
    limit: number,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [eq(waterParameters.pondId, pondId)];

    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(waterParameters.readingDate, filters.startDate, filters.endDate),
      );
    } else if (filters?.startDate) {
      conditions.push(gte(waterParameters.readingDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(waterParameters.readingDate, filters.endDate));
    }

    const whereClause = and(...conditions);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(waterParameters)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(waterParameters.readingDate), desc(waterParameters.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(waterParameters)
        .where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  /**
   * Get a single water parameter reading by ID.
   */
  async getById(id: number) {
    const [reading] = await db
      .select()
      .from(waterParameters)
      .where(eq(waterParameters.id, id))
      .limit(1);

    if (!reading) throw new AppError('Water parameter reading not found', 404);
    return reading;
  }

  /**
   * Get the most recent reading for a pond.
   */
  async getLatest(pondId: number) {
    const [reading] = await db
      .select()
      .from(waterParameters)
      .where(eq(waterParameters.pondId, pondId))
      .orderBy(desc(waterParameters.readingDate), desc(waterParameters.createdAt))
      .limit(1);

    if (!reading) throw new AppError('No readings found for this pond', 404);
    return reading;
  }

  /**
   * Create a new water parameter reading with automatic risk calculation.
   * Also creates AI alerts for RED risks and updates pond health status.
   */
  async create(
    pondId: number,
    data: Record<string, unknown>,
    userId?: number,
  ) {
    // Verify the pond exists
    const [pond] = await db
      .select()
      .from(ponds)
      .where(eq(ponds.id, pondId))
      .limit(1);
    if (!pond) throw new AppError('Pond not found', 404);

    // Parse numeric values for risk calculations
    const ammoniaNh3 = data.ammoniaNh3 != null ? Number(data.ammoniaNh3) : null;
    const ph = data.ph != null ? Number(data.ph) : null;
    const temperatureC = data.temperatureC != null ? Number(data.temperatureC) : null;
    const dissolvedOxygen = data.dissolvedOxygen != null ? Number(data.dissolvedOxygen) : null;
    const totalHardness = data.totalHardness != null ? Number(data.totalHardness) : null;
    const magnesiumMg = data.magnesiumMg != null ? Number(data.magnesiumMg) : null;

    // --- Risk calculation pipeline ---
    let ammoniaRisk: RiskLevel = 'GREEN';
    if (ammoniaNh3 != null && ph != null) {
      ammoniaRisk = assessAmmoniaRisk(ammoniaNh3, ph, temperatureC ?? 30);
    }

    let doRisk: RiskLevel = 'GREEN';
    if (dissolvedOxygen != null) {
      doRisk = assessDORisk(dissolvedOxygen);
    }

    let hardnessRisk: RiskLevel = 'GREEN';
    if (totalHardness != null) {
      hardnessRisk = assessHardnessRisk(totalHardness);
    }

    const mgRisk = assessMagnesiumRisk(magnesiumMg);

    const overallRisk = worstRisk(ammoniaRisk, doRisk, hardnessRisk, mgRisk);

    // Build the insert values (convert numbers to strings for decimal columns)
    const insertValues: Record<string, unknown> = {
      pondId,
      readingDate: data.readingDate as string,
      readingTime: (data.readingTime as string) || 'morning',
      ammoniaRisk,
      doRisk,
      hardnessRisk,
      overallRisk,
      recordedBy: userId,
      notes: data.notes as string | undefined,
    };

    // Set optional decimal fields as strings
    if (data.temperatureC != null) insertValues.temperatureC = String(data.temperatureC);
    if (data.ph != null) insertValues.ph = String(data.ph);
    if (data.dissolvedOxygen != null) insertValues.dissolvedOxygen = String(data.dissolvedOxygen);
    if (data.salinityPpt != null) insertValues.salinityPpt = String(data.salinityPpt);
    if (data.alkalinity != null) insertValues.alkalinity = String(data.alkalinity);
    if (data.carbonateCo3 != null) insertValues.carbonateCo3 = String(data.carbonateCo3);
    if (data.bicarbonateHco3 != null) insertValues.bicarbonateHco3 = String(data.bicarbonateHco3);
    if (data.totalHardness != null) insertValues.totalHardness = String(data.totalHardness);
    if (data.calciumCa != null) insertValues.calciumCa = String(data.calciumCa);
    if (data.magnesiumMg != null) insertValues.magnesiumMg = String(data.magnesiumMg);
    if (data.sodiumNa != null) insertValues.sodiumNa = String(data.sodiumNa);
    if (data.potassiumK != null) insertValues.potassiumK = String(data.potassiumK);
    if (data.totalAmmonia != null) insertValues.totalAmmonia = String(data.totalAmmonia);
    if (data.ammoniaNh3 != null) insertValues.ammoniaNh3 = String(data.ammoniaNh3);
    if (data.nitriteNo2 != null) insertValues.nitriteNo2 = String(data.nitriteNo2);
    if (data.nitrateNo3 != null) insertValues.nitrateNo3 = String(data.nitrateNo3);
    if (data.foamLevel != null) insertValues.foamLevel = data.foamLevel as string;
    if (data.paddleWheelRpm != null) insertValues.paddleWheelRpm = String(data.paddleWheelRpm);
    if (data.harvestPercentage != null) insertValues.harvestPercentage = String(data.harvestPercentage);

    const [reading] = await db
      .insert(waterParameters)
      .values(insertValues as typeof waterParameters.$inferInsert)
      .returning();

    // --- Create AI alerts for RED risks ---
    const alertsToCreate: Array<{
      pondId: number;
      alertType: string;
      severity: string;
      title: string;
      message: string;
      recommendation: string;
      triggeredValue?: string;
      thresholdValue?: string;
    }> = [];

    if (ammoniaRisk === 'RED') {
      alertsToCreate.push({
        pondId,
        alertType: 'ammonia_spike',
        severity: 'critical',
        title: `Ammonia spike detected in ${pond.name}`,
        message: `Toxic ammonia levels are critically high (NH3: ${ammoniaNh3} mg/L at pH ${ph}). Immediate action required to prevent culture crash.`,
        recommendation: 'Stop feeding, increase aeration, and consider partial water exchange. Monitor ammonia levels every 2 hours.',
        triggeredValue: ammoniaNh3 != null ? String(ammoniaNh3) : undefined,
        thresholdValue: '0.05',
      });
    }

    if (doRisk === 'RED') {
      alertsToCreate.push({
        pondId,
        alertType: 'do_crash',
        severity: 'critical',
        title: `Dissolved oxygen crash in ${pond.name}`,
        message: `Dissolved oxygen has dropped to ${dissolvedOxygen} mg/L, below the critical threshold of 3.0 mg/L. Culture crash is imminent.`,
        recommendation: 'Immediately increase paddle wheel RPM and aeration. Consider emergency oxygen supplementation.',
        triggeredValue: dissolvedOxygen != null ? String(dissolvedOxygen) : undefined,
        thresholdValue: '3.0',
      });
    }

    if (hardnessRisk === 'RED') {
      alertsToCreate.push({
        pondId,
        alertType: 'hardness_high',
        severity: 'critical',
        title: `Total hardness critical in ${pond.name}`,
        message: `Total hardness has reached ${totalHardness} mg/L, exceeding the critical threshold of 3000 mg/L.`,
        recommendation: 'Perform a partial water drain and refill with fresh water to reduce mineral concentration.',
        triggeredValue: totalHardness != null ? String(totalHardness) : undefined,
        thresholdValue: '3000',
      });
    }

    if (mgRisk === 'RED') {
      alertsToCreate.push({
        pondId,
        alertType: 'mg_accumulation',
        severity: 'critical',
        title: `Magnesium overload in ${pond.name}`,
        message: `Magnesium level has reached ${magnesiumMg} mg/L, exceeding the critical threshold of 400 mg/L. This can inhibit Spirulina growth.`,
        recommendation: 'Perform a dilution by partial drain and refill to reduce magnesium concentration below 350 mg/L.',
        triggeredValue: magnesiumMg != null ? String(magnesiumMg) : undefined,
        thresholdValue: '400',
      });
    }

    if (alertsToCreate.length > 0) {
      await db.insert(aiAlerts).values(alertsToCreate);
    }

    // --- Update pond health status based on overall risk ---
    await db
      .update(ponds)
      .set({
        healthStatus: healthStatusFromRisk(overallRisk),
        updatedAt: new Date(),
      })
      .where(eq(ponds.id, pondId));

    return reading;
  }

  /**
   * Update an existing water parameter reading. Recalculates risks from the merged data.
   */
  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.getById(id);

    // Merge existing values with update data for risk recalculation.
    // Drizzle returns decimal columns as strings, so parse them.
    const ammoniaNh3 = data.ammoniaNh3 !== undefined
      ? (data.ammoniaNh3 != null ? Number(data.ammoniaNh3) : null)
      : (existing.ammoniaNh3 != null ? Number(existing.ammoniaNh3) : null);

    const ph = data.ph !== undefined
      ? (data.ph != null ? Number(data.ph) : null)
      : (existing.ph != null ? Number(existing.ph) : null);

    const temperatureC = data.temperatureC !== undefined
      ? (data.temperatureC != null ? Number(data.temperatureC) : null)
      : (existing.temperatureC != null ? Number(existing.temperatureC) : null);

    const dissolvedOxygen = data.dissolvedOxygen !== undefined
      ? (data.dissolvedOxygen != null ? Number(data.dissolvedOxygen) : null)
      : (existing.dissolvedOxygen != null ? Number(existing.dissolvedOxygen) : null);

    const totalHardness = data.totalHardness !== undefined
      ? (data.totalHardness != null ? Number(data.totalHardness) : null)
      : (existing.totalHardness != null ? Number(existing.totalHardness) : null);

    const magnesiumMg = data.magnesiumMg !== undefined
      ? (data.magnesiumMg != null ? Number(data.magnesiumMg) : null)
      : (existing.magnesiumMg != null ? Number(existing.magnesiumMg) : null);

    // Recalculate risks
    let ammoniaRisk: RiskLevel = 'GREEN';
    if (ammoniaNh3 != null && ph != null) {
      ammoniaRisk = assessAmmoniaRisk(ammoniaNh3, ph, temperatureC ?? 30);
    }

    let doRisk: RiskLevel = 'GREEN';
    if (dissolvedOxygen != null) {
      doRisk = assessDORisk(dissolvedOxygen);
    }

    let hardnessRisk: RiskLevel = 'GREEN';
    if (totalHardness != null) {
      hardnessRisk = assessHardnessRisk(totalHardness);
    }

    const mgRisk = assessMagnesiumRisk(magnesiumMg);
    const overallRisk = worstRisk(ammoniaRisk, doRisk, hardnessRisk, mgRisk);

    // Build update object
    const updateData: Record<string, unknown> = {
      ammoniaRisk,
      doRisk,
      hardnessRisk,
      overallRisk,
      updatedAt: new Date(),
    };

    if (data.readingDate !== undefined) updateData.readingDate = data.readingDate;
    if (data.readingTime !== undefined) updateData.readingTime = data.readingTime;
    if (data.temperatureC !== undefined) updateData.temperatureC = data.temperatureC != null ? String(data.temperatureC) : null;
    if (data.ph !== undefined) updateData.ph = data.ph != null ? String(data.ph) : null;
    if (data.dissolvedOxygen !== undefined) updateData.dissolvedOxygen = data.dissolvedOxygen != null ? String(data.dissolvedOxygen) : null;
    if (data.salinityPpt !== undefined) updateData.salinityPpt = data.salinityPpt != null ? String(data.salinityPpt) : null;
    if (data.alkalinity !== undefined) updateData.alkalinity = data.alkalinity != null ? String(data.alkalinity) : null;
    if (data.carbonateCo3 !== undefined) updateData.carbonateCo3 = data.carbonateCo3 != null ? String(data.carbonateCo3) : null;
    if (data.bicarbonateHco3 !== undefined) updateData.bicarbonateHco3 = data.bicarbonateHco3 != null ? String(data.bicarbonateHco3) : null;
    if (data.totalHardness !== undefined) updateData.totalHardness = data.totalHardness != null ? String(data.totalHardness) : null;
    if (data.calciumCa !== undefined) updateData.calciumCa = data.calciumCa != null ? String(data.calciumCa) : null;
    if (data.magnesiumMg !== undefined) updateData.magnesiumMg = data.magnesiumMg != null ? String(data.magnesiumMg) : null;
    if (data.sodiumNa !== undefined) updateData.sodiumNa = data.sodiumNa != null ? String(data.sodiumNa) : null;
    if (data.potassiumK !== undefined) updateData.potassiumK = data.potassiumK != null ? String(data.potassiumK) : null;
    if (data.totalAmmonia !== undefined) updateData.totalAmmonia = data.totalAmmonia != null ? String(data.totalAmmonia) : null;
    if (data.ammoniaNh3 !== undefined) updateData.ammoniaNh3 = data.ammoniaNh3 != null ? String(data.ammoniaNh3) : null;
    if (data.nitriteNo2 !== undefined) updateData.nitriteNo2 = data.nitriteNo2 != null ? String(data.nitriteNo2) : null;
    if (data.nitrateNo3 !== undefined) updateData.nitrateNo3 = data.nitrateNo3 != null ? String(data.nitrateNo3) : null;
    if (data.foamLevel !== undefined) updateData.foamLevel = data.foamLevel;
    if (data.paddleWheelRpm !== undefined) updateData.paddleWheelRpm = data.paddleWheelRpm != null ? String(data.paddleWheelRpm) : null;
    if (data.harvestPercentage !== undefined) updateData.harvestPercentage = data.harvestPercentage != null ? String(data.harvestPercentage) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [reading] = await db
      .update(waterParameters)
      .set(updateData)
      .where(eq(waterParameters.id, id))
      .returning();

    // Update pond health status
    await db
      .update(ponds)
      .set({
        healthStatus: healthStatusFromRisk(overallRisk),
        updatedAt: new Date(),
      })
      .where(eq(ponds.id, existing.pondId));

    return reading;
  }

  /**
   * Delete a water parameter reading.
   */
  async delete(id: number) {
    const existing = await this.getById(id);

    await db.delete(waterParameters).where(eq(waterParameters.id, id));

    // After deletion, recalculate the pond health from the latest remaining reading
    const [latestRemaining] = await db
      .select({ overallRisk: waterParameters.overallRisk })
      .from(waterParameters)
      .where(eq(waterParameters.pondId, existing.pondId))
      .orderBy(desc(waterParameters.readingDate), desc(waterParameters.createdAt))
      .limit(1);

    const newHealth = latestRemaining
      ? healthStatusFromRisk(latestRemaining.overallRisk as RiskLevel)
      : 'GREEN';

    await db
      .update(ponds)
      .set({ healthStatus: newHealth, updatedAt: new Date() })
      .where(eq(ponds.id, existing.pondId));
  }

  /**
   * Get trend data for a specific parameter over a date range.
   * Returns an array of { readingDate, readingTime, value } suitable for charting.
   */
  async getTrends(
    pondId: number,
    parameter: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Validate that the parameter name is a valid column to prevent injection
    const allowedParameters = [
      'temperatureC', 'ph', 'dissolvedOxygen', 'salinityPpt',
      'alkalinity', 'carbonateCo3', 'bicarbonateHco3', 'totalHardness',
      'calciumCa', 'magnesiumMg', 'sodiumNa', 'potassiumK',
      'totalAmmonia', 'ammoniaNh3', 'nitriteNo2', 'nitrateNo3',
      'paddleWheelRpm', 'harvestPercentage',
    ];

    if (!allowedParameters.includes(parameter)) {
      throw new AppError(`Invalid parameter: ${parameter}. Allowed: ${allowedParameters.join(', ')}`, 400);
    }

    const conditions = [eq(waterParameters.pondId, pondId)];

    if (startDate && endDate) {
      conditions.push(between(waterParameters.readingDate, startDate, endDate));
    } else if (startDate) {
      conditions.push(gte(waterParameters.readingDate, startDate));
    } else if (endDate) {
      conditions.push(lte(waterParameters.readingDate, endDate));
    }

    const whereClause = and(...conditions);

    // Map camelCase parameter names to their snake_case column names
    const columnMap: Record<string, string> = {
      temperatureC: 'temperature_c',
      ph: 'ph',
      dissolvedOxygen: 'dissolved_oxygen',
      salinityPpt: 'salinity_ppt',
      alkalinity: 'alkalinity',
      carbonateCo3: 'carbonate_co3',
      bicarbonateHco3: 'bicarbonate_hco3',
      totalHardness: 'total_hardness',
      calciumCa: 'calcium_ca',
      magnesiumMg: 'magnesium_mg',
      sodiumNa: 'sodium_na',
      potassiumK: 'potassium_k',
      totalAmmonia: 'total_ammonia',
      ammoniaNh3: 'ammonia_nh3',
      nitriteNo2: 'nitrite_no2',
      nitrateNo3: 'nitrate_no3',
      paddleWheelRpm: 'paddle_wheel_rpm',
      harvestPercentage: 'harvest_percentage',
    };

    const columnName = columnMap[parameter];

    const results = await db
      .select({
        readingDate: waterParameters.readingDate,
        readingTime: waterParameters.readingTime,
        value: sql<string>`${sql.raw(`"${columnName}"`)}`,
      })
      .from(waterParameters)
      .where(whereClause)
      .orderBy(waterParameters.readingDate, waterParameters.createdAt);

    return results.map((row) => ({
      readingDate: row.readingDate,
      readingTime: row.readingTime,
      value: row.value != null ? Number(row.value) : null,
    }));
  }

  /**
   * Get all active parameter alerts: readings where any risk is RED or YELLOW.
   * Returns the readings joined with pond info, ordered by severity then date.
   */
  async getAlerts() {
    const results = await db
      .select({
        id: waterParameters.id,
        pondId: waterParameters.pondId,
        pondName: ponds.name,
        pondCode: ponds.code,
        readingDate: waterParameters.readingDate,
        readingTime: waterParameters.readingTime,
        ammoniaRisk: waterParameters.ammoniaRisk,
        doRisk: waterParameters.doRisk,
        hardnessRisk: waterParameters.hardnessRisk,
        overallRisk: waterParameters.overallRisk,
        ammoniaNh3: waterParameters.ammoniaNh3,
        dissolvedOxygen: waterParameters.dissolvedOxygen,
        totalHardness: waterParameters.totalHardness,
        magnesiumMg: waterParameters.magnesiumMg,
        ph: waterParameters.ph,
        temperatureC: waterParameters.temperatureC,
        createdAt: waterParameters.createdAt,
      })
      .from(waterParameters)
      .innerJoin(ponds, eq(waterParameters.pondId, ponds.id))
      .where(
        sql`${waterParameters.overallRisk} IN ('RED', 'YELLOW')`,
      )
      .orderBy(
        sql`CASE ${waterParameters.overallRisk} WHEN 'RED' THEN 1 WHEN 'YELLOW' THEN 2 ELSE 3 END`,
        desc(waterParameters.readingDate),
      );

    return results;
  }
}
