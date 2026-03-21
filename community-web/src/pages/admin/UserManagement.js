import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

// ── EmailJS ───────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID            = 'service_0pp2139';
const EMAILJS_APPROVAL_TEMPLATE_ID  = 'template_2r9u3vk';
const EMAILJS_REJECTION_TEMPLATE_ID = 'template_xpisoa5';
const EMAILJS_PUBLIC_KEY            = 'MYsqjprp39Rb43jVR';

const sendEmail = async (templateId, toEmail, barangay) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID, template_id: templateId,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: { to_email: toEmail, barangay },
      }),
    });
  } catch (_) {}
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const TH  = { padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD  = { padding: '14px 20px', fontSize: 13, color: '#374151' };

const _avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];
function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}
function ResidentAvatar({ url, name, size = 38, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: '50%', background: _avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>{initials}</div>;
}
function OfficialAvatar({ name, color }) {
  return <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{name?.[0]?.toUpperCase() || '?'}</div>;
}

function StatusBadge({ status }) {
  const map = {
    pending:  { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'  },
    approved: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected' },
    banned:   { bg: '#fee2e2', color: '#dc2626', dot: '#dc2626', label: 'Banned'   },
    active:   { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e', label: 'Active'   },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>{sub}</div>
    </div>
  );
}

// ── Ban modal ─────────────────────────────────────────────────────────────────
function BanModal({ target, type, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const label = type === 'official' ? target?.barangay_name : target?.name;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'morphIn 0.25s ease-out' }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Ban {type === 'official' ? 'Official' : 'Resident'}</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>This will block their access immediately</p>
          </div>
        </div>

        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', margin: '16px 0', fontSize: 13, color: '#374151' }}>
          <span style={{ color: '#6b7280' }}>Account: </span>
          <strong>{label}</strong>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
          Reason for ban <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <textarea
          rows={3}
          placeholder="e.g. Repeated spam reports, abusive behavior, false information..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontFamily: 'Poppins, sans-serif', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', color: '#374151', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#dc2626'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>The reason will be shown to the user when they try to log in.</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'background 0.15s' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason.trim())} disabled={!reason.trim() || loading} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: !reason.trim() || loading ? '#fca5a5' : '#dc2626', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: !reason.trim() || loading ? 'not-allowed' : 'pointer', color: '#fff', transition: 'background 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Banning...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Confirm Ban</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unban modal ───────────────────────────────────────────────────────────────
function UnbanModal({ target, type, onConfirm, onCancel, loading }) {
  const label = type === 'official' ? target?.barangay_name : target?.name;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Unban {type === 'official' ? 'Official' : 'Resident'}</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Restore their access to the platform</p>
          </div>
        </div>

        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', margin: '16px 0', fontSize: 13, color: '#374151' }}>
          <span style={{ color: '#6b7280' }}>Account: </span>
          <strong>{label}</strong>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280' }}>They will be able to log in and use the platform again once unbanned.</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: loading ? '#6ee7b7' : '#059669', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Unbanning...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Confirm Unban</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────
function FilterPills({ value, onChange, bannedCount }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[
        { k: 'all',    label: 'All' },
        { k: 'active', label: 'Active' },
        { k: 'banned', label: bannedCount > 0 ? `Banned (${bannedCount})` : 'Banned' },
      ].map(f => (
        <button key={f.k} onClick={() => onChange(f.k)} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12,
          fontFamily: 'Poppins, sans-serif', fontWeight: 600, cursor: 'pointer',
          border: value === f.k ? 'none' : '1.5px solid #e5e7eb',
          background: value === f.k
            ? f.k === 'banned' ? '#dc2626' : '#2563eb'
            : '#fff',
          color: value === f.k ? '#fff' : '#6b7280',
          transition: 'all 0.15s',
        }}>{f.label}</button>
      ))}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#dc2626' : '#059669',
      color: '#fff', padding: '13px 28px', borderRadius: 12,
      fontSize: 14, fontWeight: 600, zIndex: 3000,
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {type === 'error'
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {msg}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function UserManagement() {
  const [tab,       setTab]       = useState('pending');
  const [pending,   setPending]   = useState([]);
  const [officials, setOfficials] = useState([]);
  const [residents, setResidents] = useState([]);
  const [statusId,  setStatusId]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [offFilter, setOffFilter] = useState('all');
  const [resFilter, setResFilter] = useState('all');

  const [banTarget,     setBanTarget]     = useState(null);
  const [unbanTarget,   setUnbanTarget]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    const [{ data: p }, { data: o }, { data: r }] = await Promise.all([
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at').eq('status','pending').order('created_at',{ascending:true}),
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at,status,ban_reason').in('status',['approved','banned']).order('created_at',{ascending:true}),
      supabase.from('users').select('id,first_name,last_name,email,barangay,created_at,avatar_url,is_banned,ban_reason').eq('role','resident').order('created_at',{ascending:false}),
    ]);
    setPending(p  || []);
    setOfficials(o || []);
    setResidents((r || []).map((row, i) => ({ ...row, name: `${row.first_name||''} ${row.last_name||''}`.trim(), index: i })));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    setStatusId(id);
    const { data: updated } = await supabase.from('officials').update({ status }).eq('id', id).select('email,barangay').single();
    if (updated) {
      if (status === 'approved') await sendEmail(EMAILJS_APPROVAL_TEMPLATE_ID,  updated.email, updated.barangay);
      if (status === 'rejected') await sendEmail(EMAILJS_REJECTION_TEMPLATE_ID, updated.email, updated.barangay);
    }
    setStatusId(null);
    fetchAll();
  };

  const handleBan = async (reason) => {
    const { row, type } = banTarget;
    setActionLoading(true);
    let err;
    if (type === 'official') {
      const { error } = await supabase.from('officials').update({ status: 'banned', ban_reason: reason }).eq('id', row.id);
      err = error;
    } else {
      const { error } = await supabase.from('users').update({ is_banned: true, ban_reason: reason, banned_at: new Date().toISOString() }).eq('id', row.id);
      err = error;
    }
    setActionLoading(false);
    setBanTarget(null);
    if (err) { showToast('Failed to ban account. Please try again.', 'error'); return; }
    showToast(`${type === 'official' ? row.barangay_name : row.name} has been banned.`);
    fetchAll();
  };

  const handleUnban = async () => {
    const { row, type } = unbanTarget;
    setActionLoading(true);
    let err;
    if (type === 'official') {
      const { error } = await supabase.from('officials').update({ status: 'approved', ban_reason: null }).eq('id', row.id);
      err = error;
    } else {
      const { error } = await supabase.from('users').update({ is_banned: false, ban_reason: null, banned_at: null }).eq('id', row.id);
      err = error;
    }
    setActionLoading(false);
    setUnbanTarget(null);
    if (err) { showToast('Failed to unban account. Please try again.', 'error'); return; }
    showToast(`${type === 'official' ? row.barangay_name : row.name} has been unbanned.`);
    fetchAll();
  };

  // Filtered lists
  const fOfficials = officials
    .filter(o => !search || o.barangay_name?.toLowerCase().includes(search.toLowerCase()) || o.email?.toLowerCase().includes(search.toLowerCase()))
    .filter(o => offFilter === 'all' ? true : offFilter === 'active' ? o.status === 'approved' : o.status === 'banned');

  const fPending = pending.filter(r => !search || r.barangay_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));

  const fResidents = residents
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()) || r.barangay?.toLowerCase().includes(search.toLowerCase()))
    .filter(r => resFilter === 'all' ? true : resFilter === 'active' ? !r.is_banned : r.is_banned);

  const approvedCount  = officials.filter(o => o.status === 'approved').length;
  const bannedOffCount = officials.filter(o => o.status === 'banned').length;
  const bannedResCount = residents.filter(r => r.is_banned).length;

  const TABS = [
    { key: 'pending',   label: 'Pending',    count: pending.length,   activeColor: '#d97706', activeBg: '#fef3c7' },
    { key: 'officials', label: 'Officials',   count: officials.length, activeColor: '#16a34a', activeBg: '#dcfce7' },
    { key: 'residents', label: 'Residents',   count: residents.length, activeColor: '#2563eb', activeBg: '#eff6ff' },
  ];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title">User Management</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Approve officials, manage accounts, and control platform access</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Pending Approvals',  value: pending.length,            accent: '#f59e0b', iconBg: '#fef3c7', vc: pending.length > 0 ? '#d97706' : '#1f2937',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { label: 'Active Officials',   value: approvedCount,             accent: '#16a34a', iconBg: '#dcfce7', vc: '#1f2937',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
              { label: 'Registered Residents', value: residents.length,        accent: '#2563eb', iconBg: '#eff6ff', vc: '#1f2937',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { label: 'Banned Accounts',    value: bannedOffCount + bannedResCount, accent: '#dc2626', iconBg: '#fee2e2', vc: bannedOffCount + bannedResCount > 0 ? '#dc2626' : '#1f2937',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: c.vc, lineHeight: 1 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
              {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif', fontWeight: active ? 700 : 500, color: active ? t.activeColor : '#6b7280', borderBottom: active ? `2.5px solid ${t.activeColor}` : '2.5px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
                    {t.label}
                    <span style={{ background: active ? t.activeBg : '#f1f5f9', color: active ? t.activeColor : '#9ca3af', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* Search + filter row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text"
                    placeholder={tab === 'residents' ? 'Search name, email, barangay…' : 'Search barangay or email…'}
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
                  />
                </div>
                {tab === 'officials' && <FilterPills value={offFilter} onChange={setOffFilter} bannedCount={bannedOffCount} />}
                {tab === 'residents' && <FilterPills value={resFilter} onChange={setResFilter} bannedCount={bannedResCount} />}
              </div>

              {/* ── PENDING ── */}
              {tab === 'pending' && (
                fPending.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      title="No pending approvals" sub="All official requests have been reviewed." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={TH}>Official</th><th style={TH}>Barangay</th><th style={TH}>Email</th><th style={TH}>Submitted</th><th style={TH}>Actions</th></tr></thead>
                        <tbody>
                          {fPending.map((row, i) => (
                            <tr key={row.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                              onMouseEnter={e=>e.currentTarget.style.backgroundColor='#eff6ff'}
                              onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:12 }}><OfficialAvatar name={row.barangay_name} color="#1E3A5F" /><div><div style={{ fontWeight:600,color:'#111827',fontSize:13 }}>{row.barangay_name}</div><div style={{ fontSize:11,color:'#9ca3af' }}>Official account</div></div></div></td>
                              <td style={TD}><span style={{ background:'#f1f5f9',color:'#374151',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600 }}>{row.barangay}</span></td>
                              <td style={{ ...TD,color:'#6b7280' }}>{row.email}</td>
                              <td style={{ ...TD,color:'#9ca3af',fontSize:12 }}>{fmt(row.created_at)}</td>
                              <td style={TD}>
                                <div style={{ display:'flex',gap:8 }}>
                                  <button onClick={()=>updateStatus(row.id,'approved')} disabled={statusId===row.id}
                                    style={{ background:'#16a34a',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6,opacity:statusId===row.id?0.6:1 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Approve
                                  </button>
                                  <button onClick={()=>updateStatus(row.id,'rejected')} disabled={statusId===row.id}
                                    style={{ background:'#fff',color:'#dc2626',border:'1.5px solid #fca5a5',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6,opacity:statusId===row.id?0.6:1 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
              )}

              {/* ── OFFICIALS ── */}
              {tab === 'officials' && (
                fOfficials.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>}
                      title="No officials found" sub="Try adjusting the filter." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={TH}>Official</th><th style={TH}>Barangay</th><th style={TH}>Email</th><th style={TH}>Status</th><th style={TH}>Since</th><th style={TH}>Actions</th></tr></thead>
                        <tbody>
                          {fOfficials.map((row, i) => (
                            <tr key={row.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                              onMouseEnter={e=>e.currentTarget.style.backgroundColor='#eff6ff'}
                              onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:12 }}><OfficialAvatar name={row.barangay_name} color={row.status==='banned'?'#dc2626':'#16a34a'} /><div><div style={{ fontWeight:600,color:'#111827',fontSize:13 }}>{row.barangay_name}</div><div style={{ fontSize:11,color:'#9ca3af' }}>Official account</div></div></div></td>
                              <td style={TD}><span style={{ background:'#f1f5f9',color:'#374151',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600 }}>{row.barangay}</span></td>
                              <td style={{ ...TD,color:'#6b7280' }}>{row.email}</td>
                              <td style={TD}>
                                <div>
                                  <StatusBadge status={row.status} />
                                  {row.status==='banned' && row.ban_reason && (
                                    <div style={{ fontSize:11,color:'#9ca3af',marginTop:4,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} title={row.ban_reason}>{row.ban_reason}</div>
                                  )}
                                </div>
                              </td>
                              <td style={{ ...TD,color:'#9ca3af',fontSize:12 }}>{fmt(row.created_at)}</td>
                              <td style={TD}>
                                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                                  {row.status==='banned' ? (
                                    <button onClick={()=>setUnbanTarget({row,type:'official'})}
                                      style={{ background:'#059669',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Unban
                                    </button>
                                  ) : (
                                    <>
                                      <button onClick={()=>setBanTarget({row,type:'official'})}
                                        style={{ background:'#fff',color:'#dc2626',border:'1.5px solid #fca5a5',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Ban
                                      </button>
                                      <button onClick={()=>updateStatus(row.id,'rejected')} disabled={statusId===row.id}
                                        style={{ background:'#fff',color:'#6b7280',border:'1.5px solid #e2e8f0',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,opacity:statusId===row.id?0.6:1 }}>
                                        Revoke
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
              )}

              {/* ── RESIDENTS ── */}
              {tab === 'residents' && (
                fResidents.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                      title="No residents found" sub={search ? 'Try a different search term.' : 'No residents have registered yet.'} />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={TH}>Resident</th><th style={TH}>Email</th><th style={TH}>Barangay</th><th style={TH}>Status</th><th style={TH}>Joined</th><th style={TH}>Action</th></tr></thead>
                        <tbody>
                          {fResidents.map((row, i) => (
                            <tr key={row.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                              onMouseEnter={e=>e.currentTarget.style.backgroundColor='#eff6ff'}
                              onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:12 }}><ResidentAvatar url={row.avatar_url} name={row.name} size={38} index={row.index} /><div><div style={{ fontWeight:600,color:'#111827',fontSize:13 }}>{row.name}</div><div style={{ fontSize:11,color:'#9ca3af' }}>Resident</div></div></div></td>
                              <td style={{ ...TD,color:'#6b7280' }}>{row.email}</td>
                              <td style={TD}>{row.barangay ? <span style={{ background:'#f1f5f9',color:'#374151',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600 }}>{row.barangay}</span> : <span style={{ color:'#d1d5db' }}>—</span>}</td>
                              <td style={TD}>
                                <div>
                                  <StatusBadge status={row.is_banned ? 'banned' : 'active'} />
                                  {row.is_banned && row.ban_reason && (
                                    <div style={{ fontSize:11,color:'#9ca3af',marginTop:4,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} title={row.ban_reason}>{row.ban_reason}</div>
                                  )}
                                </div>
                              </td>
                              <td style={{ ...TD,color:'#9ca3af',fontSize:12 }}>{fmt(row.created_at)}</td>
                              <td style={TD}>
                                {row.is_banned ? (
                                  <button onClick={()=>setUnbanTarget({row,type:'resident'})}
                                    style={{ background:'#059669',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Unban
                                  </button>
                                ) : (
                                  <button onClick={()=>setBanTarget({row,type:'resident'})}
                                    style={{ background:'#fff',color:'#dc2626',border:'1.5px solid #fca5a5',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Ban
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {tab==='pending'   && `${fPending.length} of ${pending.length} request${pending.length!==1?'s':''}`}
                  {tab==='officials' && `${fOfficials.length} of ${officials.length} official${officials.length!==1?'s':''}`}
                  {tab==='residents' && `${fResidents.length} of ${residents.length} resident${residents.length!==1?'s':''}`}
                </span>
                {search && <button onClick={()=>setSearch('')} style={{ fontSize:12,color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:'Poppins,sans-serif' }}>Clear search</button>}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {banTarget && <BanModal target={banTarget.row} type={banTarget.type} onConfirm={handleBan} onCancel={()=>setBanTarget(null)} loading={actionLoading} />}
      {unbanTarget && <UnbanModal target={unbanTarget.row} type={unbanTarget.type} onConfirm={handleUnban} onCancel={()=>setUnbanTarget(null)} loading={actionLoading} />}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default UserManagement;
