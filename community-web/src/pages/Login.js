import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const IMG = process.env.PUBLIC_URL + '/images';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    // Supabase auth will go here
  };

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
              <label>Email / Phone Number</label>
              <input
                type="text"
                name="email"
                placeholder="Enter your email or phone number"
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
              <Link to="/forgot-password" className="auth-forgot">Forgot Password?</Link>
              <button type="submit">LOGIN</button>
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
