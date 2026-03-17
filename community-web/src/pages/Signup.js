import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

const BARANGAYS = [
  'Bacayao Norte', 'Bacayao Sur', 'Barangay I (Poblacion)', 'Barangay II (Poblacion)',
  'Barangay III (Poblacion)', 'Barangay IV (Poblacion)', 'Bolosan', 'Bonuan Binloc',
  'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan', 'Herrero',
  'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Poblacion Oeste', 'Pogo Chico', 'Pogo Grande',
  'Pugaro Suit', 'Quezon', 'Salapingao', 'Talibaew', 'Tambacan',
];

function Signup() {
  const [form, setForm] = useState({
    barangayName: '', barangay: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    // 1. Create Supabase auth account
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Insert into officials table with status = 'pending'
    const { error: dbError } = await supabase.from('officials').insert({
      auth_id:       data.user.id,
      barangay_name: form.barangayName.trim(),
      barangay:      form.barangay,
      email:         form.email.trim().toLowerCase(),
      status:        'pending',
    });

    setLoading(false);

    if (dbError) {
      setError('Account created but failed to save details. Please contact admin.');
      return;
    }

    // Sign out immediately — they need admin approval first
    await supabase.auth.signOut();
    setSubmitted(true);
  };

  // ── SUCCESS SCREEN ──
  if (submitted) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
        <header>
          <nav>
            <a href="/" className="logo">
              <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
              <span className="logo-text">CommUnity</span>
            </a>
          </nav>
        </header>
        <div className="auth-container">
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: '20px',
            padding: '56px 48px', textAlign: 'center', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ color: '#1E3A5F', marginBottom: '12px', fontSize: '22px' }}>
              Request Submitted!
            </h2>
            <p style={{ color: '#4b5563', lineHeight: '1.7', marginBottom: '24px' }}>
              Your account for <strong>{form.barangay}</strong> has been submitted for admin approval.
              You will be able to log in once the admin approves your request.
            </p>
            <a href="/login" style={{
              display: 'inline-block', background: '#1E3A5F', color: '#fff',
              padding: '12px 32px', borderRadius: '10px', textDecoration: 'none',
              fontWeight: '700', fontSize: '14px',
            }}>Back to Login</a>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>

      {/* NAVBAR */}
      <header>
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
        <div className="auth-card auth-card--signup">

          {/* LEFT — signup form */}
          <div className="auth-form auth-form--left">
            <h2>Official Sign Up</h2>
            <p className="auth-sub">Register your barangay to get started</p>

            {error && (
              <div style={{
                background: '#fdecea', color: '#c62828',
                border: '1px solid #f5c6cb', borderRadius: '8px',
                padding: '10px 14px', marginBottom: '12px', fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <label>Barangay Name</label>
              <input
                type="text"
                name="barangayName"
                placeholder="e.g. Barangay Mangin Officials"
                value={form.barangayName}
                onChange={handleChange}
                required
              />

              <label>Select Barangay</label>
              <select name="barangay" value={form.barangay} onChange={handleChange} required>
                <option value="" disabled>Select your barangay</option>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your official email"
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
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#6b7280', display: 'flex', alignItems: 'center',
                  }}>
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

              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#6b7280', display: 'flex', alignItems: 'center',
                  }}>
                  {showConfirm ? (
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
                {loading ? 'Submitting...' : 'SUBMIT FOR APPROVAL'}
              </button>
              <p className="auth-switch-text">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </form>
          </div>

          {/* RIGHT — info panel */}
          <div className="auth-overview auth-overview--right">
            <h2>Welcome to CommUnity</h2>
            <p>
              Register your barangay to start managing reports, service requests,
              and build a stronger community together.
            </p>
            <ul className="auth-checklist">
              <li>✔ Manage community reports</li>
              <li>✔ Process document requests</li>
              <li>✔ View barangay analytics</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Signup;
