import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/officials/Dashboard';
import Reports   from './pages/officials/Reports';
import Requests  from './pages/officials/Requests';
import Analytics from './pages/officials/Analytics';
import Rewards   from './pages/officials/Rewards';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminReports   from './pages/admin/AdminReports';
import AdminRequests  from './pages/admin/AdminRequests';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminRewards   from './pages/admin/AdminRewards';
import AdminSettings  from './pages/admin/AdminSettings';
import AdminPortal    from './pages/admin/AdminPortal';

const IMG = process.env.PUBLIC_URL + '/images';

function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div>

      {/* ── STICKY NAVBAR ── */}
      <header className={`landing-header${navScrolled ? ' landing-header--scrolled' : ''}`}>
        <nav>
          <a
            href="#home"
            className="logo"
            onClick={e => { e.preventDefault(); scrollToTop(); }}
          >
            <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
            <span className="logo-text">CommUnity</span>
          </a>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#get-started">Get Started</a></li>
          </ul>
        </nav>
      </header>

      {/* ── SCROLL TO TOP FAB ── */}
      {showScrollTop && (
        <button className="scroll-top-fab" onClick={scrollToTop} aria-label="Scroll to top">
          ↑
        </button>
      )}

      {/* ── HERO ── */}
      <div className="hero-wrapper" style={{ backgroundImage: `url(${IMG}/header.png)` }}>
        <div style={{ height: 80 }} />
        <section id="home" className="hero-section">
          <h1>CommUnity:<br />Report, Request, Reward</h1>
          <p>Make your barangay better</p>
        </section>
      </div>

      {/* ── ABOUT ── */}
      <div className="section fade-element" id="about">
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
        <h2 className="section-title">Who Can Use It?</h2>
        <p className="section-sub">CommUnity is built for everyone in the barangay</p>
        <div className="card-row">
          <div className="who-card">
            <img src={`${IMG}/features/whocanuseit_residents.png`} alt="Residents" />
            <h3>Residents</h3>
            <p>Report community issues, request barangay services, and earn rewards for active participation.</p>
          </div>
          <div className="who-card">
            <img src={`${IMG}/features/whocanuseit_barangayofficials.png`} alt="Barangay Officials" />
            <h3>Barangay Officials</h3>
            <p>Manage reports, process document requests, and efficiently serve your community members.</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="section fade-element" id="features">
        <h2 className="section-title">Features</h2>
        <p className="section-sub">Everything you need to report, track, and improve your community</p>
        <div className="card-grid">
          <div className="feature-card">
            <img src={`${IMG}/features/features-reports.png`} alt="Report Issues" />
            <h3>Report Issues</h3>
            <p>Easily report community problems like broken streetlights, potholes, and illegal dumping.</p>
          </div>
          <div className="feature-card">
            <img src={`${IMG}/features/features-request.png`} alt="Request Assistance" />
            <h3>Request Assistance</h3>
            <p>Request barangay documents and services directly from your phone — fast and hassle-free.</p>
          </div>
          <div className="feature-card">
            <img src={`${IMG}/features/features-rewards.png`} alt="Earn Rewards" />
            <h3>Earn Rewards</h3>
            <p>Earn points for active participation and redeem them for exciting rewards from the barangay.</p>
          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <div className="contact-section fade-element" id="contact">
        <h2 className="section-title">Contact Us</h2>
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

      {/* ── FOOTER ── */}
      <footer
        id="get-started"
        className="footer fade-element"
        style={{ backgroundImage: `url(${IMG}/footer.png)` }}
      >
        <h2>Get Started</h2>
        <p>Join and be part of building a better community.</p>
        <div className="footer-buttons">
          <a href="/login" className="footer-btn btn-login">Login</a>
          <a href="/signup" className="footer-btn btn-signup">Sign Up</a>
        </div>
      </footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/officials/dashboard" element={<Dashboard />} />
        <Route path="/officials/reports"   element={<Reports />} />
        <Route path="/officials/requests"  element={<Requests />} />
        <Route path="/officials/analytics" element={<Analytics />} />
        <Route path="/officials/rewards"   element={<Rewards />} />

        {/* Admin Portal */}
        <Route path="/admin-portal" element={<AdminPortal />} />

        {/* Admin */}
        <Route path="/admin/dashboard"       element={<AdminDashboard />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/admin/reports"         element={<AdminReports />} />
        <Route path="/admin/requests"        element={<AdminRequests />} />
        <Route path="/admin/analytics"       element={<AdminAnalytics />} />
        <Route path="/admin/rewards"         element={<AdminRewards />} />
        <Route path="/admin/settings"        element={<AdminSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
