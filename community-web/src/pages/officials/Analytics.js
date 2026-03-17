import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import {
  PieChart, Pie, Cell
} from 'recharts';

const STATS = [
  { label: 'Total Reports',   value: 0 },
  { label: 'Total Requests',  value: 0 },
  { label: 'Active Users',    value: 0 },
  { label: 'Resolved Issues', value: 0 },
];

const statusData = [
  { name: 'Reviewing',  value: 25, color: '#ef4444' },
  { name: 'Processing', value: 20, color: '#f59e0b' },
  { name: 'Ready',      value: 15, color: '#6b7280' },
  { name: 'Released',   value: 40, color: '#22c55e' },
];

function Analytics() {
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Analytics</h1>
          <p className="off-page-sub">
            {!loading && barangay ? `Reports and requests insights for ${barangay}.` : 'Reports and requests insights across the barangay.'}
          </p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-4">
            {STATS.map(s => (
              <div key={s.label} className="off-stat-card">
                <h4>{s.label}</h4>
                <div className="off-stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="off-analytics-grid">

            {/* Bar chart placeholder */}
            <div className="off-card">
              <h3 className="off-card-title">Monthly Reports vs Requests</h3>
              <div className="off-chart-empty" style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>No records yet.</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Graph will appear once data is available.</div>
                </div>
              </div>
              <div className="off-chart-legend">
                <div className="off-legend-item"><span className="off-legend-dot" style={{ background: '#93c5fd' }} />Requests</div>
                <div className="off-legend-item"><span className="off-legend-dot" style={{ background: '#1d4ed8' }} />Reports</div>
              </div>
            </div>

            {/* Donut + Top residents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="off-card">
                <h3 className="off-card-title">Request Status Distribution</h3>
                <PieChart width={290} height={180}>
                  <Pie data={statusData} cx={140} cy={90} innerRadius={52} outerRadius={82} dataKey="value" stroke="none">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
                <div className="off-donut-legend">
                  {statusData.map(d => (
                    <div key={d.name} className="off-donut-legend-item">
                      <div className="off-donut-legend-label">
                        <span className="off-donut-dot" style={{ background: d.color }} />{d.name}
                      </div>
                      <span className="off-donut-pct">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="off-card">
                <h3 className="off-card-title">Top Reporting Residents</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No resident data yet.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
