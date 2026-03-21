import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function AdminTopbar() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let userId = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      const { data } = await supabase
        .from('admins')
        .select('full_name, email, avatar_url')
        .eq('auth_id', user.id)
        .maybeSingle();
      setProfile(data ? { ...data, auth_email: user.email } : { auth_email: user.email });
    };

    load();

    const channel = supabase
      .channel('admin-topbar-profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admins' }, payload => {
        if (payload.new && userId && payload.new.auth_id === userId) {
          setProfile(prev => prev ? { ...prev, ...payload.new } : payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (profile?.auth_email || 'AD').slice(0, 2).toUpperCase();

  const avatarSrc = resolveAvatar(profile?.avatar_url);

  return (
    <div className="off-topbar">
      {/* Hamburger — visible on mobile only (CSS controls display) */}
      <button
        className="off-hamburger"
        onClick={() => document.body.classList.toggle('sidebar-open')}
        aria-label="Toggle menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="off-search">
        <input type="text" placeholder="Search..." />
        <button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

      <div className="off-topbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontSize: '13px', fontWeight: '600', color: '#1e3a5f',
            background: '#e0e7ef', padding: '4px 12px', borderRadius: '999px',
            whiteSpace: 'nowrap',
          }}>
            {profile?.full_name || 'System Admin'}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: '700', color: '#fff',
            background: '#2563eb', padding: '3px 8px', borderRadius: '999px',
            letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            Admin
          </span>
        </div>
        <button className="off-notif">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <div
          className="off-avatar"
          onClick={() => navigate('/admin/profile')}
          title={avatarSrc ? (profile?.full_name || 'My Profile') : 'Click to set your avatar'}
          style={{ cursor: 'pointer', position: 'relative', transition: 'opacity 0.15s' }}
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

export default AdminTopbar;
