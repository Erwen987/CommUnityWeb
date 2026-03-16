import React, { useState } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const STATS = [
  { label: 'Total Requests',  value: 3 },
  { label: 'Reviewing',       value: 1 },
  { label: 'Processing',      value: 1 },
  { label: 'Ready for Pickup', value: 1 },
  { label: 'Released',        value: 0 },
];

const ALL_REQUESTS = [
  { id: 'REQ-001-2026', doc: 'Barangay Clearance',      resident: 'Juan Dela Cruz', payment: 'GCash',   status: 'reviewing',  date: '1/5/2026'  },
  { id: 'REQ-002-2026', doc: 'Certificate of Residency', resident: 'Maria Santos',   payment: 'On-Site', status: 'reviewing',  date: '1/8/2026'  },
  { id: 'REQ-003-2026', doc: 'Indigency Certificate',   resident: 'Pedro Reyes',    payment: 'GCash',   status: 'reviewing',  date: '1/10/2026' },
];

const STATUS_LABELS = {
  reviewing:  { label: 'Reviewing',      cls: 'off-status-reviewing'  },
  processing: { label: 'Processing',     cls: 'off-status-processing' },
  ready:      { label: 'Ready for Pickup', cls: 'off-status-ready'    },
  released:   { label: 'Released',       cls: 'off-status-released'   },
};

function Requests() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const filtered = ALL_REQUESTS.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.doc.toLowerCase().includes(search.toLowerCase()) ||
      r.resident.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Requests</h1>
          <p className="off-page-sub">Monitor and manage barangay document requests.</p>

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
                {filtered.map(r => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.doc}</td>
                      <td>{r.resident}</td>
                      <td>{r.payment}</td>
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

export default Requests;
