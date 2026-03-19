import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const STATUS_CFG = {
  reviewing:        { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Reviewing'        },
  processing:       { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Processing'        },
  ready_for_pickup: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Ready for Pickup'  },
  released:         { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Released'          },
  rejected:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected'          },
};

const TH = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '13px 16px', fontSize: 13, color: '#374151' };

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.reviewing;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

function Requests() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');

  const fetchRequests = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data: users } = await supabase.from('users').select('auth_id').eq('barangay', barangay);
    const userIds = (users || []).map(u => u.auth_id);
    if (userIds.length === 0) { setRequests([]); setLoading(false); return; }
    const { data } = await supabase.from('requests').select('*').in('user_id', userIds).order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [barangay]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('requests').update({ status }).eq('id', id);
    setUpdatingId(null);
    fetchRequests();
  };

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.document_type?.toLowerCase().includes(search.toLowerCase()) || r.reference_number?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = s => requests.filter(r => r.status === s).length;

  const STATS = [
    { label: 'Total Requests',   value: requests.length,          accent: '#7c3aed', iconBg: '#ede9fe',
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
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Requests</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!profileLoading && barangay ? `Showing document requests for Barangay ${barangay}` : 'Monitor and manage barangay document requests'}
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {STATS.map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
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
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{filtered.length} of {requests.length} records</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search document or ref no…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 220 }} />
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
                    <th style={TH}>Ref No.</th>
                    <th style={TH}>Document</th>
                    <th style={TH}>Purpose</th>
                    <th style={TH}>Payment</th>
                    <th style={TH}>Proof</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Date</th>
                    <th style={TH}>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: 13 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>
                        Loading requests...
                      </div>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '48px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No requests found</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{search || filter !== 'all' ? 'Try adjusting your search or filter.' : `No requests submitted for ${barangay || 'your barangay'} yet.`}</div>
                      </div>
                    </td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={r.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor= i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1E3A5F' }}>{r.reference_number}</td>
                      <td style={{ ...TD, fontWeight: 600, color: '#111827' }}>{r.document_type}</td>
                      <td style={{ ...TD, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{r.purpose}</td>
                      <td style={{ ...TD, fontSize: 12 }}>
                        <span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                          {r.payment_method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={TD}>
                        {r.proof_url
                          ? <a href={r.proof_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1E3A5F', fontSize: 12, fontWeight: 600, background: '#e0e7ef', padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>View
                            </a>
                          : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={TD}><StatusBadge status={r.status} /></td>
                      <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmt(r.created_at)}</td>
                      <td style={TD}>
                        <select value={r.status} disabled={updatingId===r.id} onChange={e => updateStatus(r.id, e.target.value)}
                          style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', background: '#fff', color: '#374151', opacity: updatingId===r.id ? 0.5 : 1, outline: 'none' }}>
                          <option value="reviewing">Reviewing</option>
                          <option value="processing">Processing</option>
                          <option value="ready_for_pickup">Ready for Pickup</option>
                          <option value="released">Released</option>
                          <option value="rejected">Rejected</option>
                        </select>
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

export default Requests;
