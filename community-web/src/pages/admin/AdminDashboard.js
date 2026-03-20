import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MEDALS = ['🥇','🥈','🥉','🏅','🏅'];
const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

function getLastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

const STAT_CARDS = (s) => [
  { label: 'Total Reports',     value: s.reports,   accent: '#1d4ed8', iconBg: '#dbeafe', labelColor: '#1e40af',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    sub: `${s.pendingReports} pending` },
  { label: 'Document Requests', value: s.requests,  accent: '#7c3aed', iconBg: '#ede9fe', labelColor: '#6d28d9',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
    sub: `${s.pendingRequests} pending` },
  { label: 'Active Officials',  value: s.officials, accent: '#16a34a', iconBg: '#dcfce7', labelColor: '#166534',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
    sub: `${s.pendingOfficials} awaiting review` },
  { label: 'Registered Users',  value: s.users,     accent: '#f59e0b', iconBg: '#fef3c7', labelColor: '#92400e',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    sub: 'across all barangays' },
];

function AdminDashboard() {
  const [stats, setStats]           = useState({ reports: 0, requests: 0, officials: 0, users: 0, pendingReports: 0, pendingRequests: 0, pendingOfficials: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: reports },
        { count: requests },
        { count: officials },
        { count: users },
        { count: pendingReports },
        { count: pendingRequests },
        { count: pendingOfficials },
        { data: allReports },
        { data: allRequests },
        { data: allUsers },
      ] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('requests').select('id', { count: 'exact', head: true }),
        supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('user_id, created_at, problem, barangay').order('created_at', { ascending: false }),
        supabase.from('requests').select('user_id, created_at, document_type, barangay').order('created_at', { ascending: false }),
        supabase.from('users').select('auth_id, first_name, last_name, barangay'),
      ]);

      setStats({ reports: reports||0, requests: requests||0, officials: officials||0, users: users||0, pendingReports: pendingReports||0, pendingRequests: pendingRequests||0, pendingOfficials: pendingOfficials||0 });

      // Build user name map
      const userMap = {};
      (allUsers || []).forEach(u => { userMap[u.auth_id] = { name: `${u.first_name||''} ${u.last_name||''}`.trim(), barangay: u.barangay }; });

      // Monthly chart — last 6 months
      const slots = getLastSixMonths();
      const buckets = {};
      slots.forEach(s => { buckets[`${s.year}-${s.month}`] = { month: s.label, reports: 0, requests: 0 }; });
      (allReports || []).forEach(r => {
        const d = new Date(r.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[k]) buckets[k].reports++;
      });
      (allRequests || []).forEach(r => {
        const d = new Date(r.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[k]) buckets[k].requests++;
      });
      setMonthlyData(slots.map(s => buckets[`${s.year}-${s.month}`]));

      // Top contributors — top 5 by report count
      const countMap = {};
      (allReports || []).forEach(r => { countMap[r.user_id] = (countMap[r.user_id] || 0) + 1; });
      const top5 = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([uid, cnt]) => ({ uid, count: cnt, ...(userMap[uid] || { name: 'Unknown', barangay: '—' }) }));
      setContributors(top5);

      // Recent activities — last 8 combined (reports + requests)
      const recentReports = (allReports || []).slice(0, 8).map(r => ({
        type: 'report', label: r.problem || 'Report', barangay: r.barangay, name: userMap[r.user_id]?.name || 'Unknown', date: r.created_at,
      }));
      const recentRequests = (allRequests || []).slice(0, 8).map(r => ({
        type: 'request', label: r.document_type || 'Request', barangay: r.barangay, name: userMap[r.user_id]?.name || 'Unknown', date: r.created_at,
      }));
      const combined = [...recentReports, ...recentRequests]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);
      setActivities(combined);

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
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
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{loading ? '—' : c.value}</div>
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
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Last 6 months overview</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Requests</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1d4ed8', display: 'inline-block' }} />Reports</div>
                </div>
              </div>
              {loading ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              ) : monthlyData.every(d => d.reports === 0 && d.requests === 0) ? (
                <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>No data yet</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                    <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right column */}
            <div className="off-dash-right">

              {/* Top Contributors */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Top Contributors</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Most active residents (all barangays)</div>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                ) : contributors.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 6 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No contributor records yet</span>
                  </div>
                ) : contributors.map((c, i) => (
                  <div key={c.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < contributors.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{MEDALS[i]}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColors[i % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {(c.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.barangay}</div>
                    </div>
                    <div style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.count}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activities */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Recent Activities</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Latest reports & requests</div>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                ) : activities.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 6 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No recent activity</span>
                  </div>
                ) : activities.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: a.type === 'report' ? '#dbeafe' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {a.type === 'report'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {a.name} · {a.barangay || '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(a.date)}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
