# FinSyndeo production application

Next.js application implementing the FinSyndeo guidelines (Revision 2). The [`FinSyndeo Guidelines/`](../FinSyndeo%20Guidelines/) folder remains the behavioural reference and is not modified.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS v4
- Neon Lakebase Postgres, Managed Better Auth, Object Storage (`aws-eu-central-1`)
- Drizzle ORM

## Setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `NEXT_PUBLIC_APP_URL` (use your Vercel production URL when deployed with Neon).
2. Enable Neon Auth: set `auth: true` in `neon.ts`, run `neon deploy`.
3. Push schema: `npm run db:push`
4. Seed demo data: `npm run db:seed`
5. Start: `npm run dev`

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run test` — Vitest unit tests
- `npm run db:push` — apply Drizzle schema to Postgres
- `npm run db:seed` — seed 80 sample institutions, 80 sample customers, and the unresolved particulars register

## Visual format

Application chrome uses prototype tokens from `FinSyndeo Guidelines/prototype/base.css`. Documents use `delivery.css` styling. Email templates follow `templates/EMAIL-TEMPLATES.md`.

## Fail-closed integrations

Screening, email, payments, voice, document extraction, and PEP checks block release or dispatch until credentials and legal particulars are configured. See Admin → Unresolved particulars.
