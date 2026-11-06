import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDate, formatTime } from '../lib/booking.js';

/**
 * Read-only schedule shown directly in the public booking form.
 * Only room/resource, time, and status are displayed—no booker details.
 */
export default function PublicDailySchedule({ date, selectedResource, refreshKey = 0 }) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({
    date: '',
    today: '',
    bookings: [],
    capped: false,
    state: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    setResult(current => ({
      ...current,
      date,
      state: 'loading',
      bookings: [],
      capped: false,
    }));

    api('/api/public-schedule?date=' + encodeURIComponent(date), {
      signal: controller.signal,
    }).then(response => {
      if (controller.signal.aborted) return;
      setResult({
        date,
        today: response.today,
        bookings: response.bookings || [],
        capped: Boolean(response.capped),
        state: 'ready',
      });
    }).catch(() => {
      if (controller.signal.aborted) return;
      setResult({
        date,
        today: '',
        bookings: [],
        capped: false,
        state: 'error',
      });
    });

    return () => controller.abort();
  }, [date, refreshKey, retryCount]);
  const isCurrent = result.date === date;
  const state = isCurrent ? result.state : 'loading';
  const isToday = state === 'ready' && date === result.today;
  const title = isToday ? "Today's bookings" : 'Bookings for selected date';

  return (
    <section className="public-daily-schedule" aria-labelledby="daily-schedule-heading">
      <div className="daily-schedule-header">
        <div className="daily-schedule-heading">
          <span className="daily-schedule-symbol"><CalendarDays size={19}/></span>
          <div>
            <h4 id="daily-schedule-heading">{title}</h4>
            <p>{formatDate(date, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} · Philippine time</p>
          </div>
        </div>
        <button type="button" className="daily-schedule-refresh"
          aria-label="Refresh booking schedule" title="Refresh booking schedule"
          onClick={() => setRetryCount(value => value + 1)}>
          <RefreshCw size={16}/><span>Refresh</span>
        </button>
      </div>
      <p className="daily-schedule-intro">
        Check existing reservations before choosing a time. Pending requests may also occupy a slot.
      </p>
      {state === 'loading' && <p className="daily-schedule-feedback" role="status">Loading the schedule…</p>}
      {state === 'error' && <p className="daily-schedule-feedback warning" role="alert">
        The schedule is temporarily unavailable. Please try refreshing.
      </p>}
      {state === 'ready' && result.bookings.length === 0 &&
        <p className="daily-schedule-feedback empty" role="status">No active bookings for this date.</p>}
      {state === 'ready' && result.bookings.length > 0 && (
        <div className="daily-schedule-list" role="list">
          {result.bookings.map((booking, index) => (
            <div key={booking.resource + booking.start_time + booking.end_time + index}
              className={'daily-schedule-item' + (booking.resource === selectedResource ? ' matching' : '')}
              role="listitem">
              <span className="daily-schedule-time">
                <Clock3 size={14}/>
                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
              </span>
              <div className="daily-schedule-item-bottom">
                <strong>{booking.resource}</strong>
                <span className={'daily-schedule-status ' + booking.status}>
                  {booking.status === 'pending' ? 'Pending' :
                    booking.status === 'completed' ? 'Completed' : 'Reserved'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {state === 'ready' && result.capped &&
        <p className="daily-schedule-feedback warning">Showing the first 200 reservations only.</p>}
      <p className="daily-schedule-privacy"><ShieldCheck size={14}/> Personal booking details are kept private.</p>
    </section>
  );
}
