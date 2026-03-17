import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';

const STATS = [
  { label: 'Total Reports', value: 0 },
  { label: 'Reviewed',      value: 0 },
  { label: 'Assigned',      value: 0 },
  { label: 'In Progress',   value: 0 },
  { label: 'Fixed',         value: 0 },
];

function Reports() {
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Reports</h1>
          <p className="off-page-sub">
            {!loading && barangay ? `Showing reports for ${barangay}` : ''}
          </p>

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
              src="https://www.openstreetmap.org/export/embed.html?bbox=120.27,16.01,120.37,16.07&layer=mapnik"
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
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
                    No reports yet for {barangay || 'your barangay'}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Reports;
