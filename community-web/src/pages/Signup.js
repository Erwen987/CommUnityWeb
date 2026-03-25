import React, { useState, useEffect, useRef } from 'react';
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

const POSITIONS = [
  'Barangay Captain',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Councilor',
  'SK Chairperson',
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

const strongPasswordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

function validatePassword(pw) {
  if (pw.length < 8)              return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(pw))      return 'Password must contain at least one letter.';
  if (!/\d/.test(pw))             return 'Password must contain at least one number.';
  if (!/[^a-zA-Z0-9]/.test(pw))  return 'Password must contain at least one special character (e.g. @, #, !).';
  return null;
}

/* ── Privacy Policy Modal ── */
function PrivacyModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f2034', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
        maxWidth: 560, width: '100%', maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Privacy Policy</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>CommUnity Official Portal — Effective March 2025</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '20px 24px', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
          {[
            { title: '1. Information We Collect', body: 'We collect the information you provide during registration: your full name, email address, barangay assignment, official position, and a photo of your government-issued ID. This information is used solely to verify your identity as a barangay official.' },
            { title: '2. Use of Your Information', body: 'Your personal information is used to: create and manage your official account, verify your identity and position, facilitate communication regarding your account status, and allow you to manage barangay reports and resident concerns through the portal.' },
            { title: '3. Government ID Confidentiality', body: 'The government ID you upload is used exclusively for identity verification purposes. It is stored securely and will never be shared with third parties or displayed publicly. Only authorized administrators may access it during the verification process.' },
            { title: '4. Data Security', body: 'We implement appropriate security measures to protect your personal data against unauthorized access, alteration, or disclosure. Access to the portal is restricted to verified barangay officials and authorized system administrators.' },
            { title: '5. Data Retention', body: 'Your account data is retained for as long as your account is active. Upon account deletion or deactivation, your personal information will be securely removed from our systems in accordance with applicable data protection regulations.' },
            { title: '6. Your Rights', body: 'You have the right to access, correct, or request deletion of your personal data at any time by contacting your system administrator. You also have the right to withdraw consent, subject to applicable legal obligations.' },
            { title: '7. Contact Us', body: 'For questions or concerns about this Privacy Policy or how your data is handled, please contact your local barangay administrator or the CommUnity system support team.' },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: 5 }}>{s.title}</div>
              <div>{s.body}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '11px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

/* ── Resend OTP countdown hook ── */
function useResendCountdown(initial = 60) {
  const [secs, setSecs] = useState(initial);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const start = () => {
    setSecs(initial);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecs(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => { start(); return () => clearInterval(timerRef.current); }, []);

  return { secs, canResend, restart: start };
}

function Signup() {
  const [form, setForm] = useState({
    fullName: '', barangay: '', position: '', email: '', password: '', confirmPassword: '',
  });
  const [idFile,         setIdFile]         = useState(null);
  const [idPreview,      setIdPreview]      = useState(null);
  const [takenRoles,     setTakenRoles]     = useState([]);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [step,           setStep]           = useState('form');
  const [otp,            setOtp]            = useState('');
  const [pendingUserId,  setPendingUserId]  = useState(null);
  const [showPass,       setShowPass]       = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy,    setShowPrivacy]    = useState(false);
  const [resendMsg,      setResendMsg]      = useState('');
  const [resendLoading,  setResendLoading]  = useState(false);

  React.useEffect(() => {
    if (!form.barangay) { setTakenRoles([]); return; }
    supabase.from('officials')
      .select('position')
      .eq('barangay', form.barangay)
      .in('status', ['pending', 'approved'])
      .then(({ data }) => {
        const taken = (data || []).map(r => r.position).filter(Boolean);
        setTakenRoles(taken);
        if (taken.includes(form.position)) setForm(f => ({ ...f, position: '' }));
      });
  }, [form.barangay]);

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleIdFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, etc.)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5MB.'); return; }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setError('');
  };

  const uploadId = async (userId) => {
    if (!idFile) return null;
    const ext = idFile.name.split('.').pop();
    const path = `official-ids/${userId}.${ext}`;
    const { error } = await supabase.storage.from('proof-images').upload(path, idFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('proof-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim())    { setError('Full name is required.'); return; }
    if (!form.barangay)           { setError('Please select your barangay.'); return; }
    if (!form.position)           { setError('Please select your position.'); return; }
    if (!idFile)                  { setError('Please upload a photo of your government ID.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    const pwErr = validatePassword(form.password);
    if (pwErr) { setError(pwErr); return; }
    if (!privacyAccepted) { setError('You must agree to the Privacy Policy to continue.'); return; }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password });
    if (authError) { setLoading(false); setError(authError.message); return; }

    const idImageUrl = await uploadId(data.user.id);

    if (data.session) {
      const { error: dbError } = await supabase.from('officials').insert({
        auth_id: data.user.id,
        barangay_name: form.barangay,
        barangay: form.barangay,
        email: form.email.trim().toLowerCase(),
        full_name: form.fullName.trim(),
        position: form.position,
        id_image_url: idImageUrl,
        status: 'pending',
      });
      setLoading(false);
      if (dbError) { setError('Failed to save your details. Please contact admin.'); return; }
      await supabase.auth.signOut();
      setStep('done');
    } else {
      setPendingUserId(data.user.id);
      setLoading(false);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: form.email.trim(), token: otp.trim(), type: 'signup' });
    if (verifyError) { setLoading(false); setError('Invalid or expired code. Please try again.'); return; }

    const idImageUrl = await uploadId(pendingUserId);

    const { error: dbError } = await supabase.from('officials').insert({
      auth_id: pendingUserId,
      barangay_name: form.barangay,
      barangay: form.barangay,
      email: form.email.trim().toLowerCase(),
      full_name: form.fullName.trim(),
      position: form.position,
      id_image_url: idImageUrl,
      status: 'pending',
    });
    setLoading(false);
    if (dbError) { setError('Confirmed but failed to save. Error: ' + dbError.message); return; }
    await supabase.auth.signOut();
    setStep('done');
  };

  /* ── OTP SCREEN ── */
  if (step === 'otp') return (
    <OtpScreen
      email={form.email}
      otp={otp} setOtp={setOtp}
      error={error} setError={setError}
      loading={loading}
      onSubmit={handleVerifyOtp}
      resendLoading={resendLoading}
      resendMsg={resendMsg}
      onResend={async (restart) => {
        setResendMsg('');
        setResendLoading(true);
        const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: form.email.trim() });
        setResendLoading(false);
        if (resendError) {
          setResendMsg('Could not resend. Please wait and try again.');
        } else {
          setResendMsg('A new code has been sent to your email.');
          restart();
        }
      }}
    />
  );

  /* ── SUCCESS SCREEN ── */
  if (step === 'done') return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-overview">
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2>You're Almost There!</h2>
            <p>
              Your registration has been submitted for <strong style={{ color: '#a7d4ff' }}>Barangay {form.barangay}</strong>.
              The admin will review your ID and approve your account shortly.
            </p>
            <ul className="auth-checklist">
              <li>✔ Email confirmed</li>
              <li>✔ ID submitted for verification</li>
              <li>⏳ Waiting for admin review</li>
              <li>🔓 Access granted after approval</li>
            </ul>
          </div>
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
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 18px', margin: '16px 0 22px' }}>
              {[
                { color: '#34d399', text: 'Email confirmed ✓' },
                { color: '#34d399', text: 'Government ID submitted ✓' },
                { color: '#fbbf24', text: 'Waiting for admin review' },
                { color: 'rgba(255,255,255,0.3)', text: 'Access granted after approval' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: x.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{x.text}</span>
                </div>
              ))}
            </div>
            <a href="/login"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#173d63', color: '#fff', padding: '14px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', fontFamily: 'inherit', transition: 'background 0.2s' }}
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
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
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

              {/* Full Name */}
              <label>Full Name</label>
              <input
                type="text" name="fullName" placeholder="e.g. Juan Dela Cruz"
                value={form.fullName} onChange={handleChange} required
              />

              {/* Barangay + Position row */}
              <div className="auth-name-row">
                <div style={{ flex: 1 }}>
                  <label>Barangay</label>
                  <select name="barangay" value={form.barangay} onChange={handleChange} required>
                    <option value="" disabled>Select barangay</option>
                    {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Position / Role</label>
                  <select name="position" value={form.position} onChange={handleChange} required>
                    <option value="" disabled>{form.barangay ? 'Select position' : 'Select barangay first'}</option>
                    {POSITIONS.filter(p => !takenRoles.includes(p)).map(p => <option key={p} value={p}>{p}</option>)}
                    {takenRoles.filter(p => POSITIONS.includes(p)).map(p => <option key={p} value={p} disabled>({p} — already taken)</option>)}
                  </select>
                </div>
              </div>

              {/* Email */}
              <label>Email Address</label>
              <input
                type="email" name="email" placeholder="Enter your email"
                value={form.email} onChange={handleChange} required
              />

              {/* Passwords */}
              <div className="auth-name-row">
                <div style={{ flex: 1 }}>
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} name="password"
                      placeholder="Min. 8 chars, letter+number+symbol" value={form.password}
                      onChange={handleChange} required style={{ paddingRight: 40, marginBottom: 0 }}
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
                      onChange={handleChange} required style={{ paddingRight: 40, marginBottom: 0 }}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8ba6c9', display: 'flex', padding: 4 }}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Government ID Upload */}
              <label>Government ID <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(Barangay ID, PhilSys, Driver's License, etc.)</span></label>
              <div
                onClick={() => document.getElementById('id-upload').click()}
                style={{
                  border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 10,
                  padding: idPreview ? 8 : '18px 12px',
                  cursor: 'pointer', textAlign: 'center', marginBottom: 12,
                  background: 'rgba(255,255,255,0.04)', transition: 'border 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.6)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              >
                {idPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={idPreview} alt="ID preview" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, objectFit: 'contain' }} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Click to change</div>
                  </div>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                      <rect x="3" y="4" width="18" height="14" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><circle cx="12" cy="11" r="2"/><path d="M7 18c0-2.2 2.2-4 5-4s5 1.8 5 4"/>
                    </svg>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Click to upload your government ID</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>JPG, PNG — max 5MB</div>
                  </>
                )}
              </div>
              <input id="id-upload" type="file" accept="image/*" onChange={handleIdFile} style={{ display: 'none' }} />

              {/* ID confidentiality note */}
              <div style={{ display: 'flex', gap: 8, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Your ID will only be used to verify your identity as a barangay official. It will not be shared publicly.
              </div>

              {/* Privacy Policy checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  style={{ marginTop: 2, width: 15, height: 15, accentColor: '#2563eb', flexShrink: 0, cursor: 'pointer' }}
                />
                <span>
                  I have read and agree to the{' '}
                  <button type="button" onClick={() => setShowPrivacy(true)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer', fontSize: 12.5, padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                    Privacy Policy
                  </button>
                  {' '}and understand that my information will be used solely for identity verification as a barangay official.
                </span>
              </label>

              <button type="submit" disabled={loading || !privacyAccepted}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, opacity: (!privacyAccepted && !loading) ? 0.5 : 1, cursor: (!privacyAccepted && !loading) ? 'not-allowed' : 'pointer' }}>
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

          {/* RIGHT — info panel aligned with form title */}
          <div className="auth-overview auth-overview--right" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {/* Spacer to align with form title (step bar + subtitle height) */}
            <div style={{ height: 72 }} />
            <h2 style={{ marginBottom: 10 }}>Join CommUnity Today</h2>
            <p style={{ marginBottom: 20 }}>
              Register your barangay and start managing community reports,
              document requests, and residents — all in one place.
            </p>
            <ul className="auth-checklist" style={{ marginBottom: 24 }}>
              <li>✔ Fill out the registration form</li>
              <li>✔ Upload a valid government ID</li>
              <li>✔ Verify your email address</li>
              <li>⏳ Wait for admin approval</li>
              <li>🔓 Access the barangay portal</li>
            </ul>

            {/* What you can do section */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Once approved, you can</div>
              {[
                { icon: '📋', text: 'Manage and resolve resident reports' },
                { icon: '📄', text: 'Process document requests' },
                { icon: '🏆', text: 'Award points to active residents' },
                { icon: '📢', text: 'Post barangay announcements' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.35)',
              borderRadius: 999, padding: '6px 14px', alignSelf: 'flex-start',
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

/* ── OTP Screen Component ── */
function OtpScreen({ email, otp, setOtp, error, setError, loading, onSubmit, onResend, resendMsg, resendLoading }) {
  const { secs, canResend, restart } = useResendCountdown(60);
  const IMG = process.env.PUBLIC_URL + '/images';

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-overview">
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <h2>Check Your Inbox</h2>
            <p>We sent a 6-digit verification code to <strong style={{ color: '#a7d4ff' }}>{email}</strong>. Enter it below to confirm your email address.</p>
            <ul className="auth-checklist">
              <li>✔ Check your spam or junk folder</li>
              <li>✔ Code expires in 10 minutes</li>
              <li>✔ One step closer to joining CommUnity</li>
            </ul>
          </div>
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
            <p className="auth-sub">Enter the 6-digit code sent to <strong style={{ color: '#a7d4ff' }}>{email}</strong></p>

            {error && (
              <div style={{ display: 'flex', gap: 9, background: 'rgba(220,38,38,0.12)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {resendMsg && (
              <div style={{ display: 'flex', gap: 9, background: resendMsg.includes('sent') ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', color: resendMsg.includes('sent') ? '#6ee7b7' : '#fcd34d', border: `1px solid ${resendMsg.includes('sent') ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}`, borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 13, fontWeight: 500 }}>
                {resendMsg.includes('sent')
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
                {resendMsg}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <label>Verification Code</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                placeholder="0  0  0  0  0  0"
                value={otp} onChange={e => { setOtp(e.target.value); setError(''); }}
                style={{ fontSize: 22, textAlign: 'center', letterSpacing: '12px', fontWeight: 700 }}
              />

              <button type="submit" disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Verifying…</>
                  : 'VERIFY EMAIL'
                }
              </button>

              {/* Resend section */}
              <div style={{ textAlign: 'center' }}>
                {canResend ? (
                  <button type="button" onClick={() => onResend(restart)} disabled={resendLoading}
                    style={{ background: 'none', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 8, color: '#60a5fa', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '8px 20px', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7, opacity: resendLoading ? 0.6 : 1 }}>
                    {resendLoading
                      ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(96,165,250,0.35)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Sending…</>
                      : <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                          Resend Code
                        </>
                    }
                  </button>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Didn't receive it?{' '}
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                      Resend in {secs}s
                    </span>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
