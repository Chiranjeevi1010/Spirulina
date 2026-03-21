FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY server/package.json server/
COPY client/package.json client/
RUN pnpm install --frozen-lockfile

# Build client
FROM deps AS client-build
COPY packages/shared/ packages/shared/
COPY client/ client/
COPY tsconfig.base.json ./
RUN pnpm --filter spirulina-client build

# Production image
FROM base AS production
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY packages/shared/ packages/shared/
COPY server/ server/
COPY tsconfig.base.json ./

# Copy built client
COPY --from=client-build /app/client/dist client/dist

# Copy migration files
COPY server/drizzle server/drizzle

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "cd server && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/app.ts"]
