# Jiansheng Monorepo

This repository is a Bun workspace with two separate Nuxt projects:

- `apps/web`: public website + public tRPC backend
- `apps/admin`: admin UI + admin tRPC backend
- `packages/shared`: shared Drizzle schema/connection used by both apps

## Install

- `bun install`

## Develop

- `bun run dev:web` (public app)
- `bun run dev:admin` (admin app)

## Quality checks

- `bun run typecheck`
- `bun run lint`

## Database/auth helpers

- `bun run db:push`
- `bun run db:studio`
- `bun run auth:genKey`
- `bun run auth:createAdmin`
