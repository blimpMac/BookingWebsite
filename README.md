# Greenlight Booking Portal

A responsive, **single-operator** booking manager using React + Vite, Vercel serverless API routes, and an independent Supabase database. Includes a username/password login screen, summary dashboard (day/week/month counts), daily trend chart, upcoming reservations, searchable history, creating and editing bookings, status updates, cancellation and CSV export.

## Important migration limitation

The original Google Apps Script project is **not accessible** through the connected Google Drive account. Therefore its HTML, logic, data, and original logo have **not been copied**. `public/brand.svg` is a temporary Greenlight-style placeholder (not the original logo). Export the Apps Script source and assets, then migrate exact existing functionality and branding.

## Run locally

```bash
npm install
npm run dev
```

For live authentication and persistent data, deploy on Vercel; `/api` routes run as serverless functions there. Frontend dev mode uses a proxy only when configured, so use a Vercel dev environment for integration tests.

## Production setup

1. Create a **new Supabase project** dedicated to Greenlight Booking. Do NOT reuse the existing **RFP Web Project** or its keys. New projects may incur charges and require explicit organization selection.
2. Execute `supabase/migrations/001_greenlight_booking.sql` in the NEW project's SQL editor. The table is private to the admin API: RLS enabled, no public policies.
3. In the **greenlight-booking Vercel project**, set **server-only** variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_SCRYPT`, and `SESSION_SECRET`. Never use any `VITE_` prefix for secret values.
4. Create `ADMIN_PASSWORD_SCRYPT` as `salt_hex:derived_key_hex` (scrypt N=16384, r=8, p=1, dklen=64); generate `SESSION_SECRET` using cryptographically secure random bytes. Change the temporary admin password after the first login.
5. Redeploy after setting environment variables. Verify GET /api/session, log in, create a booking, refresh, and verify it persisted. Make sure competing bookings are prevented by the partial unique index.

## Temporary browser mode

If a dedicated Supabase project is not yet connected, the frontend shows an explicit **Browser-only preview** banner and stores new entries in localStorage under the authenticated browser. **Those entries are not synced**, are not business backups, and will not appear on other devices. Export CSV before moving to the live database. This mode exists only to preview the interface without touching any existing databases.

## Security

Credentials are never stored in Git. The password is compared on the server to a scrypt hash in Vercel environment variables. Session cookies are HttpOnly, Secure on Vercel, SameSite=Strict, signed with an HMAC and expire after seven days. All booking API access is authenticated. Writes require same-origin JSON requests. The Supabase service-role key is never included in client bundles. Configure Vercel WAF rate limits for the login endpoint for additional hardening.
