import React from 'react';
import { CalendarDays, Clock3, Building2, Users, ChevronDown } from 'lucide-react';
import { formatDate, formatTime, parseDate, dateString, today, statuses } from '../lib/booking.js';

export function Status({ value }) {
  return <span className={'status '+value}><span className="status-dot"/>{value}</span>;
}
export function Empty({ title = 'No bookings', text = 'Nothing to show yet.' }) {
  return <div className="empty"><div className="empty-icon"><CalendarDays size={25}/></div><h3>{title}</h3><p>{text}</p></div>;
}
export function StatCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  return <div className="stat-card"><div className="stat-top"><span className={'stat-icon '+tone}><Icon size={21}/></span><span className="stat-caption">LIVE <span className="live-dot"/></span></div><span className="stat-value">{value}</span><strong>{label}</strong><small>{detail}</small></div>;
}
/**
 * Admin status is edited directly in the table.
 * Changing the selection calls a status-only PATCH; the row stays intact.
 * Clicking the booker's name opens the full detail editor when needed.
 */
export function BookingTable({ bookings, onEdit, onStatusChange, savingStatusId }) {
  if (!bookings.length)
    return <Empty title="No bookings found" text="Try a different filter, or create a new reservation."/>;

  return <div className="table-scroll"><table className="booking-records-table">
    <thead><tr>
      <th scope="col">Date &amp; time</th>
      <th scope="col">Booked by</th>
      <th scope="col">Resource</th>
      <th scope="col">Purpose</th>
      <th scope="col">Status</th>
    </tr></thead>
    <tbody>{bookings.map(booking =>
      <tr key={booking.id}>
        <td>
          <strong>{formatDate(booking.booked_for)}</strong>
          <small><Clock3 size={13}/>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</small>
        </td>
        <td><div className="person-cell">
          <span className="person-avatar">{booking.booked_by?.[0]?.toUpperCase() || 'G'}</span>
          <div>
            <button type="button" className="booking-name-link"
              title="Edit booking details"
              aria-label={'Edit booking details for ' + booking.booked_by}
              onClick={() => onEdit(booking)}>{booking.booked_by}</button>
            <small>{booking.department || '—'}</small>
          </div>
        </div></td>
        <td><span className="resource-chip"><Building2 size={14}/>{booking.resource}</span></td>
        <td><span className="purpose" title={booking.purpose || ''}>{booking.purpose || '—'}</span></td>
        <td>
          <div className={'booking-status-control ' + booking.status}>
            <span className="status-dot" aria-hidden="true"/>
            <select
              aria-label={'Status for ' + booking.booked_by + ' on ' + booking.booked_for}
              title="Change status. Booking records are never deleted."
              value={booking.status}
              disabled={Boolean(savingStatusId)}
              onChange={event => onStatusChange(booking, event.target.value)}
            >
              {statuses.map(status =>
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              )}
            </select>
            <ChevronDown size={14} aria-hidden="true"/>
          </div>
          {savingStatusId === booking.id &&
            <small className="status-saving" role="status">Saving status…</small>}
        </td>
      </tr>
    )}</tbody>
  </table></div>;
}
export function CalendarPanel({bookings, date, onDate, onCreate, onEdit}) {
  const first = parseDate(date);first.setDate(1);
  const total = new Date(first.getFullYear(), first.getMonth()+1, 0).getDate();
  const offset = (first.getDay()+6)%7;
  const cells = [...Array(offset).fill(null), ...Array.from({length:total}, (_,i)=>dateString(new Date(first.getFullYear(),first.getMonth(),i+1)))];
  while(cells.length%7) cells.push(null);
  const selected=bookings.filter(b=>b.booked_for===date).sort((a,b)=>a.start_time.localeCompare(b.start_time));
  function move(n){let d=new Date(first);d.setMonth(d.getMonth()+n);onDate(dateString(d));}
  return <div className="calendar-layout">
    <section className="panel calendar-panel"><div className="calendar-top"><h2>{first.toLocaleDateString('en-PH',{month:'long',year:'numeric'})}</h2><div><button aria-label="Previous month" onClick={()=>move(-1)}>‹</button><button onClick={()=>onDate(today())}>Today</button><button aria-label="Next month" onClick={()=>move(1)}>›</button></div></div>
      <div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=><div className="weekday" key={i}>{d}</div>)}{cells.map((d,i)=><button key={i} disabled={!d} className={'cal-cell'+(d===date?' chosen':'')+(d===today()?' today':'')+(!d?' blank':'')} onClick={()=>d&&onDate(d)}><span>{d?Number(d.slice(-2)):''}</span>{d&&bookings.some(b=>b.booked_for===d)&&<span className="booking-count">{bookings.filter(b=>b.booked_for===d).length}</span>}</button>)}</div>
    </section>
    <section className="panel day-panel"><div className="panel-head"><div><h2>{formatDate(date,{weekday:'long',month:'long',day:'numeric'})}</h2><p>{selected.length} bookings</p></div></div>
      {selected.length?selected.map(b=><button key={b.id} className="day-booking" onClick={()=>onEdit(b)}><span className="day-accent"/><div><strong>{formatTime(b.start_time)} – {formatTime(b.end_time)}</strong><span>{b.resource}</span><small><Users size={13}/>{b.booked_by}</small></div><Status value={b.status}/></button>):<Empty title="No bookings on this day" text="Select another day or add a reservation."/>}
      <button className="btn subtle full-width" onClick={()=>onCreate(date)}>+ Book this date</button>
    </section>
  </div>;
}
