import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminPortal.css';

const IMG = process.env.PUBLIC_URL + '/images';

const ADMIN_EMAIL = 'pandahuntergamer09@gmail.com';

function AdminPortal() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();

    if (email !== ADMIN_EMAIL) {
      setError('Access denied. Admin accounts only.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (authError) {
      setError('Invalid email or password.');
      return;
    }

    navigate('/admin/dashboard');
  };

  return (
    <div className="ap-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>

      {/* HEADER */}
      <header className="ap-header">
        <div className="ap-logo">
          <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
          <span>CommUnity</span>
        </div>
        <span className="ap-badge">Admin Portal</span>
      </header>

      {/* LOGIN CARD */}
      <div className="ap-container">
        <div className="ap-card">

          {/* LEFT PANEL */}
          <div className="ap-panel">
            <div className="ap-panel-icon">👋</div>
            <h2>Welcome, Admin!</h2>
            <p>This portal is restricted to authorized administrators of the CommUnity system.</p>
            <ul className="ap-checklist">
              <li>✔ Manage residents & users</li>
              <li>✔ Monitor reports & requests</li>
              <li>✔ View system analytics</li>
              <li>✔ Configure system settings</li>
            </ul>
          </div>

          {/* RIGHT FORM */}
          <div className="ap-form">
            <h2>ADMIN LOGIN</h2>
            <p className="ap-sub">Enter your admin credentials to continue</p>

            {error && <div className="ap-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter admin email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <label>Password</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '44px', marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#6b7280', display: 'flex', alignItems: 'center',
                    width: 'auto', marginTop: 0,
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
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}

export default AdminPortal;
