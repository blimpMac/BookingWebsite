/**
 * Stable errors returned to clients.
 * Details from Supabase are logged with a request ID, never echoed to the browser.
 */
export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export function toPublicError(error) {
  if (error instanceof AppError) return error;
  if (['23P01', '23505'].includes(error?.code))
    return new AppError('BOOKING_OVERLAP', 'That resource is already reserved during this time.', 409);
  if (['42P01', 'PGRST205'].includes(error?.code))
    return new AppError('SCHEMA_NOT_READY', 'The booking database tables have not been initialized.', 503);
  if (['42501', 'PGRST301'].includes(error?.code))
    return new AppError('DATABASE_ACCESS', 'The booking database permissions need attention.', 503);
  return new AppError('INTERNAL_ERROR', 'Something went wrong. Give support the request ID shown.', 500);
}
