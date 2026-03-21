import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate                = useNavigate();
  const location                = useLocation();
  const successMsg              = location.state?.message || '';

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();
    setLoading(true);

    // Check maintenance mode (skip for admins)
    const { data: maintSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    // Check if email belongs to an admin
    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!adminRow && maintSetting?.value === 'true') {
      setLoading(false);
      setError('The system is currently under maintenance. Please try again later.');
      return;
    }

    if (adminRow) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      setLoading(false);
      if (authError) { setError('Invalid email or password. Please try again.'); return; }
      navigate('/admin/dashboard');
      return;
    }

    // Officials — check Supabase auth first
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      if (authError.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed yet. Please go back to sign up and complete the OTP verification step.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
      return;
    }

    // Look up in officials table
    const { data: official, error: dbError } = await supabase
      .from('officials')
      .select('status, barangay, ban_reason')
      .eq('auth_id', data.user.id)
      .single();

    setLoading(false);

    if (dbError || !official) {
      await supabase.auth.signOut();
      setError('Access denied. This portal is for officials only.');
      return;
    }

    if (official.status === 'pending') {
      await supabase.auth.signOut();
      setError('Your account is under review. Please wait for admin approval.');
      return;
    }

    if (official.status === 'rejected') {
      await supabase.auth.signOut();
      setError('Your account was not approved. Please contact the admin.');
      return;
    }

    if (official.status === 'banned') {
      await supabase.auth.signOut();
      const reason = official.ban_reason ? ` Reason: ${official.ban_reason}` : '';
      setError(`Your account has been suspended.${reason} Please contact the admin.`);
      return;
    }

    // Approved — go to dashboard
    navigate('/officials/dashboard');
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>

      {/* NAVBAR */}
      <header className="landing-header">
        <nav>
          <a href="/" className="logo">
            <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
            <span className="logo-text">CommUnity</span>
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#contact">Contact</a></li>
            <li><a href="/#get-started">Get Started</a></li>
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
              CommUnity helps residents connect, report issues, request services,
              and build a stronger barangay together.
            </p>
            <ul className="auth-checklist">
              <li>✔ Report community concerns</li>
              <li>✔ Request barangay services</li>
              <li>✔ Earn rewards for participation</li>
            </ul>
          </div>

          {/* RIGHT — login form */}
          <div className="auth-form">
            <h2>WELCOME BACK!</h2>
            <form onSubmit={handleSubmit}>
              {successMsg && (
                <div style={{
                  background: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0', borderRadius: '8px',
                  padding: '10px 14px', marginBottom: '12px', fontSize: '14px'
                }}>
                  {successMsg}
                </div>
              )}
              {error && (
                <div style={{
                  background: '#fdecea', color: '#c62828',
                  border: '1px solid #f5c6cb', borderRadius: '8px',
                  padding: '10px 14px', marginBottom: '12px', fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#6b7280', display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </button>
              <p style={{ textAlign: 'right', margin: '4px 0 0' }}>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </p>
              <p className="auth-switch-text">
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;
