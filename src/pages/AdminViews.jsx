import React, { useState } from 'react';
import { CalendarDays, CalendarCheck2, BarChart3, Users, Plus, ArrowRight, Clock3, Download, Filter, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { formatDate, formatTime, parseDate, dateString, today } from '../lib/booking.js';
import { StatCard, BookingTable, Status, Empty } from '../components/AdminWidgets.jsx';

function PageHeading({eyebrow,title,description,children}) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}
function Action({children,onClick}) {
  return <button className="btn primary" onClick={onClick}><Plus size={18}/>{children}</button>;
}
export function Overview({stats, bookings, onNew, onEdit, onCancel, onConfirm, onAll}) {
  const upcoming=stats.active.filter(b=>b.booked_for>=today()).sort((a,b)=>(a.booked_for+a.start_time).localeCompare(b.booked_for+b.start_time));
  const calendar=Array.from({length:7},(_,i)=>{const d=parseDate(today());d.setDate(d.getDate()-6+i);return dateString(d)});
  const heights=calendar.map(d=>stats.active.filter(b=>b.booked_for===d).length);
  const max=Math.max(1,...heights);
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Booking dashboard" description="A quick look at your upcoming reservations and daily activity."><Action onClick={onNew}>New booking</Action></PageHeading>
    <div className="stat-grid">
      <StatCard icon={CalendarDays} label="Today" value={stats.day.length} detail={formatDate(today())}/>
      <StatCard icon={CalendarCheck2} label="This week" value={stats.week.length} detail="Monday to Sunday" tone="blue"/>
      <StatCard icon={BarChart3} label="This month" value={stats.monthly.length} detail={formatDate(today(),{month:'long',year:'numeric'})} tone="purple"/>
      <StatCard icon={Users} label="Unique bookers" value={stats.uniqueBookers} detail="This month" tone="orange"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h2>Booking activity</h2><p>Past 7 days, including today</p></div></div><div className="chart-wrap"><div className="chart-axis"><span>{max}</span><span>{Math.floor(max/2)}</span><span>0</span></div><div className="chart-bars">{calendar.map((day,i)=><div className="bar-track" key={day} title={day+' · '+heights[i]+' bookings'}><div className="bar-position"><div className={'bar '+(day===today()?'current':'')} style={{height:heights[i]?Math.max(8,heights[i]*100/max)+'%':'3px'}}/></div><small>{formatDate(day,{weekday:'short'})}</small></div>)}</div></div><div className="chart-footer"><span className="chart-legend"/> Active bookings per day</div></section>
      <section className="panel upcoming-panel"><div className="panel-head"><div><h2>Upcoming bookings</h2><p>Next scheduled reservations</p></div><button className="text-btn" onClick={onAll}>View all <ArrowRight size={16}/></button></div><div className="upcoming-list">{upcoming.length?upcoming.slice(0,5).map(b=><div className="upcoming-item" key={b.id}><div className="date-square"><b>{parseDate(b.booked_for).getDate()}</b><span>{formatDate(b.booked_for,{month:'short'})}</span></div><div className="upcoming-details"><strong>{b.booked_by}</strong><small>{b.resource}</small><span><Clock3 size={13}/>{formatTime(b.start_time)} – {formatTime(b.end_time)}</span></div><Status value={b.status}/></div>):<Empty title="No upcoming bookings" text="New reservations will appear here."/>}</div></section>
    </div>
    <section className="panel table-panel"><div className="panel-head"><div><h2>Today's bookings</h2><p>{stats.day.length} active reservations today</p></div><button className="text-btn" onClick={onAll}>All bookings <ArrowRight size={16}/></button></div><BookingTable bookings={stats.day} onEdit={onEdit} onCancel={onCancel} onConfirm={onConfirm}/></section>
  </>;
}
export function Reservations({bookings,onNew,onEdit,onCancel,onConfirm,onExport,onReload,loading}) {
  const [term,setTerm]=useState('');
  const [status,setStatus]=useState('all');
  const filtered=bookings.filter(b=>(status==='all'||b.status===status)&&
    [b.booked_by,b.department,b.resource,b.purpose,b.booked_for].join(' ').toLowerCase().includes(term.toLowerCase()));
  return <>
    <PageHeading eyebrow="RESERVATIONS" title="All bookings" description="Review, confirm and manage all booking requests.">
      <div className="head-actions"><button className="btn subtle" onClick={()=>onExport(filtered)}><Download size={17}/>Export CSV</button><Action onClick={onNew}>New booking</Action></div>
    </PageHeading>
    <section className="panel table-panel"><div className="filter-bar"><div className="search-box"><Search size={17}/><input aria-label="Search bookings" placeholder="Search names, dates or resources..." value={term} onChange={e=>setTerm(e.target.value)}/></div><div className="select-box"><Filter size={16}/><select aria-label="Filter status" value={status} onChange={e=>setStatus(e.target.value)}>{['all','pending','confirmed','completed','cancelled'].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></div><button className="btn subtle small" onClick={onReload} disabled={loading}><RefreshCw size={16}/>Refresh</button></div><BookingTable bookings={filtered} onEdit={onEdit} onCancel={onCancel} onConfirm={onConfirm}/></section>
  </>;
}
export function Insights({stats,bookings,onExport}) {
  const counts=Object.entries(stats.active.reduce((acc,b)=>(acc[b.resource]=(acc[b.resource]||0)+1,acc),{})).sort((a,b)=>b[1]-a[1]);
  const history=[...bookings].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,8);
  return <>
    <PageHeading eyebrow="ANALYTICS" title="Usage and insights" description="See who is booking, when, and which resources are used most."><button className="btn subtle" onClick={()=>onExport(bookings)}><Download size={17}/>Export CSV</button></PageHeading>
    <div className="stat-grid"><StatCard icon={CalendarDays} label="Today" value={stats.day.length} detail="Current day"/><StatCard icon={CalendarCheck2} label="This week" value={stats.week.length} detail="Calendar week" tone="blue"/><StatCard icon={BarChart3} label="This month" value={stats.monthly.length} detail="Calendar month" tone="purple"/><StatCard icon={TrendingUp} label="Total active" value={stats.active.length} detail="All dates" tone="orange"/></div>
    <div className="dashboard-grid reports-grid">
      <section className="panel"><div className="panel-head"><div><h2>Bookings per resource</h2><p>All non-cancelled reservations</p></div></div><div className="distribution">{counts.length?counts.map(([label,count])=><div className="dist-row" key={label}><div><span>{label}</span><b>{count}</b></div><div className="dist-track"><span style={{width:(100*count/Math.max(1,stats.active.length))+'%'}}/></div></div>):<Empty title="No activity yet" text="Once bookings are submitted, usage appears here."/ >}</div></section>
      <section className="panel"><div className="panel-head"><div><h2>Recent booking history</h2><p>Recorded names, dates and creation times</p></div></div><div className="history-list">{history.length?history.map(b=><div className="history-item" key={b.id}><div className="history-avatar">{b.booked_by?.[0]?.toUpperCase()||'G'}</div><div><strong>{b.booked_by}</strong><p>Reserved <b>{b.resource}</b> for {formatDate(b.booked_for)}</p><small>{b.created_at?new Date(b.created_at).toLocaleString('en-PH'):'Booking time unavailable'}</small></div></div>):<Empty title="No history yet" text="A history will appear after the first booking."/ >}</div></section>
    </div>
  </>;
}
