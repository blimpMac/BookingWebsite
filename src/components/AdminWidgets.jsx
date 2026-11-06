import React from 'react';
import { CalendarDays, Clock3, Edit3, Trash2, Check, Building2, Users } from 'lucide-react';
import { formatDate, formatTime, parseDate, dateString, today } from '../lib/booking.js';

export function Status({ value }) {
  return <span className={'status '+value}><span className="status-dot"/>{value}</span>;
}
export function Empty({ title = 'No bookings', text = 'Nothing to show yet.' }) {
  return <div className="empty"><div className="empty-icon"><CalendarDays size={25}/></div><h3>{title}</h3><p>{text}</p></div>;
}
export function StatCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  return <div className="stat-card"><div className="stat-top"><span className={'stat-icon '+tone}><Icon size={21}/></span><span className="stat-caption">LIVE <span className="live-dot"/></span></div><span className="stat-value">{value}</span><strong>{label}</strong><small>{detail}</small></div>;
}
export function BookingTable({ bookings, onEdit, onCancel, onConfirm }) {
  if (!bookings.length) return <Empty title="No bookings found" text="Reservations will appear here once they're submitted."/>;
  return <div className="table-scroll"><table><thead><tr><th>Date & time</th><th>Booked by</th><th>Resource</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {bookings.map(b => <tr key={b.id}>
      <td><strong>{formatDate(b.booked_for)}</strong><small><Clock3 size={13}/>{formatTime(b.start_time)} – {formatTime(b.end_time)}</small></td>
      <td><div className="person-cell"><span className="person-avatar">{b.booked_by?.[0]?.toUpperCase() || 'G'}</span><div><strong>{b.booked_by}</strong><small>{b.department || '—'}</small></div></div></td>
      <td><span className="resource-chip"><Building2 size={14}/>{b.resource}</span></td>
      <td><span className="purpose" title={b.purpose || ''}>{b.purpose || '—'}</span></td>
      <td><Status value={b.status}/></td>
      <td><div className="row-actions">
        {b.status==='pending'&&<button aria-label="Confirm booking" title="Confirm" onClick={() => onConfirm(b)}><Check size={16}/></button>}
        <button aria-label="Edit booking" title="Edit" onClick={() => onEdit(b)}><Edit3 size={16}/></button>
        {b.status !== 'cancelled' && <button aria-label="Cancel booking" title="Cancel" onClick={() => onCancel(b)}><Trash2 size={16}/></button>}
      </div></td>
    </tr>)}
  </tbody></table></div>;
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
