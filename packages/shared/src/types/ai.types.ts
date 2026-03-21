import { AIProvider, AIContextType, AlertSeverity, AlertType, HealthStatus } from './common.types';

export interface AIConversation {
  id: number;
  userId: number;
  title?: string;
  provider: AIProvider;
  model?: string;
  contextType?: AIContextType;
  contextPondId?: number;
  messages: AIChatMessage[];
  tokenUsage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIChatRequest {
  message: string;
  conversationId?: number;
  contextType?: AIContextType;
  contextPondId?: number;
  provider?: AIProvider;
}

export interface AIChatResponse {
  message: string;
  conversationId: number;
  tokenUsage: number;
}

export interface AIAlert {
  id: number;
  pondId?: number;
  pondName?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: number;
  resolvedAt?: string;
  triggeredValue?: number;
  thresholdValue?: number;
  createdAt: string;
}

export interface AIPondAnalysis {
  pondId: number;
  pondName: string;
  healthStatus: HealthStatus;
  summary: string;
  risks: AIRiskItem[];
  recommendations: string[];
  predictedGrowthRate?: number;
  suggestedActions: string[];
}

export interface AIRiskItem {
  parameter: string;
  currentValue: number;
  idealRange: { min: number; max: number };
  status: HealthStatus;
  trend: 'rising' | 'falling' | 'stable';
  message: string;
}

export interface AIDosingRecommendation {
  chemical: string;
  currentPpm: number;
  targetPpm: number;
  requiredQuantityKg: number;
  instructions: string;
  warnings: string[];
}

export interface AIWeeklyReport {
  weekStart: string;
  weekEnd: string;
  overallHealth: HealthStatus;
  pondSummaries: AIPondAnalysis[];
  criticalAlerts: AIAlert[];
  productionSummary: {
    totalWetKg: number;
    totalDryKg: number;
    avgEfficiency: number;
  };
  recommendations: string[];
}
