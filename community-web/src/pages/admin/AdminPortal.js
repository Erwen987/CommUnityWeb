import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminPortal.css';

const IMG = process.env.PUBLIC_URL + '/images';

function AdminPortal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', data.user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. Admin accounts only.');
      setLoading(false);
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
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
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
