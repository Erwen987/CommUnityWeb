import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import MaintenanceModeListener from '../../components/MaintenanceModeListener';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';
import Pagination from '../../components/Pagination';

const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

const sendNotificationEmail = async (payload) => {
  try { await supabase.functions.invoke('send-email', { body: payload }); } catch (_) {}
};

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 38, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:'50%', background:avatarColors[index%avatarColors.length], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{initials}</div>;
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });

const STATUS_CFG = {
  pending:          { bg:'#fef9c3', color:'#854d0e', dot:'#f59e0b', label:'Pending'          },
  in_progress:      { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6', label:'In Progress'      },
  resolved:         { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Resolved'         },
  rejected:         { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Rejected'         },
  ready_for_pickup: { bg:'#ede9fe', color:'#6d28d9', dot:'#8b5cf6', label:'Ready for Pickup' },
  claimed:          { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Claimed'          },
};
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:s.bg, color:s.color, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}><span style={{ width:5, height:5, borderRadius:'50%', background:s.dot }} />{s.label}</span>;
}

// ── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ resident, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const QUICK = [
    'Government ID is unclear or unreadable',
    'ID does not match the provided information',
    'ID appears to be expired',
    'Incomplete registration information',
    'Not a resident of this barangay',
  ];
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:460, boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Reject Registration</h3>
            <p style={{ fontSize:12, color:'#6b7280', margin:'2px 0 0' }}>{`${resident.first_name} ${resident.last_name}`.trim()}</p>
          </div>
        </div>

        <p style={{ fontSize:13, color:'#374151', marginBottom:12 }}>Quick reasons:</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setReason(q)}
              style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer', border: reason===q?'none':'1.5px solid #e5e7eb', background: reason===q?'#fee2e2':'#f9fafb', color: reason===q?'#dc2626':'#6b7280', transition:'all 0.15s' }}>
              {q}
            </button>
          ))}
        </div>

        <textarea
          value={reason} onChange={e => setReason(e.target.value)}
          rows={3} placeholder="Or type a custom reason..."
          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontFamily:'Poppins,sans-serif', resize:'vertical', outline:'none', boxSizing:'border-box', color:'#374151' }} />

        <p style={{ fontSize:11, color:'#9ca3af', margin:'8px 0 20px' }}>The reason will be sent to the resident via email. Their account will be deleted.</p>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            Cancel
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={loading || !reason.trim()}
            style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: loading||!reason.trim() ? '#fca5a5' : '#dc2626', color:'#fff', fontSize:14, fontWeight:700, cursor: loading||!reason.trim()?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ID Image Modal ────────────────────────────────────────────────────────────
function IdImageModal({ url, name, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth:600, maxHeight:'85vh', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:-36, right:0, background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>✕ Close</button>
        <img src={url} alt={`${name}'s Government ID`} style={{ maxWidth:'100%', maxHeight:'80vh', borderRadius:12, objectFit:'contain' }} />
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:8 }}>{name} — Government ID</p>
      </div>
    </div>
  );
}

// ── Activity Modal ─────────────────────────────────────────────────────────────
function ActivityModal({ resident, onClose }) {
  const [actTab,   setActTab]   = useState('reports');
  const [reports,  setReports]  = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!resident?.auth_id) return;
    setLoading(true);
    Promise.all([
      supabase.from('reports').select('*').eq('user_id', resident.auth_id).order('created_at', { ascending: false }),
      supabase.from('requests').select('*').eq('user_id', resident.auth_id).order('created_at', { ascending: false }),
    ]).then(([{ data: rpts }, { data: reqs }]) => {
      setReports(rpts || []);
      setRequests(reqs || []);
      setLoading(false);
    });
  }, [resident]);

  const name = `${resident.first_name||''} ${resident.last_name||''}`.trim();

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, width:640, maxWidth:'100%', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#f3f4f6,#fafafa)', padding:'20px 24px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'#6b7280', flexShrink:0 }}>
                {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#111827' }}>{name}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{resident.email}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
              <span style={{ color:'#9ca3af', fontWeight:600 }}>Deleted on </span>
              <span style={{ color:'#374151', fontWeight:700 }}>{fmt(resident.deleted_at)}</span>
            </div>
            {resident.reason && (
              <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:8, padding:'8px 12px', fontSize:12, flex:1, minWidth:0 }}>
                <span style={{ color:'#92400e', fontWeight:600 }}>Reason: </span>
                <span style={{ color:'#78350f' }}>{resident.reason}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#f8fafc' }}>
          {[{ key:'reports', label:`Reports (${reports.length})` }, { key:'requests', label:`Requests (${requests.length})` }].map(t => (
            <button key={t.key} onClick={() => setActTab(t.key)} style={{ flex:1, padding:'12px', border:'none', background:'none', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color: actTab===t.key?'#2563eb':'#9ca3af', borderBottom: actTab===t.key?'2px solid #2563eb':'2px solid transparent', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : actTab === 'reports' ? (
            reports.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No reports submitted.</div> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Problem','Description','Status','Date'].map(h => <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>)}</tr></thead>
                <tbody>{reports.map((r,i) => <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb' }}><td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.problem}</td><td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description||'—'}</td><td style={{ padding:'12px 16px' }}><StatusBadge status={r.status} /></td><td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmt(r.created_at)}</td></tr>)}</tbody>
              </table>
            )
          ) : (
            requests.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No document requests submitted.</div> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Document','Purpose','Status','Date'].map(h => <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>)}</tr></thead>
                <tbody>{requests.map((r,i) => <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb' }}><td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.document_type}</td><td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.purpose||'—'}</td><td style={{ padding:'12px 16px' }}><StatusBadge status={r.status} /></td><td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmt(r.created_at)}</td></tr>)}</tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function Residents() {
  const { barangay, barangayName, isCapitan, canManage, loading: profileLoading } = useOfficialProfile();
  const canAct = isCapitan || canManage;

  const [tab,              setTab]              = useState('pending');
  const [residents,        setResidents]        = useState([]);
  const [pendingResidents, setPendingResidents] = useState([]);
  const [deletedResidents, setDeletedResidents] = useState([]);
  const [fetching,         setFetching]         = useState(false);
  const [search,           setSearch]           = useState('');
  const [filter,           setFilter]           = useState('all');
  const [viewActivity,     setViewActivity]     = useState(null);
  const [viewIdImage,      setViewIdImage]      = useState(null);
  const [rejectTarget,     setRejectTarget]     = useState(null);
  const [actionLoading,    setActionLoading]    = useState(false);
  const [toast,            setToast]            = useState(null);
  const [page,             setPage]             = useState(1);
  const PAGE_SIZE = 5;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadResidents = useCallback(async () => {
    if (!barangay) return;
    setFetching(true);
    const [{ data: active }, { data: pending }, { data: deleted }] = await Promise.all([
      supabase.from('users')
        .select('id, first_name, last_name, email, phone, points, avatar_url, is_banned, ban_reason, created_at')
        .eq('barangay', barangay).eq('role', 'resident').eq('status', 'active')
        .order('first_name', { ascending: true }),
      supabase.from('users')
        .select('id, auth_id, first_name, last_name, email, phone, id_image_url, created_at')
        .eq('barangay', barangay).eq('role', 'resident').eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabase.from('deleted_accounts')
        .select('*').eq('barangay', barangay)
        .order('deleted_at', { ascending: false }),
    ]);
    setResidents(active || []);
    setPendingResidents(pending || []);
    setDeletedResidents(deleted || []);
    setFetching(false);
  }, [barangay]);

  useEffect(() => { loadResidents(); }, [loadResidents]);

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = async (resident) => {
    setActionLoading(true);
    const name = `${resident.first_name} ${resident.last_name}`.trim();
    const { error } = await supabase.from('users')
      .update({ status: 'active' })
      .eq('id', resident.id);
    if (!error) {
      await sendNotificationEmail({
        type: 'resident_approved',
        toEmail: resident.email,
        residentName: name,
        barangayName,
        barangay,
      });
      showToast(`${name} has been approved.`);
      loadResidents();
    } else {
      showToast('Failed to approve resident.', 'error');
    }
    setActionLoading(false);
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    const name = `${rejectTarget.first_name} ${rejectTarget.last_name}`.trim();
    try {
      await sendNotificationEmail({
        type: 'resident_rejected',
        toEmail: rejectTarget.email,
        residentName: name,
        barangayName,
        barangay,
        reason,
      });
      // Delete auth account so they can re-register
      if (rejectTarget.auth_id) {
        await supabase.functions.invoke('delete-auth-user', { body: { auth_id: rejectTarget.auth_id } });
      }
      // Delete user row
      await supabase.from('users').delete().eq('id', rejectTarget.id);
      showToast(`${name}'s registration has been rejected.`);
      setRejectTarget(null);
      loadResidents();
    } catch {
      showToast('Failed to reject resident.', 'error');
    }
    setActionLoading(false);
  };

  const rows = residents.map((r,i) => ({ ...r, name:`${r.first_name} ${r.last_name}`.trim(), index:i }));
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const matchFilter = filter==='all' || (filter==='active'&&!r.is_banned) || (filter==='banned'&&r.is_banned);
    return matchSearch && matchFilter;
  });

  const filteredDeleted = deletedResidents.filter(r => {
    const q = search.toLowerCase();
    const name = `${r.first_name||''} ${r.last_name||''}`.trim();
    return !q || name.toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q);
  });

  const filteredPending = pendingResidents.filter(r => {
    const q = search.toLowerCase();
    const name = `${r.first_name||''} ${r.last_name||''}`.trim();
    return !q || name.toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q);
  });

  const totalPages       = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedCurrent = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPagesDel    = Math.ceil(filteredDeleted.length / PAGE_SIZE);
  const paginatedDeleted = filteredDeleted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPagesPend   = Math.ceil(filteredPending.length / PAGE_SIZE);
  const paginatedPending = filteredPending.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const totalCount   = residents.length;
  const activeCount  = residents.filter(r => !r.is_banned).length;
  const bannedCount  = residents.filter(r =>  r.is_banned).length;
  const deletedCount = deletedResidents.length;
  const pendingCount = pendingResidents.length;

  const FILTERS = [
    { key:'all',    label:'All',    count:totalCount  },
    { key:'active', label:'Active', count:activeCount },
    { key:'banned', label:'Banned', count:bannedCount },
  ];

  const TH = { padding:'11px 20px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left', whiteSpace:'nowrap' };
  const TD = { padding:'14px 20px', fontSize:13, color:'#374151' };

  return (
    <div className="off-layout">
      <MaintenanceModeListener />
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {/* Toast */}
          {toast && (
            <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background: toast.type==='error'?'#dc2626':'#059669', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', animation:'slideUp 0.3s ease-out' }}>
              {toast.msg}
              <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
          )}

          {viewActivity && <ActivityModal resident={viewActivity} onClose={() => setViewActivity(null)} />}
          {viewIdImage  && <IdImageModal url={viewIdImage.url} name={viewIdImage.name} onClose={() => setViewIdImage(null)} />}
          {rejectTarget && <RejectModal resident={rejectTarget} onConfirm={handleReject} onCancel={() => setRejectTarget(null)} loading={actionLoading} />}

          {/* Page header */}
          <div style={{ marginBottom:24 }}>
            <h1 className="off-page-title">Residents</h1>
            <p className="off-page-sub" style={{ margin:0 }}>
              {barangayName ? `Barangay ${barangayName}` : 'Your barangay'} · Contact admin to ban or unban residents
            </p>
          </div>

          {/* Stat cards */}
          {(() => {
            const activeCard = tab === 'deleted' ? 'deleted' : tab === 'pending' ? 'pending' : filter;
            const cards = [
              { id:'pending', label:'Pending Approval', value:pendingCount, accent: pendingCount>0?'#d97706':'#9ca3af', iconBg: pendingCount>0?'#fef3c7':'#f3f4f6',
                onClick:() => { setTab('pending'); setSearch(''); setPage(1); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={pendingCount>0?'#d97706':'#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { id:'all',     label:'Total Residents',  value:totalCount,   accent:'#2563eb', iconBg:'#eff6ff',
                onClick:() => { setTab('current'); setFilter('all'); setSearch(''); setPage(1); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { id:'banned',  label:'Banned',           value:bannedCount,  accent:bannedCount>0?'#dc2626':'#9ca3af', iconBg:bannedCount>0?'#fee2e2':'#f3f4f6',
                onClick:() => { setTab('current'); setFilter('banned'); setSearch(''); setPage(1); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bannedCount>0?'#dc2626':'#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
              { id:'deleted', label:'Deleted Accounts', value:deletedCount, accent:'#6b7280', iconBg:'#f3f4f6',
                onClick:() => { setTab('deleted'); setSearch(''); setPage(1); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> },
            ];
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                {cards.map(c => {
                  const isActive = activeCard === c.id;
                  return (
                    <div key={c.id} onClick={c.onClick} style={{ background: isActive ? c.iconBg : '#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16, borderLeft:`4px solid ${c.accent}`, borderBottom: isActive ? `2px solid ${c.accent}` : '2px solid transparent', cursor:'pointer', transition:'background 0.15s', boxSizing:'border-box' }}>
                      <div style={{ width:46, height:46, borderRadius:12, background: isActive ? '#fff' : c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{c.icon}</div>
                      <div>
                        <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{c.label}</div>
                        <div style={{ fontSize:28, fontWeight:800, color:c.accent, lineHeight:1 }}>{c.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Tab switcher */}
          <div style={{ display:'flex', gap:0, marginBottom:0, background:'#fff', borderRadius:'16px 16px 0 0', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            {[
              { key:'pending', label:'Pending Approval', count:pendingCount, accent:'#d97706' },
              { key:'current', label:'Current Residents', count:totalCount, accent:'#2563eb' },
              { key:'deleted', label:'Deleted Accounts',  count:deletedCount, accent:'#6b7280' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilter('all'); setPage(1); }}
                style={{ flex:1, padding:'14px 20px', border:'none', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', background: tab===t.key?'#fff':'#f8fafc', color: tab===t.key?t.accent:'#9ca3af', borderBottom: tab===t.key?`2px solid ${t.accent}`:'2px solid transparent', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {t.label}
                <span style={{ padding:'1px 8px', borderRadius:999, background: tab===t.key?'rgba(0,0,0,0.07)':'#f1f5f9', color: tab===t.key?t.accent:'#9ca3af', fontSize:11, fontWeight:800 }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:'#fff', borderRadius:'0 0 16px 16px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>

            {/* Search + filter bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid #f1f5f9', gap:12, flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:'1 1 240px', maxWidth:340 }}>
                <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', boxSizing:'border-box', fontFamily:'Poppins,sans-serif' }} />
              </div>
              {tab === 'current' && (
                <div style={{ display:'flex', gap:6 }}>
                  {FILTERS.map(f => (
                    <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }} style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer', border: filter===f.key?'none':'1.5px solid #e5e7eb', background: filter===f.key?(f.key==='banned'?'#dc2626':f.key==='active'?'#059669':'#2563eb'):'#fff', color: filter===f.key?'#fff':'#6b7280' }}>
                      {f.label} <span style={{ marginLeft:6, padding:'1px 7px', borderRadius:999, background: filter===f.key?'rgba(255,255,255,0.25)':'#f1f5f9', color: filter===f.key?'#fff':'#9ca3af', fontSize:11, fontWeight:800 }}>{f.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            {fetching || profileLoading ? (
              <div style={{ padding:'60px 24px', textAlign:'center' }}>
                <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                <p style={{ color:'#9ca3af', fontSize:13 }}>Loading residents...</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>

            ) : tab === 'pending' ? (
              /* ── Pending Approval Tab ── */
              filteredPending.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <p style={{ fontWeight:700, color:'#374151', fontSize:15 }}>No pending registrations</p>
                  <p style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>All residents have been reviewed.</p>
                </div>
              ) : (
                <>
                  {!canAct && (
                    <div style={{ margin:'12px 24px 0', padding:'10px 14px', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, fontSize:12, color:'#92400e' }}>
                      You have view-only access. Only the Barangay Captain or officials with full access can approve or reject registrations.
                    </div>
                  )}
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Resident','Email','Phone','Government ID','Registered', canAct ? 'Actions' : ''].filter(Boolean).map(h => <th key={h} style={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {paginatedPending.map((r,i) => {
                          const name = `${r.first_name} ${r.last_name}`.trim();
                          return (
                            <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb' }}>
                              <td style={TD}>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                  <div style={{ width:38, height:38, borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#d97706', flexShrink:0 }}>
                                    {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{name}</div>
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, color:'#d97706', fontWeight:700, background:'#fef3c7', padding:'1px 8px', borderRadius:999 }}>
                                      <span style={{ width:4, height:4, borderRadius:'50%', background:'#d97706' }} />Pending
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...TD, color:'#6b7280' }}>{r.email}</td>
                              <td style={{ ...TD, color:'#6b7280' }}>{r.phone||'—'}</td>
                              <td style={TD}>
                                {r.id_image_url ? (
                                  <button onClick={() => setViewIdImage({ url: r.id_image_url, name })}
                                    style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    View ID
                                  </button>
                                ) : <span style={{ fontSize:12, color:'#9ca3af' }}>No ID uploaded</span>}
                              </td>
                              <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{r.created_at ? fmt(r.created_at) : '—'}</td>
                              {canAct && (
                                <td style={TD}>
                                  <div style={{ display:'flex', gap:6 }}>
                                    <button onClick={() => handleApprove(r)} disabled={actionLoading}
                                      style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#059669', color:'#fff', fontSize:12, fontWeight:700, cursor:actionLoading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', opacity:actionLoading?0.6:1 }}>
                                      Approve
                                    </button>
                                    <button onClick={() => setRejectTarget(r)} disabled={actionLoading}
                                      style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #fca5a5', background:'#fff', color:'#dc2626', fontSize:12, fontWeight:700, cursor:actionLoading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', opacity:actionLoading?0.6:1 }}>
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9' }}>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{filteredPending.length} pending registration{filteredPending.length!==1?'s':''}</span>
                  </div>
                  <Pagination page={page} totalPages={totalPagesPend} onPage={setPage} />
                </>
              )

            ) : tab === 'current' ? (
              /* ── Current Residents Tab ── */
              filtered.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <p style={{ fontWeight:700, color:'#374151', fontSize:15 }}>No residents found</p>
                  <p style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>{search ? 'Try a different search term.' : 'No residents have been approved yet.'}</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Resident','Email','Phone','Points','Status','Joined'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {paginatedCurrent.map((r,i) => (
                          <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb', transition:'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor='#eff6ff'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                            <td style={TD}>
                              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                <ResidentAvatar url={r.avatar_url} name={r.name} size={38} index={r.index} />
                                <div>
                                  <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{r.name}</div>
                                  <div style={{ fontSize:11, color:'#9ca3af' }}>Resident</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...TD, color:'#6b7280' }}>{r.email}</td>
                            <td style={{ ...TD, color:'#6b7280' }}>{r.phone||'—'}</td>
                            <td style={TD}><span style={{ fontWeight:700, color:'#2563eb', fontSize:14 }}>{r.points??0}</span></td>
                            <td style={TD}>
                              {r.is_banned ? (
                                <div>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fee2e2', color:'#dc2626', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', flexShrink:0 }} />Banned
                                  </span>
                                  {r.ban_reason && <div style={{ fontSize:11, color:'#9ca3af', marginTop:4, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.ban_reason}>{r.ban_reason}</div>}
                                </div>
                              ) : (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#dcfce7', color:'#16a34a', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />Active
                                </span>
                              )}
                            </td>
                            <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{r.created_at ? fmt(r.created_at) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{filtered.length} of {totalCount} resident{totalCount!==1?'s':''}</span>
                    {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ fontSize:12, color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'Poppins,sans-serif' }}>Clear search</button>}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={setPage} />
                </>
              )

            ) : (
              /* ── Deleted Tab ── */
              filteredDeleted.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </div>
                  <p style={{ fontWeight:700, color:'#374151', fontSize:15 }}>No deleted accounts</p>
                  <p style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>No residents from this barangay have deleted their accounts.</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Resident','Email','Reason for Deletion','Deleted On','Activity'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {paginatedDeleted.map((r,i) => {
                          const name = `${r.first_name||''} ${r.last_name||''}`.trim();
                          return (
                            <tr key={r.id||r.auth_id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb', transition:'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f3f4f6'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                  <div style={{ width:38, height:38, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#9ca3af', flexShrink:0 }}>
                                    {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:600, color:'#374151', fontSize:13 }}>{name}</div>
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, color:'#6b7280', fontWeight:600 }}>
                                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af' }} />Deleted
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...TD, color:'#6b7280' }}>{r.email||'—'}</td>
                              <td style={{ ...TD, color:'#6b7280', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }} title={r.reason}>{r.reason||'—'}</td>
                              <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{r.deleted_at?fmt(r.deleted_at):'—'}</td>
                              <td style={TD}>
                                <button onClick={() => setViewActivity(r)}
                                  style={{ padding:'5px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  View Activity
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9' }}>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{filteredDeleted.length} deleted account{filteredDeleted.length!==1?'s':''}</span>
                  </div>
                  <Pagination page={page} totalPages={totalPagesDel} onPage={setPage} />
                </>
              )
            )}
          </div>

          {/* Info note */}
          {tab==='current' && bannedCount>0 && (
            <div style={{ marginTop:16, padding:'14px 18px', borderRadius:10, background:'#fef9c3', border:'1px solid #fde047', fontSize:13, color:'#854d0e', display:'flex', alignItems:'center', gap:10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span><strong>{bannedCount} banned resident{bannedCount!==1?'s':''}</strong> in your barangay. Only the system admin can ban or unban residents.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Residents;
