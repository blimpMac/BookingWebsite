import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Fetches public busy time ranges for one date/resource combination.
 *
 * A request is invalidated on selection changes or component unmount.
 * Errors are represented as state, not copied into global form notices;
 * the booking form should show one actionable availability message.
 */
export function useBookingAvailability(date, resource) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({
    key: '',
    state: 'checking',
    occupied: [],
    reference: null,
  });

  const selectionKey = JSON.stringify([date, resource]);
  const retry = useCallback(() => setAttempt(current => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    setResult({
      key: selectionKey,
      state: 'checking',
      occupied: [],
      reference: null,
    });

    const query = new URLSearchParams({ date, resource });

    api('/api/availability?' + query.toString(), { signal: controller.signal })
      .then(response => {
        if (controller.signal.aborted) return;
        setResult({
          key: selectionKey,
          state: 'ready',
          occupied: response.occupied || [],
          reference: null,
        });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setResult({
          key: selectionKey,
          state: 'unavailable',
          occupied: [],
          reference: error.requestId || null,
        });
      });

    return () => controller.abort();
  }, [selectionKey, date, resource, attempt]);

  // Avoid reporting a previous resource's availability on the next render.
  return {
    ...result,
    state: result.key === selectionKey ? result.state : 'checking',
    occupied: result.key === selectionKey ? result.occupied : [],
    retry,
  };
}
