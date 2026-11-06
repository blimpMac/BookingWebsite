/**
 * Public booking schedule deliberately shares the identifying information
 * requested by the booking owner: booker name and department.
 *
 * Never include IDs, email addresses, purposes, notes, audit fields,
 * or full database records. This endpoint is publicly accessible.
 */
export function toPublicScheduleEntry(row) {
  return {
    resource: row.resource,
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
    status: row.status,
    booked_by: typeof row.booked_by === 'string' ? row.booked_by.trim() : '',
    department: typeof row.department === 'string' ? row.department.trim() : '',
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
