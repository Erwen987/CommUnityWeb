import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]         = useState('official');
  const navigate                = useNavigate();
  const location                = useLocation();
  const successMsg              = location.state?.message || '';

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    setLoading(true);

    const { data: maintSetting } = await supabase
      .from('system_settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
    const { data: adminRow } = await supabase
      .from('admins').select('id').eq('email', email).maybeSingle();

    if (!adminRow && maintSetting?.value === 'true') {
      setLoading(false);
      setError('The system is currently under maintenance. Please try again later.');
      return;
    }

    // Enforce role selection — admin email must use System Admin role
    if (adminRow && role === 'official') {
      setLoading(false);
      setError('This account belongs to a System Admin. Please select the "System Admin" role.');
      return;
    }

    // Enforce role selection — official email must use Barangay Official role
    if (!adminRow && role === 'admin') {
      setLoading(false);
      setError('No admin account found with this email. Please select the "Barangay Official" role.');
      return;
    }

    if (adminRow) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      setLoading(false);
      if (authError) { setError('Invalid email or password.'); return; }
      navigate('/admin/dashboard');
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
    if (authError) {
      setLoading(false);
      setError(authError.message?.toLowerCase().includes('email not confirmed')
        ? 'Email not confirmed yet. Please complete the OTP verification step.'
        : 'Invalid email or password.');
      return;
    }

    const { data: official, error: dbError } = await supabase
      .from('officials').select('status, barangay, ban_reason').eq('auth_id', data.user.id).single();
    setLoading(false);

    if (dbError || !official) { await supabase.auth.signOut(); setError('Access denied. This portal is for officials only.'); return; }
    if (official.status === 'pending')  { await supabase.auth.signOut(); setError('Your account is under review. Please wait for admin approval.'); return; }
    if (official.status === 'rejected') { await supabase.auth.signOut(); setError('Your account was not approved. Please contact the admin.'); return; }
    if (official.status === 'banned')   { await supabase.auth.signOut(); setError(`Your account has been suspended.${official.ban_reason ? ` Reason: ${official.ban_reason}` : ''}`); return; }
    navigate('/officials/dashboard');
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>

      {/* NAVBAR */}
      <header className="landing-header">
        <nav>
          <a href="/" className="logo">
            <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" style={{ height: 36, width: 'auto' }} />
            <span className="logo-text">CommUnity</span>
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#contact">Contact</a></li>
            <li><a href="/#get-started" className="btn-get-started">Get Started</a></li>
          </ul>
        </nav>
      </header>

      {/* CARD */}
      <div className="auth-container">
        <div className="auth-card">

          {/* LEFT — info panel */}
          <div className="auth-overview">
            <h2>Welcome to CommUnity</h2>
            <p>
              A unified platform for barangay officials to manage community reports,
              process document requests, and serve residents more effectively.
            </p>
            <ul className="auth-checklist">
              <li>✔ Community Reports Management</li>
              <li>✔ Document Request Processing</li>
              <li>✔ Resident Rewards &amp; Recognition</li>
            </ul>

            {/* Role hint badge */}
            <div style={{
              marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.35)',
              borderRadius: 999, padding: '6px 14px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}>Barangay Management System</span>
            </div>
          </div>

          {/* RIGHT — login form */}
          <div className="auth-form">
            <h2 style={{ marginBottom: 4 }}>Sign In</h2>
            <p className="auth-sub">Select your role and enter your credentials</p>

            {/* Role cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
              {[
                { key: 'official', icon: '🏛️', label: 'Barangay Official', sub: 'Portal access' },
                { key: 'admin',    icon: '🛡️', label: 'System Admin',      sub: 'Full access'   },
              ].map(r => (
                <button key={r.key} type="button" onClick={() => { setRole(r.key); setError(''); }}
                  style={{
                    padding: '12px 10px',
                    border: role === r.key ? '2px solid #7AB1F1' : '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    background: role === r.key ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'all 0.18s',
                    boxShadow: role === r.key ? '0 0 0 3px rgba(122,177,241,0.15)' : 'none',
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{r.icon}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: role === r.key ? '#a7d4ff' : 'rgba(255,255,255,0.8)' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.sub}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Success alert */}
              {successMsg && (
                <div style={{ display: 'flex', gap: 9, background: 'rgba(5,150,105,0.15)', color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                  {successMsg}
                </div>
              )}
              {/* Error alert */}
              {error && (
                <div style={{ display: 'flex', gap: 9, background: 'rgba(220,38,38,0.12)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Email */}
              <label>Email Address</label>
              <div style={{ position: 'relative', marginBottom: 11 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8ba6c9', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email" name="email" placeholder="Enter your email"
                  value={form.email} onChange={handleChange} required
                  style={{ paddingLeft: 38, marginBottom: 0 }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" className="auth-forgot" style={{ marginBottom: 0, fontSize: 11.5 }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative', marginTop: 5, marginBottom: 11 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8ba6c9', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  placeholder="Enter your password" value={form.password}
                  onChange={handleChange} required
                  style={{ paddingLeft: 38, paddingRight: 44, marginBottom: 0 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8ba6c9', display: 'flex', padding: 4 }}>
                  <EyeIcon open={showPass} />
                </button>
              </div>

              <button type="submit" disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Signing in…</>
                  : 'SIGN IN'
                }
              </button>

              <p className="auth-switch-text">
                Don't have an account? <Link to="/signup">Sign up here</Link>
              </p>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;
