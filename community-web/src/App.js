import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import ProtectedRoute    from './components/ProtectedRoute';
import Login             from './pages/Login';
import Signup            from './pages/Signup';
import ForgotPassword    from './pages/ForgotPassword';
import ResetPassword     from './pages/ResetPassword';

import Dashboard   from './pages/officials/Dashboard';
import Reports     from './pages/officials/Reports';
import Requests    from './pages/officials/Requests';
import Analytics   from './pages/officials/Analytics';
import Rewards     from './pages/officials/Rewards';
import Residents   from './pages/officials/Residents';
import OfficialProfile from './pages/officials/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminReports   from './pages/admin/AdminReports';
import AdminRequests  from './pages/admin/AdminRequests';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminRewards   from './pages/admin/AdminRewards';
import AdminSettings  from './pages/admin/AdminSettings';
import AdminPortal    from './pages/admin/AdminPortal';
import AdminProfile   from './pages/admin/AdminProfile';

const IMG = process.env.PUBLIC_URL + '/images';

function Landing() {
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > 300);
      document.querySelectorAll('.fade-element').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('fade-in');
      });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const closeMenu   = () => setMenuOpen(false);

  const navLinks = [
    { href: '#home',        label: 'Home'        },
    { href: '#about',       label: 'About'       },
    { href: '#features',    label: 'Features'    },
    { href: '#contact',     label: 'Contact'     },
    { href: '#get-started', label: 'Get Started' },
  ];

  return (
    <div>

      {/* ── MOBILE FULL-SCREEN MENU ── */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>

        {/* Top bar: logo + close */}
        <div className="mobile-menu-topbar">
          <div className="mobile-menu-logo">
            <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
            <span>CommUnity</span>
          </div>
          <button className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Badge */}
        <div className="mobile-menu-badge">
          <span className="mobile-menu-dot" />
          Barangay Management System
        </div>

        {/* Nav links */}
        <nav className="mobile-menu-nav">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={closeMenu}
              className={l.label === 'Get Started' ? 'mobile-menu-cta' : ''}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="mobile-menu-footer">© {new Date().getFullYear()} CommUnity. All rights reserved.</div>
      </div>

      {/* ── STICKY NAVBAR ── */}
      <header className={`landing-header${navScrolled ? ' landing-header--scrolled' : ''}`}>
        <nav>
          <a href="#home" className="logo" onClick={e => { e.preventDefault(); scrollToTop(); }}>
            <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
            <span className="logo-text">CommUnity</span>
          </a>

          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#get-started" className="btn-get-started">Get Started</a></li>
          </ul>

          <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </nav>
      </header>

      {/* ── SCROLL TO TOP FAB ── */}
      {showScrollTop && (
        <button className="scroll-top-fab" onClick={scrollToTop} aria-label="Scroll to top">↑</button>
      )}

      {/* ── HERO ── */}
      <div className="hero-wrapper" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
        <div className="hero-overlay" />
        <div style={{ height: 80 }} />
        <section id="home" className="hero-section">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Barangay Management System
          </div>
          <h1>CommUnity:<br />Report, Request,<br className="hero-br" /> Reward</h1>
          <p>Make your barangay better — together.</p>
          <div className="hero-actions">
            <a href="#get-started" className="hero-btn-primary">Get Started →</a>
            <a href="#about" className="hero-btn-secondary">Learn More</a>
          </div>
        </section>
      </div>

      {/* ── ABOUT ── */}
      <div className="section fade-element" id="about">
        <div className="section-label">About</div>
        <h2 className="section-title">How CommUnity Works</h2>
        <p className="section-sub">Explore the powerful features of CommUnity</p>
        <div className="about-layout">
          <div className="about-image">
            <img src={`${IMG}/features/how community works.png`} alt="How CommUnity Works" />
          </div>
          <div className="about-text">
            <h3>A Platform Built for Your Barangay</h3>
            <p>
              <span className="highlight">CommUnity</span> is a platform designed to help neighborhoods and communities thrive.
              Residents can report issues, request services, and earn rewards,
              fostering a safer and more connected barangay.
            </p>
          </div>
        </div>
      </div>

      {/* ── WHO CAN USE ── */}
      <div className="who-section fade-element">
        <div className="section-label">Users</div>
        <h2 className="section-title">Who Can Use It?</h2>
        <p className="section-sub">CommUnity is built for everyone in the barangay</p>
        <div className="card-row">
          <div className="who-card">
            <div className="who-card-img-wrap">
              <img src={`${IMG}/features/whocanuseit_residents.png`} alt="Residents" />
            </div>
            <h3>Residents</h3>
            <p>Report community issues, request barangay services, and earn rewards for active participation.</p>
          </div>
          <div className="who-card">
            <div className="who-card-img-wrap">
              <img src={`${IMG}/features/whocanuseit_barangayofficials.png`} alt="Barangay Officials" />
            </div>
            <h3>Barangay Officials</h3>
            <p>Manage reports, process document requests, and efficiently serve your community members.</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="section fade-element" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">What Can You Do?</h2>
        <p className="section-sub">Everything you need to report, track, and improve your community</p>
        <div className="card-grid">
          <div className="feature-card">
            <div className="feature-card-icon">
              <img src={`${IMG}/features/features-reports.png`} alt="Report Issues" />
            </div>
            <h3>Report Issues</h3>
            <p>Easily report community problems like broken streetlights, potholes, and illegal dumping.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <img src={`${IMG}/features/features-request.png`} alt="Request Assistance" />
            </div>
            <h3>Request Assistance</h3>
            <p>Request barangay documents and services directly from your phone — fast and hassle-free.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <img src={`${IMG}/features/features-rewards.png`} alt="Earn Rewards" />
            </div>
            <h3>Earn Rewards</h3>
            <p>Earn points for active participation and redeem them for exciting rewards from the barangay.</p>
          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <div className="contact-section fade-element" id="contact">
        <div className="section-label">Contact</div>
        <h2 className="section-title">Get In Touch</h2>
        <p className="section-sub">We'd love to hear from you</p>
        <div className="contact-layout">
          <div className="contact-image">
            <img src={`${IMG}/features/contactus.png`} alt="Contact Us" />
          </div>
          <div className="contact-form">
            <form>
              <label htmlFor="barangay">Barangay Name</label>
              <input type="text" id="barangay" placeholder="Enter your barangay name" required />
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="Enter your email" required />
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Write your message here..." required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </div>

      {/* ── FOOTER / GET STARTED ── */}
      <footer id="get-started" className="footer fade-element"
        style={{ backgroundImage: `url(${IMG}/footer.png)` }}>
        <div className="footer-overlay" />
        <div className="footer-content">
          <div className="footer-badge">Join CommUnity Today</div>
          <h2>Get Started</h2>
          <p>Join and be part of building a better community.</p>
          <div className="footer-buttons">
            <a href="/login"  className="footer-btn btn-login">Login</a>
            <a href="/signup" className="footer-btn btn-signup">Sign Up</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/admin-portal"    element={<AdminPortal />} />

        <Route path="/officials/dashboard" element={<ProtectedRoute role="official"><Dashboard /></ProtectedRoute>} />
        <Route path="/officials/reports"   element={<ProtectedRoute role="official"><Reports /></ProtectedRoute>} />
        <Route path="/officials/requests"  element={<ProtectedRoute role="official"><Requests /></ProtectedRoute>} />
        <Route path="/officials/analytics" element={<ProtectedRoute role="official"><Analytics /></ProtectedRoute>} />
        <Route path="/officials/rewards"   element={<ProtectedRoute role="official"><Rewards /></ProtectedRoute>} />
        <Route path="/officials/residents" element={<ProtectedRoute role="official"><Residents /></ProtectedRoute>} />
        <Route path="/officials/profile"   element={<ProtectedRoute role="official"><OfficialProfile /></ProtectedRoute>} />

        <Route path="/admin/dashboard"       element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/user-management" element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/reports"         element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/requests"        element={<ProtectedRoute role="admin"><AdminRequests /></ProtectedRoute>} />
        <Route path="/admin/analytics"       element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/rewards"         element={<ProtectedRoute role="admin"><AdminRewards /></ProtectedRoute>} />
        <Route path="/admin/settings"        element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/profile"         element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
