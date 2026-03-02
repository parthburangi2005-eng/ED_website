# Integrated Smart Asset Management System

Frontend: Vite + React + TypeScript  
Backend: Express + Prisma + Clerk  
Database: PostgreSQL

## Local setup

1. Install dependencies:

```sh
npm install
```

2. Create env file:

```sh
cp .env.example .env
```

3. Update `.env` with your Clerk and PostgreSQL credentials.

4. Generate Prisma client + push schema + seed:

```sh
npm run db:setup
```

5. Run web + API together:

```sh
npm run dev:full
```

## Production deployment (recommended)

### 1) Backend + DB on Render

- Use `render.yaml` from this repo.
- Set environment variables:
  - `DATABASE_URL` (Render PostgreSQL internal URL)
  - `CLERK_SECRET_KEY`
  - `CLERK_PUBLISHABLE_KEY`
  - `FRONTEND_ORIGIN` (your frontend domain)
- Deploy command:
  - Build: `npm install && npm run db:generate && npm run build`
  - Start: `npm run start:api`

### 2) Frontend on Vercel

- Import this repo in Vercel.
- Build command: `npm run build`
- Output directory: `dist`
- Set:
  - `VITE_API_URL` to your Render API URL
  - `VITE_CLERK_PUBLISHABLE_KEY`

## Useful scripts

- `npm run dev` - frontend only
- `npm run dev:api` - backend only
- `npm run dev:full` - frontend + backend
- `npm run db:generate` - Prisma client generate
- `npm run db:push` - apply schema changes
- `npm run db:migrate:deploy` - run production migrations
- `npm run db:seed` - seed sample data
- `npm run build` - production build
- `npm run lint` - lint check
