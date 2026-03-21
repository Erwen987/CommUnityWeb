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

const EyeIcon = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* Step indicator used on OTP and Done screens */
function StepBar({ active }) {
  const steps = ['Details', 'Verify Email', 'Pending'];
  return (
    <div className="auth-step-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800,
              background: i < active ? '#2563eb' : i === active ? 'rgba(37,99,235,0.85)' : 'rgba(255,255,255,0.12)',
              color: '#fff', border: i === active ? '2px solid #7AB1F1' : 'none', flexShrink: 0,
            }}>
              {i < active
                ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1
              }
            </div>
            <span className="step-label" style={{ fontSize: 11.5, fontWeight: i === active ? 700 : 500, color: i === active ? '#a7d4ff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < 2 && <div style={{ flex: 1, minWidth: 8, height: 1.5, background: i < active ? 'rgba(37,99,235,0.7)' : 'rgba(255,255,255,0.12)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* Shared Navbar */
function Navbar() {
  return (
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
  );
}

function Signup() {
  const [form, setForm]           = useState({ barangay: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState('form');
  const [otp, setOtp]             = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }

    if (data.session) {
      const { error: dbError } = await supabase.from('officials').insert({
        auth_id: data.user.id, barangay_name: form.barangay, barangay: form.barangay,
        email: form.email.trim().toLowerCase(), status: 'pending',
      });
      if (dbError) { setError('Failed to save your details. Please contact admin.'); return; }
      await supabase.auth.signOut();
      setStep('done');
    } else {
      setPendingUserId(data.user.id);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Please enter the OTP code.'); return; }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: form.email.trim(), token: otp.trim(), type: 'signup' });
    if (verifyError) { setLoading(false); setError('Invalid or expired code. Please try again.'); return; }
    const { error: dbError } = await supabase.from('officials').insert({
      auth_id: pendingUserId, barangay_name: form.barangay, barangay: form.barangay,
      email: form.email.trim().toLowerCase(), status: 'pending',
    });
    setLoading(false);
    if (dbError) { setError('Confirmed but failed to save. Error: ' + dbError.message); return; }
    await supabase.auth.signOut();
    setStep('done');
  };

  /* ── OTP SCREEN ── */
  if (step === 'otp') return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">

          {/* LEFT — info */}
          <div className="auth-overview">
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <h2>Check Your Inbox</h2>
            <p>We sent a 6-digit verification code to <strong style={{ color: '#a7d4ff' }}>{form.email}</strong>. Enter it to confirm your email address.</p>
            <ul className="auth-checklist">
              <li>✔ Check your spam folder if you don't see it</li>
              <li>✔ Code expires in 10 minutes</li>
              <li>✔ One step closer to joining CommUnity</li>
            </ul>
          </div>

          {/* RIGHT — OTP form */}
          <div className="auth-form">
            <div className="auth-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" style={{ height: 32, width: 'auto' }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>CommUnity</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Official Portal</div>
              </div>
            </div>
            <StepBar active={1} />

            <h2 style={{ marginBottom: 4 }}>Verify Your Email</h2>
            <p className="auth-sub">Enter the 6-digit code we sent you</p>

            {error && (
              <div style={{ display: 'flex', gap: 9, background: 'rgba(220,38,38,0.12)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <label>Verification Code</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                placeholder="0  0  0  0  0  0"
                value={otp} onChange={e => { setOtp(e.target.value); setError(''); }}
                style={{ fontSize: 22, textAlign: 'center', letterSpacing: '12px', fontWeight: 700 }}
              />
              <button type="submit" disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Verifying…</>
                  : 'VERIFY EMAIL'
                }
              </button>
              <p className="auth-switch-text" style={{ marginTop: 12 }}>
                Didn't receive it? Check your spam folder.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );

  /* ── SUCCESS SCREEN ── */
  if (step === 'done') return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">

          {/* LEFT — info */}
          <div className="auth-overview">
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2>You're Almost There!</h2>
            <p>
              Your registration has been submitted for <strong style={{ color: '#a7d4ff' }}>Barangay {form.barangay}</strong>.
              The admin will review and approve your account shortly.
            </p>
            <ul className="auth-checklist">
              <li>✔ Email confirmed</li>
              <li>⏳ Waiting for admin review</li>
              <li>🔓 Access granted after approval</li>
            </ul>
          </div>

          {/* RIGHT — done */}
          <div className="auth-form">
            <div className="auth-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" style={{ height: 32, width: 'auto' }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>CommUnity</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Official Portal</div>
              </div>
            </div>
            <StepBar active={2} />

            <h2 style={{ marginBottom: 4 }}>Registration Submitted!</h2>
            <p className="auth-sub">Your account is pending admin approval</p>

            {/* Status card */}
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 18px', margin: '16px 0 22px' }}>
              {[
                { color: '#34d399', text: 'Email confirmed ✓' },
                { color: '#fbbf24', text: 'Waiting for admin review' },
                { color: 'rgba(255,255,255,0.3)', text: 'Access granted after approval' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: x.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{x.text}</span>
                </div>
              ))}
            </div>

            <a href="/login"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#173d63', color: '#fff', padding: '14px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.05em', fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1f507f'}
              onMouseLeave={e => e.currentTarget.style.background = '#173d63'}
            >
              BACK TO SIGN IN
            </a>
          </div>

        </div>
      </div>
    </div>
  );

  /* ── SIGNUP FORM ── */
  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card auth-card--signup">

          {/* LEFT — form */}
          <div className="auth-form auth-form--left">
            <div className="auth-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" style={{ height: 32, width: 'auto' }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>CommUnity</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Official Portal</div>
              </div>
            </div>
            <StepBar active={0} />

            <h2 style={{ marginBottom: 4 }}>Create Your Account</h2>
            <p className="auth-sub">For barangay officials only — requires admin approval</p>

            {error && (
              <div style={{ display: 'flex', gap: 9, background: 'rgba(220,38,38,0.12)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Barangay */}
              <label>Barangay</label>
              <select name="barangay" value={form.barangay} onChange={handleChange} required>
                <option value="" disabled>Select your barangay</option>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              {/* Email */}
              <label>Email Address</label>
              <input
                type="email" name="email" placeholder="Enter your email"
                value={form.email} onChange={handleChange} required
              />

              {/* Passwords — 2 column */}
              <div className="auth-name-row">
                <div style={{ flex: 1 }}>
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} name="password"
                      placeholder="Min. 8 chars" value={form.password}
                      onChange={handleChange} required
                      style={{ paddingRight: 40, marginBottom: 0 }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8ba6c9', display: 'flex', padding: 4 }}>
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      placeholder="Re-enter" value={form.confirmPassword}
                      onChange={handleChange} required
                      style={{ paddingRight: 40, marginBottom: 0 }}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8ba6c9', display: 'flex', padding: 4 }}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Submitting…</>
                  : 'SUBMIT FOR APPROVAL →'
                }
              </button>

              <p className="auth-switch-text">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </div>

          {/* RIGHT — info panel */}
          <div className="auth-overview auth-overview--right">
            <h2>Join CommUnity Today</h2>
            <p>
              Register your barangay and start managing community reports,
              document requests, and residents — all in one place.
            </p>
            <ul className="auth-checklist">
              <li>✔ Fill out the form</li>
              <li>✔ Verify your email</li>
              <li>⏳ Wait for admin approval</li>
              <li>🔓 Access the portal</li>
            </ul>

            <div style={{
              marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.35)',
              borderRadius: 999, padding: '6px 14px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}>Official Registration</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Signup;
