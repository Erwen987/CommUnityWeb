import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const REPORTS = [
  { id: 'RPT-001-2026', type: 'Broken Streetlight', resident: 'Juan Dela Cruz', location: 'Purok 3', status: 'Reviewed',   date: '1/5/2026'  },
  { id: 'RPT-002-2026', type: 'Pothole on Road',    resident: 'Maria Santos',   location: 'Purok 1', status: 'In Progress', date: '1/8/2026'  },
  { id: 'RPT-003-2026', type: 'Illegal Dumping',    resident: 'Pedro Reyes',    location: 'Purok 5', status: 'Assigned',    date: '1/10/2026' },
];

const STATUS_CLS = {
  Reviewed:    'off-status-reviewing',
  Assigned:    'off-status-assigned',
  'In Progress': 'off-status-inprogress',
  Fixed:       'off-status-fixed',
};

function AdminReports() {
  const [search, setSearch] = useState('');

  const filtered = REPORTS.filter(r =>
    r.type.toLowerCase().includes(search.toLowerCase()) ||
    r.resident.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Reports</h1>
          <p className="off-page-sub">View and manage all reports submitted by residents.</p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-5">
            <div className="off-stat-card"><h4>Total Reports</h4><div className="off-stat-value">2</div></div>
            <div className="off-stat-card"><h4>Reviewed</h4><div className="off-stat-value">1</div></div>
            <div className="off-stat-card"><h4>Assigned</h4><div className="off-stat-value">0</div></div>
            <div className="off-stat-card"><h4>In Progress</h4><div className="off-stat-value">1</div></div>
            <div className="off-stat-card"><h4>Fixed</h4><div className="off-stat-value">0</div></div>
          </div>

          {/* Map */}
          <div className="off-map">
            <iframe
              title="Barangay Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=120.97,14.59,121.03,14.63&layer=mapnik"
            />
          </div>

          {/* Table */}
          <div className="off-card">
            <h3 className="off-card-title">Reports Overview</h3>
            <div className="off-table-header">
              <input
                className="off-table-search"
                placeholder="Search reports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <table className="off-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Resident</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.type}</td>
                    <td>{r.resident}</td>
                    <td>{r.location}</td>
                    <td><span className={`off-status-badge ${STATUS_CLS[r.status]}`}>{r.status}</span></td>
                    <td>{r.date}</td>
                    <td><button className="off-view-btn">View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminReports;
