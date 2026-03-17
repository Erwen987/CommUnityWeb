import React, { useState } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';

const STATS = [
  { label: 'Total Requests',   value: 0 },
  { label: 'Reviewing',        value: 0 },
  { label: 'Processing',       value: 0 },
  { label: 'Ready for Pickup', value: 0 },
  { label: 'Released',         value: 0 },
];

function Requests() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Requests</h1>
          <p className="off-page-sub">
            {!loading && barangay ? `Showing document requests for ${barangay}` : 'Monitor and manage barangay document requests.'}
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

          {/* Requests list */}
          <div className="off-card">
            <h3 className="off-card-title">Requests List</h3>
            <div className="off-table-header">
              <input
                className="off-table-search"
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="off-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="reviewing">Reviewing</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="released">Released</option>
              </select>
            </div>
            <table className="off-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Document</th>
                  <th>Resident</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
                    No requests yet for {barangay || 'your barangay'}.
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

export default Requests;
