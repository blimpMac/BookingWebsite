# Greenlight Booking — architecture

## Route separation

| Route | Audience | Responsibility |
|---|---|---|
| `/` | Public | Booking request form and date/resource availability |
| `/admin/login` | Administrator | Private username/password authentication |
| `/admin` | Administrator | Dashboard, approvals, calendar, reporting and management |
| `GET /api/availability` | Public | Available/busy time ranges only; no personal fields |
| `POST /api/public-bookings` | Public | Create a **pending** request; never accept status/privilege |
| `GET, POST, PATCH, DELETE /api/bookings` | Admin | All booking CRUD |
| `GET, POST, DELETE /api/session` | Admin | Login/logout and session validation |
| `GET /api/health` | Admin | Authenticated database readiness probe |

## Modules

```
src/
  main.jsx                     # Router and session guard
  components/
    Brand.jsx                  # Shared Greenlight branding
    AdminWidgets.jsx           # Reusable cards, tables and calendar
    BookingDialog.jsx          # Reservation form modal
  lib/
    api.js                     # Fetch/error/client diagnostics
    booking.js                 # Date formatting, stats and overlap UI checks
  pages/
    PublicBookingPage.jsx      # Public request flow
    LoginPage.jsx              # Staff sign-in
    AdminWorkspace.jsx         # Admin state and write operations
    AdminViews.jsx             # Dashboard, booking list and reports
  styles.css                   # Admin design system
  public.css                   # Public and login design
api/
  session.js                   # Thin auth HTTP handler
  bookings.js                  # Private booking HTTP handler
  public-bookings.js           # Public intake HTTP handler
  availability.js              # Public time slots, no names
  health.js                    # Private readiness check
server/
  adminAuth.js                 # Password hash and signed HttpOnly cookie
  http.js                      # Error/response/request ID handling
  errors.js                    # Stable public errors
  validation.js                # Input validation, public status restriction
  repository.js                # Supabase queries
supabase/migrations/           # Schema only; no historical data
tests/                         # Node.js unit tests
```

## Data ownership and isolation

**Never deploy the booking migration in the RFP Web Project.** Create a dedicated Supabase project called Greenlight Booking first. The booking application uses a single table, `greenlight_booking_reservations`, and it has no foreign keys to any RFP data.

The service-role Supabase key lives **only in Vercel server environment variables**. The web UI never receives this secret. Row-Level Security is enabled, with no anonymous table policies.

## Concurrency

PostgreSQL's exclusion constraint prevents overlapping active reservations in the same resource and day, including two users submitting at the same time. The browser performs a friendly preliminary check, but the database is authoritative.

## Public/private boundary

Public clients may only create **pending** requests and read occupied time ranges, not names, departments, or notes. Staff can approve/modify/cancel requests after login. The same-origin JSON check, honeypot, and input-size limits are basic abuse controls; production environments should additionally enable Vercel WAF/rate limiting on public submission and login.

## Diagnostics

Every API response includes `requestId`, also sent as `X-Request-ID`. Errors are logged with the same correlation ID in Vercel runtime logs. No request body, credential, or booking details should be logged.
