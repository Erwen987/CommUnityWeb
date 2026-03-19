import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const REQUESTS = [
  { id: 'REQ-001-2026', doc: 'Barangay Clearance',       resident: 'Juan Dela Cruz', barangay: 'Mangin',  payment: 'GCash',   status: 'reviewing',  date: '1/5/2026'  },
  { id: 'REQ-002-2026', doc: 'Certificate of Residency', resident: 'Maria Santos',   barangay: 'Bolosan', payment: 'On-Site', status: 'processing', date: '1/8/2026'  },
  { id: 'REQ-003-2026', doc: 'Indigency Certificate',    resident: 'Pedro Reyes',    barangay: 'Calmay',  payment: 'GCash',   status: 'ready_for_pickup', date: '1/10/2026' },
  { id: 'REQ-004-2026', doc: 'Barangay ID',              resident: 'Ana Gonzales',   barangay: 'Mangin',  payment: 'GCash',   status: 'released',   date: '1/12/2026' },
];

const STATUS_CFG = {
  reviewing:        { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Reviewing'       },
  processing:       { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Processing'       },
  ready_for_pickup: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Ready for Pickup' },
  released:         { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Released'         },
  rejected:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected'         },
};

const TH = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '13px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9' };

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.reviewing;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

const avatarColors = ['#1E3A5F', '#0f766e', '#7c3aed', '#c2410c', '#0369a1'];

function AdminRequests() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = REQUESTS.filter(r => {
    const matchSearch = !search || r.doc.toLowerCase().includes(search.toLowerCase()) || r.resident.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const count = s => REQUESTS.filter(r => r.status === s).length;

  const STATS = [
    { label: 'Total Requests',   value: REQUESTS.length,          accent: '#7c3aed', iconBg: '#ede9fe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
    { label: 'Reviewing',        value: count('reviewing'),        accent: '#f59e0b', iconBg: '#fef3c7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { label: 'Processing',       value: count('processing'),       accent: '#3b82f6', iconBg: '#dbeafe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label: 'Ready for Pickup', value: count('ready_for_pickup'), accent: '#8b5cf6', iconBg: '#ede9fe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label: 'Released',         value: count('released'),         accent: '#16a34a', iconBg: '#dcfce7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Requests</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Monitor and manage barangay document requests</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {STATS.map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table panel */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Requests List</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{filtered.length} of {REQUESTS.length} records</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search by document or resident…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 230 }} />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
                  <option value="all">All Status</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="processing">Processing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="released">Released</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>Request ID</th>
                    <th style={TH}>Document</th>
                    <th style={TH}>Resident</th>
                    <th style={TH}>Barangay</th>
                    <th style={TH}>Payment</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Date</th>
                    <th style={TH}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '48px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No requests found</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Try adjusting your search or filter</div>
                      </div>
                    </td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{r.id}</td>
                      <td style={{ ...TD, fontWeight: 600, color: '#111827' }}>{r.doc}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColors[i % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {r.resident[0]}
                          </div>
                          <span style={{ fontWeight: 500 }}>{r.resident}</span>
                        </div>
                      </td>
                      <td style={TD}><span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.barangay}</span></td>
                      <td style={TD}><span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.payment}</span></td>
                      <td style={TD}><StatusBadge status={r.status} /></td>
                      <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{r.date}</td>
                      <td style={TD}>
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1E3A5F', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRequests;
