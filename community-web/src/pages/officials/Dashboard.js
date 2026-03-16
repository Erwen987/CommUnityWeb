import React, { useState } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const monthlyData = [];

function Dashboard() {
  const [announcement, setAnnouncement] = useState('');

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Hello, Barangay Officials 👋</h1>
          <p className="off-page-sub">Here's what's happening in your barangay today.</p>

          <div className="off-dash-grid">

            {/* LEFT COLUMN */}
            <div className="off-dash-left">

              {/* Announcement */}
              <div className="off-card">
                <h3 className="off-card-title">Barangay Announcement</h3>
                <textarea
                  className="off-announce-textarea"
                  placeholder="Write an announcement for barangay residents..."
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                />
                <div className="off-announce-footer">
                  <button className="off-publish-btn">Publish Announcement</button>
                </div>
              </div>

              {/* Monthly chart */}
              <div className="off-card">
                <h3 className="off-card-title">Monthly Reports and Requests</h3>
                {monthlyData.length === 0 ? (
                  <div className="off-chart-empty">No available records yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} />
                      <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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

            </div>

            {/* RIGHT COLUMN */}
            <div className="off-dash-right">
              {/* Two stat cards side by side */}
              <div className="off-dash-stats-row">
                <div className="off-stat-card">
                  <h4>Total Reports</h4>
                  <div className="off-stat-value">0</div>
                </div>
                <div className="off-stat-card">
                  <h4>Total Requests</h4>
                  <div className="off-stat-value">0</div>
                </div>
              </div>
              <div className="off-card">
                <h3 className="off-card-title">Top Community Contributors</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No contributor records yet.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
