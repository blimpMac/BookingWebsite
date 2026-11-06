import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { resources, statuses } from '../lib/booking.js';

export default function BookingDialog({ booking, onChange, onSave, onClose, saving }) {
  const change = (field, value) => onChange({ ...booking, [field]: value });
  const options = statuses.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>);
  return <div className="modal-shade" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
      <div className="modal-head"><div><span className="eyebrow">RESERVATION DETAILS</span><h2 id="booking-dialog-title">{booking.id?'Edit booking':'New booking'}</h2><p>Manage a reservation in the secured database.</p></div><button className="close-btn" onClick={onClose} aria-label="Close form"><X size={20}/></button></div>
      <form className="booking-form" onSubmit={onSave}>
        <div className="field-row"><label>Date *<input type="date" required value={booking.booked_for} onChange={e=>change('booked_for',e.target.value)}/></label><label>Status<select value={booking.status} onChange={e=>change('status',e.target.value)}>{options}</select></label></div>
        <div className="field-row"><label>Start time *<input type="time" required value={booking.start_time} onChange={e=>change('start_time',e.target.value)}/></label><label>End time *<input type="time" required value={booking.end_time} onChange={e=>change('end_time',e.target.value)}/></label></div>
        <label>Room or resource *<input required list="admin-resources" value={booking.resource} onChange={e=>change('resource',e.target.value)}/><datalist id="admin-resources">{resources.map(r=><option key={r} value={r}/>)}</datalist></label>
        <div className="field-row"><label>Booked by *<input required maxLength={120} value={booking.booked_by} onChange={e=>change('booked_by',e.target.value)}/></label><label>Department<input maxLength={120} value={booking.department} onChange={e=>change('department',e.target.value)}/></label></div>
        <label>Purpose<textarea maxLength={1000} rows={2} value={booking.purpose} onChange={e=>change('purpose',e.target.value)}/></label>
        <label>Notes<textarea maxLength={1000} rows={2} value={booking.notes} onChange={e=>change('notes',e.target.value)}/></label>
        <div className="modal-actions"><button type="button" className="btn subtle" onClick={onClose}>Cancel</button><button className="btn primary" disabled={saving}>{saving?'Saving…':booking.id?'Save changes':'Create booking'}<ArrowRight size={17}/></button></div>
      </form>
    </div>
  </div>;
}
