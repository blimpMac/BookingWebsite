import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Users, Building2, ClipboardList } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { api } from '../lib/api.js';
import { resources, today } from '../lib/booking.js';
import { departments } from '../lib/departments.js';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import { useBookingAvailability } from '../hooks/useBookingAvailability.js';
import AvailabilityMessage from '../components/AvailabilityMessage.jsx';
import PublicDailySchedule from '../components/PublicDailySchedule.jsx';

const empty = () => ({
  booked_for: today(), start_time: '09:00', end_time: '10:00',
  resource: 'Conference Room', booked_by: '', department: '', purpose: '', website: ''
});

export default function PublicBookingPage() {
  useScrollReveal();
  const [form, setForm] = useState(empty);
  const { state: availability, occupied: slots, reference, retry } =
    useBookingAvailability(form.booked_for, form.resource);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);

  const conflict = slots.some(s => form.start_time < s.end_time && form.end_time > s.start_time);

  function field(name, value) {
    setForm(current => ({ ...current, [name]: value }));
    setNotice(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (form.end_time <= form.start_time) return setNotice({type:'error', text:'End time must be later than start time.'});
    if (conflict) return setNotice({type:'error', text:'The selected room is already booked at that time.'});
    if (availability !== 'ready') return setNotice({type:'error', text:'Booking is currently unavailable. Please try again after the database connection is restored.'});
    setBusy(true);
    setNotice(null);
    try {
      const result = await api('/api/public-bookings', { method: 'POST', body: form });
      setNotice({type:'success', text:result.message || 'Booking request submitted successfully.'});
      setForm(current => ({...empty(), booked_for: current.booked_for, resource: current.resource}));
      retry(); // Refresh occupancy now that a new request has been recorded.
      setScheduleRefresh(count => count + 1); // Also update today's public schedule.
    } catch (error) {
      setNotice({type:'error', text:error.message + (error.requestId ? ' (Reference: ' + error.requestId.slice(0, 8) + ')' : '')});
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="booking-public">
      <header className="public-header">
        <div className="public-container header-inner">
          <Brand/>
          <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#request">Book a space</a><Link className="staff-link" to="/admin/login">Staff sign in <ArrowRight size={15}/></Link></nav>
        </div>
      </header>
      <main>
        <section className="booking-hero"><div className="public-container hero-grid">
          <div className="hero-copy"><div className="hero-tag"><span/> GREENLIGHT RESERVATION PORTAL</div>
            <h1>Your space.<br/><em>Right on schedule.</em></h1>
            <p>Plan meetings, reserve workspaces, and keep the day running smoothly. Submit your booking in just a few simple steps.</p>
            <a className="hero-cta" href="#request">Book your space <ArrowRight size={18}/></a>
            <div className="hero-foot"><span><ShieldCheck size={17}/> Organized requests</span><span><CalendarDays size={17}/> Clear scheduling</span></div>
          </div>
          <div className="hero-illustration" aria-hidden="true"><div className="hero-window"><div className="tiny-dots"><span/><span/><span/></div><div className="fake-calendar"><div className="fake-head"><span>November 2026</span><span>‹ &nbsp; ›</span></div><div className="fake-week">{['M','T','W','T','F','S','S'].map((d,i)=><b key={i}>{d}</b>)}</div><div className="fake-days">{Array.from({length:28},(_,i)=><span key={i} className={[3,10,18,24].includes(i)?'filled':''}>{i+1}</span>)}</div></div><div className="hero-success"><CheckCircle2 size={19}/><div><b>Make plans with ease</b><small>All in one place</small></div></div></div></div>
        </div></section>
        <section className="request-section" id="request"><div className="public-container">
          <div className="request-header" data-reveal="first"><span className="eyebrow">BOOK A SPACE</span><h2>Make a reservation</h2><p>Choose your room and schedule, then tell us who's booking it. Requests are reviewed by the booking administrator.</p></div>
          <div className="request-layout">
            <form className="public-request-form" data-reveal="second" onSubmit={submit}>
              <h3><CalendarDays size={20}/> Reservation details</h3>
              <div className="form-two"><label><span className="form-label-text">Booking date <span aria-hidden="true">*</span></span><input type="date" min={today()} required value={form.booked_for} onChange={e => field('booked_for', e.target.value)}/></label><label><span className="form-label-text">Resource / space <span aria-hidden="true">*</span></span><select required value={form.resource} onChange={e => field('resource',e.target.value)}>{resources.map(r => <option key={r}>{r}</option>)}</select></label></div>
              <div className="form-two"><label><span className="form-label-text">Start time <span aria-hidden="true">*</span></span><input type="time" required value={form.start_time} onChange={e => field('start_time',e.target.value)}/></label><label><span className="form-label-text">End time <span aria-hidden="true">*</span></span><input type="time" required value={form.end_time} onChange={e => field('end_time',e.target.value)}/></label></div>
              <PublicDailySchedule
                date={form.booked_for}
                selectedResource={form.resource}
                refreshKey={scheduleRefresh}
              />
              <AvailabilityMessage
                state={availability}
                conflict={conflict}
                reference={reference}
                onRetry={retry}
              />
              <h3><Users size={20}/> Booker information</h3>
              <div className="form-two"><label><span className="form-label-text">Full name <span aria-hidden="true">*</span></span><input required maxLength={120} value={form.booked_by} onChange={e=>field('booked_by',e.target.value)} placeholder="Your full name"/></label><label><span className="form-label-text">Department <span aria-hidden="true">*</span></span><select required value={form.department} onChange={e=>field('department',e.target.value)}><option value="">Select department</option>{departments.map(department => <option key={department} value={department}>{department}</option>)}</select></label></div>
              <p className="booking-sharing-notice">Your full name and department will appear in the public daily booking schedule to help colleagues coordinate reservations. Your booking purpose will not be displayed.</p>
              <label><span className="form-label-text">Purpose of booking</span><textarea rows={3} maxLength={1000} value={form.purpose} onChange={e=>field('purpose',e.target.value)} placeholder="What will you use this space for?"/></label>
              <input tabIndex={-1} aria-hidden="true" autoComplete="off" className="honeypot" value={form.website} onChange={e=>field('website',e.target.value)}/>
              {notice&&<div role="status" className={'alert '+notice.type}>{notice.type==='success'?<CheckCircle2 size={19}/>:<AlertTriangle size={19}/>}<span>{notice.text}</span></div>}
              <button className={"btn primary public-submit" + (busy ? " is-loading" : "")} disabled={busy||availability!=='ready'||conflict}>{busy?'Submitting…':'Submit booking request'}<ArrowRight size={17}/></button>
            </form>
            <aside className="request-aside" data-reveal="third" id="how-it-works"><div className="aside-heading"><span className="eyebrow">HOW IT WORKS</span><h3>Booking made simple.</h3></div>
              <div className="step"><span className="step-icon"><CalendarDays size={20}/></span><div><b>01. Select your schedule</b><p>Pick a space, date, and time that suits your needs.</p></div></div>
              <div className="step"><span className="step-icon"><ClipboardList size={20}/></span><div><b>02. Share your details</b><p>Tell us who is booking and what the reservation is for.</p></div></div>
              <div className="step"><span className="step-icon"><CheckCircle2 size={20}/></span><div><b>03. Await confirmation</b><p>The administrator reviews the request and manages the booking.</p></div></div>
              <div className="aside-note"><Building2 size={19}/><p>Booking records are managed securely by the Greenlight administrator. Names and departments are visible in the daily schedule to help coordinate shared spaces. Booking purposes and private notes remain hidden.</p></div>
            </aside>
          </div>
        </div></section>
      </main>
      <footer className="public-footer"><div className="public-container"><Brand size={32}/><span>© {new Date().getFullYear()} Greenlight Booking Portal</span><Link to="/admin/login">Admin access</Link></div></footer>
    </div>
  );
}
