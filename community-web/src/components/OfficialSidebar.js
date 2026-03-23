import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineGift, HiOutlineLogout, HiOutlineUserGroup, HiOutlineUser } from 'react-icons/hi';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

const IMG = process.env.PUBLIC_URL + '/images';

const NAV = [
  { to: '/officials/dashboard', icon: HiOutlineHome,          label: 'Home'      },
  { to: '/officials/reports',   icon: HiOutlineDocumentText,   label: 'Reports'   },
  { to: '/officials/requests',  icon: HiOutlineClipboardList,  label: 'Requests'  },
  { to: '/officials/analytics', icon: HiOutlineChartBar,       label: 'Analytics' },
  { to: '/officials/rewards',   icon: HiOutlineGift,           label: 'Rewards'   },
  { to: '/officials/residents', icon: HiOutlineUserGroup,      label: 'Residents' },
  { to: '/officials/profile',   icon: HiOutlineUser,           label: 'Profile'   },
];

const closeSidebar = () => document.body.classList.remove('sidebar-open');

function OfficialSidebar() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    closeSidebar();
    await supabase.auth.signOut();
    await Swal.fire({ icon: 'success', title: 'Logged Out', text: 'You have been successfully logged out.', timer: 1500, showConfirmButton: false, timerProgressBar: true });
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div className="off-sidebar-overlay" onClick={closeSidebar} />

      <aside className="off-sidebar">
        <div className="off-sidebar-logo">
          <img src={`${IMG}/CommUnity Logo.png`} alt="CommUnity" />
          <span>CommUnity</span>
        </div>

        <nav className="off-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) => `off-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="off-nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="off-logout">
          <button onClick={() => setShowConfirm(true)}>
            <HiOutlineLogout className="off-nav-icon" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div style={{ background:'#fff', borderRadius:20, width:400, maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ padding:'28px 28px 20px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'#fef2f2', border:'2px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <HiOutlineLogout style={{ width:28, height:28, color:'#dc2626' }} />
              </div>
              <div style={{ fontWeight:800, fontSize:18, color:'#111827', marginBottom:8 }}>Log Out</div>
              <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>
                Are you sure you want to log out of your account? You will need to sign in again to continue.
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'#f1f5f9', margin:'0 28px' }} />

            {/* Buttons */}
            <div style={{ padding:'20px 28px', display:'flex', gap:10 }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleLogout} disabled={loggingOut}
                style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: loggingOut ? '#fca5a5' : '#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor: loggingOut ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                {loggingOut ? (
                  <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Logging out…</>
                ) : (
                  <><HiOutlineLogout style={{ width:15, height:15 }} />Yes, Log Out</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default OfficialSidebar;
