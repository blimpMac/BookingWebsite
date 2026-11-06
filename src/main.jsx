import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './lib/api.js';
import Brand from './components/Brand.jsx';
import PublicBookingPage from './pages/PublicBookingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminWorkspace from './pages/AdminWorkspace.jsx';
import './styles.css';
import './public.css';

/** Routes follow the RFP website: public intake, separate staff login, private admin. */
function AdminLoginRoute({ session, setAuthenticated }) {
  const navigate = useNavigate();
  if (session.loading) return <Loading/>;
  if (session.authenticated) return <Navigate to="/admin" replace/>;
  return <LoginPage configured={session.configured} onLogin={() => {
    setAuthenticated(true);
    navigate('/admin', { replace: true });
  }}/>;
}

function Loading() {
  return <div className="splash"><Brand size={54}/><p>Loading Greenlight Booking…</p></div>;
}

function App() {
  const [session, setSession] = useState({ loading: true, authenticated: false, configured: false });

  useEffect(() => {
    let mounted = true;
    api('/api/session').then(response => {
      if (mounted) setSession({
        loading: false,
        authenticated: Boolean(response.authenticated),
        configured: Boolean(response.configured)
      });
    }).catch(() => {
      if (mounted) setSession({ loading: false, authenticated: false, configured: false });
    });
    return () => { mounted = false; };
  }, []);

  function setAuthenticated(authenticated) {
    setSession(current => ({ ...current, loading: false, authenticated }));
  }

  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicBookingPage/>}/>
    <Route path="/admin/login" element={<AdminLoginRoute session={session} setAuthenticated={setAuthenticated}/>}/>
    <Route path="/admin/*" element={session.loading ? <Loading/> :
      session.authenticated ? <AdminWorkspace onSignOut={() => setAuthenticated(false)}/> :
        <Navigate to="/admin/login" replace/>}/>
    <Route path="*" element={<div className="not-found"><Brand/><h1>Page not found</h1><a href="/">Return to booking page</a></div>}/>
  </Routes></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App/>);
