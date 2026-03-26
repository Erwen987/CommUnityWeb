import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import NotificationDropdown from './NotificationDropdown';

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

const TYPE_CFG = {
  user:    { label: 'Resident', color: '#0369a1', bg: '#e0f2fe', icon: '👤' },
  report:  { label: 'Report',   color: '#b45309', bg: '#fef3c7', icon: '📋' },
  request: { label: 'Request',  color: '#7c3aed', bg: '#ede9fe', icon: '📄' },
};

function AdminTopbar() {
  const [profile, setProfile]   = useState(null);
  const [query,   setQuery]     = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [open,    setOpen]      = useState(false);
  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const dropRef    = useRef(null);
  const timerRef   = useRef(null);

  /* ── Profile ── */
  useEffect(() => {
    let userId = null;
    const cached = sessionStorage.getItem('admin_profile');
    if (cached) { try { setProfile(JSON.parse(cached)); } catch {} }

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      const { data } = await supabase
        .from('admins')
        .select('full_name, email, avatar_url')
        .eq('auth_id', user.id)
        .maybeSingle();
      const p = data ? { ...data, auth_email: user.email } : { auth_email: user.email };
      setProfile(p);
      sessionStorage.setItem('admin_profile', JSON.stringify(p));
    };
    load();

    const channel = supabase
      .channel('admin-topbar-profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admins' }, payload => {
        if (payload.new && userId && payload.new.auth_id === userId) {
          setProfile(prev => {
            const updated = prev ? { ...prev, ...payload.new } : payload.new;
            sessionStorage.setItem('admin_profile', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Search ── */
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const term = q.trim().toLowerCase();

    const [
      { data: users    = [] },
      { data: reports  = [] },
      { data: requests = [] },
    ] = await Promise.all([
      supabase.from('users')
        .select('id, first_name, last_name, email, barangay')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(4),
      supabase.from('reports')
        .select('id, problem, barangay, status')
        .or(`problem.ilike.%${term}%,barangay.ilike.%${term}%`)
        .limit(4),
      supabase.from('requests')
        .select('id, document_type, barangay, status')
        .or(`document_type.ilike.%${term}%,barangay.ilike.%${term}%`)
        .limit(4),
    ]);

    const grouped = [
      ...users.map(u => ({
        type: 'user',
        id: u.id,
        title: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        sub: u.barangay ? `Barangay ${u.barangay}` : u.email,
        route: '/admin/user-management',
      })),
      ...reports.map(r => ({
        type: 'report',
        id: r.id,
        title: r.problem || 'Report',
        sub: r.barangay ? `Barangay ${r.barangay} · ${r.status}` : r.status,
        route: '/admin/reports',
      })),
      ...requests.map(r => ({
        type: 'request',
        id: r.id,
        title: r.document_type || 'Request',
        sub: r.barangay ? `Barangay ${r.barangay} · ${r.status}` : r.status,
        route: '/admin/requests',
      })),
    ];

    setResults(grouped);
    setOpen(grouped.length > 0);
    setSearching(false);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (route) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(route);
  };

  const initials  = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (profile?.auth_email || 'AD').slice(0, 2).toUpperCase();
  const avatarSrc = resolveAvatar(profile?.avatar_url);

  return (
    <div className="off-topbar">
      {/* Hamburger */}
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

      {/* Search with dropdown */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <div className="off-search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search residents, reports, requests…"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          <button onClick={() => doSearch(query)}>
            {searching
              ? <div style={{ width: 12, height: 12, border: '2px solid #d1d5db', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            }
          </button>
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
            border: '1px solid #e5e7eb', minWidth: 320, maxWidth: 380,
            zIndex: 9999, overflow: 'hidden',
          }}>
            {results.map((r, i) => {
              const cfg = TYPE_CFG[r.type];
              return (
                <div key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r.route)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: cfg.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15,
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} — click to navigate
            </div>
          </div>
        )}

        {/* No results */}
        {open && query.trim() && !searching && results.length === 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
            border: '1px solid #e5e7eb', minWidth: 280, zIndex: 9999,
            padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>No results for "<strong>{query}</strong>"</div>
          </div>
        )}
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
        <NotificationDropdown userType="admin" />
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
