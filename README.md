# Greenlight Booking Portal

A booking-request website with an independent administrator workspace, built with React, Vite, Vercel Functions and Supabase.

## Pages

| Route | Audience | Description |
|---|---|---|
| [/](/) | Public | Booking landing page, availability, and request form |
| [/admin/login](/admin/login) | Staff | Separate Greenlight administrator sign-in |
| [/admin](/admin) | Staff only | Dashboard, calendar, approvals, booking records, reports |

The interface is modeled after the **public request / separate staff login** structure of the Greenlight RFP website.

## Features

- Public booking intake with date, time, room, name, department, and purpose
- Private scheduling: public pages see occupied times, never other users' names or notes
- Requests start as **pending** and can be confirmed by the single administrator
- Administrator can add, edit, confirm, cancel, filter and export bookings
- Dashboard summaries: today, current week, current month, and unique bookers
- Calendar, upcoming bookings, room utilization, booking history
- Overlapping reservations are rejected by an atomic PostgreSQL exclusion constraint
- Clear server errors with request IDs for debugging and handover
- Responsive public, login and administrator layouts

## Code quality

The original single-file UI has been separated into `src/pages`, `src/components`, and `src/lib` modules. The server code is split into thin `api/` routes and reusable `server/` services. Database queries, authentication, validation, HTTP error handling, and reporting utilities have independent responsibilities.

Run:

```bash
npm install
npm run test
npm run build
```

Read [ARCHITECTURE](docs/ARCHITECTURE.md) and [OPERATIONS](docs/OPERATIONS.md) before changing the production system.

## Production connection — NOT YET COMPLETED

**The existing RFP Web Project database is not a booking database and must not be modified.**

The **Greenlight Booking** Supabase project is `wwuewhkzrbehhcgzgoww`, in its own organization. The booking table was installed and verified on November 6, 2026. This requires selecting the owning Supabase organization and any applicable cost approval. No historical Apps Script data will be migrated.

1. Use project `wwuewhkzrbehhcgzgoww` (already created) in the separate Greenlight Booking organization.
2. The initial schema and extension-hardening migrations were applied and verified. Do not reapply to the RFP database.
3. Set these encrypted Vercel environment variables in project `greenlight-booking`:
   - `ADMIN_USERNAME` (single admin)
   - `ADMIN_PASSWORD_SCRYPT` (salted scrypt digest, not plaintext)
   - `SESSION_SECRET` (random server signing key)
   - `SUPABASE_URL` (new project's URL)
   - `SUPABASE_SECRET_KEY` (recommended: modern `sb_secret_...` key from this project's settings; **set it directly in Vercel**, never in chat or Git)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional legacy fallback if a modern secret key is unavailable)
   - `BOOKING_SUPABASE_PROJECT_REF` (new project reference; prevents accidentally using the RFP database)
4. Redeploy the site so serverless functions receive the new settings.
5. Log in and check `GET /api/health`. It should return `database: connected`.
6. Test public submission, admin confirmation, cancellation, and conflicting reservations.

If Supabase is not configured, the public form and dashboard **must not** claim to save real bookings. No browser-only storage fallback is used.

## Branding and original Apps Script

The Greenlight Power logo asset is reused from the owner's RFP project. The Google Apps Script editor project was inaccessible through the provided connection, so specific original Apps Script behavior cannot be independently verified; this implementation recreates the described booking functions and adds the requested usage dashboard.

## Security considerations

The public repository contains no real admin password or Supabase credentials. Authentication happens server-side using a salted scrypt hash. The administrator session is signed and stored in an HttpOnly cookie. Only Vercel Functions can use the Supabase service-role key. RLS is enabled and anonymous database permissions are revoked. Configure rate limiting for `/api/public-bookings` and `/api/session` before high-volume production use.

**Admin password:** The initial password was shared in a conversation. Rotate it during handover before business-critical use.
