import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${IMG}/header.png)` }}>

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
          </ul>
        </nav>
      </header>

      <div className="auth-container">
        <div className="auth-card">

          {/* LEFT */}
          <div className="auth-overview">
            <h2>Forgot your password?</h2>
            <p>
              No worries — enter your registered email and we'll send you
              a secure link to reset your password.
            </p>
            <ul className="auth-checklist">
              <li>✔ Check your inbox</li>
              <li>✔ Click the reset link</li>
              <li>✔ Set a new secure password</li>
            </ul>
          </div>

          {/* RIGHT */}
          <div className="auth-form">
            <h2>RESET PASSWORD</h2>

            {sent ? (
              <div>
                <div style={{
                  background: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 20, fontSize: 14, lineHeight: 1.6,
                }}>
                  ✓ Reset link sent! Check your email inbox and follow the link to set a new password.
                  <br />
                  <span style={{ fontSize: 12, color: '#6b7280', marginTop: 6, display: 'block' }}>
                    Didn't receive it? Check your spam folder or try again.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    style={{ background: 'none', border: '1.5px solid #2563eb', color: '#2563eb', borderRadius: 8, padding: '10px', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Send to a different email
                  </button>
                  <Link to="/login" style={{ textAlign: 'center', color: '#6b7280', fontWeight: 600, fontSize: 13 }}>
                    ← Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{
                    background: '#fdecea', color: '#c62828',
                    border: '1px solid #f5c6cb', borderRadius: 8,
                    padding: '10px 14px', marginBottom: 12, fontSize: 14,
                  }}>
                    {error}
                  </div>
                )}
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <p className="auth-switch-text">
                  Remember your password? <Link to="/login">Back to Login</Link>
                </p>
              </form>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

export default ForgotPassword;
