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
    barangay: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  // 'form' | 'otp' | 'done'
  const [step, setStep]       = useState('form');
  const [otp, setOtp]         = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

    // 1. Create Supabase auth account (Supabase will send an OTP to their email)
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // If Supabase auto-confirmed (email confirmation disabled), session is available now
    if (data.session) {
      // Insert immediately — user is already authenticated
      const { error: dbError } = await supabase.from('officials').insert({
        auth_id:       data.user.id,
        barangay_name: form.barangay,
        barangay:      form.barangay,
        email:         form.email.trim().toLowerCase(),
        status:        'pending',
      });
      if (dbError) {
        setError('Failed to save your details. Please contact admin.');
        return;
      }
      await supabase.auth.signOut();
      setStep('done');
    } else {
      // Email confirmation required — wait for OTP
      setPendingUserId(data.user.id);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Please enter the OTP code.'); return; }
    setLoading(true);

    // Verify OTP — this gives the user an active session
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email.trim(),
      token: otp.trim(),
      type:  'signup',
    });

    if (verifyError) {
      setLoading(false);
      setError('Invalid or expired OTP. Please check the code and try again.');
      return;
    }

    // Now authenticated — insert into officials table
    const { error: dbError } = await supabase.from('officials').insert({
      auth_id:       pendingUserId,
      barangay_name: form.barangay,
      barangay:      form.barangay,
      email:         form.email.trim().toLowerCase(),
      status:        'pending',
    });

    setLoading(false);

    if (dbError) {
      setError('Email confirmed but failed to save your details. Please contact admin. Error: ' + dbError.message);
      return;
    }

    // Sign out — they need admin approval before they can use the portal
    await supabase.auth.signOut();
    setStep('done');
  };

  // ── OTP SCREEN ──
  if (step === 'otp') {
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
            padding: '48px 40px', textAlign: 'center', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
            <h2 style={{ color: '#1E3A5F', marginBottom: '8px', fontSize: '22px' }}>Check Your Email</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
              We sent a 6-digit OTP to <strong>{form.email}</strong>.<br />
              Enter it below to confirm your email address.
            </p>
            {error && (
              <div style={{
                background: '#fdecea', color: '#c62828', border: '1px solid #f5c6cb',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px',
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => { setOtp(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '12px 16px', fontSize: '20px', textAlign: 'center',
                  letterSpacing: '8px', border: '2px solid #e5e7eb', borderRadius: '10px',
                  marginBottom: '16px', boxSizing: 'border-box', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: '#1E3A5F', color: '#fff',
                  padding: '12px', borderRadius: '10px', border: 'none',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS SCREEN ──
  if (step === 'done') {
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
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#1E3A5F', marginBottom: '12px', fontSize: '22px' }}>
              Email Confirmed!
            </h2>
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
                padding: '16px 20px',
              }}>
                <div style={{ fontWeight: '700', color: '#166534', marginBottom: '4px', fontSize: '14px' }}>
                  Waiting for Admin Approval
                </div>
                <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.6' }}>
                  Your account for <strong>{form.barangay}</strong> has been submitted. Once the admin approves it, you can log in using your email and password.
                </div>
              </div>
            </div>
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
