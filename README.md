# Jiansheng Monorepo

This repository is a Bun workspace with two separate Nuxt projects:

- `apps/web`: public website + public tRPC backend
- `apps/admin`: admin UI + admin tRPC backend
- `packages/shared`: shared Drizzle schema/connection used by both apps

Install Vite+ (`vp`) once, then use it as the toolchain. Bun stays the package manager.

## Install

- `vp install`

## Develop

- `vp run dev:web` (public app)
- `vp run dev:admin` (admin app)

## Quality checks

- `vp check` (format, lint, type-aware lint)
- `vp run typecheck`

## Database/auth helpers

- `vp run db:push`
- `vp run db:studio`
- `vp run auth:createAdmin`
