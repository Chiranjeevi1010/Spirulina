import 'dotenv/config';

export const env = {
  port: parseInt(process.env.SERVER_PORT || process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/spirulina',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER || 'claude') as 'claude' | 'openai',
  defaultAiModel: process.env.DEFAULT_AI_MODEL || 'claude-sonnet-4-20250514',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
} as const;
