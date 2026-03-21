import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../supabaseClient';

const avatarColors2 = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];
function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}
function ResidentAvatar({ url, name, size = 30, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors2[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>{initials}</div>;
}

const STATUS_CFG = [
  { key: 'pending',          label: 'Pending',           color: '#f59e0b' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup',  color: '#8b5cf6' },
  { key: 'claimed',          label: 'Claimed',           color: '#16a34a' },
  { key: 'rejected',         label: 'Rejected',          color: '#ef4444' },
];

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getLastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
}

function bucketByMonth(rows, months) {
  return months.map(m => ({
    label: m.label,
    count: rows.filter(r => {
      const d = new Date(r.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length,
  }));
}

function Analytics() {
  const { barangay, loading } = useOfficialProfile();

  const [stats,       setStats]       = useState({ reports: 0, requests: 0, users: 0, resolved: 0 });
  const [monthly,     setMonthly]     = useState([]);
  const [statusDist,  setStatusDist]  = useState([]);
  const [topReporters,setTopReporters]= useState([]);
  const [fetching,    setFetching]    = useState(false);

  const load = useCallback(async () => {
    if (!barangay) return;
    setFetching(true);

    const months = getLastSixMonths();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // ── Fetch all in parallel ──────────────────────────────────────────────
    const [
      { data: reports  = [] },
      { data: requests = [] },
      { data: users    = [] },
    ] = await Promise.all([
      supabase.from('reports').select('id, status, created_at, user_id').eq('barangay', barangay),
      supabase.from('requests').select('id, status, created_at, user_id').eq('barangay', barangay),
      supabase.from('users').select('auth_id, first_name, last_name, avatar_url').eq('barangay', barangay),
    ]);

    // ── Stat cards ─────────────────────────────────────────────────────────
    setStats({
      reports:  reports.length,
      requests: requests.length,
      users:    users.length,
      resolved: reports.filter(r => r.status === 'resolved').length,
    });

    // ── Monthly bar chart (last 6 months) ──────────────────────────────────
    const recentReports  = reports.filter(r  => new Date(r.created_at)  >= sixMonthsAgo);
    const recentRequests = requests.filter(r => new Date(r.created_at) >= sixMonthsAgo);
    const reportBuckets  = bucketByMonth(recentReports,  months);
    const requestBuckets = bucketByMonth(recentRequests, months);
    setMonthly(months.map((m, i) => ({
      month:    m.label,
      reports:  reportBuckets[i].count,
      requests: requestBuckets[i].count,
    })));

    // ── Status donut ───────────────────────────────────────────────────────
    const total = requests.length || 1;
    setStatusDist(
      STATUS_CFG.map(s => ({
        ...s,
        value: requests.filter(r => r.status === s.key).length,
        pct:   Math.round((requests.filter(r => r.status === s.key).length / total) * 100),
      })).filter(s => s.value > 0)
    );

    // ── Top reporters: group report counts by user ─────────────────────────
    const countMap = {};
    reports.forEach(r => { countMap[r.user_id] = (countMap[r.user_id] || 0) + 1; });
    const userMap = {};
    users.forEach(u => { userMap[u.auth_id] = { name: `${u.first_name} ${u.last_name}`.trim(), avatar_url: u.avatar_url }; });

    const ranked = Object.entries(countMap)
      .map(([uid, count]) => ({ ...(userMap[uid] || { name: 'Unknown', avatar_url: null }), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopReporters(ranked);

    setFetching(false);
  }, [barangay]);

  useEffect(() => { load(); }, [load]);

  const STAT_CARDS = [
    { label: 'Total Reports',   value: stats.reports,  accent: '#1d4ed8', iconBg: '#dbeafe', sub: 'Submitted by residents',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Total Requests',  value: stats.requests, accent: '#7c3aed', iconBg: '#ede9fe', sub: 'Documents requested',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
    { label: 'Registered Users', value: stats.users,   accent: '#0369a1', iconBg: '#e0f2fe', sub: 'Residents in barangay',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'Resolved Issues', value: stats.resolved, accent: '#16a34a', iconBg: '#dcfce7', sub: 'Reports resolved',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  const hasMonthly = monthly.some(m => m.reports > 0 || m.requests > 0);
  const totalReqs  = statusDist.reduce((s, d) => s + d.value, 0);

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Analytics</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay
                ? `Reports and requests insights for Barangay ${barangay}`
                : 'Reports and requests insights across the barangay'}
            </p>
          </div>

          {/* Stat cards */}
          <div className="off-analytics-stats-grid">
            {STAT_CARDS.map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
                    {fetching ? <span style={{ fontSize: 16, color: '#d1d5db' }}>—</span> : c.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="off-analytics-grid" style={{ marginBottom: 20 }}>

            {/* Monthly bar chart */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Monthly Activity</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Reports &amp; requests over last 6 months</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Reports
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#7c3aed', display: 'inline-block' }} />Requests
                  </div>
                </div>
              </div>

              {fetching ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : !hasMonthly ? (
                <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>No activity yet</div>
                  <div style={{ fontSize: 11, color: '#d1d5db' }}>Chart will appear once records are available</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <BarTooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Bar dataKey="reports"  name="Reports"  fill="#93c5fd" radius={[4,4,0,0]} />
                    <Bar dataKey="requests" name="Requests" fill="#7c3aed" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Status donut */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 2 }}>Request Status</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Breakdown of {totalReqs} total request{totalReqs !== 1 ? 's' : ''}</div>

                {fetching ? (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : statusDist.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No requests yet</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <PieChart width={130} height={130}>
                      <Pie data={statusDist} cx={60} cy={60} innerRadius={36} outerRadius={58} dataKey="value" stroke="none">
                        {statusDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <PieTooltip
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                        formatter={(v, n) => [`${v} (${Math.round((v/totalReqs)*100)}%)`, n]}
                      />
                    </PieChart>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {statusDist.map(d => (
                        <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151' }}>
                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                            {d.label}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{d.value}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{d.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top reporters */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 2 }}>Top Reporters</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Most active residents this month</div>

                {fetching ? (
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : topReporters.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No reporter data yet</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {topReporters.map((r, i) => {
                      const medals = ['🥇','🥈','🥉'];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < topReporters.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ResidentAvatar url={r.avatar_url} name={r.name} size={30} index={i} />
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i < 3 && <span style={{ fontSize: 14 }}>{medals[i]}</span>}
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A5F', background: '#e0e7ef', padding: '2px 9px', borderRadius: 999 }}>{r.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Analytics;
