import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
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

function AdminProfile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  // Edit name
  const [editName, setEditName]   = useState(false);
  const [name,     setName]       = useState('');
  const [savingName, setSavingName] = useState(false);

  // Change password
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
      .from('admins')
      .select('id, full_name, email, created_at')
      .eq('auth_id', user.id)
      .single();

    if (data) {
      setProfile({ ...data, auth_email: user.email });
      setName(data.full_name || '');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from('admins')
      .update({ full_name: name.trim() })
      .eq('id', profile.id);
    setSavingName(false);
    if (error) { showToast('Failed to update name.', 'error'); return; }
    setProfile(p => ({ ...p, full_name: name.trim() }));
    setEditName(false);
    showToast('Display name updated.');
  };

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

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (profile?.auth_email || 'AD').slice(0, 2).toUpperCase();

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title">My Profile</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>View and manage your administrator account</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>Profile not found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

              {/* ── Left: Avatar card ── */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #374151 100%)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{profile.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{profile.auth_email}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#16a34a', padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    System Admin
                  </span>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Account Email" value={profile.auth_email} />
                  <Field label="Admin Since"   value={fmt(profile.created_at)} />
                  <Field label="Role"          value="System Administrator" />
                </div>
              </div>

              {/* ── Right: Edit panels ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Account info */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Account Information</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Your administrator account details</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <Field label="Email"       value={profile.auth_email} />
                    <Field label="Role"        value="System Administrator" />
                    <Field label="Admin Since" value={fmt(profile.created_at)} />

                    {/* Display name — editable */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Display Name</div>
                      {editName ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #2563eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                          <button onClick={handleSaveName} disabled={savingName}
                            style={{ padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {savingName ? '…' : 'Save'}
                          </button>
                          <button onClick={() => { setEditName(false); setName(profile.full_name || ''); }}
                            style={{ padding: '8px 10px', background: '#f1f5f9', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, color: profile.full_name ? '#1f2937' : '#9ca3af', fontWeight: 500 }}>
                            {profile.full_name || 'Not set'}
                          </span>
                          <button onClick={() => setEditName(true)}
                            style={{ background: '#eff6ff', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 8px', borderRadius: 6 }}>
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
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
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Update your admin login password</div>
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

export default AdminProfile;
