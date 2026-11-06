import React from 'react';
import { Clock3, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

/** One availability message replaces duplicate technical warnings. */
export default function AvailabilityMessage({ state, conflict, reference, onRetry }) {
  const unavailable = state === 'unavailable';
  const checking = state === 'checking';
  const taken = state === 'ready' && conflict;

  const text = checking
    ? 'Checking your selected date and resource…'
    : unavailable
      ? 'Online booking is temporarily unavailable. Please retry or contact the booking administrator.'
      : taken
        ? 'This resource is already reserved during your selected time.'
        : 'Time slot is available. Your request will be reviewed by the administrator.';

  return (
    <div
      className={'availability-indicator ' +
        (checking ? 'checking' : unavailable ? 'offline' : taken ? 'taken' : '')}
      role="status"
      aria-live="polite"
    >
      {unavailable
        ? <AlertTriangle size={18} aria-hidden="true" />
        : taken
          ? <AlertTriangle size={18} aria-hidden="true" />
          : checking
            ? <Clock3 size={18} aria-hidden="true" />
            : <CheckCircle2 size={18} aria-hidden="true" />
      }
      <span className="availability-copy">
        {text}
        {unavailable && reference &&
          <small className="availability-reference">Support reference: {reference.slice(0, 8)}</small>
        }
      </span>
      {unavailable && (
        <button type="button" className="availability-retry" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
