# Copilot Instructions for `jiansheng`

## Big picture architecture
- Use bun as the runtime and package manager for both frontend and backend.
- This is a Nuxt 4 fullstack app: Vue UI in `app/`, server API in `server/`, shared types via tRPC.
- API boundary is tRPC only (`/api/trpc`), configured in `server/api/trpc/[trpc].ts` and consumed via plugin `app/plugins/trpc.ts` (`$trpc`).
- Persistence uses Drizzle + PostgreSQL (`server/db/schema.ts`, `server/db/index.ts`, `drizzle.config.ts`).
- Content pages (`about`, `contact`) come from Nuxt Content (`content/`, rendered via `[...slug].vue`).
- Admin and public surfaces share data models (`works`, `products`) but admin writes are protected procedures.

## Backend patterns (must follow)
- Define routers in `server/trpc/routers/*.ts`, register in `server/trpc/routers/index.ts`.
- Use `publicProcedure` for read/public actions and `protectedProcedure` for admin mutations (`server/trpc/trpc.ts`).
- Validate all inputs with `zod` at procedure boundaries.
- Throw `TRPCError` for domain errors; do not return ad-hoc error objects.
- For image-backed entities, store `s3FileId` in DB and resolve signed URLs server-side before returning (`attachImageUrls` pattern in `work.ts` and `product.ts`).

## Auth and session conventions
- Auth token is a signed+encrypted JWT (JWS inside JWE) issued in `server/utils/auth.ts` and stored in `access_tokens` table.
- tRPC context reads `Authorization` header and resolves user in `server/trpc/context.ts`.
- Client sends auth header automatically from `useUserStore().accessToken` in `app/plugins/trpc.ts`.
- Unauthorized client errors should flow through `useErrorHandler` (`app/composables/errorHandler.ts`) to trigger login redirect.

## Stripe and product conventions
- Never accept `stripeProductId` / `stripePriceId` from client input.
- Create/update Stripe product+price server-side in `server/trpc/routers/product.ts`, then persist IDs in DB.
- Checkout is created server-side (`createCheckoutSession`) and client redirects to returned `url`; shipping is collected in Stripe checkout session config.

## S3 upload workflow (project-specific)
- Upload is 2-step: call `createImage` mutation (returns DB image id + presigned URL), then upload file with `axios.put(url, file)` from client.
- Deletion must remove both S3 object and DB row (`deleteImage` patterns).
- Use `S3Controller` in `server/utils/s3.ts` for all signed URL and delete operations.

## Frontend data/state patterns
- Use `useQuery` from `@pinia/colada` for reads; invalidate with `useQueryCache().invalidateQueries({ key: [...] })` after mutations.
- Use Pinia stores with persisted state:
  - `useUserStore`: cookies (auth)
  - `useCartStore`: localStorage (shop cart)
- Shared UI logic should be extracted to components (example: `app/components/CartSlideover.vue` used by both layouts).

## Developer workflow
- Install deps: `bun install` (README standard).
- Local dev: `bun run dev`.
- Type-check before handoff: `npx nuxi typecheck` (or `npm run typecheck`).
- Lint: `npm run lint` / `npm run lint:fix`.
- DB schema sync (no handwritten migrations in this repo flow): `npm run db:push`.
- Admin bootstrap helpers: `npm run auth:genKey`, `npm run auth:createAdmin`.

## Implementation guardrails for agents
- Preserve existing Nuxt UI + Tailwind utility style; avoid introducing alternate UI libraries.
- Keep mutations server-authoritative for security-sensitive data (prices, auth, Stripe IDs, file keys).
- When adding new entities with images, follow `workImages`/`productImages` table + presigned upload pattern rather than storing raw URLs directly.
- Prefer minimal, surgical edits and keep naming consistent with existing router/store/component conventions.
