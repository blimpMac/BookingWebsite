import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, AlertTriangle } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { api } from '../lib/api.js';

/** A dedicated staff sign-in page, separate from the public booking form. */
export default function LoginPage({ configured, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/session', { method: 'POST', body: { username, password } });
      setPassword('');
      onLogin();
    } catch (cause) {
      setError(cause.message + (cause.requestId ? ' (Ref: ' + cause.requestId.slice(0, 8) + ')' : ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-route">
      <div className="login-top"><Link to="/"><ArrowLeft size={17}/> Back to booking page</Link></div>
      <div className="login-centered">
        <Brand size={49}/>
        <div className="login-box">
          <span className="login-icon"><LockKeyhole size={25}/></span>
          <div className="eyebrow">STAFF ACCESS</div>
          <h1>Welcome back</h1>
          <p>Sign in to manage bookings, approvals and reporting.</p>
          <form onSubmit={submit}>
            <label htmlFor="admin-username">Username</label>
            <input id="admin-username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username" required/>
            <label htmlFor="admin-password">Password</label>
            <div className="login-password">
              <input id="admin-password" type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required/>
              <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
            {error && <div role="alert" className="alert error"><AlertTriangle size={17}/><span>{error}</span></div>}
            {!configured && <div role="status" className="alert warning"><AlertTriangle size={17}/>Login configuration is not active. Contact your system administrator.</div>}
            <button className={"btn primary login-submit" + (busy ? " is-loading" : "")} disabled={busy || !configured}>{busy ? 'Signing in...' : 'Sign in'}<ArrowRight size={18}/></button>
          </form>
          <div className="login-secure"><ShieldCheck size={15}/> Authorized staff only</div>
        </div>
      </div>
    </main>
  );
}
