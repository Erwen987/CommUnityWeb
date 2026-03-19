import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const statusData = [
  { name: 'Reviewing',  value: 25, color: '#f59e0b' },
  { name: 'Processing', value: 20, color: '#3b82f6' },
  { name: 'Ready',      value: 15, color: '#8b5cf6' },
  { name: 'Released',   value: 40, color: '#22c55e' },
];

const STATS = [
  { label: 'Total Reports',   value: 0, accent: '#1d4ed8', iconBg: '#dbeafe',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    sub: 'Reports submitted' },
  { label: 'Total Requests',  value: 0, accent: '#7c3aed', iconBg: '#ede9fe',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
    sub: 'Documents requested' },
  { label: 'Active Users',    value: 0, accent: '#0369a1', iconBg: '#e0f2fe',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    sub: 'Registered residents' },
  { label: 'Resolved Issues', value: 0, accent: '#16a34a', iconBg: '#dcfce7',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    sub: 'Reports resolved' },
];

function Analytics() {
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Analytics</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay ? `Reports and requests insights for Barangay ${barangay}` : 'Reports and requests insights across the barangay'}
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {STATS.map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div className="off-analytics-grid">

            {/* Bar chart placeholder */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Monthly Reports vs Requests</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Activity over time</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Requests</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1d4ed8', display: 'inline-block' }} />Reports</div>
                </div>
              </div>
              <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>No data yet</div>
                <div style={{ fontSize: 11, color: '#d1d5db' }}>Chart will appear once records are available</div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Donut chart */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Request Status Distribution</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Breakdown by current status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <PieChart width={150} height={150}>
                    <Pie data={statusData} cx={70} cy={70} innerRadius={42} outerRadius={68} dataKey="value" stroke="none">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {statusData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                          {d.name}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top residents */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Top Reporting Residents</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Most active community members</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No resident data yet</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
