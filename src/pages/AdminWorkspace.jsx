import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CalendarDays, CalendarCheck2, CheckCircle2, ChevronRight, LayoutDashboard, LogOut, Menu, Plus, X, BarChart3 } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import BookingDialog from '../components/BookingDialog.jsx';
import { CalendarPanel } from '../components/AdminWidgets.jsx';
import { Overview, Reservations, Insights } from './AdminViews.jsx';
import { api } from '../lib/api.js';
import { today, newBooking, reportStats, rangesOverlap } from '../lib/booking.js';

/** Stateful controller: views, fields and database operations live in separate modules. */
export default function AdminWorkspace({ onSignOut }) {
  const [view, setView] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyStatusId, setBusyStatusId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [form, setForm] = useState(null);
  const [calendarDate, setCalendarDate] = useState(today());

  const stats = useMemo(() => reportStats(bookings), [bookings]);
  const nav = [
    { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { key: 'bookings', label: 'All Bookings', Icon: CalendarCheck2 },
    { key: 'calendar', label: 'Calendar', Icon: CalendarDays },
    { key: 'reports', label: 'Reports & Insights', Icon: BarChart3 }
  ];
  const title = nav.find(item => item.key === view)?.label || 'Dashboard';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/api/bookings');
      setBookings(result.bookings || []);
      setDatabaseError(null);
      if (result.capped) setNotice({ type: 'warning', text: 'Showing the first 10,000 bookings. Export or archive older records before the database grows further.' });
    } catch (error) {
      setBookings([]);
      setDatabaseError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function navigate(next) {
    setView(next);
    setDrawer(false);
    setNotice(null);
  }
  function openNew(date = today()) { setForm(newBooking(date)); }
  function openEdit(booking) {
    setForm({
      ...booking,
      start_time: booking.start_time.slice(0, 5),
      end_time: booking.end_time.slice(0, 5)
    });
  }
  function success(text) { setNotice({ type: 'success', text }); }
  function failure(error) {
    setNotice({
      type: 'error',
      text: error.message + (error.requestId ? ' (Reference ' + error.requestId.slice(0, 8) + ')' : '')
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!form) return;
    if (form.start_time >= form.end_time) {
      return setNotice({ type: 'error', text: 'End time must be later than start time.' });
    }
    if (bookings.some(b => b.id !== form.id && rangesOverlap(b, form))) {
      return setNotice({ type: 'error', text: 'This resource is already booked at that time.' });
    }
    setBusy(true);
    try {
      const result = await api('/api/bookings', { method: form.id ? 'PATCH' : 'POST', body: form });
      setBookings(current => form.id
        ? current.map(b => b.id === form.id ? result.booking : b)
        : [result.booking, ...current]
      );
      setForm(null);
      success(form.id ? 'Booking updated.' : 'Booking created.');
    } catch (error) { failure(error); }
    finally { setBusy(false); }
  }

  /**
   * Only the booking's status is patched; all names, dates, purposes and
   * history remain in the database. A cancelled entry can be restored
   * from the Cancelled or All status filter.
   */
  async function changeStatus(booking, nextStatus) {
    if (nextStatus === booking.status || busyStatusId || busy) return;
    if (nextStatus === 'cancelled' &&
        !window.confirm('Mark this booking as cancelled? The record will remain saved and can be restored.'))
      return;
    setBusyStatusId(booking.id);
    setNotice(null);
    try {
      const data = await api('/api/bookings', {
        method: 'PATCH',
        body: { id: booking.id, status: nextStatus }
      });
      setBookings(current => current.map(row =>
        row.id === booking.id ? data.booking : row
      ));
      success('Status updated to ' + nextStatus + '. Booking details were kept.');
    } catch (error) { failure(error); }
    finally { setBusyStatusId(null); }
  }

  function exportCsv(rows) {
    const headers = ['Booking date', 'Start', 'End', 'Resource', 'Booked by', 'Department', 'Purpose', 'Status', 'Notes', 'Created at'];
    const fields = ['booked_for', 'start_time', 'end_time', 'resource', 'booked_by', 'department', 'purpose', 'status', 'notes', 'created_at'];
    // Quote and escape all CSV values; neutralize spreadsheet formula injection.
    const escape = value => {
      const text = String(value ?? '');
      const safe = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv = [headers, ...rows.map(b => fields.map(key => b[key]))]
      .map(row => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'greenlight-bookings-' + today() + '.csv';
    anchor.click(); URL.revokeObjectURL(url);
  }

  async function signOut() {
    try {
      await api('/api/session', { method: 'DELETE' });
      onSignOut();
    } catch (error) { failure(error); }
  }

  return <div className="shell">
    <aside className={'sidebar ' + (drawer ? 'open' : '')}>
      <div className="sidebar-brand"><Brand size={39}/><button className="mobile-only close-btn" onClick={()=>setDrawer(false)} aria-label="Close sidebar"><X size={18}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="sidebar-nav">{nav.map(({key,label,Icon})=><button key={key} className={'nav-button '+(view===key?'selected':'')} onClick={()=>navigate(key)}><Icon size={19}/>{label}{view===key&&<span className="nav-indicator"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="admin-row"><div className="avatar">G</div><div><strong>Greenlight</strong><span>Administrator</span></div><button title="Sign out" onClick={signOut}><LogOut size={18}/></button></div>
      </div>
    </aside>
    {drawer&&<div className="mobile-overlay" onClick={()=>setDrawer(false)}/>}
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb"><button className="mobile-only menu-toggle" onClick={()=>setDrawer(true)} aria-label="Open menu"><Menu size={22}/></button><span>Workspace</span><ChevronRight size={16}/><b>{title}</b></div>
        <div className="topbar-right"><span className="live-dot"/><span className="date-top">{new Date().toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span><Link to="/" className="admin-public-link">Public booking page <ArrowRight size={14}/></Link><div className="avatar small">G</div></div>
      </header>
      <main className="content">
        {databaseError&&<div role="alert" className="alert error"><AlertTriangle size={18}/><span><b>Booking database unavailable:</b> {databaseError.message}{databaseError.requestId?' (Ref: '+databaseError.requestId.slice(0,8)+')':''}. The app will not save bookings locally.</span><button className="btn subtle small" onClick={load}>Retry</button></div>}
        {notice&&<div role="status" className={'alert '+notice.type}><span>{notice.type==='success'?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}</span>{notice.text}<button onClick={()=>setNotice(null)} aria-label="Dismiss message"><X size={15}/></button></div>}
        {loading&&<p className="loading-message">Loading bookings…</p>}
        {view==='dashboard'&&<Overview stats={stats} bookings={bookings} onNew={openNew} onEdit={openEdit} onStatusChange={changeStatus} savingStatusId={busyStatusId} onAll={()=>navigate('bookings')}/>}
        {view==='bookings'&&<Reservations bookings={bookings} onNew={openNew} onEdit={openEdit} onStatusChange={changeStatus} savingStatusId={busyStatusId} onExport={exportCsv} onReload={load} loading={loading}/>}
        {view==='calendar'&&<><div className="page-head"><div><div className="eyebrow">SCHEDULE</div><h1>Booking calendar</h1><p>Plan and manage daily reservations.</p></div><button className="btn primary" onClick={()=>openNew(calendarDate)}><Plus size={17}/> New booking</button></div><CalendarPanel bookings={stats.active} date={calendarDate} onDate={setCalendarDate} onCreate={openNew} onEdit={openEdit}/></>}
        {view==='reports'&&<Insights stats={stats} bookings={bookings} onExport={exportCsv}/>}
        <footer className="footer"><span>© {new Date().getFullYear()} Greenlight Booking</span><span>Administrator dashboard</span></footer>
      </main>
    </div>
    {form&&<BookingDialog booking={form} onChange={setForm} onSave={save} onClose={()=>setForm(null)} saving={busy}/>}
  </div>;
}
