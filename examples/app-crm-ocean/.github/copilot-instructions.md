<!-- Copilot / AI agent instructions for OceanCRM_Web_App_Refine (Ocean Technolab) -->

# Quick Context

Ocean Technolab maintains this CRM frontend (React + TypeScript + Ant Design). The app uses the Refine library as a UI/data helper (hooks, providers) but Ocean CRM is the product — treat Refine as an implementation dependency.

# Big-picture architecture (short)

- Frontend (this repo): UI, routing, data shaping and small GraphQL helpers.
- Backend: separate Python API (set `VITE_API_URL` to point to it). Frontend expects `/v1` endpoints.
- Dataflow: UI components -> Refine hooks (useList/useForm/etc.) -> `dataProvider` (see `src/providers/data/index.ts`) -> `axiosInstance` -> backend.

# Critical files to read first

- `package.json` — scripts and node engine (Node >=22) and tools (`refine`, `biome`, `vite`).
- `src/providers/data/index.ts` — central axios setup, interceptors, `dataProvider` customizations (pagination, filters, getOne('lead') workaround).
- `src/providers/auth.ts` — auth flows, token vs cookie modes (`VITE_AUTH_METHOD`).
- `src/routes/**` and `src/App.tsx` — page registration and route composition.
- `src/components/**` — common UI primitives used across pages.

# Project-specific conventions & gotchas

- Pagination/query params: backend expects `page` and `page_size` (not `_start/_end`). `q` is the generic search param.
- Multi-value filters: e.g., `assigned_user_ids` passed as repeated/array query params.
- Auth modes: `VITE_AUTH_METHOD === 'token'` toggles token (localStorage `access_token`/`refresh_token`) vs cookie flows (`axiosInstance.withCredentials`).
- Special-case `getOne('lead')`: currently implemented by fetching a large page and finding the item client-side — if you add a `/v1/lead/{id}` endpoint, update `getOne` accordingly.
- Error handling: axios response interceptor redirects to `/login` on 401/422 and clears org/role caches.

-# Developer workflows & commands

- Install: `npm install`
- Dev server: `npm run dev` (starts Vite / Refine dev)
- Build: `npm run build` (runs `tsc` then `refine build`)
- Codegen (optional GraphQL flow): `npm run codegen` (uses GraphQL Codegen, see `graphql.config.ts`)
- Format / lint: `npm run format` / `npm run lint` (uses Biome)

Formatting details: this repo uses Biome for formatting and linting. Configuration lives in `biome.json` at the repo root. The npm scripts call Biome via `npx`:

```powershell
npx @biomejs/biome check --write
npx @biomejs/biome lint --write
```

You can run the npm scripts instead: `npm run format` / `npm run lint`.

# Integration points & external deps

- Backend API: `VITE_API_URL` (default fallback `http://localhost:8000/api`).
- Facebook / Meta leads: ingestion handled by backend; frontend reads leads via standard resources (leads endpoint).
- GraphQL: present for optional operations; generated types live under `src/graphql/` when codegen runs.

# How to add a new page (exact steps)

1. Create `src/routes/<resource>/` and add `list.tsx`, `create.tsx`, `edit.tsx`, `view.tsx` as needed.
2. Use Refine hooks (`useList`, `useForm`, `useModalForm`) and set `resource` to the backend resource name.
3. If using GraphQL operations, add query/mutation in `src/graphql/` and run `npm run codegen`.
4. Follow `src/providers/data/index.ts` shapes (page/page_size, q, assigned_user_ids) or update `dataProvider` if backend contract changes.

# PR checklist for AI agents

- Keep requests/response shapes consistent with `src/providers/data/index.ts`.
- Run `npm run format` and `npm run lint`.
- Include which env vars are required (`VITE_API_URL`, `VITE_AUTH_METHOD`) and any backend contract notes.

If you want, I can expand this into a longer `AGENT.md` with examples (common errors, sample `.env`, and sample API request/response shapes). Tell me which sections to expand.
