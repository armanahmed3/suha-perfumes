# Task 7 — Backend API Layer (SUHA Perfumes)

Agent: backend-api (Task ID 7)
Status: COMPLETED ✅ — tsc clean, lint clean, endpoints smoke-tested via curl.

## Files Created

### Lib helpers
- `src/lib/auth.ts` — `signToken`/`verifyToken` (jose HS256, 7d expiry, secret from `AUTH_SECRET` || fallback), `getSessionUser(req)` (reads httpOnly cookie `suha_session`, loads user from DB), `requireAdmin(req)`, `sessionCookieOptions`, `SessionUser` type, `SESSION_COOKIE`, `SESSION_MAX_AGE`.
- `src/lib/serialize.ts` — `safeParseJSON` (DB JSON-string note fields → string arrays), `normalizeJSONField` (array|string → JSON string for DB), `serializeProduct` (parses topNotes/heartNotes/baseNotes/accords/season into arrays + `rating` (1-decimal avg of approved reviews) + `reviewCount`), `serializeVariant`, `serializeReview`, `serializeOrder` (with optional `userEmail`), `computeRating`, typed `Serialized*` interfaces.
- `src/lib/api.ts` — `readBody`, `str/trimStr/optStr/num/bool` body coercion helpers, `EMAIL_RE`, `ORDER_STATUSES`, `GENDERS`, `guardAdmin` (401 no session / 403 non-admin), `guardSession` (401), `serverError(scope, err)` uniform 500.

### Auth API (cookie: `suha_session`, httpOnly, sameSite lax, path /, 7d maxAge)
- `src/app/api/auth/register/route.ts` — POST; validates name/email format/password ≥ 6; bcryptjs hash (cost 10); role CUSTOMER; 409 duplicate email; 201 `{user}` + sets cookie.
- `src/app/api/auth/login/route.ts` — POST; bcrypt compare; 401 invalid credentials; returns `{user}` + cookie.
- `src/app/api/auth/logout/route.ts` — POST; clears cookie (maxAge 0); `{ok:true}`.
- `src/app/api/auth/me/route.ts` — GET; `{user: SessionUser | null}`.

### Public API
- `src/app/api/products/route.ts` — GET; filters: `search` (name/brand/originalName contains; SQLite LIKE is case-insensitive for ASCII), `gender` (Men/Women/Unisex/All), `featured='1'`; sort `name|price_asc|price_desc|newest` (default sortOrder asc, tie-break name); only active products + active variants; returns parsed note arrays + rating/reviewCount.
- `src/app/api/products/[slug]/route.ts` — GET; awaited `params: Promise<{slug:string}>`; 404 if missing/inactive; product with active variants + approved reviews (newest first) incl. serialized `reviews`.
- `src/app/api/reviews/route.ts` — POST `{slug,name,rating(1-5 int),comment}`; auth optional (userId attached from session); creates approved review; 201 `{review}`.
- `src/app/api/orders/route.ts` — POST checkout: validates customer fields + items `[{variantId,quantity}]` (dedupes lines), loads variants+products from DB, stock check → 409, subtotal from DB prices, settings `main` (fallbacks 199/4000) → shipping 0 if ≥ freeShippingOver, orderNumber `SUHA-` + base36 ts + 3 random chars, `$transaction` decrementing stock with `stock >= qty` guard (anti-oversell) and creating order+items (userId attached if session); 201 `{order:{id,orderNumber,total,status}}`. — GET (session required): user's orders newest-first with items.
- `src/app/api/contact/route.ts` — POST `{name,email,subject?,message}` → ContactMessage; `{ok:true}`.
- `src/app/api/settings/route.ts` — GET public settings; auto-creates `main` row with schema defaults.

### Admin API (all guarded: 401 no session / 403 non-admin)
- `src/app/api/admin/stats/route.ts` — GET: revenue (non-cancelled sum), orderCount, productCount, userCount, pendingOrders, recentOrders (5 w/ items), topProducts (top 5 by qty: name+qty+revenue), monthlyRevenue (6 months, `Jan`-style labels).
- `src/app/api/admin/orders/route.ts` — GET (`?status=` validated filter, items + user email, newest first); PATCH `{id,status}` validated against 5 statuses; P2025 → 404.
- `src/app/api/admin/products/route.ts` — GET all products (incl. inactive) with variants + rating; POST create (slug auto from name via slugify + uniqueness `-2`,`-3`…; JSON note fields accept array or string; nested variant create); PATCH `{id, ...fields, variants?}` (variant with id → updateMany scoped to product; without id → create); DELETE `?id=` (cascade); P2002 slug conflict → 409.
- `src/app/api/admin/users/route.ts` — GET users (never selects password) + orderCount + totalSpent (non-cancelled), newest first.
- `src/app/api/admin/messages/route.ts` — GET newest first; PATCH `{id,read}`.
- `src/app/api/admin/settings/route.ts` — PUT upsert of phone/email/instagram/facebook/address/shippingFee/freeShippingOver/announcement.

## Verification
- `bunx tsc --noEmit` → 0 errors in project code (only pre-existing errors in `examples/` and `skills/` folders, not mine).
- `bun run lint` → clean, no issues.
- Runtime smoke tests (curl against running dev server): `/api/settings` 200, `/api/products?featured=1&sort=price_asc` 200, `/api/auth/me` 200, `/api/admin/stats` 401 (unauth), register → 201 + cookie, `/api/orders` GET with cookie 200, empty-cart order → 400, contact → 201. Smoke-test rows deleted afterwards.

## Notes for other agents (frontend, Task 8+)
- Product JSON fields (`topNotes`, `heartNotes`, `baseNotes`, `accords`, `season`) are returned as string arrays everywhere; `variants[].image` is `string | null`.
- Cart checkout payload: `POST /api/orders` with `{customerName,email,phone,address,city,notes?,items:[{variantId,quantity}]}`; response `{order:{id,orderNumber,total,status}}`.
- Auth cookie is set by register/login responses automatically — use `credentials: 'include'` (same-origin fetch default is fine).
- Admin guard behavior: 401 `{error:'Unauthorized'}` when logged out, 403 `{error:'Forbidden'}` when logged in as CUSTOMER.
- Public image assets exist under `/upload/products/*.jpg` (useful for seed/product images).
