import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineDocumentText,
  HiOutlineClipboardList, HiOutlineChartBar, HiOutlineGift,
  HiOutlineCog, HiOutlineLogout, HiOutlineUser
} from 'react-icons/hi';
import { supabase } from '../supabaseClient';

const IMG = process.env.PUBLIC_URL + '/images';

const NAV = [
  { to: '/admin/dashboard',       icon: HiOutlineHome,          label: 'Home'            },
  { to: '/admin/user-management', icon: HiOutlineUserGroup,      label: 'User Management' },
  { to: '/admin/reports',         icon: HiOutlineDocumentText,   label: 'Reports'         },
  { to: '/admin/requests',        icon: HiOutlineClipboardList,  label: 'Requests'        },
  { to: '/admin/analytics',       icon: HiOutlineChartBar,       label: 'Analytics'       },
  { to: '/admin/rewards',         icon: HiOutlineGift,           label: 'Reward'          },
  { to: '/admin/settings',        icon: HiOutlineCog,            label: 'Settings'        },
  { to: '/admin/profile',         icon: HiOutlineUser,           label: 'Profile'         },
];

const closeSidebar = () => document.body.classList.remove('sidebar-open');

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    closeSidebar();
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay — tap to close sidebar */}
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
          <button onClick={handleLogout}>
            <HiOutlineLogout className="off-nav-icon" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
