import React, { useEffect, useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyData = [];

const STAT_CARDS = (s) => [
  { label: 'Total Reports',     value: s.reports,   accent: '#1d4ed8', iconBg: '#dbeafe', labelColor: '#1e40af',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    sub: s.reports === 0 ? 'No reports yet' : `${s.reports} total submitted` },
  { label: 'Document Requests', value: s.requests,  accent: '#7c3aed', iconBg: '#ede9fe', labelColor: '#6d28d9',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
    sub: s.requests === 0 ? 'No requests yet' : `${s.requests} total requests` },
  { label: 'Active Officials',  value: s.officials, accent: '#16a34a', iconBg: '#dcfce7', labelColor: '#166534',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
    sub: s.officials === 0 ? 'No officials yet' : `${s.officials} approved` },
  { label: 'Pending Officials', value: s.pending,   accent: '#f59e0b', iconBg: '#fef3c7', labelColor: '#92400e', valueColor: s.pending > 0 ? '#d97706' : undefined,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    sub: s.pending === 0 ? 'No pending approvals' : `${s.pending} awaiting review` },
];

function AdminDashboard() {
  const [stats, setStats] = useState({ reports: 0, requests: 0, officials: 0, pending: 0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [{ count: reports }, { count: requests }, { count: officials }, { count: pending }] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({ reports: reports||0, requests: requests||0, officials: officials||0, pending: pending||0 });
  };

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Welcome, Admin 👋</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Here's a quick overview of the system</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {STAT_CARDS(stats).map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: c.labelColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.valueColor || '#1f2937', lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div className="off-dash-grid">

            {/* Chart */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Reports & Requests</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Monthly overview</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Requests</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1d4ed8', display: 'inline-block' }} />Reports</div>
                </div>
              </div>
              {monthlyData.length === 0 ? (
                <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>No data yet</div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>Chart will appear once records are available</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                    <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right column */}
            <div className="off-dash-right">
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Top Contributors</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Most active residents</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No contributor records yet</span>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Recent Activities</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Latest system events</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No recent activity</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
