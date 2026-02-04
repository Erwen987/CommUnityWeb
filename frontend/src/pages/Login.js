import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', formData);
    // You can add authentication logic, API calls, etc.
  };

  return (
    <div>
      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="logo">CommUnity.</div>
        <nav>
          <Link to="/">Home</Link>
          <a href="#">About</a>
          <a href="#">Features</a>
          <a href="#">Contact</a>
          <a href="#" className="btn-primary">Get Started</a>
        </nav>
      </header>

      {/* ================= MAIN ================= */}
      <main className="hero">
        {/* Background Illustration */}
        <div className="hero-bg"></div>

        <div className="login-wrapper">
          <div className="login-container">
            {/* LEFT SIDE: OVERVIEW */}
            <div className="login-overview">
              <h2>Welcome to CommUnity</h2>
              <p>
                CommUnity helps residents connect, report issues,
                request services, and build a stronger barangay together.
              </p>

              <ul className="overview-points">
                <li>✔ Report community concerns</li>
                <li>✔ Request barangay services</li>
                <li>✔ Earn rewards for participation</li>
              </ul>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="login-form">
              <h2>WELCOME BACK!</h2>

              <form onSubmit={handleSubmit}>
                <label>Email / Phone Number</label>
                <input 
                  type="text" 
                  name="emailOrPhone"
                  placeholder="Enter your email or phone number"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  required
                />

                <label>Password</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <a href="#" className="forgot-link">Forgot Password?</a>

                <button type="submit">LOGIN</button>

                <p className="signup-text">
                  Don't have an account? <a href="#">Sign up</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;