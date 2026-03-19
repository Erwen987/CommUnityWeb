import React from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATS = [
  { label: 'Total Reports',   value: 80,  accent: '#1d4ed8', iconBg: '#dbeafe', sub: 'Reports submitted',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { label: 'Total Requests',  value: 63,  accent: '#7c3aed', iconBg: '#ede9fe', sub: 'Documents requested',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
  { label: 'Active Users',    value: 128, accent: '#0369a1', iconBg: '#e0f2fe', sub: 'Registered residents',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Resolved Issues', value: 52,  accent: '#16a34a', iconBg: '#dcfce7', sub: 'Reports resolved',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
];

const monthlyData = [
  { month: 'Jan', requests: 8,  reports: 12 },
  { month: 'Feb', requests: 14, reports: 20 },
  { month: 'Mar', requests: 6,  reports: 8  },
  { month: 'Apr', requests: 12, reports: 16 },
  { month: 'May', requests: 9,  reports: 11 },
  { month: 'Jun', requests: 14, reports: 18 },
];

const statusData = [
  { name: 'Reviewing',  value: 25, color: '#f59e0b' },
  { name: 'Processing', value: 20, color: '#3b82f6' },
  { name: 'Ready',      value: 15, color: '#8b5cf6' },
  { name: 'Released',   value: 40, color: '#22c55e' },
];

const topResidents = [
  { name: 'Juan Dela Cruz', barangay: 'Mangin',  count: 10 },
  { name: 'Maria Santos',   barangay: 'Bolosan', count: 8  },
  { name: 'Pedro Reyes',    barangay: 'Calmay',  count: 7  },
  { name: 'Ana Gonzales',   barangay: 'Mangin',  count: 6  },
];

const avatarColors = ['#1E3A5F', '#0f766e', '#7c3aed', '#c2410c'];

function AdminAnalytics() {
  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Analytics</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>System-wide reports and requests insights</p>
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

            {/* Bar chart */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Monthly Reports vs Requests</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Jan – Jun 2026</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Requests</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1d4ed8', display: 'inline-block' }} />Reports</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                  <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Donut */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 2 }}>Request Status Distribution</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Breakdown by current status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <PieChart width={150} height={150}>
                    <Pie data={statusData} cx={70} cy={70} innerRadius={42} outerRadius={68} dataKey="value" stroke="none">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {statusData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />{d.name}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top residents */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 2 }}>Top Reporting Residents</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Most active community members</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topResidents.map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColors[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {r.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.barangay}</div>
                        </div>
                      </div>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {r.count} reports
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
