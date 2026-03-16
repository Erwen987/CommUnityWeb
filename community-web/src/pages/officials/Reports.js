import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const STATS = [
  { label: 'Total Reports', value: 2 },
  { label: 'Reviewed',      value: 1 },
  { label: 'Assigned',      value: 0 },
  { label: 'In Progress',   value: 1 },
  { label: 'Fixed',         value: 0 },
];

const REPORTS = [
  { id: 'RPT-001-2026', type: 'Broken Streetlight', resident: 'Juan Dela Cruz', location: 'Brgy. 1', status: 'inprogress', date: '1/5/2026' },
  { id: 'RPT-002-2026', type: 'Pothole',            resident: 'Maria Santos',   location: 'Brgy. 2', status: 'reviewing',  date: '1/8/2026' },
];

const STATUS_LABELS = {
  reviewing:  { label: 'Reviewing',  cls: 'off-status-reviewing'  },
  inprogress: { label: 'In Progress', cls: 'off-status-inprogress' },
  assigned:   { label: 'Assigned',   cls: 'off-status-assigned'   },
  fixed:      { label: 'Fixed',      cls: 'off-status-fixed'      },
};

function Reports() {
  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Reports</h1>
          <p className="off-page-sub" style={{ marginBottom: 20 }}></p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-5">
            {STATS.map(s => (
              <div key={s.label} className="off-stat-card">
                <h4>{s.label}</h4>
                <div className="off-stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="off-map">
            <iframe
              title="Barangay Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=120.97,14.59,121.07,14.63&layer=mapnik"
              allowFullScreen
            />
          </div>

          {/* Reports Overview */}
          <div className="off-card">
            <h3 className="off-card-title">Reports Overview</h3>
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
                {REPORTS.map(r => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.type}</td>
                      <td>{r.resident}</td>
                      <td>{r.location}</td>
                      <td><span className={`off-status-badge ${s.cls}`}>{s.label}</span></td>
                      <td>{r.date}</td>
                      <td><button className="off-view-btn">View Details</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Reports;
