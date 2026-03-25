import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';
import Pagination from '../../components/Pagination';

// ── Email (Resend via Supabase Edge Function) ─────────────────────────────────
const sendNotificationEmail = async (payload) => {
  try {
    await supabase.functions.invoke('send-email', { body: payload });
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

        {/* Quick reason chips */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick Reasons</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              'Spam or false reports',
              'Abusive behavior',
              'Harassment of residents',
              'Multiple policy violations',
              'Inappropriate content',
            ].map(r => (
              <button key={r} onClick={() => setReason(r)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${reason === r ? '#dc2626' : '#e5e7eb'}`, background: reason === r ? '#fee2e2' : '#f9fafb', color: reason === r ? '#dc2626' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom reason */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Or write a custom reason <span style={{ color: '#dc2626' }}>*</span></div>
        <textarea
          rows={3}
          placeholder="Describe why this account is being banned..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={300}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontFamily: 'Poppins, sans-serif', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', color: '#374151', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#dc2626'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Shown to the user when they try to log in.</p>
          <span style={{ fontSize: 11, color: reason.length > 260 ? '#f59e0b' : '#d1d5db' }}>{reason.length}/300</span>
        </div>

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

// ── Revoke modal ──────────────────────────────────────────────────────────────
function RevokeModal({ target, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const QUICK = [
    'No longer in position',
    'Resigned or removed from office',
    'Misconduct or violation of community guidelines',
    'Position transferred to another official',
    'Account registered under wrong barangay',
  ];
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:460, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', animation:'morphIn 0.25s ease-out' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Revoke Official</h3>
            <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>Their account will be deleted and they can re-register</p>
          </div>
        </div>

        {/* Account info */}
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', margin:'16px 0', fontSize:13, color:'#374151' }}>
          <span style={{ color:'#6b7280' }}>Official: </span>
          <strong>{target?.full_name || target?.barangay_name}</strong>
          {target?.position && <span style={{ marginLeft:8, fontSize:11, background:'#fef9c3', color:'#92400e', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{target.position}</span>}
        </div>

        {/* Quick reasons */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Quick Reasons</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {QUICK.map(r => (
              <button key={r} onClick={() => setReason(r)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${reason===r?'#d97706':'#e5e7eb'}`, background:reason===r?'#fef3c7':'#f9fafb', color:reason===r?'#92400e':'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', transition:'all 0.15s' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom reason */}
        <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
          Or write a custom reason <span style={{ color:'#d97706' }}>*</span>
        </div>
        <textarea
          rows={3}
          placeholder="Explain why this official's account is being revoked..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={300}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontFamily:'Poppins,sans-serif', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', color:'#374151', transition:'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#d97706'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, marginBottom:16 }}>
          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>This reason will be sent to the official via email.</p>
          <span style={{ fontSize:11, color:reason.length>260?'#f59e0b':'#d1d5db' }}>{reason.length}/300</span>
        </div>

        {/* Note */}
        <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#6b7280', marginBottom:20, lineHeight:1.5 }}>
          ⚠️ Their account will be <strong style={{ color:'#374151' }}>permanently deleted</strong> from the system.
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason.trim())} disabled={!reason.trim() || loading}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:!reason.trim()||loading?'#fcd34d':'#d97706', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:600, cursor:!reason.trim()||loading?'not-allowed':'pointer', color:'#fff', display:'inline-flex', alignItems:'center', gap:7, transition:'background 0.2s' }}>
            {loading
              ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>Revoking…</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Confirm Revoke</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────
function FilterPills({ value, onChange, bannedCount, pendingCount }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[
        { k: 'all',     label: 'All' },
        { k: 'active',  label: 'Active' },
        { k: 'banned',  label: bannedCount > 0 ? `Banned (${bannedCount})` : 'Banned' },
        { k: 'pending', label: pendingCount > 0 ? `Pending (${pendingCount})` : 'Pending' },
      ].map(f => (
        <button key={f.k} onClick={() => onChange(f.k)} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12,
          fontFamily: 'Poppins, sans-serif', fontWeight: 600, cursor: 'pointer',
          border: value === f.k ? 'none' : '1.5px solid #e5e7eb',
          background: value === f.k
            ? f.k === 'banned' ? '#dc2626' : f.k === 'pending' ? '#d97706' : '#2563eb'
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

// ── Activity Modal (for deleted accounts) ────────────────────────────────────
const ACTIVITY_STATUS_CFG = {
  pending:          { bg:'#fef9c3', color:'#854d0e', dot:'#f59e0b', label:'Pending'          },
  in_progress:      { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6', label:'In Progress'      },
  resolved:         { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Resolved'         },
  rejected:         { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Rejected'         },
  ready_for_pickup: { bg:'#ede9fe', color:'#6d28d9', dot:'#8b5cf6', label:'Ready for Pickup' },
  claimed:          { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Claimed'          },
};
function ActStatusBadge({ status }) {
  const s = ACTIVITY_STATUS_CFG[status] || ACTIVITY_STATUS_CFG.pending;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:s.bg, color:s.color, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}><span style={{ width:5, height:5, borderRadius:'50%', background:s.dot }} />{s.label}</span>;
}
function ActivityModal({ resident, onClose }) {
  const [actTab,   setActTab]   = useState('reports');
  const [reports,  setReports]  = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const fmtD = d => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });

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
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, width:640, maxWidth:'100%', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#f3f4f6,#fafafa)', padding:'20px 24px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'#6b7280', flexShrink:0 }}>
                {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?'}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#111827' }}>{name}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{resident.email} · {resident.barangay}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
              <span style={{ color:'#9ca3af', fontWeight:600 }}>Deleted on </span>
              <span style={{ color:'#374151', fontWeight:700 }}>{fmtD(resident.deleted_at)}</span>
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
            <button key={t.key} onClick={() => setActTab(t.key)}
              style={{ flex:1, padding:'12px', border:'none', background:'none', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color: actTab===t.key?'#2563eb':'#9ca3af', borderBottom: actTab===t.key?'2px solid #2563eb':'2px solid transparent', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
              <p style={{ color:'#9ca3af', fontSize:13 }}>Loading activity...</p>
            </div>
          ) : actTab === 'reports' ? (
            reports.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No reports submitted.</div> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Problem','Description','Status','Date'].map(h => <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {reports.map((r,i) => (
                    <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}>
                      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.problem}</td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description||'—'}</td>
                      <td style={{ padding:'12px 16px' }}><ActStatusBadge status={r.status} /></td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmtD(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            requests.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No document requests submitted.</div> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Document','Purpose','Status','Date'].map(h => <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {requests.map((r,i) => (
                    <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}>
                      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.document_type}</td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.purpose||'—'}</td>
                      <td style={{ padding:'12px 16px' }}><ActStatusBadge status={r.status} /></td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmtD(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'pandahuntergamer09@gmail.com';

function UserManagement() {
  const [tab,          setTab]          = useState('pending');
  const [pending,      setPending]      = useState([]);
  const [officials,    setOfficials]    = useState([]);
  const [residents,    setResidents]    = useState([]);
  const [statusId,     setStatusId]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [offFilter,    setOffFilter]    = useState('all');
  const [resFilter,    setResFilter]    = useState('all');
  const [page,         setPage]         = useState(1);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const PAGE_SIZE = 5;

  const [deletedAccounts,  setDeletedAccounts]  = useState([]);
  const [viewActivity,     setViewActivity]      = useState(null);
  const [flags,            setFlags]            = useState([]);
  const [appeals,          setAppeals]          = useState([]);
  const [appealAction,     setAppealAction]      = useState(null); // { appeal, action: 'approve'|'reject' }

  const [banConfirmTarget, setBanConfirmTarget] = useState(null); // step 1
  const [banTarget,        setBanTarget]        = useState(null); // step 2
  const [unbanTarget,      setUnbanTarget]       = useState(null);
  const [revokeTarget,     setRevokeTarget]      = useState(null);
  const [actionLoading,    setActionLoading]     = useState(false);
  const [toast,            setToast]             = useState(null);
  const [flagActionTarget, setFlagActionTarget]  = useState(null); // { flag, action: 'warn'|'ban'|'dismiss' }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    const [{ data: p }, { data: o }, { data: r }, { data: d }, { data: f }, { data: a }] = await Promise.all([
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at,full_name,position,id_image_url').eq('status','pending').order('created_at',{ascending:true}),
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at,status,ban_reason').in('status',['approved','banned']).order('created_at',{ascending:true}),
      supabase.from('users').select('id,auth_id,first_name,last_name,email,phone,barangay,created_at,avatar_url,is_banned,ban_reason,offense_count,suspended_until,status').eq('role','resident').order('created_at',{ascending:false}),
      supabase.from('deleted_accounts').select('*').order('deleted_at',{ascending:false}),
      supabase.from('abuse_flags').select('*').eq('status','pending').order('created_at',{ascending:false}),
      supabase.from('appeals').select('*').order('created_at',{ascending:false}),
    ]);
    setPending(p  || []);
    setOfficials(o || []);
    setResidents((r || []).map((row, i) => ({ ...row, name: `${row.first_name||''} ${row.last_name||''}`.trim(), index: i })));
    setDeletedAccounts(d || []);
    setFlags(f || []);
    setAppeals(a || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsSuperAdmin(data.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL);
    });
  }, []);

  const updateStatus = async (id, status) => {
    setStatusId(id);
    const { data: updated } = await supabase.from('officials').update({ status }).eq('id', id).select('email,barangay').single();
    if (updated && status === 'approved') {
      await sendNotificationEmail({ type: 'approval', toEmail: updated.email, barangay: updated.barangay });
    }
    setStatusId(null);
    fetchAll();
  };

  const handleRevoke = async (reason) => {
    const { row } = revokeTarget;
    setActionLoading(true);
    try {
      // Fetch auth_id + contact info
      const { data: official, error: fetchErr } = await supabase
        .from('officials')
        .select('auth_id, email, barangay, full_name')
        .eq('id', row.id)
        .single();

      if (fetchErr || !official) throw new Error('Could not fetch official data.');

      // Send revocation email
      await sendNotificationEmail({
        type: 'revoked',
        toEmail: official.email,
        officialName: official.full_name || row.full_name || 'Official',
        reason,
      });

      // Delete from Supabase Auth so they can re-register with same email + receive OTP
      if (official.auth_id) {
        const { data: delData, error: delErr } = await supabase.functions.invoke('delete-auth-user', {
          body: { auth_id: official.auth_id },
        });
        if (delErr) throw new Error(`Auth deletion failed: ${delErr.message}`);
        if (delData?.error) throw new Error(`Auth deletion failed: ${delData.error}`);
      }

      // Remove the officials row
      const { error: rowErr } = await supabase.from('officials').delete().eq('id', row.id);
      if (rowErr) throw new Error(`Failed to remove official record: ${rowErr.message}`);

      setActionLoading(false);
      setRevokeTarget(null);
      showToast(`${row.full_name || row.barangay_name} has been revoked.`);
      fetchAll();
    } catch (e) {
      setActionLoading(false);
      showToast(e.message || 'Failed to revoke account. Please try again.', 'error');
    }
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
      const { error } = await supabase.from('users').update({ is_banned: false, ban_reason: null, banned_at: null, suspended_until: null, offense_count: 0 }).eq('id', row.id);
      err = error;
    }
    setActionLoading(false);
    setUnbanTarget(null);
    if (err) { showToast('Failed to unban account. Please try again.', 'error'); return; }
    if (type !== 'official') {
      await sendNotificationEmail({ type: 'unban', toEmail: row.email, residentName: row.name });
    }
    showToast(`${type === 'official' ? row.barangay_name : row.name} has been unbanned.`);
    fetchAll();
  };

  // ── Flag actions ──────────────────────────────────────────────────────────────

  const handleWarnFlag = async (flag) => {
    const resident = residents.find(r => r.auth_id === flag.flagged_user_id);
    if (!resident) return;
    setActionLoading(true);
    const currentOffense = resident.offense_count || 0;
    const newOffenseCount = currentOffense + 1;

    if (newOffenseCount >= 3) {
      // 3rd offense → permanent ban
      await supabase.from('users')
        .update({ is_banned: true, ban_reason: flag.reason, banned_at: new Date().toISOString(), offense_count: newOffenseCount, suspended_until: null })
        .eq('auth_id', flag.flagged_user_id);
      await supabase.from('abuse_flags')
        .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_note: 'permanent_ban_3rd_offense' })
        .eq('id', flag.id);
      await sendNotificationEmail({ type: 'permban', toEmail: resident.email, residentName: resident.name, reason: flag.reason });
      setActionLoading(false);
      setFlagActionTarget(null);
      showToast(`${resident.name} permanently banned — 3rd offense.`);
      fetchAll();
      return;
    }

    // 1st offense = 1 day, 2nd offense = 3 days
    const suspendDays = newOffenseCount === 1 ? 1 : 3;
    const suspendUntil = new Date(Date.now() + suspendDays * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('users')
      .update({ suspended_until: suspendUntil, offense_count: newOffenseCount })
      .eq('auth_id', flag.flagged_user_id);
    await supabase.from('abuse_flags')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_note: `warning_${newOffenseCount}` })
      .eq('id', flag.id);
    await sendNotificationEmail({
      type: 'suspended', toEmail: resident.email, residentName: resident.name, reason: flag.reason,
      suspendedUntil: new Date(suspendUntil).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' }),
      offenseNumber: newOffenseCount, suspendDays,
    });
    setActionLoading(false);
    setFlagActionTarget(null);
    showToast(`Warning #${newOffenseCount} — ${resident.name} suspended for ${suspendDays} day${suspendDays > 1 ? 's' : ''}.`);
    fetchAll();
  };

  const handleBanFlag = async (flag) => {
    const resident = residents.find(r => r.auth_id === flag.flagged_user_id);
    if (!resident) return;
    setActionLoading(true);
    await supabase.from('users')
      .update({ is_banned: true, ban_reason: flag.reason, banned_at: new Date().toISOString() })
      .eq('auth_id', flag.flagged_user_id);
    await supabase.from('abuse_flags')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_note: 'permanent_ban' })
      .eq('id', flag.id);
    await sendNotificationEmail({ type: 'permban', toEmail: resident.email, residentName: resident.name, reason: flag.reason });
    setActionLoading(false);
    setFlagActionTarget(null);
    showToast(`${resident.name} has been permanently banned.`);
    fetchAll();
  };

  const handleApproveAppeal = async (appeal) => {
    setActionLoading(true);
    // Unban the user
    await supabase.from('users')
      .update({ is_banned: false, ban_reason: null, banned_at: null, suspended_until: null, offense_count: 0 })
      .eq('email', appeal.email);
    await supabase.from('appeals')
      .update({ status: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', appeal.id);
    // Find resident name for email
    const residentRecord = residents.find(r => r.email === appeal.email);
    await sendNotificationEmail({ type: 'unban', toEmail: appeal.email, residentName: residentRecord?.name || appeal.email });
    setActionLoading(false);
    setAppealAction(null);
    showToast(`Appeal approved — ${appeal.email} has been unbanned.`);
    fetchAll();
  };

  const handleRejectAppeal = async (appeal) => {
    setActionLoading(true);
    await supabase.from('appeals')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', appeal.id);
    const residentRecord = residents.find(r => r.email === appeal.email);
    await sendNotificationEmail({ type: 'appeal_rejected', toEmail: appeal.email, residentName: residentRecord?.name || appeal.email });
    setActionLoading(false);
    setAppealAction(null);
    showToast(`Appeal rejected — ban remains.`);
    fetchAll();
  };

  const handleDismissFlag = async (flag) => {
    setActionLoading(true);
    await supabase.from('abuse_flags')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_note: 'dismissed' })
      .eq('id', flag.id);
    setActionLoading(false);
    setFlagActionTarget(null);
    showToast('Flag dismissed.');
    fetchAll();
  };

  // Filtered lists
  const fOfficials = officials
    .filter(o => !search || o.barangay_name?.toLowerCase().includes(search.toLowerCase()) || o.email?.toLowerCase().includes(search.toLowerCase()))
    .filter(o => offFilter === 'all' ? true : offFilter === 'active' ? o.status === 'approved' : o.status === 'banned');

  const fPending = pending.filter(r => !search || r.barangay_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));

  const fResidents = residents
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()) || r.barangay?.toLowerCase().includes(search.toLowerCase()))
    .filter(r => resFilter === 'all' ? true : resFilter === 'active' ? (!r.is_banned && r.status !== 'pending') : resFilter === 'pending' ? r.status === 'pending' : r.is_banned);

  const approvedCount   = officials.filter(o => o.status === 'approved').length;
  const bannedOffCount  = officials.filter(o => o.status === 'banned').length;
  const bannedResCount  = residents.filter(r => r.is_banned).length;
  const pendingResCount = residents.filter(r => r.status === 'pending').length;

  const fDeleted = deletedAccounts.filter(r => {
    const q = search.toLowerCase();
    const name = `${r.first_name||''} ${r.last_name||''}`.trim();
    return !q || name.toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q) || (r.barangay||'').toLowerCase().includes(q);
  });

  const fFlags = flags.filter(f => {
    const q = search.toLowerCase();
    return !q || (f.reason||'').toLowerCase().includes(q) || (f.barangay||'').toLowerCase().includes(q);
  });

  const pendingAppeals = appeals.filter(a => a.status === 'pending');
  const fAppeals = appeals.filter(a => {
    const q = search.toLowerCase();
    return !q || (a.email||'').toLowerCase().includes(q) || (a.reason||'').toLowerCase().includes(q);
  });

  const activeList   = tab === 'pending'   ? fPending   : tab === 'officials' ? fOfficials : tab === 'deleted' ? fDeleted : tab === 'flagged' ? fFlags : tab === 'appeals' ? fAppeals : fResidents;
  const totalPagesUM = Math.ceil(activeList.length / PAGE_SIZE);
  const paginatedUM  = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS = [
    { key: 'pending',   label: 'Pending',          count: pending.length,          activeColor: '#d97706', activeBg: '#fef3c7' },
    { key: 'officials', label: 'Officials',         count: officials.length,        activeColor: '#16a34a', activeBg: '#dcfce7' },
    { key: 'residents', label: 'Residents',         count: residents.length,        activeColor: '#2563eb', activeBg: '#eff6ff' },
    { key: 'deleted',   label: 'Deleted Accounts',  count: deletedAccounts.length,  activeColor: '#6b7280', activeBg: '#f3f4f6' },
    { key: 'flagged',   label: 'Flagged Residents', count: flags.length,            activeColor: '#d97706', activeBg: '#fef9c3' },
    { key: 'appeals',   label: 'Appeals',            count: pendingAppeals.length,   activeColor: '#7c3aed', activeBg: '#ede9fe' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {(() => {
              const activeCard =
                tab === 'pending'   ? 'pending'   :
                tab === 'officials' ? 'officials'  :
                tab === 'deleted'   ? 'deleted'    :
                tab === 'flagged'   ? 'flagged'    :
                tab === 'appeals'   ? 'appeals'    :
                resFilter === 'banned' ? 'banned'  : 'residents';
              return [
                { id: 'total',     label: 'Total Users',            value: residents.length + officials.length, accent: '#0891b2', iconBg: '#e0f2fe', vc: '#1f2937',
                  onClick: () => {},
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
                { id: 'pending',   label: 'Pending Approvals',    value: pending.length,                 accent: '#f59e0b', iconBg: '#fef3c7', vc: pending.length > 0 ? '#d97706' : '#1f2937',
                  onClick: () => { setTab('pending');   setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                { id: 'officials', label: 'Active Officials',      value: approvedCount,                  accent: '#16a34a', iconBg: '#dcfce7', vc: '#1f2937',
                  onClick: () => { setTab('officials'); setOffFilter('all'); setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
                { id: 'residents', label: 'Registered Residents',  value: residents.length,               accent: '#2563eb', iconBg: '#eff6ff', vc: '#1f2937',
                  onClick: () => { setTab('residents'); setResFilter('all'); setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { id: 'banned',    label: 'Banned Accounts',       value: bannedOffCount + bannedResCount, accent: '#dc2626', iconBg: '#fee2e2', vc: bannedOffCount + bannedResCount > 0 ? '#dc2626' : '#1f2937',
                  onClick: () => { setTab('residents'); setResFilter('banned'); setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
                { id: 'deleted',   label: 'Deleted Accounts',      value: deletedAccounts.length,         accent: '#6b7280', iconBg: '#f3f4f6', vc: '#6b7280',
                  onClick: () => { setTab('deleted');   setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> },
                { id: 'flagged',   label: 'Flagged Residents',     value: flags.length,                   accent: '#d97706', iconBg: '#fef3c7', vc: flags.length > 0 ? '#d97706' : '#1f2937',
                  onClick: () => { setTab('flagged');   setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                { id: 'appeals',   label: 'Pending Appeals',        value: pendingAppeals.length,           accent: '#7c3aed', iconBg: '#ede9fe', vc: pendingAppeals.length > 0 ? '#7c3aed' : '#1f2937',
                  onClick: () => { setTab('appeals');   setSearch(''); setPage(1); },
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              ].map(c => {
                const isActive = activeCard === c.id;
                return (
                  <div key={c.id} onClick={c.onClick} style={{ background: isActive ? c.iconBg : '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, borderBottom: isActive ? `2px solid ${c.accent}` : '2px solid transparent', cursor: 'pointer', transition: 'background 0.15s, border-bottom 0.15s' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: c.vc, lineHeight: 1 }}>{c.value}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Main panel */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
              {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setPage(1); }}
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
                    placeholder={tab === 'residents' ? 'Search name, email, barangay…' : tab === 'deleted' ? 'Search name, email, barangay…' : 'Search barangay or email…'}
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
                  />
                </div>
                {tab === 'officials' && <FilterPills value={offFilter} onChange={v => { setOffFilter(v); setPage(1); }} bannedCount={bannedOffCount} />}
                {tab === 'residents' && <FilterPills value={resFilter} onChange={v => { setResFilter(v); setPage(1); }} bannedCount={bannedResCount} pendingCount={pendingResCount} />}
              </div>

              {/* ── PENDING ── */}
              {tab === 'pending' && (
                fPending.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      title="No pending approvals" sub="All official requests have been reviewed." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={TH}>Name</th><th style={TH}>Barangay</th><th style={TH}>Position</th><th style={TH}>Email</th><th style={TH}>Gov't ID</th><th style={TH}>Submitted</th><th style={TH}>Actions</th></tr></thead>
                        <tbody>
                          {paginatedUM.map((row, i) => (
                            <tr key={row.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                              onMouseEnter={e=>e.currentTarget.style.backgroundColor='#eff6ff'}
                              onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:12 }}><OfficialAvatar name={row.full_name || row.barangay_name} color="#1E3A5F" /><div><div style={{ fontWeight:600,color:'#111827',fontSize:13 }}>{row.full_name || '—'}</div><div style={{ fontSize:11,color:'#9ca3af' }}>{row.email}</div></div></div></td>
                              <td style={TD}><span style={{ background:'#f1f5f9',color:'#374151',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600 }}>{row.barangay}</span></td>
                              <td style={{ ...TD,color:'#6b7280',fontSize:12 }}>{row.position || '—'}</td>
                              <td style={{ ...TD,color:'#6b7280',fontSize:12 }}>{row.email}</td>
                              <td style={TD}>
                                {row.id_image_url
                                  ? <a href={row.id_image_url} target="_blank" rel="noopener noreferrer"
                                      style={{ display:'inline-flex',alignItems:'center',gap:5,background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:600,textDecoration:'none' }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View ID
                                    </a>
                                  : <span style={{ fontSize:11,color:'#9ca3af' }}>Not uploaded</span>
                                }
                              </td>
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
                          {paginatedUM.map((row, i) => (
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
                                  {isSuperAdmin ? (
                                    row.status==='banned' ? (
                                      <button onClick={()=>setUnbanTarget({row,type:'official'})}
                                        style={{ background:'#059669',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Unban
                                      </button>
                                    ) : (
                                      <>
                                        <button onClick={()=>setBanConfirmTarget({row,type:'official'})}
                                          style={{ background:'#fff',color:'#dc2626',border:'1.5px solid #fca5a5',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Ban
                                        </button>
                                        <button onClick={()=>setRevokeTarget({row})} disabled={statusId===row.id}
                                          style={{ background:'#fff',color:'#d97706',border:'1.5px solid #fde68a',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Revoke
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <button onClick={()=>updateStatus(row.id,'rejected')} disabled={statusId===row.id}
                                      style={{ background:'#fff',color:'#6b7280',border:'1.5px solid #e2e8f0',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,opacity:statusId===row.id?0.6:1 }}>
                                      Revoke
                                    </button>
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
                        <thead><tr><th style={TH}>Resident</th><th style={TH}>Email</th><th style={TH}>Phone</th><th style={TH}>Barangay</th><th style={TH}>Status</th><th style={TH}>Joined</th><th style={TH}>Action</th></tr></thead>
                        <tbody>
                          {paginatedUM.map((row, i) => (
                            <tr key={row.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                              onMouseEnter={e=>e.currentTarget.style.backgroundColor='#eff6ff'}
                              onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={TD}><div style={{ display:'flex',alignItems:'center',gap:12 }}><ResidentAvatar url={row.avatar_url} name={row.name} size={38} index={row.index} /><div><div style={{ fontWeight:600,color:'#111827',fontSize:13 }}>{row.name}</div><div style={{ fontSize:11,color:'#9ca3af' }}>Resident</div></div></div></td>
                              <td style={{ ...TD,color:'#6b7280' }}>{row.email}</td>
                              <td style={{ ...TD,color:'#6b7280' }}>{row.phone || <span style={{ color:'#d1d5db' }}>—</span>}</td>
                              <td style={TD}>{row.barangay ? <span style={{ background:'#f1f5f9',color:'#374151',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600 }}>{row.barangay}</span> : <span style={{ color:'#d1d5db' }}>—</span>}</td>
                              <td style={TD}>
                                <div>
                                  <StatusBadge status={row.status === 'pending' ? 'pending' : row.is_banned ? 'banned' : 'active'} />
                                  {row.is_banned && row.ban_reason && (
                                    <div style={{ fontSize:11,color:'#9ca3af',marginTop:4,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} title={row.ban_reason}>{row.ban_reason}</div>
                                  )}
                                </div>
                              </td>
                              <td style={{ ...TD,color:'#9ca3af',fontSize:12 }}>{fmt(row.created_at)}</td>
                              <td style={TD}>
                                {row.status === 'pending' ? (
                                  <span style={{ fontSize:11, color:'#d97706', fontWeight:600, background:'#fef3c7', padding:'6px 12px', borderRadius:8, display:'inline-block' }}>
                                    Reviewed by officials
                                  </span>
                                ) : isSuperAdmin ? (
                                  row.is_banned ? (
                                    <button onClick={()=>setUnbanTarget({row,type:'resident'})}
                                      style={{ background:'#059669',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Unban
                                    </button>
                                  ) : (
                                    <button onClick={()=>setBanConfirmTarget({row,type:'resident'})}
                                      style={{ background:'#fff',color:'#dc2626',border:'1.5px solid #fca5a5',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:12,display:'inline-flex',alignItems:'center',gap:6 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Ban
                                    </button>
                                  )
                                ) : (
                                  <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600, background:'#f1f5f9', padding:'6px 14px', borderRadius:8, display:'inline-block' }}>
                                    {row.is_banned ? 'Banned' : 'View Only'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
              )}

              {/* ── DELETED ACCOUNTS ── */}
              {tab === 'deleted' && (
                fDeleted.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>}
                      title="No deleted accounts" sub="No residents have deleted their accounts yet." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={TH}>Resident</th><th style={TH}>Email</th><th style={TH}>Barangay</th><th style={TH}>Reason</th><th style={TH}>Deleted On</th><th style={TH}>Activity</th></tr></thead>
                        <tbody>
                          {paginatedUM.map((row, i) => {
                            const name = `${row.first_name||''} ${row.last_name||''}`.trim();
                            return (
                              <tr key={row.id||row.auth_id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                                onMouseEnter={e=>e.currentTarget.style.backgroundColor='#f3f4f6'}
                                onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
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
                                <td style={{ ...TD, color:'#6b7280' }}>{row.email||'—'}</td>
                                <td style={TD}>{row.barangay ? <span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>{row.barangay}</span> : <span style={{ color:'#d1d5db' }}>—</span>}</td>
                                <td style={{ ...TD, color:'#6b7280', fontSize:12, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.reason}>{row.reason||'—'}</td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{row.deleted_at ? fmt(row.deleted_at) : '—'}</td>
                                <td style={TD}>
                                  <button onClick={() => setViewActivity(row)}
                                    style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
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
              )}

              {/* ── FLAGGED RESIDENTS ── */}
              {tab === 'flagged' && (
                fFlags.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                      title="No pending flags" sub="No officials have flagged any residents yet." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                          <th style={TH}>Resident</th>
                          <th style={TH}>Barangay</th>
                          <th style={TH}>Reason</th>
                          <th style={TH}>Proof</th>
                          <th style={TH}>Offense #</th>
                          <th style={TH}>Flagged On</th>
                          <th style={TH}>Actions</th>
                        </tr></thead>
                        <tbody>
                          {paginatedUM.map((flag, i) => {
                            const resident = residents.find(r => r.auth_id === flag.flagged_user_id);
                            const residentName = resident ? resident.name : flag.flagged_user_id;
                            const offenseCount = (resident?.offense_count || 0) + 1; // what it will become after action
                            return (
                              <tr key={flag.id} style={{ backgroundColor: i%2===0?'#fff':'#fef9c3' }}
                                onMouseEnter={e=>e.currentTarget.style.backgroundColor='#fef3c7'}
                                onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#fef9c3'}>
                                <td style={TD}>
                                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    {resident && <ResidentAvatar url={resident.avatar_url} name={residentName} size={36} index={i} />}
                                    <div>
                                      <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{residentName}</div>
                                      <div style={{ fontSize:11, color:'#9ca3af' }}>{resident?.email || '—'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={TD}>{flag.barangay ? <span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>{flag.barangay}</span> : '—'}</td>
                                <td style={{ ...TD, maxWidth:200, fontSize:12, color:'#374151' }}>
                                  <div style={{ maxHeight:48, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }} title={flag.reason}>{flag.reason}</div>
                                </td>
                                <td style={TD}>
                                  {flag.proof_image_url ? (
                                    <a href={flag.proof_image_url} target="_blank" rel="noreferrer">
                                      <img src={flag.proof_image_url} alt="proof"
                                        style={{ width:64, height:48, objectFit:'cover', borderRadius:6, border:'1.5px solid #fde68a', display:'block', cursor:'pointer' }} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>
                                  )}
                                </td>
                                <td style={{ ...TD, textAlign:'center' }}>
                                  <span style={{ fontWeight:700, fontSize:14, color: offenseCount >= 2 ? '#dc2626' : '#d97706' }}>{resident?.offense_count || 0}</span>
                                  <div style={{ fontSize:10, color:'#9ca3af' }}>current</div>
                                </td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(flag.created_at)}</td>
                                <td style={TD}>
                                  {(() => {
                                    const currentOffense = resident?.offense_count || 0;
                                    const nextOffense = currentOffense + 1;
                                    const warnLabel = nextOffense >= 3 ? 'Warn → Perm Ban' : nextOffense === 2 ? 'Warn #2 (3 days)' : 'Warn #1 (1 day)';
                                    const warnBg    = nextOffense >= 3 ? '#fee2e2' : '#fef3c7';
                                    const warnColor = nextOffense >= 3 ? '#dc2626' : '#92400e';
                                    const warnBorder= nextOffense >= 3 ? '#fca5a5' : '#fde68a';
                                    return (
                                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                    <button onClick={() => setFlagActionTarget({ flag, action: 'warn' })}
                                      style={{ background:warnBg, color:warnColor, border:`1.5px solid ${warnBorder}`, padding:'7px 12px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                      {warnLabel}
                                    </button>
                                    <button onClick={() => setFlagActionTarget({ flag, action: 'ban' })}
                                      style={{ background:'#fee2e2', color:'#dc2626', border:'1.5px solid #fca5a5', padding:'7px 12px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                      Perm Ban
                                    </button>
                                    <button onClick={() => setFlagActionTarget({ flag, action: 'dismiss' })}
                                      style={{ background:'#f1f5f9', color:'#6b7280', border:'1.5px solid #e2e8f0', padding:'7px 12px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'Poppins,sans-serif' }}>
                                      Dismiss
                                    </button>
                                  </div>
                                    );
                                  })()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
              )}

              {/* ── APPEALS ── */}
              {tab === 'appeals' && (
                fAppeals.length === 0
                  ? <EmptyState
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                      title="No appeals" sub="No residents have submitted an appeal yet." />
                  : <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                          <th style={TH}>Resident Email</th>
                          <th style={TH}>Appeal Reason</th>
                          <th style={TH}>Status</th>
                          <th style={TH}>Submitted</th>
                          <th style={TH}>Actions</th>
                        </tr></thead>
                        <tbody>
                          {paginatedUM.map((appeal, i) => {
                            const statusCfg = {
                              pending:  { bg:'#fef9c3', color:'#854d0e', label:'Pending' },
                              approved: { bg:'#dcfce7', color:'#166534', label:'Approved' },
                              rejected: { bg:'#fee2e2', color:'#991b1b', label:'Rejected' },
                            }[appeal.status] || { bg:'#f1f5f9', color:'#6b7280', label:appeal.status };
                            return (
                              <tr key={appeal.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}
                                onMouseEnter={e=>e.currentTarget.style.backgroundColor='#f5f3ff'}
                                onMouseLeave={e=>e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                                <td style={TD}>
                                  <div style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{appeal.email}</div>
                                </td>
                                <td style={{ ...TD, maxWidth:260, fontSize:12, color:'#374151' }}>
                                  <div style={{ display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }} title={appeal.reason}>{appeal.reason}</div>
                                </td>
                                <td style={TD}>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:statusCfg.bg, color:statusCfg.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                                    {statusCfg.label}
                                  </span>
                                </td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(appeal.created_at)}</td>
                                <td style={TD}>
                                  {appeal.status === 'pending' ? (
                                    <div style={{ display:'flex', gap:6 }}>
                                      <button onClick={() => setAppealAction({ appeal, action: 'approve' })}
                                        style={{ background:'#dcfce7', color:'#166534', border:'1.5px solid #86efac', padding:'7px 12px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Approve (Unban)
                                      </button>
                                      <button onClick={() => setAppealAction({ appeal, action: 'reject' })}
                                        style={{ background:'#fee2e2', color:'#dc2626', border:'1.5px solid #fca5a5', padding:'7px 12px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic' }}>Resolved</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
              )}

              <Pagination page={page} totalPages={totalPagesUM} onPage={setPage} />

              {/* Footer */}
              <div style={{ paddingTop: 8, paddingLeft: 20, paddingRight: 20, paddingBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {tab==='pending'   && `${fPending.length} of ${pending.length} request${pending.length!==1?'s':''}`}
                  {tab==='officials' && `${fOfficials.length} of ${officials.length} official${officials.length!==1?'s':''}`}
                  {tab==='residents' && `${fResidents.length} of ${residents.length} resident${residents.length!==1?'s':''}`}
                  {tab==='deleted'   && `${fDeleted.length} of ${deletedAccounts.length} deleted account${deletedAccounts.length!==1?'s':''}`}
                  {tab==='flagged'   && `${fFlags.length} of ${flags.length} flag${flags.length!==1?'s':''}`}
                  {tab==='appeals'   && `${fAppeals.length} of ${appeals.length} appeal${appeals.length!==1?'s':''}`}
                </span>
                {search && <button onClick={()=>{ setSearch(''); setPage(1); }} style={{ fontSize:12,color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:'Poppins,sans-serif' }}>Clear search</button>}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Step 1 — Ban confirmation dialog */}
      {banConfirmTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) setBanConfirmTarget(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:420, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg, #fef2f2, #fff1f1)', padding:'24px 24px 20px', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'#fee2e2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#111827', fontFamily:'Poppins, sans-serif' }}>
                  Ban this {banConfirmTarget.type === 'official' ? 'official' : 'resident'}?
                </div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.5, fontFamily:'Poppins, sans-serif' }}>
                  You are about to ban <strong style={{ color:'#374151' }}>
                    {banConfirmTarget.type === 'official' ? banConfirmTarget.row.barangay_name : banConfirmTarget.row.name}
                  </strong>. This will block their access immediately. You will need to provide a reason.
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setBanConfirmTarget(null)}
                style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins, sans-serif' }}>
                Cancel
              </button>
              <button onClick={() => { setBanTarget(banConfirmTarget); setBanConfirmTarget(null); }}
                style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Ban reason modal */}
      {banTarget && <BanModal target={banTarget.row} type={banTarget.type} onConfirm={handleBan} onCancel={()=>setBanTarget(null)} loading={actionLoading} />}
      {unbanTarget && <UnbanModal target={unbanTarget.row} type={unbanTarget.type} onConfirm={handleUnban} onCancel={()=>setUnbanTarget(null)} loading={actionLoading} />}
      {revokeTarget && <RevokeModal target={revokeTarget.row} onConfirm={handleRevoke} onCancel={()=>setRevokeTarget(null)} loading={actionLoading} />}

      {/* Flag action confirmation modal */}
      {flagActionTarget && (() => {
        const { flag, action } = flagActionTarget;
        const resident = residents.find(r => r.auth_id === flag.flagged_user_id);
        const residentName = resident ? resident.name : flag.flagged_user_id;
        const isWarn    = action === 'warn';
        const isBan     = action === 'ban';
        const isDismiss = action === 'dismiss';
        return (
          <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}
            onClick={e => { if (e.target === e.currentTarget) setFlagActionTarget(null); }}>
            <div style={{ background:'#fff', borderRadius:20, width:460, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>
              <div style={{ background: isWarn ? 'linear-gradient(135deg,#fef9c3,#fffbeb)' : isBan ? 'linear-gradient(135deg,#fef2f2,#fff1f1)' : 'linear-gradient(135deg,#f8fafc,#f1f5f9)', padding:'24px 24px 20px', borderBottom:`1px solid ${isWarn?'#fde047':isBan?'#fecaca':'#e5e7eb'}`, display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:isWarn?'#fef3c7':isBan?'#fee2e2':'#f1f5f9', border:`1.5px solid ${isWarn?'#fde68a':isBan?'#fecaca':'#e5e7eb'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isWarn && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                  {isBan  && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
                  {isDismiss && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#111827', fontFamily:'Poppins,sans-serif' }}>
                    {isWarn ? 'Issue Warning & Suspend' : isBan ? 'Permanently Ban Resident' : 'Dismiss Flag'}
                  </div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.5, fontFamily:'Poppins,sans-serif' }}>
                    {isWarn && (() => {
                    const offense = (resident?.offense_count || 0) + 1;
                    const days = offense === 1 ? '1 day' : offense === 2 ? '3 days' : null;
                    return days
                      ? <>Suspend <strong style={{ color:'#374151' }}>{residentName}</strong> for <strong>{days}</strong> (offense #{offense}). They will be notified by email.</>
                      : <>This is offense #{offense} — <strong style={{ color:'#dc2626' }}>Permanent ban</strong> will be issued instead.</>;
                  })()}
                    {isBan  && <>Permanently ban <strong style={{ color:'#374151' }}>{residentName}</strong>. This cannot be undone without manual admin action.</>}
                    {isDismiss && <>Dismiss this flag against <strong style={{ color:'#374151' }}>{residentName}</strong>. No action will be taken.</>}
                  </div>
                </div>
              </div>
              <div style={{ padding:'14px 24px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, color:'#374151' }}>
                <span style={{ color:'#6b7280', fontWeight:600 }}>Flag reason: </span>{flag.reason}
              </div>
              <div style={{ padding:'16px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setFlagActionTarget(null)} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  Cancel
                </button>
                <button
                  onClick={() => { isWarn ? handleWarnFlag(flag) : isBan ? handleBanFlag(flag) : handleDismissFlag(flag); }}
                  disabled={actionLoading}
                  style={{ padding:'10px 22px', borderRadius:10, border:'none', background:isWarn?'#d97706':isBan?'#dc2626':'#6b7280', color:'#fff', fontSize:13, fontWeight:700, cursor:actionLoading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', opacity:actionLoading?0.7:1, display:'inline-flex', alignItems:'center', gap:6 }}>
                  {actionLoading ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Processing...</> : isWarn ? 'Issue Warning' : isBan ? 'Confirm Permanent Ban' : 'Dismiss Flag'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Appeal action confirmation */}
      {appealAction && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) setAppealAction(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:460, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>
            <div style={{ background: appealAction.action === 'approve' ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fff1f1)', padding:'24px 24px 20px', borderBottom:`1px solid ${appealAction.action==='approve'?'#86efac':'#fecaca'}`, display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:appealAction.action==='approve'?'#dcfce7':'#fee2e2', border:`1.5px solid ${appealAction.action==='approve'?'#86efac':'#fecaca'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {appealAction.action === 'approve'
                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                }
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#111827', fontFamily:'Poppins,sans-serif' }}>
                  {appealAction.action === 'approve' ? 'Approve Appeal & Unban' : 'Reject Appeal'}
                </div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.5, fontFamily:'Poppins,sans-serif' }}>
                  {appealAction.action === 'approve'
                    ? <><strong style={{ color:'#374151' }}>{appealAction.appeal.email}</strong> will be unbanned and their offense count reset.</>
                    : <>The ban on <strong style={{ color:'#374151' }}>{appealAction.appeal.email}</strong> will remain permanent.</>}
                </div>
              </div>
            </div>
            <div style={{ padding:'14px 24px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', fontSize:12, color:'#374151' }}>
              <span style={{ color:'#6b7280', fontWeight:600 }}>Appeal reason: </span>{appealAction.appeal.reason}
            </div>
            <div style={{ padding:'16px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setAppealAction(null)} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                Cancel
              </button>
              <button onClick={() => appealAction.action === 'approve' ? handleApproveAppeal(appealAction.appeal) : handleRejectAppeal(appealAction.appeal)}
                disabled={actionLoading}
                style={{ padding:'10px 22px', borderRadius:10, border:'none', background:appealAction.action==='approve'?'#059669':'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:actionLoading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif', opacity:actionLoading?0.7:1, display:'inline-flex', alignItems:'center', gap:6 }}>
                {actionLoading ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Processing...</> : appealAction.action === 'approve' ? 'Approve & Unban' : 'Reject Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity modal for deleted accounts */}
      {viewActivity && <ActivityModal resident={viewActivity} onClose={() => setViewActivity(null)} />}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default UserManagement;
