import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import './App.css';
import ProtectedRoute    from './components/ProtectedRoute';
import useSessionTimeout from './hooks/useSessionTimeout';
import Login             from './pages/Login';
import Signup            from './pages/Signup';
import ForgotPassword    from './pages/ForgotPassword';
import ResetPassword     from './pages/ResetPassword';
import Dashboard         from './pages/officials/Dashboard';
import Reports           from './pages/officials/Reports';
import Requests          from './pages/officials/Requests';
import Analytics         from './pages/officials/Analytics';
import Rewards           from './pages/officials/Rewards';
import Residents         from './pages/officials/Residents';
import OfficialProfile   from './pages/officials/Profile';
import AdminDashboard    from './pages/admin/AdminDashboard';
import UserManagement    from './pages/admin/UserManagement';
import AdminReports      from './pages/admin/AdminReports';
import AdminRequests     from './pages/admin/AdminRequests';
import AdminAnalytics    from './pages/admin/AdminAnalytics';
import AdminRewards      from './pages/admin/AdminRewards';
import AdminSettings     from './pages/admin/AdminSettings';
import AdminPortal       from './pages/admin/AdminPortal';
import AdminProfile      from './pages/admin/AdminProfile';

// ── EmailJS contact form ──────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_0pp2139';
const EMAILJS_CONTACT_TPL = 'template_contact';   // create this template in EmailJS
const EMAILJS_PUBLIC_KEY  = 'MYsqjprp39Rb43jVR';

// ── Session Timeout Warning Modal ─────────────────────────────────────────────
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/admin-portal'];

function SessionGuard() {
  const location = useLocation();
  const isProtected = !PUBLIC_PATHS.includes(location.pathname);
  const { showWarning, secondsLeft, resetTimer } = useSessionTimeout(isProtected);

  if (!showWarning) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:420, maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'28px 28px 20px', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef3c7', border:'2px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontWeight:800, fontSize:18, color:'#111827', marginBottom:8, fontFamily:'Poppins,sans-serif' }}>Session Expiring Soon</div>
          <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, fontFamily:'Poppins,sans-serif' }}>
            You have been inactive for a while. Your session will expire in
          </p>
          <div style={{ fontSize:40, fontWeight:900, color: secondsLeft <= 10 ? '#dc2626' : '#d97706', margin:'10px 0', fontFamily:'Poppins,sans-serif', transition:'color 0.3s' }}>
            {secondsLeft}s
          </div>
          <p style={{ fontSize:13, color:'#9ca3af', fontFamily:'Poppins,sans-serif' }}>Click "Stay Logged In" to continue your session.</p>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'#f1f5f9', margin:'0 28px' }} />

        {/* Buttons */}
        <div style={{ padding:'20px 28px', display:'flex', gap:10 }}>
          <button
            onClick={resetTimer}
            style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:'#2563eb', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            Stay Logged In
          </button>
          <button
            onClick={async () => { await Swal.fire({ icon:'info', title:'Logging out…', timer:800, showConfirmButton:false }); window.location.href='/login'; }}
            style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            Log Out Now
          </button>
        </div>

      </div>
    </div>
  );
}

const IMG = process.env.PUBLIC_URL + '/images';

function Landing() {
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [contact, setContact]             = useState({ barangay: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactChange = e => setContact({ ...contact, [e.target.id]: e.target.value });

  const handleContactSubmit = async e => {
    e.preventDefault();
    if (!contact.barangay.trim() || !contact.email.trim() || !contact.message.trim()) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Form', text: 'Please fill in all fields before sending.', confirmButtonColor: '#2563eb' });
      return;
    }
    setContactLoading(true);
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_CONTACT_TPL,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            barangay: contact.barangay,
            from_email: contact.email,
            message: contact.message,
          },
        }),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Message Sent!', text: 'Thank you for reaching out. We will get back to you shortly.', confirmButtonColor: '#2563eb' });
        setContact({ barangay: '', email: '', message: '' });
      } else {
        throw new Error('send failed');
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to Send', text: 'Something went wrong. Please try again later.', confirmButtonColor: '#2563eb' });
    } finally {
      setContactLoading(false);
    }
  };

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
            <form onSubmit={handleContactSubmit}>
              <label htmlFor="barangay">Barangay Name</label>
              <input type="text" id="barangay" placeholder="Enter your barangay name" value={contact.barangay} onChange={handleContactChange} required />
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="Enter your email" value={contact.email} onChange={handleContactChange} required />
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Write your message here..." value={contact.message} onChange={handleContactChange} required />
              <button type="submit" disabled={contactLoading} style={{ opacity: contactLoading ? 0.7 : 1, cursor: contactLoading ? 'not-allowed' : 'pointer' }}>
                {contactLoading ? 'Sending…' : 'Send Message'}
              </button>
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
      <SessionGuard />
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
