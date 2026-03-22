import { eq, and, sql, desc, like, or } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { extractedLeads, leads, settings } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { GooglePlacesClient, SEARCH_QUERIES } from './google-places.client.js';

export class LeadExtractionService {
  async getConfig() {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.category, 'lead_extraction'));

    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return config;
  }

  async extractLeads(): Promise<number> {
    const config = await this.getConfig();
    const apiKey = (config.google_places_api_key as string) || process.env.GOOGLE_PLACES_API_KEY || '';
    if (!apiKey) {
      console.log('Lead extraction skipped: No Google Places API key configured');
      return 0;
    }

    const enabled = config.enabled !== false;
    if (!enabled) {
      console.log('Lead extraction skipped: Feature is disabled');
      return 0;
    }

    const dailyLimit = (config.daily_limit as number) || 20;
    const location = (config.search_location as string) || 'India';
    const categories = (config.search_categories as string[]) || Object.keys(SEARCH_QUERIES);

    // Check how many already extracted today
    const today = new Date().toISOString().split('T')[0];
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(extractedLeads)
      .where(eq(extractedLeads.extractionDate, today));

    const alreadyExtracted = countResult?.count ?? 0;
    if (alreadyExtracted >= dailyLimit) {
      console.log(`Lead extraction: Daily limit reached (${alreadyExtracted}/${dailyLimit})`);
      return 0;
    }

    const remaining = dailyLimit - alreadyExtracted;
    const client = new GooglePlacesClient(apiKey);
    let totalExtracted = 0;

    for (const category of categories) {
      if (totalExtracted >= remaining) break;

      const queries = SEARCH_QUERIES[category] || [`${category} in ${location}`];
      const query = queries[Math.floor(Math.random() * queries.length)];
      const searchQuery = `${query} in ${location}`;

      try {
        const response = await client.textSearch(searchQuery);
        if (response.status !== 'OK' || !response.results.length) continue;

        for (const place of response.results) {
          if (totalExtracted >= remaining) break;

          // Check if already exists
          const [existing] = await db
            .select({ id: extractedLeads.id })
            .from(extractedLeads)
            .where(eq(extractedLeads.googlePlaceId, place.place_id))
            .limit(1);

          if (existing) continue;

          // Get details for phone/website
          let phone: string | undefined;
          let website: string | undefined;
          try {
            const details = await client.getPlaceDetails(place.place_id);
            if (details) {
              phone = details.international_phone_number || details.formatted_phone_number;
              website = details.website;
            }
          } catch {
            // Details fetch failed, continue with basic info
          }

          await db.insert(extractedLeads).values({
            businessName: place.name,
            phone: phone || null,
            website: website || null,
            address: place.formatted_address || null,
            category,
            googlePlaceId: place.place_id,
            extractionDate: today,
            status: 'new',
            rawData: place as unknown as Record<string, unknown>,
          });

          totalExtracted++;
        }

        // Small delay between API calls
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Lead extraction error for category ${category}:`, err);
      }
    }

    console.log(`Lead extraction completed: ${totalExtracted} new leads`);
    return totalExtracted;
  }

  async list(page: number, limit: number, filters?: { status?: string; category?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.status) conditions.push(eq(extractedLeads.status, filters.status));
    if (filters?.category) conditions.push(eq(extractedLeads.category, filters.category));
    if (filters?.search) {
      conditions.push(
        or(
          like(extractedLeads.businessName, `%${filters.search}%`),
          like(extractedLeads.phone, `%${filters.search}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(extractedLeads).where(whereClause).limit(limit).offset(offset).orderBy(desc(extractedLeads.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(extractedLeads).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [lead] = await db.select().from(extractedLeads).where(eq(extractedLeads.id, id)).limit(1);
    if (!lead) throw new AppError('Extracted lead not found', 404);
    return lead;
  }

  async review(id: number, status: string, notes: string | undefined, userId: number) {
    const lead = await this.getById(id);

    if (lead.status !== 'new' && lead.status !== 'reviewed') {
      throw new AppError('Lead has already been processed', 400);
    }

    let approvedLeadId: number | undefined;

    if (status === 'approved') {
      // Create entry in main leads table
      const [newLead] = await db.insert(leads).values({
        contactName: lead.contactName || lead.businessName,
        companyName: lead.businessName,
        email: lead.email,
        phone: lead.phone,
        leadSource: 'google_places',
        customerType: this.mapCategoryToCustomerType(lead.category),
        status: 'new',
        notes: `Auto-extracted from Google Places. ${lead.address || ''}\n${lead.website || ''}`.trim(),
        createdBy: userId,
      }).returning();

      approvedLeadId = newLead.id;
    }

    const [updated] = await db.update(extractedLeads).set({
      status,
      notes,
      reviewedBy: userId,
      reviewedAt: new Date(),
      ...(approvedLeadId ? { approvedLeadId } : {}),
    }).where(eq(extractedLeads.id, id)).returning();

    return updated;
  }

  async bulkReview(ids: number[], status: string, userId: number) {
    const results = { approved: 0, rejected: 0, skipped: 0 };

    for (const id of ids) {
      try {
        await this.review(id, status, undefined, userId);
        if (status === 'approved') results.approved++;
        else results.rejected++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async getStats() {
    const today = new Date().toISOString().split('T')[0];

    const [statusCounts, todayCounts] = await Promise.all([
      db.select({
        status: extractedLeads.status,
        count: sql<number>`count(*)::int`,
      }).from(extractedLeads).groupBy(extractedLeads.status),

      db.select({
        count: sql<number>`count(*)::int`,
      }).from(extractedLeads).where(eq(extractedLeads.extractionDate, today)),
    ]);

    return {
      byStatus: statusCounts,
      extractedToday: todayCounts[0]?.count ?? 0,
    };
  }

  async getExtractionHistory() {
    const history = await db
      .select({
        date: extractedLeads.extractionDate,
        count: sql<number>`count(*)::int`,
      })
      .from(extractedLeads)
      .groupBy(extractedLeads.extractionDate)
      .orderBy(desc(extractedLeads.extractionDate))
      .limit(30);

    return history;
  }

  private mapCategoryToCustomerType(category: string): string {
    const map: Record<string, string> = {
      nutraceuticals: 'nutraceutical',
      poultry_farm: 'direct',
      livestock: 'direct',
      fisheries: 'fish_farmer',
      shrimp: 'shrimp_farmer',
      aquaculture: 'fish_farmer',
      animal_feed: 'direct',
      health_supplements: 'retail',
    };
    return map[category] || 'direct';
  }
}
