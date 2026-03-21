import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineGift, HiOutlineLogout, HiOutlineUserGroup, HiOutlineUser } from 'react-icons/hi';
import { supabase } from '../supabaseClient';

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

function OfficialSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
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
            className={({ isActive }) => `off-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="off-nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="off-logout">
        <button onClick={handleLogout}>
          <HiOutlineLogout className="off-nav-icon" />
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default OfficialSidebar;
