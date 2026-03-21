import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

/* ── Toast ── */
function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#dc2626' : '#059669', color: '#fff',
      padding: '13px 26px', borderRadius: 14, fontSize: 13.5, fontWeight: 600,
      zIndex: 3000, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
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

/* ── Info Row ── */
function InfoRow({ icon, label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9' }}>
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

function AdminProfile() {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [editName,     setEditName]     = useState(false);
  const [name,         setName]         = useState('');
  const [savingName,   setSavingName]   = useState(false);
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

  const loadStats = useCallback(async () => {
    const [
      { count: totalOfficials },
      { count: pendingOfficials },
      { count: totalReports },
      { count: resolvedReports },
      { count: totalRequests },
      { count: totalResidents },
    ] = await Promise.all([
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('officials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('residents').select('id', { count: 'exact', head: true }),
    ]);
    setStats({ totalOfficials, pendingOfficials, totalReports, resolvedReports, totalRequests, totalResidents });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('admins')
      .select('id, full_name, email, created_at, avatar_url')
      .eq('auth_id', user.id)
      .single();
    if (data) {
      setProfile({ ...data, auth_email: user.email });
      setName(data.full_name || '');
    }
    setLoading(false);
    loadStats();
  }, [loadStats]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSelectAvatar = async (preset) => {
    setSavingAvatar(true);
    const { error } = await supabase.from('admins').update({ avatar_url: preset }).eq('id', profile.id);
    setSavingAvatar(false);
    if (error) { showToast('Failed to update avatar.', 'error'); return; }
    setProfile(p => ({ ...p, avatar_url: preset }));
    setShowPicker(false);
    showToast('Avatar updated!');
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from('admins').update({ full_name: name.trim() }).eq('id', profile.id);
    setSavingName(false);
    if (error) { showToast('Failed to update name.', 'error'); return; }
    setProfile(p => ({ ...p, full_name: name.trim() }));
    setEditName(false);
    showToast('Display name updated.');
  };

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
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (profile?.auth_email || 'AD').slice(0, 2).toUpperCase();

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
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Select an avatar for your admin account</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => handleSelectAvatar(p)} disabled={savingAvatar}
              style={{
                padding: 0, border: profile.avatar_url === p ? '3px solid #1e3a5f' : '3px solid transparent',
                borderRadius: '50%', cursor: 'pointer', background: 'none', transition: 'all 0.15s',
                boxShadow: profile.avatar_url === p ? '0 0 0 3px rgba(30,58,95,0.2)' : 'none',
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
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          {/* Page Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 className="off-page-title">My Profile</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage your administrator account and system overview</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading profile…</div>
            </div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Profile not found</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Your admin profile could not be loaded.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22, alignItems: 'start' }}>

              {/* ── LEFT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Profile Card */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Hero Banner */}
                  <div style={{
                    background: 'linear-gradient(145deg, #0a1628 0%, #1e3a5f 55%, #2d5a9e 100%)',
                    padding: '36px 24px 28px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', top: 20, left: -30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                    {/* Avatar */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 92, height: 92, borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.35)',
                        boxShadow: '0 0 0 6px rgba(255,255,255,0.08)',
                        overflow: 'hidden', background: 'rgba(255,255,255,0.12)',
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
                          position: 'absolute', bottom: 2, right: 2, width: 28, height: 28,
                          borderRadius: '50%', background: '#fff', border: '2px solid #1e3a5f',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.25)', zIndex: 2, transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title="Change avatar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Name + role */}
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.01em' }}>
                        {profile.full_name || 'System Admin'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: 500 }}>
                        {profile.auth_email}
                      </div>
                    </div>

                    {/* Role badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                      color: '#fff', padding: '5px 16px', borderRadius: 999,
                      fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)',
                      zIndex: 1,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      System Admin
                    </span>
                  </div>

                  {/* Info rows */}
                  <div style={{ padding: '4px 20px 8px' }}>
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                      label="Display Name"
                      value={profile.full_name || 'Not set'}
                    />
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                      label="Account Email"
                      value={profile.auth_email}
                    />
                    <InfoRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                      label="Admin Since"
                      value={fmt(profile.created_at)}
                      last
                    />
                    <div style={{ height: 8 }} />
                  </div>
                </div>

                {/* Admin privilege card */}
                <div style={{ background: 'linear-gradient(135deg, #0f2444 0%, #1e3a5f 100%)', borderRadius: 16, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Administrator Access</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                        You have full system access including officials management, reports, and settings.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* System Overview */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f0f4ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>System Overview</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Platform-wide statistics at a glance</div>
                      </div>
                    </div>
                    {stats && (
                      <div style={{ fontSize: 11.5, color: '#6b7280', background: '#f3f4f6', padding: '5px 12px', borderRadius: 999, fontWeight: 600 }}>
                        {(stats.totalOfficials ?? 0)} active officials
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '22px 26px' }}>
                    {!stats ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <div style={{ width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                          <StatCard label="Active Officials" value={stats.totalOfficials} accent="#1e3a5f" bg="#eff6ff"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                            sub="Approved barangay" />
                          <StatCard label="Pending Approval" value={stats.pendingOfficials} accent="#d97706" bg="#fef3c7"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                            sub="Awaiting review" />
                          <StatCard label="Total Residents" value={stats.totalResidents} accent="#7c3aed" bg="#ede9fe"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                            sub="Registered users" />
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Reports & Requests</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          <StatCard label="Total Reports" value={stats.totalReports} accent="#2563eb" bg="#eff6ff"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                            sub="All barangays" />
                          <StatCard label="Resolved" value={stats.resolvedReports} accent="#059669" bg="#d1fae5"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            sub="Successfully closed" />
                          <StatCard label="Total Requests" value={stats.totalRequests} accent="#e11d48" bg="#ffe4e6"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>}
                            sub="All barangays" />
                        </div>

                        {/* Resolution bar */}
                        {stats.totalReports > 0 && (
                          <div style={{ marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                              <span>System-wide resolution rate</span>
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                {Math.round((stats.resolvedReports / stats.totalReports) * 100)}%
                              </span>
                            </div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.round((stats.resolvedReports / stats.totalReports) * 100)}%`, background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Account Info + Edit Name */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f0f4ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Account Information</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Your administrator account details</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 26px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Email */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</div>
                        <div style={{ fontSize: 13.5, color: '#1f2937', fontWeight: 600 }}>{profile.auth_email}</div>
                      </div>
                      {/* Role */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Role</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0f4ff', color: '#1e3a5f', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: '1px solid #dbeafe' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            System Administrator
                          </span>
                        </div>
                      </div>
                      {/* Admin Since */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Admin Since</div>
                        <div style={{ fontSize: 13.5, color: '#1f2937', fontWeight: 600 }}>{fmt(profile.created_at)}</div>
                      </div>
                      {/* Display Name — editable */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Display Name</div>
                        {editName ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditName(false); setName(profile.full_name || ''); } }}
                              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #1e3a5f', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                            <button onClick={handleSaveName} disabled={savingName}
                              style={{ padding: '8px 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              {savingName ? '…' : 'Save'}
                            </button>
                            <button onClick={() => { setEditName(false); setName(profile.full_name || ''); }}
                              style={{ padding: '8px 10px', background: '#f1f5f9', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13.5, color: profile.full_name ? '#1f2937' : '#9ca3af', fontWeight: 600 }}>
                              {profile.full_name || 'Not set'}
                            </span>
                            <button onClick={() => setEditName(true)}
                              style={{ background: '#f0f4ff', border: 'none', color: '#1e3a5f', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '3px 10px', borderRadius: 7 }}>
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Update your admin login password securely</div>
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
                              onFocus={e => e.target.style.borderColor = '#1e3a5f'}
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
                          padding: '11px 24px', background: passLoading ? '#9ca3af' : 'linear-gradient(135deg, #0a1628, #1e3a5f)',
                          color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 13.5,
                          cursor: passLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          boxShadow: passLoading ? 'none' : '0 4px 14px rgba(30,58,95,0.4)',
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
                        Use at least 6 characters for better security.
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

export default AdminProfile;
