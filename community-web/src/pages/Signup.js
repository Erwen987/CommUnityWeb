import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const IMG = process.env.PUBLIC_URL + '/images';

const BARANGAYS = [
  'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
  'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
];

function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', barangay: '',
    email: '', password: '', confirmPassword: '',
  });

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
        <div className="auth-card auth-card--signup">

          {/* LEFT — signup form */}
          <div className="auth-form auth-form--left">
            <h2>Create an Account</h2>
            <p className="auth-sub">Join your community today!</p>
            <form onSubmit={handleSubmit}>
              <label>Name</label>
              <div className="auth-name-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>Barangay</label>
              <select name="barangay" value={form.barangay} onChange={handleChange} required>
                <option value="" disabled>Select your barangay</option>
                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
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
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button type="submit">SIGN UP</button>
              <p className="auth-switch-text">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </form>
          </div>

          {/* RIGHT — info panel */}
          <div className="auth-overview auth-overview--right">
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

        </div>
      </div>

    </div>
  );
}

export default Signup;
