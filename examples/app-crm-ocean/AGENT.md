# AGENT Guide — Ocean Technolab CRM Frontend

Purpose: provide AI agents and new frontend devs with concrete API shapes, request/response examples, and practical debugging steps specific to this repo.

## API surface (short)

- Base URL: `API_URL = ${VITE_API_URL || 'http://localhost:8000/api'}/v1` (see `src/providers/data/index.ts`).
- Typical resource endpoints: `GET /v1/<resource>`, `GET /v1/<resource>/{id}`, `POST /v1/<resource>`, `PUT /v1/<resource>/{id}`.
- Pagination: backend expects `page` and `page_size` query params.
- Search and filters: use `q` for generic search; multi-value filters sent as repeated query params (e.g., `assigned_user_ids=1&assigned_user_ids=2`).

## Example requests & responses

1. List (getList)
   Request:
   GET /v1/contacts?page=1&page_size=20&q=mike&assigned_user_ids=12&assigned_user_ids=15

Example response shape the frontend handles (note fallback handling in `dataProvider`):

```json
{
  "items": [{ "id": "1", "name": "Mike", "email": "mike@example.com" }],
  "total": 123
}
```

The `dataProvider` also tolerates `data.items` or `data` as the list.

2. Get one (getOne)
   Preferred (if backend supports it):
   GET /v1/lead/123

Response:

```json
{ "id": "123", "name": "Lead Name", "email": "lead@example.com" }
```

Note: this repo currently has a special-case for `resource === 'lead'` where the frontend fetches a large page (`page_size: 1000`) and finds the lead client-side. If you add `/v1/lead/{id}` in the backend, update `getOne` in `src/providers/data/index.ts` to call it.

3. Create / Update
   POST /v1/contacts (body JSON)

```json
{ "name": "New Contact", "email": "new@example.com" }
```

PUT /v1/contacts/1 (body JSON) updates the resource and returns the updated object.

4. Custom GraphQL-style requests (dataProvider.custom)
   Some UI code uses `dataProvider.custom` to send GraphQL raw queries via POST to the GraphQL endpoint at `API_URL` with `meta.rawQuery` and `meta.variables`. Example usage: see `src/providers/auth.ts` login flow.

## Authentication headers / modes

- Token mode (`VITE_AUTH_METHOD=token`): frontend stores `access_token` and `refresh_token` in `localStorage` (keys `access_token`, `refresh_token`). The `axiosInstance` request interceptor adds headers `x-access-token` and `x-refresh-token` when present.
- Cookie mode (default if not `token`): backend sets auth cookies; `axiosInstance` is created with `withCredentials: true` for cookie flows.

## Error handling

- Axios response interceptor in `src/providers/data/index.ts` redirects the browser to `/login` on `401` and certain `422` session-expired responses. It also clears org/role local caches.

## Common debugging checklist

1. Env & config

   - Ensure `VITE_API_URL` is set in your `.env.*` and points to a running backend. Example: `VITE_API_URL=http://localhost:8000/api`.
   - Confirm `VITE_AUTH_METHOD` is `token` or `cookie` depending on your backend.

2. Is the backend reachable?

   - Use curl or PowerShell to confirm a simple fetch:

   ```powershell
   # curl (if available)
   curl -i "http://localhost:8000/api/v1/contacts?page=1&page_size=1"

   # PowerShell
   Invoke-RestMethod -Uri "http://localhost:8000/api/v1/contacts?page=1&page_size=1" -Method Get
   ```

3. Inspect network traffic in browser DevTools

   - Check request URL, query params (`page`/`page_size`), request headers (especially `x-org-id`, `x-access-token`), and response payload shape.
   - Look for 3xx redirects: backend should avoid redirecting `/v1/resource/` (the `dataProvider` tries to avoid trailing slashes to prevent 307 redirects).

4. Token vs Cookie issues

   - Token mode: check `localStorage` for `access_token` / `refresh_token` and verify headers are sent.
   - Cookie mode: check `document.cookie` in browser and that requests include cookies (`withCredentials: true`).

5. Console & application logs

   - The providers include `console.log` / `console.warn` in DEV mode. Reproduce the issue locally and watch browser console for provider logs.

6. DataProvider specifics

   - If list endpoints return a different shape (e.g., `data` instead of `items`), the `dataProvider` already supports `data.items || data.data || data`. Still, prefer normalizing backend to `items`/`total`.
   - Special-case `getOne('lead')`: if a single-resource endpoint is missing, consider adding it backend-side and updating `getOne`.

7. GraphQL codegen

   - If you change GraphQL operations, run `npm run codegen` (see `graphql.config.ts`) and commit generated `src/graphql/*` types.

8. Formatting & linting
   - Run `npm run format` and `npm run lint` (Biome). Biome commands are available in `biome.json` and invoked via npm scripts.

## Quick fixes for common issues

- 401 unauthorized: verify tokens or cookies; check `axiosInstance` interceptor behavior; try logging out and logging in again to refresh tokens.
- Empty lists or total=0: confirm `page` and `page_size` params are correct; test the endpoint directly with curl.
- CORS errors: ensure backend allows the frontend origin and sets proper CORS for cookies when using cookie auth.
- Unexpected redirect (307): remove trailing slash in client URL or adjust backend to return 200 on the exact path.

## Where to update client behavior

- `src/providers/data/index.ts` — primary place to change request shaping, headers, pagination, filter parsing, and getOne overrides.
- `src/providers/auth.ts` — change login/logout/check/getIdentity logic or token storage.

If you want, I can (A) expand this file with concrete curl examples per resource, (B) add a `.env.example` file to the repo, or (C) create a short troubleshooting checklist printable for support staff. Tell me which and I'll add it.
