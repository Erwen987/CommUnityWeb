import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IMG = process.env.PUBLIC_URL + '/images';

const BARANGAYS = [
  'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
  'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
];

function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', barangay: '',
    email: '', password: '', confirmPassword: '',
  });

  const switchTo = (newMode) => {
    setMode(newMode);
    navigate(`/${newMode}`, { replace: true });
  };

  const handleLoginChange = e => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleSignupChange = e => setSignupForm({ ...signupForm, [e.target.name]: e.target.value });

  const handleLoginSubmit = e => {
    e.preventDefault();
    // Supabase auth will go here
  };

  const handleSignupSubmit = e => {
    e.preventDefault();
    // Supabase auth will go here
  };

  const isSignup = mode === 'signup';

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

      {/* AUTH CARD */}
      <div className="auth-container">
        <div className={`auth-card${isSignup ? ' auth-signup-mode' : ''}`}>

          {/* LOGIN FORM — right side in login mode */}
          <div className="auth-panel auth-panel-login">
            <h2 className="auth-panel-title">WELCOME BACK!</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="auth-field">
                <label>Email / Phone Number</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your email or phone number"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <span className="auth-forgot">Forgot Password?</span>
              <button type="submit" className="auth-btn">LOGIN</button>
              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => switchTo('signup')}>
                  Sign up
                </button>
              </p>
            </form>
          </div>

          {/* SIGNUP FORM — left side in signup mode */}
          <div className="auth-panel auth-panel-signup">
            <h2 className="auth-panel-title">Create an Account</h2>
            <p className="auth-form-sub">Join your community today!</p>
            <form onSubmit={handleSignupSubmit}>
              <div className="auth-field">
                <label>Name</label>
                <div className="auth-name-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={signupForm.firstName}
                    onChange={handleSignupChange}
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={signupForm.lastName}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Barangay</label>
                <select name="barangay" value={signupForm.barangay} onChange={handleSignupChange} required>
                  <option value="" disabled>Select your barangay</option>
                  {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="auth-field">
                <label>Email / Phone Number</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Enter your email or phone number"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              <button type="submit" className="auth-btn">SIGN UP</button>
              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" className="auth-switch-btn" onClick={() => switchTo('login')}>
                  Log in
                </button>
              </p>
            </form>
          </div>

          {/* SLIDING INFO OVERLAY */}
          <div className="auth-overlay">
            <h2>Welcome to CommUnity</h2>
            <p>
              CommUnity helps residents connect, report issues, request services,
              and build a stronger barangay together.
            </p>
            <ul className="auth-checklist">
              <li>✓ Report community concerns</li>
              <li>✓ Request barangay services</li>
              <li>✓ Earn rewards for participation</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Auth;
