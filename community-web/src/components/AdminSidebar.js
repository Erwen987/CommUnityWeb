import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineDocumentText,
  HiOutlineClipboardList, HiOutlineChartBar, HiOutlineGift,
  HiOutlineCog, HiOutlineLogout
} from 'react-icons/hi';

const IMG = process.env.PUBLIC_URL + '/images';

const NAV = [
  { to: '/admin/dashboard',       icon: HiOutlineHome,          label: 'Home'            },
  { to: '/admin/user-management', icon: HiOutlineUserGroup,      label: 'User Management' },
  { to: '/admin/reports',         icon: HiOutlineDocumentText,   label: 'Reports'         },
  { to: '/admin/requests',        icon: HiOutlineClipboardList,  label: 'Requests'        },
  { to: '/admin/analytics',       icon: HiOutlineChartBar,       label: 'Analytics'       },
  { to: '/admin/rewards',         icon: HiOutlineGift,           label: 'Reward'          },
];

function AdminSidebar() {
  const navigate = useNavigate();
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
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `off-logout-settings${isActive ? ' active' : ''}`}
        >
          <HiOutlineCog className="off-nav-icon" />
          <span>Settings</span>
        </NavLink>
        <button onClick={() => navigate('/login')}>
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
