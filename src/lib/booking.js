export const resources = ['Conference Room', 'Discussion Room', 'Workstation', 'Meeting Room', 'Company Vehicle', 'Other'];
export const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

export function today() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function parseDate(value) { return new Date(value + 'T12:00:00'); }
export function dateString(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return parseDate(value).toLocaleDateString('en-PH', opts);
}
export function formatTime(value) {
  const [hours, minutes] = String(value || '00:00').slice(0, 5).split(':').map(Number);
  return (hours % 12 || 12) + ':' + String(minutes).padStart(2, '0') + (hours >= 12 ? ' PM' : ' AM');
}
export function newBooking(date = today()) {
  return {
    id: '', booked_for: date, start_time: '09:00', end_time: '10:00',
    resource: 'Conference Room', booked_by: '', department: '',
    purpose: '', notes: '', status: 'confirmed'
  };
}
export function rangesOverlap(a, b) {
  return a.status !== 'cancelled' && b.status !== 'cancelled' &&
    a.booked_for === b.booked_for && a.resource.toLowerCase() === b.resource.toLowerCase() &&
    a.start_time.slice(0, 5) < b.end_time.slice(0, 5) &&
    b.start_time.slice(0, 5) < a.end_time.slice(0, 5);
}
export function reportStats(bookings, now = today()) {
  const active = bookings.filter(b => b.status !== 'cancelled');
  const monday = parseDate(now);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const weekStart = dateString(monday);
  monday.setDate(monday.getDate() + 6);
  const weekEnd = dateString(monday);
  const month = now.slice(0, 7);
  const day = active.filter(b => b.booked_for === now);
  const week = active.filter(b => b.booked_for >= weekStart && b.booked_for <= weekEnd);
  const monthly = active.filter(b => b.booked_for.startsWith(month));
  return { active, day, week, monthly, weekStart, weekEnd,
    uniqueBookers: new Set(monthly.map(b => b.booked_by.trim().toLowerCase())).size };
}
