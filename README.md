# Landpower Umpire Console (Local-Only MVP)

A local-only Next.js + Prisma + SQLite web app for Landpower white-cell turn control, close combat adjudication, and auditable logging.

## Stack
- Next.js (App Router) + React + TypeScript
- Prisma + SQLite (local file)
- Route handlers under `app/api/*`
- Global CSS in `app/globals.css`

## Setup
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open http://localhost:3000.

## Available scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## MVP Workflow
1. `/setup` create a game and add units (single or bulk CSV-like lines).
2. `/turn` set/advance turn and phase.
3. `/units` edit CPP, suppression, destroyed status, and notes inline.
4. `/actions/new?type=close_combat` create a close combat draft action.
5. `/actions/[id]` roll D10 to generate **proposed** result, then **approve** or **modify** (with override reason), then **apply**.
6. `/log` review applied outcomes and copy chat-ready lines.

## Rules implementation note
The close combat CRT is encoded in `lib/rules/closeCombatCRT.json` and consumed by pure adjudication logic in `lib/adjudication/closeCombat.ts`.

For MVP speed, this is a single encoded ruleset for end-to-end workflow validation. Validate/align table values against your exact event packet before production use.
