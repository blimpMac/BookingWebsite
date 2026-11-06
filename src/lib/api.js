/**
 * All browser/server communication in one place.
 * An API error keeps its stable code and request ID for support.
 */
export class ApiError extends Error {
  constructor(message, code, requestId, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method, credentials: 'same-origin', signal,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new ApiError('Network unavailable. Check your internet connection.', 'NETWORK_ERROR');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      result.error || 'The request could not be completed.',
      result.code || 'HTTP_' + response.status,
      result.requestId || response.headers.get('X-Request-ID'),
      response.status
    );
  }
  return result;
}
