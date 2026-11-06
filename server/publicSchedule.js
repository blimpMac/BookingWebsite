/**
 * Public, privacy-limited booking schedule.
 *
 * The booking form may show occupied spaces and time ranges, but must never
 * expose employee names, departments, purposes, notes, IDs or timestamps.
 */
export function toPublicScheduleEntry(row) {
  return {
    resource: row.resource,
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
    status: row.status,
  };
}

/** Calendar date at Greenlight's local office, independent of Vercel UTC. */
export function manilaCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(item => item.type === type)?.value;
  return [part('year'), part('month'), part('day')].join('-');
}
