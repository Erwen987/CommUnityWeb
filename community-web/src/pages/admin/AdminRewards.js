import React, { useState, useEffect } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

const TIERS = [
  { label: 'Gold',   min: 1500, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', shadow: 'rgba(245,158,11,0.3)', desc: 'Exceptional contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: 'Silver', min: 1000, bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', shadow: 'rgba(107,114,128,0.3)', desc: 'Outstanding contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: 'Green',  min: 500,  bg: 'linear-gradient(135deg, #4ade80, #16a34a)', shadow: 'rgba(22,163,74,0.3)',  desc: 'Active contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { label: 'Blue',   min: 300,  bg: 'linear-gradient(135deg, #60a5fa, #1d4ed8)', shadow: 'rgba(29,78,216,0.3)',  desc: 'Regular contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { label: 'Red',    min: 100,  bg: 'linear-gradient(135deg, #f87171, #dc2626)', shadow: 'rgba(220,38,38,0.3)',  desc: 'New contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
];

const rankColors = ['#f59e0b', '#9ca3af', '#cd7f32', '#6b7280', '#6b7280'];
const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];
const medals = ['🥇','🥈','🥉'];

function getTier(points) {
  return TIERS.find(t => (points || 0) >= t.min) || null;
}

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 36, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function TierBadge({ points }) {
  const tier = getTier(points);
  if (!tier) return <span style={{ fontSize: 11, color: '#9ca3af' }}>No tier</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: tier.bg, color: '#fff' }}>
      {tier.label}
    </span>
  );
}

function AdminRewards() {
  const [contributors, setContributors] = useState([]);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState('');

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, points, avatar_url, barangay')
        .order('points', { ascending: false });
      setContributors((data || []).map((u, i) => ({
        ...u,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown',
        rank: i + 1,
      })));
      setFetching(false);
    };
    load();
  }, []);

  const filtered = contributors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.barangay?.toLowerCase().includes(search.toLowerCase())
  );

  const Spinner = ({ size = 32 }) => (
    <div style={{ width: size, height: size, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Rewards</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Monitor barangay reward contributions and top contributors system-wide</p>
          </div>

          {/* Tier cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
            {TIERS.map(t => (
              <div key={t.label} style={{ borderRadius: 16, padding: '20px 16px', background: t.bg, boxShadow: `0 4px 16px ${t.shadow}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#fff' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{t.label} Tier</div>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginTop: 2 }}>{t.min.toLocaleString()}</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>points</div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, textAlign: 'center' }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

            {/* Top Contributors */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Top Contributors</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Residents with the most reward points system-wide</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search by name or barangay…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ padding: '7px 12px 7px 30px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 230 }} />
                </div>
              </div>

              {fetching ? (
                <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Spinner />
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading contributors...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>{search ? 'No results found' : 'No contributor records yet'}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{search ? 'Try a different search term.' : 'Reward points will appear here as residents engage with the system.'}</div>
                </div>
              ) : (
                <div style={{ padding: '8px 16px 16px' }}>
                  {filtered.map((c, i) => (
                    <div key={c.auth_id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, marginBottom: 4, backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor= i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: rankColors[Math.min(i,4)], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                          {i < 3 ? medals[i] : c.rank}
                        </div>
                        <ResidentAvatar url={c.avatar_url} name={c.name} size={36} index={i} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.barangay || '—'}</span>
                            <TierBadge points={c.points || 0} />
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: rankColors[Math.min(i,4)] }}>{(c.points || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points Overview */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Points Overview</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Distribution by tier across all barangays</div>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {fetching ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><Spinner size={24} /></div>
                ) : (
                  <>
                    {TIERS.map(t => {
                      const count = contributors.filter(c => getTier(c.points || 0)?.label === t.label).length;
                      const pct = contributors.length > 0 ? Math.round((count / contributors.length) * 100) : 0;
                      return (
                        <div key={t.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label} Tier</span>
                            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>{count} <span style={{ fontWeight: 400, color: '#9ca3af' }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: t.bg, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>No tier</span>
                      <span style={{ fontWeight: 700, color: '#374151' }}>{contributors.filter(c => !getTier(c.points || 0)).length}</span>
                    </div>
                    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Total residents</span>
                      <span style={{ fontWeight: 800, color: '#1f2937' }}>{contributors.length}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminRewards;
