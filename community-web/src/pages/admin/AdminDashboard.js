import React, { useEffect, useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const monthlyData = [];

function AdminDashboard() {
  const [stats, setStats] = useState({ reports: 0, requests: 0, officials: 0, pending: 0 });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [
      { count: reports },
      { count: requests },
      { count: officials },
      { count: pending },
    ] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({
      reports:   reports   || 0,
      requests:  requests  || 0,
      officials: officials || 0,
      pending:   pending   || 0,
    });
  };

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Welcome Admin 👋</h1>
          <p className="off-page-sub">Here's a quick overview of the system</p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-4">
            <div className="off-stat-card"><h4>Reports</h4><div className="off-stat-value">{stats.reports}</div></div>
            <div className="off-stat-card"><h4>Requests</h4><div className="off-stat-value">{stats.requests}</div></div>
            <div className="off-stat-card"><h4>Officials</h4><div className="off-stat-value">{stats.officials}</div></div>
            <div className="off-stat-card">
              <h4>Pending Officials</h4>
              <div className="off-stat-value" style={{ color: stats.pending > 0 ? '#d97706' : undefined }}>
                {stats.pending}
              </div>
            </div>
          </div>

          <div className="off-dash-grid">

            {/* LEFT — Chart */}
            <div className="off-card">
              <h3 className="off-card-title">Reports and Requests per Month</h3>
              {monthlyData.length === 0 ? (
                <div className="off-chart-empty">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>No records yet.</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Graph will appear once data is available.</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                    <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="off-chart-legend">
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#93c5fd' }} /> Requests
                </div>
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#1d4ed8' }} /> Reports
                </div>
              </div>
            </div>

            {/* RIGHT — Contributors + Activities */}
            <div className="off-dash-right">
              <div className="off-card">
                <h3 className="off-card-title">Top Contributors</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No contributor records yet.</p>
              </div>
              <div className="off-card">
                <h3 className="off-card-title">Recent Activities</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No recent activity.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
