import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 38, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return (
    <img src={src} alt={name} style={{
      width: size, height: size, borderRadius: '50%',
      objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb',
    }} />
  );
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColors[index % avatarColors.length],
      color: '#fff', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 700,
      fontSize: size * 0.38, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Residents() {
  const { barangay, barangayName, loading: profileLoading } = useOfficialProfile();

  const [residents, setResidents] = useState([]);
  const [fetching,  setFetching]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  const loadResidents = useCallback(async () => {
    if (!barangay) return;
    setFetching(true);
    const { data = [] } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, points, avatar_url, is_banned, ban_reason, created_at')
      .eq('barangay', barangay)
      .eq('role', 'resident')
      .order('first_name', { ascending: true });
    setResidents(data || []);
    setFetching(false);
  }, [barangay]);

  useEffect(() => { loadResidents(); }, [loadResidents]);

  const rows = residents.map((r, i) => ({
    ...r,
    name: `${r.first_name} ${r.last_name}`.trim(),
    index: i,
  }));

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'active' && !r.is_banned) || (filter === 'banned' && r.is_banned);
    return matchSearch && matchFilter;
  });

  const totalCount  = residents.length;
  const activeCount = residents.filter(r => !r.is_banned).length;
  const bannedCount = residents.filter(r =>  r.is_banned).length;

  const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  const FILTERS = [
    { key: 'all',    label: 'All',    count: totalCount  },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'banned', label: 'Banned', count: bannedCount },
  ];

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {/* ── Page header ── */}
          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title">Residents</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {barangayName ? `Barangay ${barangayName}` : 'Your barangay'} · View only — contact admin to ban or unban
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Residents', value: totalCount,  accent: '#2563eb', iconBg: '#eff6ff',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { label: 'Active',          value: activeCount, accent: '#059669', iconBg: '#d1fae5',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
              { label: 'Banned',          value: bannedCount, accent: bannedCount > 0 ? '#dc2626' : '#9ca3af', iconBg: bannedCount > 0 ? '#fee2e2' : '#f3f4f6',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bannedCount > 0 ? '#dc2626' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff', borderRadius: 14,
                padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                display: 'flex', alignItems: 'center', gap: 16,
                borderLeft: `4px solid ${c.accent}`,
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.accent, lineHeight: 1 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Search + filter bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12,
                    fontFamily: 'Poppins, sans-serif', fontWeight: 600, cursor: 'pointer',
                    border: filter === f.key ? 'none' : '1.5px solid #e5e7eb',
                    background: filter === f.key
                      ? f.key === 'banned' ? '#dc2626' : f.key === 'active' ? '#059669' : '#2563eb'
                      : '#fff',
                    color: filter === f.key ? '#fff' : '#6b7280',
                    transition: 'all 0.15s',
                  }}>
                    {f.label}
                    <span style={{
                      marginLeft: 6, padding: '1px 7px', borderRadius: 999,
                      background: filter === f.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                      color: filter === f.key ? '#fff' : '#9ca3af',
                      fontSize: 11, fontWeight: 800,
                    }}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {fetching || profileLoading ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading residents...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <p style={{ fontWeight: 700, color: '#374151', fontSize: 15 }}>No residents found</p>
                <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>{search ? 'Try a different search term.' : 'No residents have registered yet.'}</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Resident', 'Email', 'Phone', 'Points', 'Status', 'Joined'].map(h => (
                          <th key={h} style={{ padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={r.id}
                          style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#f9fafb'}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <ResidentAvatar url={r.avatar_url} name={r.name} size={38} index={r.index} />
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>Resident</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{r.email}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{r.phone || '—'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 14 }}>{r.points ?? 0}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {r.is_banned ? (
                              <div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                                  Banned
                                </span>
                                {r.ban_reason && (
                                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.ban_reason}>
                                    {r.ban_reason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                Active
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 12, color: '#9ca3af' }}>{r.created_at ? fmt(r.created_at) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} of {totalCount} resident{totalCount !== 1 ? 's' : ''}</span>
                  {search && <button onClick={() => setSearch('')} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>Clear search</button>}
                </div>
              </>
            )}
          </div>

          {/* ── Info note if banned residents exist ── */}
          {bannedCount > 0 && (
            <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: '#fef9c3', border: '1px solid #fde047', fontSize: 13, color: '#854d0e', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span><strong>{bannedCount} banned resident{bannedCount !== 1 ? 's' : ''}</strong> in your barangay. Only the system admin can ban or unban residents.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Residents;
