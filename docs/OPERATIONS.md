# Greenlight Booking — operations and troubleshooting

## Production prerequisites

1. Create **a separate Supabase project** for Greenlight Booking. The connected **RFP Web Project must not be modified**.
2. Run the checked-in SQL migration on the new project (no historical data migration).
3. Set Vercel project environment variables for **Production**, **Preview** and **Development**:
   - `ADMIN_USERNAME` — Greenlight
   - `ADMIN_PASSWORD_SCRYPT` — salted scrypt hash (never a plaintext password)
   - `SESSION_SECRET` — random signing secret
   - `SUPABASE_URL` — the new project's API URL
   - `SUPABASE_SERVICE_ROLE_KEY` — the new project's **secret** service-role key
4. Redeploy the production branch so Vercel Functions receive the new variables.
5. Verify the public page, sign-in, `/api/health`, creating pending bookings, admin confirmation, cancellation, and duplicate time protection.

## Confirm health

- `GET /api/session` returns `configured: true` when the admin settings exist.
- `GET /api/health` (only once signed in) returns `database: connected` when the schema and credentials work.
- In the dashboard, booking errors show a short reference ID. Search that request ID in Vercel Functions logs.

## Error codes

| Code | Meaning | Fix |
|---|---|---|
| `INVALID_CREDENTIALS` | Username/password mismatch | Check Vercel admin vars and redeploy |
| `DATABASE_NOT_CONFIGURED` | Supabase URL/key missing | Add dedicated project credentials to Vercel |
| `SCHEMA_NOT_READY` | Booking table doesn't exist | Run the migration in the new Supabase project |
| `DATABASE_ACCESS` | Database access problem | Verify service-role key and project isolation |
| `BOOKING_OVERLAP` | Resource/time conflict | Choose another date/time or cancel conflicting booking |
| `INVALID_DATE`, `INVALID_TIME` | Invalid input | Check date/time fields |
| `UNAUTHORIZED` | Admin-only route accessed without session | Sign in at /admin/login |
| `INVALID_ORIGIN` | Cross-origin/invalid content type | Make requests from this site with JSON |
| `INTERNAL_ERROR` | Unclassified error | Find the request ID in Vercel runtime logs |

## Developer checks

Run `npm install`, then `npm run check` to execute unit tests and the Vite production build. Test a temporary branch on Vercel before release. Do not change the RFP project or share service-role keys. The original Apps Script source was inaccessible through the connected account, so any previously uninspected behaviors must be compared against a source export before claiming exact functional parity.

## Database backups and handover

Supabase backup/export options depend on the project's plan. Confirm appropriate backup/restore procedures before using this for critical business workflows. Keep a current admin recovery procedure, project ownership notes, and environment variable ownership information in an access-controlled operations guide; **never put secrets in GitHub**.
