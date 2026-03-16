import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const REQUESTS = [
  { id: 'REQ-001-2026', doc: 'Barangay Clearance',       resident: 'Juan Dela Cruz', payment: 'GCash',   status: 'Reviewing',  date: '1/5/2026'  },
  { id: 'REQ-002-2026', doc: 'Certificate of Residency', resident: 'Maria Santos',   payment: 'On-Site', status: 'Processing', date: '1/8/2026'  },
  { id: 'REQ-003-2026', doc: 'Indigency Certificate',    resident: 'Pedro Reyes',    payment: 'GCash',   status: 'Ready',      date: '1/10/2026' },
  { id: 'REQ-004-2026', doc: 'Barangay ID',              resident: 'Ana Gonzales',   payment: 'GCash',   status: 'Released',   date: '1/12/2026' },
];

const STATUS_CLS = {
  Reviewing:  'off-status-reviewing',
  Processing: 'off-status-processing',
  Ready:      'off-status-ready',
  Released:   'off-status-released',
};

function AdminRequests() {
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('All');

  const filtered = REQUESTS.filter(r => {
    const matchSearch = r.doc.toLowerCase().includes(search.toLowerCase()) ||
                        r.resident.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Requests</h1>
          <p className="off-page-sub">Monitor and manage barangay document requests.</p>

          <div className="off-stats-row off-stats-row-5">
            <div className="off-stat-card"><h4>Total Requests</h4><div className="off-stat-value">4</div></div>
            <div className="off-stat-card"><h4>Reviewing</h4><div className="off-stat-value">1</div></div>
            <div className="off-stat-card"><h4>Processing</h4><div className="off-stat-value">1</div></div>
            <div className="off-stat-card"><h4>Ready for Pickup</h4><div className="off-stat-value">1</div></div>
            <div className="off-stat-card"><h4>Released</h4><div className="off-stat-value">1</div></div>
          </div>

          <div className="off-card">
            <h3 className="off-card-title">Requests List</h3>
            <div className="off-table-header">
              <input
                className="off-table-search"
                placeholder="Search requests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="off-filter-select"
                value={statusFilter}
                onChange={e => setStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>Reviewing</option>
                <option>Processing</option>
                <option>Ready</option>
                <option>Released</option>
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
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.doc}</td>
                    <td>{r.resident}</td>
                    <td>{r.payment}</td>
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

export default AdminRequests;
