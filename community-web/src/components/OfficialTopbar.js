import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOfficialProfile } from '../hooks/useOfficialProfile';

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function OfficialTopbar({ badge = false }) {
  const { barangay, avatarUrl, loading } = useOfficialProfile();
  const navigate = useNavigate();

  const initials = barangay
    ? barangay.replace('Barangay ', '').slice(0, 2).toUpperCase()
    : 'OF';

  const avatarSrc = resolveAvatar(avatarUrl);

  return (
    <div className="off-topbar">
      <div className="off-search">
        <input type="text" placeholder="Search..." />
        <button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
      <div className="off-topbar-actions">
        {!loading && barangay && (
          <span style={{
            fontSize: '13px', fontWeight: '600', color: '#1e3a5f',
            background: '#e0f2fe', padding: '4px 12px', borderRadius: '999px',
          }}>
            {barangay}
          </span>
        )}
        <button className="off-notif">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {badge && <span className="off-notif-badge" />}
        </button>
        <div
          className="off-avatar"
          onClick={() => navigate('/officials/profile')}
          title={avatarSrc ? barangay : 'Click to set your avatar'}
          style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <span>{initials}</span>
          }
        </div>
      </div>
    </div>
  );
}

export default OfficialTopbar;
