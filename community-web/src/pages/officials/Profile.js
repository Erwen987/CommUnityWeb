import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';

/* ── Toast ── */
function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#dc2626' : '#059669', color: '#fff',
      padding: '13px 26px', borderRadius: 14, fontSize: 13.5, fontWeight: 600,
      zIndex: 3000, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.25s ease',
    }}>
      {type === 'error'
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {msg}
    </div>
  );
}

/* ── Info Row ── */
function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: '#1f2937', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, accent, bg, icon, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${bg}`,
      borderTop: `3px solid ${accent}`, transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1 }}>{value ?? 0}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

const STATUS_COLORS = {
  approved: { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e', label: 'Approved' },
  pending:  { bg: '#fef9c3', color: '#ca8a04', dot: '#eab308', label: 'Pending'  },
  rejected: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', label: 'Rejected' },
  banned:   { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', label: 'Banned'   },
};

function OfficialProfile() {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  const [stats,        setStats]        = useState(null);

  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg,     setPassMsg]     = useState(null);

  const PRESETS = Array.from({ length: 10 }, (_, i) => `preset_${i + 1}`);

  const resolveAvatar = url => {
    if (!url) return null;
    if (url.startsWith('preset_')) return `/avatar_${url}.png`;
    return url;
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const handleSelectAvatar = async (preset) => {
    setSavingAvatar(true);
    const { error } = await supabase.from('officials').update({ avatar_url: preset }).eq('id', profile.id);
    setSavingAvatar(false);
    if (error) { showToast('Failed to update avatar.', 'error'); return; }
    setProfile(p => ({ ...p, avatar_url: preset }));
    setShowPicker(false);
    showToast('Avatar updated!');
  };

  const loadStats = useCallback(async (barangay) => {
    if (!barangay) return;
    const [
      { count: totalReports },
      { count: resolvedReports },
      { count: pendingReports },
      { count: totalRequests },
      { count: pendingRequests },
      { count: claimedRequests },
    ] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('barangay', barangay),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('barangay', barangay).eq('status', 'resolved'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('barangay', barangay).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('barangay', barangay),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('barangay', barangay).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('barangay', barangay).eq('status', 'claimed'),
    ]);
    setStats({ totalReports, resolvedReports, pendingReports, totalRequests, pendingRequests, claimedRequests });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('officials')
      .select('id, email, barangay, barangay_name, status, created_at, avatar_url, full_name, position')
      .eq('auth_id', user.id)
      .single();
    if (data) {
      setProfile({ ...data, auth_email: user.email });
      loadStats(data.barangay);
    }
    setLoading(false);
  }, [loadStats]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChangePassword = async () => {
    setPassMsg(null);
    if (!newPass)                return setPassMsg({ type: 'error', text: 'Please enter a new password.' });
    if (newPass.length < 6)      return setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    if (newPass !== confirmPass)  return setPassMsg({ type: 'error', text: 'Passwords do not match.' });
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);
    if (error) return setPassMsg({ type: 'error', text: error.message });
    setPassMsg({ type: 'success', text: 'Password updated successfully.' });
    setNewPass(''); setConfirmPass('');
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const statusStyle = STATUS_COLORS[profile?.status] || STATUS_COLORS.pending;
  const initials = (profile?.full_name || profile?.email || 'OF').slice(0, 2).toUpperCase();
  const barangayLabel = profile?.barangay_name ? `Barangay ${profile.barangay_name}` : profile?.barangay || '—';

  /* ── Avatar Picker Modal ── */
  const AvatarPickerModal = () => (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)',
    }} onClick={() => setShowPicker(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: '28px', width: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'fadeInUp 0.2s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Choose Your Avatar</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Select an avatar that represents you</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => handleSelectAvatar(p)} disabled={savingAvatar}
              style={{
                padding: 0, border: profile.avatar_url === p ? '3px solid #2563eb' : '3px solid transparent',
                borderRadius: '50%', cursor: 'pointer', background: 'none', transition: 'all 0.15s',
                boxShadow: profile.avatar_url === p ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
              }}>
              <img src={`/avatar_${p}.png`} alt={p} style={{ width: 46, height: 46, borderRadius: '50%', display: 'block', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
        <button onClick={() => setShowPicker(false)} style={{
          width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb',
          background: '#f9fafb', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {/* Page Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 className="off-page-title">My Profile</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage your official account and barangay activity</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading profile…</div>
            </div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Profile not found</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Your profile could not be loaded.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22, alignItems: 'start' }}>

              {/* ── LEFT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Profile Card */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Hero Banner */}
                  <div style={{
                    background: 'linear-gradient(145deg, #0f2444 0%, #1e3a5f 50%, #2563eb 100%)',
                    padding: '36px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 12, position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                    {/* Avatar */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 92, height: 92, borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.35)',
                        boxShadow: '0 0 0 6px rgba(255,255,255,0.1)',
                        overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 30, fontWeight: 800, color: '#fff',
                      }}>
                        {resolveAvatar(profile.avatar_url)
                          ? <img src={resolveAvatar(profile.avatar_url)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span>{initials}</span>
                        }
                      </div>
                      <button onClick={() => setShowPicker(true)} disabled={savingAvatar}
                        style={{
                          position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%',
                          background: '#fff', border: '2px solid #2563eb', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.25)', zIndex: 2, transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title="Change avatar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Name + role */}
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.01em' }}>{profile.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 500 }}>{profile.position || 'Barangay Official'}</div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: statusStyle.bg, color: statusStyle.color,
                      padding: '5px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 1,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusStyle.dot }} />
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div style={{ padding: '4px 20px 8px' }}>
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                      label="Barangay"
                      value={barangayLabel}
                    />
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                      label="Member Since"
                      value={fmt(profile.created_at)}
                    />
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                      label="Account Email"
                      value={profile.auth_email}
                    />
                    {/* Remove bottom border from last row */}
                    <div style={{ height: 8 }} />
                  </div>
                </div>

                {/* Quick tip card */}
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: 16, padding: '16px 18px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 3 }}>Quick Tip</div>
                      <div style={{ fontSize: 11.5, color: '#3b82f6', lineHeight: 1.5 }}>
                        Click the pencil icon on your avatar to personalize your profile photo.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Barangay Activity */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Barangay Activity</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Reports and requests in {barangayLabel}</div>
                      </div>
                    </div>
                    {stats && (
                      <div style={{ fontSize: 11.5, color: '#6b7280', background: '#f3f4f6', padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>
                        {(stats.resolvedReports ?? 0)} resolved
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '22px 26px' }}>
                    {!stats ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : (
                      <>
                        {/* Section label */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Reports</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                          <StatCard label="Total" value={stats.totalReports} accent="#2563eb" bg="#eff6ff"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                            sub={`${stats.totalReports ?? 0} total submitted`} />
                          <StatCard label="Resolved" value={stats.resolvedReports} accent="#059669" bg="#d1fae5"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            sub="Successfully closed" />
                          <StatCard label="Pending" value={stats.pendingReports} accent="#d97706" bg="#fef3c7"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                            sub="Awaiting action" />
                        </div>

                        {/* Progress bar */}
                        {stats.totalReports > 0 && (
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                              <span>Resolution rate</span>
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                {Math.round((stats.resolvedReports / stats.totalReports) * 100)}%
                              </span>
                            </div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.round((stats.resolvedReports / stats.totalReports) * 100)}%`, background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Requests</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          <StatCard label="Total" value={stats.totalRequests} accent="#7c3aed" bg="#ede9fe"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>}
                            sub="All submitted" />
                          <StatCard label="Claimed" value={stats.claimedRequests} accent="#16a34a" bg="#dcfce7"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                            sub="Fulfilled" />
                          <StatCard label="Pending" value={stats.pendingRequests} accent="#e11d48" bg="#ffe4e6"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                            sub="Needs attention" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Change Password */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Change Password</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Update your login password securely</div>
                    </div>
                  </div>
                  <div style={{ padding: '24px 26px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
                      {[
                        ['New Password',     newPass,     setNewPass,     showNew,     setShowNew,     'Minimum 6 characters'],
                        ['Confirm Password', confirmPass, setConfirmPass, showConfirm, setShowConfirm, 'Re-enter new password'],
                      ].map(([label, val, setVal, show, setShow, ph]) => (
                        <div key={label}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={show ? 'text' : 'password'} value={val}
                              onChange={e => { setVal(e.target.value); setPassMsg(null); }}
                              placeholder={ph}
                              style={{
                                width: '100%', padding: '11px 42px 11px 14px',
                                border: '1.5px solid #e5e7eb', borderRadius: 11, fontSize: 13,
                                outline: 'none', background: '#fafafa', boxSizing: 'border-box',
                                fontFamily: 'inherit', transition: 'border 0.15s',
                              }}
                              onFocus={e => e.target.style.borderColor = '#2563eb'}
                              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <button type="button" onClick={() => setShow(v => !v)}
                              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
                              {show
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                      <button onClick={handleChangePassword} disabled={passLoading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '11px 24px', background: passLoading ? '#9ca3af' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                          color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 13.5,
                          cursor: passLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          boxShadow: passLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!passLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                      >
                        {passLoading
                          ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Updating…</>
                          : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Update Password</>
                        }
                      </button>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        Use at least 6 characters with a mix of letters and numbers.
                      </div>
                    </div>

                    {passMsg && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                        padding: '12px 16px', borderRadius: 11, marginTop: 16,
                        background: passMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: passMsg.type === 'success' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${passMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                      }}>
                        {passMsg.type === 'success'
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        }
                        {passMsg.text}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {showPicker && <AvatarPickerModal />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default OfficialProfile;
