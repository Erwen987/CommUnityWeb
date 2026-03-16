import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const STATS = [
  { label: 'Total Reports',    value: 80  },
  { label: 'Total Requests',   value: 63  },
  { label: 'Active Users',     value: 128 },
  { label: 'Resolved Issues',  value: 52  },
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
  { name: 'Reviewing',  value: 25, color: '#ef4444' },
  { name: 'Processing', value: 20, color: '#f59e0b' },
  { name: 'Ready',      value: 15, color: '#6b7280' },
  { name: 'Released',   value: 40, color: '#22c55e' },
];

const topResidents = [
  { name: 'Juan Dela Cruz', count: 10 },
  { name: 'Maria Santos',   count: 8  },
  { name: 'Pedro Reyes',    count: 7  },
  { name: 'Ana Gonzales',   count: 6  },
];

function Analytics() {
  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Analytics</h1>
          <p className="off-page-sub">Reports and requests insights across the barangay.</p>

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

            {/* Bar chart */}
            <div className="off-card">
              <h3 className="off-card-title">Monthly Reports vs Requests</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                  <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                </BarChart>
              </ResponsiveContainer>
              <div className="off-chart-legend">
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#93c5fd' }} />
                  Requests
                </div>
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#1d4ed8' }} />
                  Reports
                </div>
              </div>
            </div>

            {/* Donut + Top residents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div className="off-card">
                <h3 className="off-card-title">Request Status Distribution</h3>
                <PieChart width={290} height={180}>
                  <Pie
                    data={statusData}
                    cx={140}
                    cy={90}
                    innerRadius={52}
                    outerRadius={82}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="off-donut-legend">
                  {statusData.map(d => (
                    <div key={d.name} className="off-donut-legend-item">
                      <div className="off-donut-legend-label">
                        <span className="off-donut-dot" style={{ background: d.color }} />
                        {d.name}
                      </div>
                      <span className="off-donut-pct">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="off-card">
                <h3 className="off-card-title">Top Reporting Residents</h3>
                {topResidents.map(r => (
                  <div key={r.name} className="off-top-row">
                    <div className="off-top-name">
                      <div className="off-top-avatar">{r.name[0]}</div>
                      {r.name}
                    </div>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{r.count} reports</span>
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

export default Analytics;
