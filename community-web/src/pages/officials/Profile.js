import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';

function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#dc2626' : '#059669', color: '#fff',
      padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
      zIndex: 3000, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {type === 'error'
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {msg}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{value || '—'}</div>
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
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,       setToast]       = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showPicker,   setShowPicker]  = useState(false);

  const PRESETS = Array.from({ length: 10 }, (_, i) => `preset_${i + 1}`);

  const resolveAvatar = url => {
    if (!url) return null;
    if (url.startsWith('preset_')) return `/avatar_${url}.png`;
    return url;
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

  // Activity stats
  const [stats, setStats] = useState(null);

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

  // Password change
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg,     setPassMsg]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('officials')
      .select('id, email, barangay, barangay_name, status, created_at, avatar_url')
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
    if (!newPass)               return setPassMsg({ type: 'error', text: 'Please enter a new password.' });
    if (newPass.length < 6)     return setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    if (newPass !== confirmPass) return setPassMsg({ type: 'error', text: 'Passwords do not match.' });
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);
    if (error) return setPassMsg({ type: 'error', text: error.message });
    setPassMsg({ type: 'success', text: 'Password updated successfully.' });
    setNewPass(''); setConfirmPass('');
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const statusStyle = STATUS_COLORS[profile?.status] || STATUS_COLORS.pending;

  const initials = (profile?.email || 'OF').slice(0, 2).toUpperCase();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title">My Profile</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>View and manage your official account details</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>Profile not found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

              {/* ── Left: Avatar card ── */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  {/* Avatar with edit button */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 84, height: 84, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', overflow: 'hidden', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                      {resolveAvatar(profile.avatar_url)
                        ? <img src={resolveAvatar(profile.avatar_url)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{initials}</span>
                      }
                    </div>
                    <button onClick={() => setShowPicker(v => !v)} disabled={savingAvatar}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#fff', border: '2px solid #2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                      title="Change avatar">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>

                  {/* Avatar picker */}
                  {showPicker && (
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: '14px', backdropFilter: 'blur(4px)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Avatar</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {PRESETS.map(p => (
                          <button key={p} onClick={() => handleSelectAvatar(p)}
                            style={{ padding: 0, border: profile.avatar_url === p ? '3px solid #2563eb' : '3px solid transparent', borderRadius: '50%', cursor: 'pointer', background: 'none', transition: 'border 0.15s' }}>
                            <img src={`/avatar_${p}.png`} alt={p} style={{ width: 40, height: 40, borderRadius: '50%', display: 'block', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowPicker(false)} style={{ marginTop: 10, width: '100%', padding: '6px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{profile.barangay_name ? `Barangay ${profile.barangay_name}` : profile.barangay || '—'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Barangay Official</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: statusStyle.bg, color: statusStyle.color, padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot }} />
                    {statusStyle.label}
                  </span>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Barangay" value={profile.barangay_name ? `Barangay ${profile.barangay_name}` : profile.barangay} />
                  <Field label="Member Since" value={fmt(profile.created_at)} />
                  <Field label="Account Email" value={profile.auth_email} />
                </div>
              </div>

              {/* ── Right: Edit panels ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Info card */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Account Information</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Your official account details</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <Field label="Email"      value={profile.auth_email} />
                    <Field label="Barangay"   value={profile.barangay_name ? `Barangay ${profile.barangay_name}` : profile.barangay} />
                    <Field label="Status"     value={statusStyle.label} />
                    <Field label="Member Since" value={fmt(profile.created_at)} />
                  </div>
                </div>

                {/* ── Activity Stats ── */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Barangay Activity</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Overview of reports and requests in your barangay</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px' }}>
                    {!stats ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                        <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {[
                          { label: 'Total Reports',     value: stats.totalReports,    accent: '#2563eb', bg: '#eff6ff',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                          { label: 'Resolved',          value: stats.resolvedReports, accent: '#059669', bg: '#d1fae5',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                          { label: 'Pending Reports',   value: stats.pendingReports,  accent: '#d97706', bg: '#fef3c7',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                          { label: 'Total Requests',    value: stats.totalRequests,   accent: '#7c3aed', bg: '#ede9fe',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
                          { label: 'Claimed',           value: stats.claimedRequests, accent: '#16a34a', bg: '#dcfce7',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                          { label: 'Pending Requests',  value: stats.pendingRequests, accent: '#e11d48', bg: '#ffe4e6',
                            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
                        ].map(s => (
                          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${s.accent}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>{s.icon}<span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span></div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.value ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Change Password */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Change Password</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Update your login password</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380 }}>
                      {[
                        ['New Password', newPass, setNewPass, showNew, setShowNew, 'Minimum 6 characters'],
                        ['Confirm Password', confirmPass, setConfirmPass, showConfirm, setShowConfirm, 'Re-enter new password'],
                      ].map(([label, val, setVal, show, setShow, ph]) => (
                        <div key={label}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                          <div style={{ position: 'relative' }}>
                            <input type={show ? 'text' : 'password'} value={val} onChange={e => { setVal(e.target.value); setPassMsg(null); }} placeholder={ph}
                              style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            <button type="button" onClick={() => setShow(v => !v)}
                              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
                              {show
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                      <button onClick={handleChangePassword} disabled={passLoading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: passLoading ? '#9ca3af' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: passLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>
                        {passLoading
                          ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
                          : <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Update Password
                            </>
                        }
                      </button>
                      {passMsg && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 14px', borderRadius: 9, background: passMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: passMsg.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${passMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                          {passMsg.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default OfficialProfile;
