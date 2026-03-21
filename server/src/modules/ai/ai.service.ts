import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { aiConversations, aiAlerts, ponds, waterParameters } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { env } from '../../config/env.config.js';
import { FarmDataAggregator } from './farm-data.aggregator.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const farmData = new FarmDataAggregator();

export class AIService {
  // =============================================
  // AGENTIC FARM SUMMARY — full auto-analysis
  // =============================================

  /**
   * Generates a comprehensive AI-driven farm health summary.
   * Collects data from ALL modules, sends to AI, returns structured analysis.
   */
  async generateFarmSummary(provider?: string): Promise<{
    summary: string;
    snapshot: Record<string, unknown>;
    generatedAt: string;
  }> {
    // 1. Collect data from every module
    const snapshot = await farmData.collectFullSnapshot();

    // 2. Build the system prompt with all farm data
    const systemPrompt = farmData.buildSystemPrompt(snapshot);

    // 3. Build the user prompt requesting structured analysis
    const userPrompt = farmData.buildSummaryUserPrompt();

    // 4. Call AI provider
    const aiProvider = provider || env.defaultAiProvider || 'claude';
    let summary = '';

    try {
      if (aiProvider === 'claude') {
        summary = await this.callClaude(systemPrompt, [
          { role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
        ], 4096);
      } else if (aiProvider === 'openai') {
        summary = await this.callOpenAI(systemPrompt, [
          { role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
        ], 4096);
      } else {
        summary = 'AI provider not configured. Please set up Claude or OpenAI API keys in Settings > AI Configuration.';
      }
    } catch (error) {
      summary = `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your API key in Settings.`;
    }

    return {
      summary,
      snapshot: snapshot as unknown as Record<string, unknown>,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns the raw farm data snapshot (no AI call).
   * Used by the frontend to display real-time metrics.
   */
  async getFarmSnapshot() {
    return farmData.collectFullSnapshot();
  }

  // =============================================
  // CONTEXT-AWARE CHAT — auto-injects farm data
  // =============================================

  async chat(conversationId: number, userId: number, userMessage: string) {
    const conversation = await this.getConversation(conversationId, userId);
    const messages = (conversation.messages as ChatMessage[]) || [];

    // Build FULL-CONTEXT system prompt with live farm data
    const snapshot = await farmData.collectFullSnapshot();
    let systemPrompt = farmData.buildSystemPrompt(snapshot);
    systemPrompt += `\n\n---\nYou are the AI assistant for this spirulina farm. Answer the user's questions using the real-time data above. Be specific, cite numbers, pond names, and give actionable recommendations. If the user asks about dosing, calculate exact amounts based on pond volumes. Use ₹ for currency.`;

    // If there's a specific pond context, add extra detail
    if (conversation.contextPondId) {
      const [pond] = await db.select().from(ponds).where(eq(ponds.id, conversation.contextPondId)).limit(1);
      if (pond) {
        systemPrompt += `\n\nThe user is specifically asking about pond: ${pond.name} (${pond.code}), Volume: ${pond.volumeLiters}L`;
      }
    }

    // Add user message
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ];

    let assistantResponse = '';
    const aiProvider = conversation.provider || env.defaultAiProvider || 'claude';

    try {
      if (aiProvider === 'claude') {
        assistantResponse = await this.callClaude(systemPrompt, newMessages, 2048);
      } else if (aiProvider === 'openai') {
        assistantResponse = await this.callOpenAI(systemPrompt, newMessages, 2048);
      } else {
        assistantResponse = 'AI provider not configured. Please set up Claude or OpenAI API keys in settings.';
      }
    } catch (error) {
      assistantResponse = `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration.`;
    }

    // Add assistant response
    newMessages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    });

    // Update conversation
    await db.update(aiConversations).set({
      messages: newMessages,
      tokenUsage: sql`${aiConversations.tokenUsage} + 1`,
      updatedAt: new Date(),
    }).where(eq(aiConversations.id, conversationId));

    return {
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    };
  }

  // =============================================
  // CONVERSATIONS CRUD
  // =============================================

  async getConversations(userId: number) {
    return db.select().from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async getConversation(id: number, userId: number) {
    const [conv] = await db.select().from(aiConversations)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
      .limit(1);
    if (!conv) throw new AppError('Conversation not found', 404);
    return conv;
  }

  async createConversation(userId: number, data: { title?: string; provider?: string; model?: string; contextType?: string; contextPondId?: number }) {
    const [conv] = await db.insert(aiConversations).values({
      userId,
      title: data.title || 'New Conversation',
      provider: data.provider || env.defaultAiProvider || 'claude',
      model: data.model,
      contextType: data.contextType,
      contextPondId: data.contextPondId,
      messages: [],
    }).returning();
    return conv;
  }

  async deleteConversation(id: number, userId: number) {
    const [conv] = await db.select({ id: aiConversations.id }).from(aiConversations)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
      .limit(1);
    if (!conv) throw new AppError('Conversation not found', 404);
    await db.delete(aiConversations).where(eq(aiConversations.id, id));
  }

  // =============================================
  // AI PROVIDER CALLS
  // =============================================

  private async callClaude(systemPrompt: string, messages: ChatMessage[], maxTokens = 1024): Promise<string> {
    const apiKey = env.claudeApiKey;
    if (!apiKey) throw new Error('Claude API key not configured. Add your key in Settings > AI Configuration.');

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: env.defaultAiModel || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });

    const textBlock = response.content.find(c => c.type === 'text');
    return textBlock ? textBlock.text : 'No response generated';
  }

  private async callOpenAI(systemPrompt: string, messages: ChatMessage[], maxTokens = 1024): Promise<string> {
    const apiKey = env.openaiApiKey;
    if (!apiKey) throw new Error('OpenAI API key not configured. Add your key in Settings > AI Configuration.');

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      ],
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  }

  // =============================================
  // AI ALERTS
  // =============================================

  async getAlerts(filters?: { pondId?: number; isRead?: boolean; isResolved?: boolean }) {
    const conditions = [];
    if (filters?.pondId) conditions.push(eq(aiAlerts.pondId, filters.pondId));
    if (filters?.isRead !== undefined) conditions.push(eq(aiAlerts.isRead, filters.isRead));
    if (filters?.isResolved !== undefined) conditions.push(eq(aiAlerts.isResolved, filters.isResolved));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select({
      id: aiAlerts.id,
      pondId: aiAlerts.pondId,
      pondName: ponds.name,
      alertType: aiAlerts.alertType,
      severity: aiAlerts.severity,
      title: aiAlerts.title,
      message: aiAlerts.message,
      recommendation: aiAlerts.recommendation,
      isRead: aiAlerts.isRead,
      isResolved: aiAlerts.isResolved,
      triggeredValue: aiAlerts.triggeredValue,
      thresholdValue: aiAlerts.thresholdValue,
      createdAt: aiAlerts.createdAt,
    })
      .from(aiAlerts)
      .leftJoin(ponds, eq(aiAlerts.pondId, ponds.id))
      .where(whereClause)
      .orderBy(desc(aiAlerts.createdAt));
  }

  async markAlertRead(id: number) {
    const [alert] = await db.update(aiAlerts).set({ isRead: true }).where(eq(aiAlerts.id, id)).returning();
    if (!alert) throw new AppError('Alert not found', 404);
    return alert;
  }

  async resolveAlert(id: number, userId: number) {
    const [alert] = await db.update(aiAlerts).set({
      isResolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
    }).where(eq(aiAlerts.id, id)).returning();
    if (!alert) throw new AppError('Alert not found', 404);
    return alert;
  }

  async getUnreadCount() {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(aiAlerts)
      .where(and(eq(aiAlerts.isRead, false), eq(aiAlerts.isResolved, false)));
    return result?.count ?? 0;
  }
}
