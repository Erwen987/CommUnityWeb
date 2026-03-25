import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const avatarColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 30, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}
function AccountStatusBadge({ status }) {
  if (status === 'banned')  return <span style={{ fontSize:10, color:'#dc2626', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', flexShrink:0 }} />Banned</span>;
  if (status === 'deleted') return <span style={{ fontSize:10, color:'#6b7280', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af', flexShrink:0 }} />Deleted</span>;
  return <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />Active</span>;
}
function StarDisplay({ rating }) {
  if (!rating) return <span style={{ fontSize:10, color:'#d1d5db', fontStyle:'italic' }}>No rating</span>;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= rating ? '#f59e0b' : '#e5e7eb'} stroke={s <= rating ? '#d97706' : '#d1d5db'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize:10, color:'#6b7280', marginLeft:3, fontWeight:600 }}>{rating}/5</span>
    </div>
  );
}

const STATUS_CFG = {
  pending:          { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'           },
  ready_for_pickup: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Ready for Pickup'  },
  claimed:          { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Claimed'           },
  rejected:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected'          },
};

const TH = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '12px 12px', fontSize: 13, color: '#374151' };

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}
    </span>
  );
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// ── CSV Export ─────────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  const cols = [
    { h: 'Ref No.',        v: r => r.reference_number || '' },
    { h: 'Resident',       v: r => r.residentName },
    { h: 'Document Type',  v: r => r.document_type || '' },
    { h: 'Purpose',        v: r => r.purpose || '' },
    { h: 'Payment Method', v: r => r.payment_method || '' },
    { h: 'Status',         v: r => r.status },
    { h: 'Rating',         v: r => r.rating ?? '' },
    { h: 'Date',           v: r => r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH') : '' },
  ];
  const csv = [cols.map(c => c.h).join(','), ...rows.map(r => cols.map(c => `"${String(c.v(r)).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

// ── Detail Modal (centered popup) ─────────────────────────────────────────────
function RequestModal({ req, onClose }) {
  if (!req) return null;
  const shortId = req.reference_number
    ? 'REQ-' + req.reference_number.slice(-6).toUpperCase()
    : '—';
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:560, maxWidth:'100%', maxHeight:'90vh', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'#1f2937' }}>Request Details</div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2, fontFamily:'monospace', fontWeight:600 }}>{shortId}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Resident row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', borderRadius:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <ResidentAvatar url={req.residentAvatar} name={req.residentName} size={48} />
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#111827' }}>{req.residentName}</div>
                <AccountStatusBadge status={req.accountStatus} />
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>

          {/* Fields grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Document Type',  value: req.document_type },
              { label:'Purpose',        value: req.purpose },
              { label:'Barangay',       value: req.barangay },
              { label:'Payment Method', value: req.payment_method?.replace(/_/g,' ') },
              { label:'Date Submitted', value: req.created_at ? fmt(req.created_at) : '—' },
              { label:'Ref Number',     value: req.reference_number || '—' },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:13, color:'#111827', lineHeight:1.5, fontWeight:500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Rating */}
          {req.rating ? (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Rating</div>
              <StarDisplay rating={req.rating} />
            </div>
          ) : null}

          {/* Rejection reason */}
          {req.status === 'rejected' && req.rejection_reason && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Rejection Reason</div>
              <div style={{ fontSize:13, color:'#991b1b', lineHeight:1.6 }}>{req.rejection_reason}</div>
            </div>
          )}

          {/* Proof image */}
          {req.proof_url && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Proof of Payment</div>
              <img src={req.proof_url} alt="Proof" style={{ width:'100%', borderRadius:12, border:'1px solid #e5e7eb', maxHeight:240, objectFit:'cover' }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
          <button onClick={onClose}
            style={{ padding:'9px 24px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Requests() {
  const { barangay, isCapitan, canManage, loading: profileLoading } = useOfficialProfile();
  const canAct = isCapitan || canManage;
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [updatingId, setUpdatingId]     = useState(null);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [page,   setPage]               = useState(1);
  const PAGE_SIZE = 5;
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, docType, refNo }
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [rejectError, setRejectError]     = useState('');
  const [drawerRequest, setDrawerRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const [{ data: requestsData }, { data: usersData }] = await Promise.all([
      supabase.from('requests').select('*').eq('barangay', barangay).order('created_at', { ascending: false }),
      supabase.from('users').select('auth_id, first_name, last_name, avatar_url, is_banned').eq('barangay', barangay),
    ]);
    const userMap = {};
    (usersData || []).forEach(u => { userMap[u.auth_id] = { name: `${u.first_name||''} ${u.last_name||''}`.trim(), avatar_url: u.avatar_url, is_banned: u.is_banned }; });
    setRequests((requestsData||[]).map(r => ({
      ...r,
      residentName:   userMap[r.user_id]?.name || r.resident_name || 'Deleted Account',
      residentAvatar: userMap[r.user_id]?.avatar_url || null,
      accountStatus:  !userMap[r.user_id] ? 'deleted' : userMap[r.user_id].is_banned ? 'banned' : 'active',
    })));
    setLoading(false);
  }, [barangay]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Real-time subscription
  useEffect(() => {
    if (!barangay) return;
    const channel = supabase
      .channel(`requests-realtime-${barangay}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [barangay, fetchRequests]);

  // Reset to page 1 on filter/search change
  useEffect(() => setPage(1), [filter, search]);

  const handleStatusChange = (id, status) => {
    if (status === 'rejected') {
      const req = requests.find(r => r.id === id);
      setConfirmTarget({ id, docType: req?.document_type, refNo: req?.reference_number, residentName: req?.residentName });
    } else {
      updateStatus(id, status, null);
    }
  };

  const proceedToReject = () => {
    setRejectReason('');
    setRejectError('');
    setRejectModal(confirmTarget);
    setConfirmTarget(null);
  };

  const updateStatus = async (id, status, reason) => {
    setUpdatingId(id);
    await supabase.from('requests').update({ status, rejection_reason: reason ?? null }).eq('id', id);
    setUpdatingId(null);
    fetchRequests();
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { setRejectError('Please enter a reason for rejection.'); return; }
    await updateStatus(rejectModal.id, 'rejected', rejectReason.trim());
    setRejectModal(null);
  };

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.document_type?.toLowerCase().includes(search.toLowerCase()) || r.reference_number?.toLowerCase().includes(search.toLowerCase()) || r.residentName?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = s => requests.filter(r => r.status === s).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const STATS = [
    { label: 'Total Requests',   filterKey: 'all',             value: requests.length,          accent: '#7c3aed', iconBg: '#ede9fe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
    { label: 'Pending',          filterKey: 'pending',         value: count('pending'),          accent: '#f59e0b', iconBg: '#fef3c7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Ready for Pickup', filterKey: 'ready_for_pickup', value: count('ready_for_pickup'), accent: '#8b5cf6', iconBg: '#ede9fe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label: 'Claimed',          filterKey: 'claimed',         value: count('claimed'),          accent: '#16a34a', iconBg: '#dcfce7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Rejected',         filterKey: 'rejected',        value: count('rejected'),         accent: '#ef4444', iconBg: '#fee2e2',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <>
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
              <div key={c.label} onClick={() => setFilter(c.filterKey)}
                style={{ background: filter === c.filterKey ? c.iconBg : '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${c.accent}`, cursor: 'pointer', transition: 'background 0.15s', minHeight: 72, boxSizing: 'border-box', borderBottom: filter === c.filterKey ? `2px solid ${c.accent}` : '2px solid transparent' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: filter === c.filterKey ? '#fff' : c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>{c.icon}</div>
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
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{filtered.length} of {requests.length} records · page {page} of {totalPages || 1}</div>
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
                  <option value="pending">Pending</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="claimed">Claimed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button onClick={() => exportCSV(filtered, `requests_${barangay || 'all'}_${new Date().toISOString().slice(0,10)}.csv`)}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', border:'1.5px solid #e5e7eb', borderRadius:9, background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, width: '10%' }}>Ref No.</th>
                    <th style={{ ...TH, width: '15%' }}>Resident</th>
                    <th style={{ ...TH, width: '15%' }}>Document</th>
                    <th style={{ ...TH, width: '13%' }}>Purpose</th>
                    <th style={{ ...TH, width: '10%' }}>Payment</th>
                    <th style={{ ...TH, width: '7%' }}>Proof</th>
                    <th style={{ ...TH, width: '12%' }}>Status</th>
                    <th style={{ ...TH, width: '10%' }}>Rating</th>
                    <th style={{ ...TH, width: '9%'  }}>Date</th>
                    <th style={{ ...TH, width: '13%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: 13 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>
                        Loading requests...
                      </div>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '48px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No requests found</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{search || filter !== 'all' ? 'Try adjusting your search or filter.' : `No requests submitted for ${barangay || 'your barangay'} yet.`}</div>
                      </div>
                    </td></tr>
                  ) : paginated.map((r, i) => (
                    <tr key={r.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor= i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                      <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1E3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reference_number}</td>
                      <td style={{ ...TD }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={30} index={i} />
                          <div style={{ overflow: 'hidden', minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.residentName}</div>
                            <AccountStatusBadge status={r.accountStatus} />
                          </div>
                        </div>
                      </td>
                      <td style={{ ...TD, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.document_type}</td>
                      <td style={{ ...TD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{r.purpose}</td>
                      <td style={{ ...TD, overflow: 'hidden' }}>
                        <span style={{ background: '#f1f5f9', color: '#374151', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.payment_method?.replace(/_/g, ' ')}
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
                      <td style={TD}><StarDisplay rating={r.rating} /></td>
                      <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmt(r.created_at)}</td>
                      <td style={TD}>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <button onClick={() => setDrawerRequest(r)}
                            style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid #bfdbfe', background:'#eff6ff', color:'#1E3A5F', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Details
                          </button>
                          {r.status === 'claimed' || r.status === 'rejected' ? (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#9ca3af', fontWeight:600, background:'#f1f5f9', padding:'4px 10px', borderRadius:6 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Closed
                            </span>
                          ) : canAct ? (
                            <>
                              {r.status === 'pending' && (
                                <button onClick={() => handleStatusChange(r.id, 'ready_for_pickup')} disabled={updatingId===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, border:'1.5px solid #ddd6fe', background:'#f5f3ff', color:'#6d28d9', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                  Ready for Pickup
                                </button>
                              )}
                              {r.status === 'ready_for_pickup' && (
                                <button onClick={() => handleStatusChange(r.id, 'claimed')} disabled={updatingId===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, border:'1.5px solid #bbf7d0', background:'#f0fdf4', color:'#15803d', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  Mark Claimed
                                </button>
                              )}
                              <button onClick={() => handleStatusChange(r.id, 'rejected')} disabled={updatingId===r.id}
                                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, border:'1.5px solid #fecaca', background:'#fff5f5', color:'#dc2626', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Reject
                              </button>
                            </>
                          ) : (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#9ca3af', fontWeight:600, background:'#f1f5f9', padding:'4px 10px', borderRadius:6 }}>
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: page === 1 ? '#f9fafb' : '#fff', color: page === 1 ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 12, cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) => p === '…'
                        ? <span key={`e-${i}`} style={{ padding: '6px 4px', color: '#9ca3af', fontSize: 12 }}>…</span>
                        : <button key={p} onClick={() => setPage(p)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {p}
                          </button>
                      )
                    }
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: page === totalPages ? '#f9fafb' : '#fff', color: page === totalPages ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 12, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>

      {/* Step 1 — Confirmation dialog */}
      {confirmTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmTarget(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:420, maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg, #fef2f2, #fff1f1)', padding:'24px 24px 20px', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'#fee2e2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#111827' }}>Reject this request?</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.5 }}>
                  You are about to reject <strong style={{ color:'#374151' }}>{confirmTarget.docType}</strong>
                  {confirmTarget.residentName && <> from <strong style={{ color:'#374151' }}>{confirmTarget.residentName}</strong></>}. You will need to provide a reason.
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmTarget(null)}
                style={{ padding:'9px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={proceedToReject}
                style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Rejection modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, width: 480, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fff1f1)', padding: '20px 24px 16px', borderBottom: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>Reject Document Request</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>The resident will be notified with your reason</div>
                  </div>
                </div>
                <button onClick={() => setRejectModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6, lineHeight: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Document info pill */}
              {rejectModal.docType && (
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 12px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{rejectModal.docType}</span>
                  {rejectModal.refNo && <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>• {rejectModal.refNo}</span>}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px' }}>

              {/* Quick reason chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick Reasons</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Incomplete requirements',
                    'Invalid proof of payment',
                    'Incorrect document type',
                    'Duplicate request',
                    'Insufficient information',
                  ].map(r => (
                    <button key={r} onClick={() => { setRejectReason(r); setRejectError(''); }}
                      style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${rejectReason === r ? '#dc2626' : '#e5e7eb'}`, background: rejectReason === r ? '#fee2e2' : '#f9fafb', color: rejectReason === r ? '#dc2626' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Or write a custom reason
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe why this request is being rejected..."
                  value={rejectReason}
                  onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
                  maxLength={300}
                  style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${rejectError ? '#ef4444' : '#e5e7eb'}`, borderRadius: 10, fontSize: 13, color: '#374151', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {rejectError
                    ? <span style={{ color: '#ef4444', fontSize: 12 }}>{rejectError}</span>
                    : <span />}
                  <span style={{ fontSize: 11, color: rejectReason.length > 260 ? '#f59e0b' : '#d1d5db' }}>{rejectReason.length}/300</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmReject}
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
      <RequestModal req={drawerRequest} onClose={() => setDrawerRequest(null)} />
    </>
  );
}

export default Requests;
