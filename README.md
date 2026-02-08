# SlabDex

Track your tokenized Pokemon slabs across platforms. Courtyard ownership, ALT.xyz pricing, set completion — all in one place.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **PostgreSQL** running locally (default: `localhost:5432`)
- **Redis** running locally (default: `localhost:6379`) — required for the worker

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file and fill in your values
cp .env.example .env

# 3. Generate Prisma client
pnpm db:generate

# 4. Run database migrations (creates tables)
pnpm db:migrate
```

## Development

```bash
# Start everything via Turborepo
pnpm dev

# Or start services individually:
pnpm dev:api      # NestJS API on http://localhost:3001
pnpm dev:web      # Next.js frontend on http://localhost:3000
pnpm dev:worker   # BullMQ worker process
```

## Build

```bash
pnpm build
```

## Project Structure

```
apps/
  web/                  Next.js 14 (App Router, Tailwind)
services/
  api/                  NestJS + Fastify API
    prisma/             Prisma schema & migrations
  worker/               BullMQ job workers & adapters
packages/
  shared/               Shared types & constants
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `API_PORT` | API server port (default: 3001) |
| `API_CORS_ORIGIN` | Allowed CORS origin (default: http://localhost:3000) |
| `COURTYARD_CONTRACT_ADDRESS` | Courtyard ERC-721 contract address |
| `EVM_RPC_URL` | Ethereum/Polygon RPC endpoint |
| `ALT_API_KEY` | ALT.xyz API key for pricing |
| `ALT_API_BASE_URL` | ALT.xyz API base URL |
