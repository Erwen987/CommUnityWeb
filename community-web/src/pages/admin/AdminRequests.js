import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

const STATUS_CFG = {
  pending:          { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'          },
  ready_for_pickup: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Ready for Pickup' },
  claimed:          { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Claimed'          },
  rejected:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected'         },
};

const TH = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '12px 12px', fontSize: 13, color: '#374151' };

const avatarColors = ['#1E3A5F', '#0f766e', '#7c3aed', '#c2410c', '#0369a1'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 30, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading requests…</span>
    </div>
  );
}

function RequestModal({ req, onClose }) {
  if (!req) return null;
  const s = STATUS_CFG[req.status] || STATUS_CFG.pending;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1f2937' }}>Request Details</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }}>{req.shortId}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Status</span>
            <StatusBadge status={req.status} />
          </div>

          {/* Core fields */}
          {[
            { label: 'Document Type',   value: req.document_type },
            { label: 'Resident',        value: req.residentName },
            { label: 'Barangay',        value: req.barangay },
            { label: 'Purpose',         value: req.purpose },
            { label: 'Payment Method',  value: req.payment_method },
            { label: 'Reference No.',   value: req.reference_number || '—' },
            { label: 'Date Submitted',  value: req.dateLabel },
          ].map(({ label, value }) => value ? (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1f2937', fontWeight: 600, textAlign: 'right' }}>{value}</span>
            </div>
          ) : null)}

          {/* Rejection reason */}
          {req.status === 'rejected' && req.rejection_reason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Rejection Reason</div>
              <div style={{ fontSize: 13, color: '#991b1b' }}>{req.rejection_reason}</div>
            </div>
          )}

          {/* Proof of payment */}
          {req.proof_url && (
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Proof of Payment</div>
              <img src={req.proof_url} alt="Proof" style={{ width: '100%', borderRadius: 10, border: '1px solid #e5e7eb', objectFit: 'cover', maxHeight: 280 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminRequests() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: reqs }, { data: users }] = await Promise.all([
        supabase.from('requests').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('auth_id, first_name, last_name, avatar_url'),
      ]);

      const userMap = {};
      (users || []).forEach(u => { userMap[u.auth_id] = { name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), avatar_url: u.avatar_url }; });

      const rows = (reqs || []).map(r => ({
        ...r,
        residentName: userMap[r.user_id]?.name || 'Unknown Resident',
        residentAvatar: userMap[r.user_id]?.avatar_url || null,
        shortId: `REQ-${r.id.slice(0, 6).toUpperCase()}`,
        dateLabel: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      }));

      setRequests(rows);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.document_type?.toLowerCase().includes(q) || r.residentName.toLowerCase().includes(q) || r.barangay?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const count = s => requests.filter(r => r.status === s).length;

  const STATS = [
    { label: 'Total Requests',   value: requests.length,          accent: '#7c3aed', iconBg: '#ede9fe', filterKey: 'all',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
    { label: 'Pending',          value: count('pending'),          accent: '#f59e0b', iconBg: '#fef3c7', filterKey: 'pending',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Ready for Pickup', value: count('ready_for_pickup'), accent: '#8b5cf6', iconBg: '#ede9fe', filterKey: 'ready_for_pickup',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label: 'Claimed',          value: count('claimed'),          accent: '#16a34a', iconBg: '#dcfce7', filterKey: 'claimed',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Rejected',         value: count('rejected'),         accent: '#ef4444', iconBg: '#fee2e2', filterKey: 'rejected',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Requests</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Monitor and manage barangay document requests</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {STATS.map(c => (
              <div key={c.label} onClick={() => setFilter(c.filterKey)}
                style={{ background: filter === c.filterKey ? c.iconBg : '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${c.accent}`, cursor: 'pointer', transition: 'background 0.15s', minHeight: 72, boxSizing: 'border-box', borderBottom: filter === c.filterKey ? `2px solid ${c.accent}` : '2px solid transparent' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: filter === c.filterKey ? '#fff' : c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{loading ? '—' : c.value}</div>
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
                  <input type="text" placeholder="Search by document, resident or barangay…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 260 }} />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="claimed">Claimed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? <Spinner /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, width: '9%' }}>Request ID</th>
                      <th style={{ ...TH, width: '20%' }}>Document</th>
                      <th style={{ ...TH, width: '18%' }}>Resident</th>
                      <th style={{ ...TH, width: '11%' }}>Barangay</th>
                      <th style={{ ...TH, width: '11%' }}>Payment</th>
                      <th style={{ ...TH, width: '14%' }}>Status</th>
                      <th style={{ ...TH, width: '11%' }}>Date</th>
                      <th style={{ ...TH, width: '6%' }}>Action</th>
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
                      <tr key={r.id}
                        style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                        <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.shortId}</td>
                        <td style={{ ...TD, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.document_type}</td>
                        <td style={{ ...TD, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={30} index={i} />
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.residentName}</span>
                          </div>
                        </td>
                        <td style={{ ...TD, overflow: 'hidden' }}><span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.barangay || '—'}</span></td>
                        <td style={{ ...TD, overflow: 'hidden' }}><span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.payment_method || '—'}</span></td>
                        <td style={TD}><StatusBadge status={r.status} /></td>
                        <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{r.dateLabel}</td>
                        <td style={TD}>
                          <button onClick={() => setSelected(r)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1E3A5F', border: '1px solid #bfdbfe', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && <RequestModal req={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default AdminRequests;
