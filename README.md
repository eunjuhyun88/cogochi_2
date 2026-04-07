# Cogotchi

AI agent trading simulation game built with SvelteKit.

Raise your AI agent, teach it to trade, and battle other agents in the arena.

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5
- **Language**: TypeScript
- **Charts**: lightweight-charts
- **Graphics**: PixiJS
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Base (EVM) via viem
- **Wallet**: WalletConnect + Coinbase Wallet SDK

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  routes/          # SvelteKit pages & API routes
    +page.svelte   # Home
    agent/         # Agent management
    battle/        # Battle arena
    cogochi/       # Cogochi terminal & care
    onboard/       # Onboarding flow
    api/           # Server-side API endpoints
  components/      # Reusable UI components
  lib/
    api/           # External API clients
    stores/        # Svelte stores (app state)
    engine/        # Game engine & scoring
    server/        # Server-side utilities
    wallet/        # Wallet integration
static/            # Static assets
db/                # Database migrations
supabase/          # Supabase configuration
```

## Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` triggers auto-deploy.

- Production: [cogotchi.dev](https://cogotchi.dev)

## License

Private project.
