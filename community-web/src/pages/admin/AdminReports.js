import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

const STATUS_CFG = {
  pending:     { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'     },
  reviewed:    { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Reviewed'    },
  assigned:    { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Assigned'    },
  in_progress: { bg: '#fff7ed', color: '#9a3412', dot: '#f97316', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Resolved'    },
};

const TH = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '13px 16px', fontSize: 13, color: '#374151' };

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || { bg: '#f1f5f9', color: '#374151', dot: '#9ca3af', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

const fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// Detail modal
function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Report Details</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }}>{report.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StatusBadge status={report.status} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Problem',   value: report.problem },
              { label: 'Resident',  value: report.residentName },
              { label: 'Barangay',  value: report.barangay },
              { label: 'Date',      value: fmtDate(report.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {report.description && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Description</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{report.description}</div>
            </div>
          )}

          {report.image_url && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Photo</div>
              <img src={report.image_url} alt="report" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminReports() {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: rpts = [] }, { data: users = [] }] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('auth_id, first_name, last_name'),
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.auth_id] = `${u.first_name} ${u.last_name}`.trim(); });

    setReports(rpts.map(r => ({ ...r, residentName: userMap[r.user_id] || 'Unknown' })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.problem?.toLowerCase().includes(q) || r.residentName.toLowerCase().includes(q) || r.barangay?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const count = s => reports.filter(r => r.status === s).length;

  const STATS = [
    { label: 'Total',       value: reports.length,       accent: '#1d4ed8', iconBg: '#dbeafe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Pending',     value: count('pending'),     accent: '#f59e0b', iconBg: '#fef3c7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Assigned',    value: count('assigned'),    accent: '#8b5cf6', iconBg: '#ede9fe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
    { label: 'In Progress', value: count('in_progress'), accent: '#f97316', iconBg: '#fff7ed',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label: 'Resolved',    value: count('resolved'),    accent: '#16a34a', iconBg: '#dcfce7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Reports</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>View all reports submitted by residents across all barangays</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {STATS.map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${c.accent}`, cursor: 'pointer' }}
                onClick={() => setFilter(c.label === 'Total' ? 'all' : c.label.toLowerCase().replace(' ', '_'))}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
                    {loading ? <span style={{ fontSize: 16, color: '#d1d5db' }}>—</span> : c.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Reports Overview</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{filtered.length} of {reports.length} records</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search by problem, resident, barangay…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 260 }} />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>#</th>
                    <th style={TH}>Problem</th>
                    <th style={TH}>Resident</th>
                    <th style={TH}>Barangay</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Date</th>
                    <th style={TH}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading reports...</span>
                      </div>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '48px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No reports found</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Try adjusting your search or filter</div>
                      </div>
                    </td></tr>
                  ) : filtered.map((r, i) => {
                    const initials = r.residentName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                    return (
                      <tr key={r.id}
                        style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f9fafb'}>
                        <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ ...TD, fontWeight: 600, color: '#111827', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.problem || '—'}</div>
                        </td>
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e0e7ef', color: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: 500 }}>{r.residentName}</span>
                          </div>
                        </td>
                        <td style={TD}><span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.barangay || '—'}</span></td>
                        <td style={TD}><StatusBadge status={r.status} /></td>
                        <td style={{ ...TD, color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                        <td style={TD}>
                          <button onClick={() => setSelected(r)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1E3A5F', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      <ReportModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default AdminReports;
