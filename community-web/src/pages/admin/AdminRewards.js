import React from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';

const TIERS = [
  { label: 'Gold',   points: 1500, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', shadow: 'rgba(245,158,11,0.3)', desc: 'Exceptional contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: 'Silver', points: 1000, bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', shadow: 'rgba(107,114,128,0.3)', desc: 'Outstanding contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: 'Green',  points: 500,  bg: 'linear-gradient(135deg, #4ade80, #16a34a)', shadow: 'rgba(22,163,74,0.3)',  desc: 'Active contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { label: 'Blue',   points: 300,  bg: 'linear-gradient(135deg, #60a5fa, #1d4ed8)', shadow: 'rgba(29,78,216,0.3)',  desc: 'Regular contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { label: 'Red',    points: 100,  bg: 'linear-gradient(135deg, #f87171, #dc2626)', shadow: 'rgba(220,38,38,0.3)',  desc: 'New contributors',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
];

const CONTRIBUTORS = [
  { name: 'Juan Dela Cruz', barangay: 'Mangin',  points: 2000, rank: 1 },
  { name: 'Maria Santos',   barangay: 'Bolosan', points: 1800, rank: 2 },
  { name: 'Pedro Reyes',    barangay: 'Calmay',  points: 1500, rank: 3 },
  { name: 'Ana Gonzales',   barangay: 'Mangin',  points: 950,  rank: 4 },
  { name: 'Carlo Mendoza',  barangay: 'Lucao',   points: 780,  rank: 5 },
];

const avatarColors = ['#f59e0b', '#6b7280', '#16a34a', '#1d4ed8', '#dc2626'];
const rankColors   = ['#f59e0b', '#9ca3af', '#cd7f32', '#6b7280', '#6b7280'];

function AdminRewards() {
  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Rewards</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Monitor barangay reward contributions and top contributors</p>
          </div>

          {/* Tier cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
            {TIERS.map(t => (
              <div key={t.label} style={{ borderRadius: 16, padding: '20px 16px', background: t.bg, boxShadow: `0 4px 16px ${t.shadow}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#fff' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.icon}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{t.label} Tier</div>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginTop: 2 }}>{t.points.toLocaleString()}</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>points</div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, textAlign: 'center' }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top Contributors */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Top Contributors</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Residents with the most reward points</div>
              </div>
              <div style={{ padding: '12px 24px 20px' }}>
                {CONTRIBUTORS.map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor= i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: rankColors[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {c.rank}
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColors[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {c.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.barangay}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: rankColors[i] }}>{c.points.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Points Overview */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Points Overview</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Distribution by tier</div>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {TIERS.map((t, i) => {
                  const pct = [65, 48, 30, 20, 10][i];
                  return (
                    <div key={t.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label} Tier</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: t.bg, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminRewards;
