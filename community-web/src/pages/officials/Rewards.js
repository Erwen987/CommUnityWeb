import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';

const TIERS = [
  {
    label: 'Gold',   points: 1500, color: '#92400e', bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', shadow: 'rgba(245,158,11,0.35)',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    desc: 'Exceptional contributors',
  },
  {
    label: 'Silver', points: 1000, color: '#374151', bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', shadow: 'rgba(107,114,128,0.35)',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    desc: 'Outstanding contributors',
  },
  {
    label: 'Green',  points: 500,  color: '#166534', bg: 'linear-gradient(135deg, #4ade80, #16a34a)', shadow: 'rgba(22,163,74,0.35)',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    desc: 'Active contributors',
  },
  {
    label: 'Blue',   points: 300,  color: '#1e40af', bg: 'linear-gradient(135deg, #60a5fa, #1d4ed8)', shadow: 'rgba(29,78,216,0.35)',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    desc: 'Regular contributors',
  },
  {
    label: 'Red',    points: 100,  color: '#991b1b', bg: 'linear-gradient(135deg, #f87171, #dc2626)', shadow: 'rgba(220,38,38,0.35)',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    desc: 'New contributors',
  },
];

function Rewards() {
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Rewards</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay ? `Monitor reward contributions for Barangay ${barangay}` : 'Monitor barangay reward contributions'}
            </p>
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

          {/* Top contributors table */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Top Contributors</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Residents with the most reward points</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>No contributor records yet</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Reward points will appear here as residents engage with the system</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Rewards;
