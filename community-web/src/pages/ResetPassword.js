import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function ResetPassword() {
  const navigate = useNavigate();
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [ready,       setReady]       = useState(false);
  const [done,        setDone]        = useState(false);

  useEffect(() => {
    // Supabase automatically processes the token in the URL hash on load.
    // Checking for an active session confirms the link is valid.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('This reset link is invalid or has expired. Please request a new one.');
    });
  }, []);

  const handleReset = async e => {
    e.preventDefault();
    setError('');
    if (!newPass)                return setError('Please enter a new password.');
    if (newPass.length < 6)      return setError('Password must be at least 6 characters.');
    if (newPass !== confirmPass)  return setError('Passwords do not match.');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPass });
    if (err) { setLoading(false); setError(err.message); return; }
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => navigate('/login'), 3000);
  };

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
        <div className="auth-card">

          <div className="auth-overview">
            <h2>Set New Password</h2>
            <p>Choose a strong, memorable password that you haven't used before.</p>
            <ul className="auth-checklist">
              <li>✔ At least 6 characters</li>
              <li>✔ Mix letters and numbers</li>
              <li>✔ Keep it private</li>
            </ul>
          </div>

          <div className="auth-form">
            <h2>NEW PASSWORD</h2>

            {done ? (
              <div>
                <div style={{
                  background: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 16, fontSize: 14, lineHeight: 1.6,
                }}>
                  ✓ Password updated successfully! Redirecting to login…
                </div>
              </div>
            ) : !ready && error ? (
              <div>
                <div style={{
                  background: '#fdecea', color: '#c62828',
                  border: '1px solid #f5c6cb', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 16, fontSize: 14,
                }}>
                  {error}
                </div>
                <a href="/forgot-password" style={{ color: '#2563eb', fontWeight: 600, fontSize: 13 }}>
                  Request a new reset link
                </a>
              </div>
            ) : (
              <form onSubmit={handleReset}>
                {error && (
                  <div style={{
                    background: '#fdecea', color: '#c62828',
                    border: '1px solid #f5c6cb', borderRadius: 8,
                    padding: '10px 14px', marginBottom: 12, fontSize: 14,
                  }}>
                    {error}
                  </div>
                )}

                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError(''); }}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>

                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setError(''); }}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>

                <button type="submit" disabled={loading || !ready}>
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

export default ResetPassword;
