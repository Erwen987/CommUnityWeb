import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 46, height: 26, borderRadius: 13, cursor: 'pointer', background: value ? '#1E3A5F' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function SectionCard({ icon, title, sub, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{sub}</div>
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

const Input = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }} />
  </div>
);

function AdminSettings() {
  const [backupFreq,       setBackupFreq]       = useState('daily');
  const [autoBackup,       setAutoBackup]       = useState(true);
  const [notifications,    setNotifications]    = useState(true);
  const [maintenanceMode,  setMaintenanceMode]  = useState(false);

  // ── Change Password ───────────────────────────────────────────────────────
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg,     setPassMsg]     = useState(null); // { type: 'success'|'error', text }

  const handleChangePassword = async () => {
    setPassMsg(null);
    if (!newPass)                     return setPassMsg({ type: 'error', text: 'Please enter a new password.' });
    if (newPass.length < 6)           return setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    if (newPass !== confirmPass)       return setPassMsg({ type: 'error', text: 'Passwords do not match.' });

    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);

    if (error) return setPassMsg({ type: 'error', text: error.message });
    setPassMsg({ type: 'success', text: 'Password updated successfully.' });
    setNewPass(''); setConfirmPass('');
  };

  // ── Admin Management ──────────────────────────────────────────────────────
  const [admins,       setAdmins]       = useState([]);
  const [adminsLoading,setAdminsLoading]= useState(false);
  const [removingId,   setRemovingId]   = useState(null);

  const [newName,      setNewName]      = useState('');
  const [newEmail,     setNewEmail]     = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [createMsg,    setCreateMsg]    = useState(null);

  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setCurrentEmail(user.email);
    });
  }, []);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
    setAdmins(data || []);
    setAdminsLoading(false);
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleCreateAdmin = async () => {
    setCreateMsg(null);
    if (!newName.trim())              return setCreateMsg({ type: 'error', text: 'Full name is required.' });
    if (!newEmail.trim())             return setCreateMsg({ type: 'error', text: 'Email is required.' });
    if (newPassword.length < 6)      return setCreateMsg({ type: 'error', text: 'Password must be at least 6 characters.' });

    setCreating(true);

    // 1. Create Supabase auth account
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email:    newEmail.trim().toLowerCase(),
      password: newPassword,
    });

    if (signUpErr) {
      setCreating(false);
      return setCreateMsg({ type: 'error', text: signUpErr.message });
    }

    // 2. Insert into admins table
    const { error: insertErr } = await supabase.from('admins').insert({
      auth_id:   signUpData.user?.id ?? null,
      email:     newEmail.trim().toLowerCase(),
      full_name: newName.trim(),
    });

    setCreating(false);

    if (insertErr) return setCreateMsg({ type: 'error', text: insertErr.message });

    setCreateMsg({ type: 'success', text: `Admin account created for ${newEmail.trim()}.` });
    setNewName(''); setNewEmail(''); setNewPassword('');
    loadAdmins();
  };

  const handleRemoveAdmin = async (admin) => {
    if (admin.email === currentEmail) return setCreateMsg({ type: 'error', text: "You can't remove your own account." });
    setRemovingId(admin.id);
    await supabase.from('admins').delete().eq('id', admin.id);
    setRemovingId(null);
    loadAdmins();
  };

  const Btn = ({ onClick, variant = 'primary', disabled, children, icon }) => {
    const styles = {
      primary:   { background: disabled ? '#9ca3af' : '#1E3A5F', color: '#fff', border: 'none' },
      secondary: { background: '#fff',    color: '#1E3A5F', border: '1.5px solid #1E3A5F' },
      danger:    { background: '#dc2626', color: '#fff', border: 'none' },
      ghost:     { background: '#f1f5f9', color: '#374151', border: '1.5px solid #e5e7eb' },
    };
    return (
      <button onClick={onClick} disabled={disabled}
        style={{ ...styles[variant], display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.7 : 1 }}>
        {icon}{children}
      </button>
    );
  };

  const EyeIcon = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  const PasswordInput = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label} <span style={{ color: '#dc2626' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width: '100%', padding: '9px 38px 9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <EyeIcon show={show} onToggle={onToggle} />
      </div>
    </div>
  );

  const StatusMsg = ({ msg }) => msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 14px', borderRadius: 9,
      background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
      color:      msg.type === 'success' ? '#16a34a'  : '#dc2626',
      border:    `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
      {msg.type === 'success'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>System Settings</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage admin accounts, security, backup, and system preferences</p>
          </div>

          {/* ── Change Password ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            title="Change Password"
            sub="Update your admin account password"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
              <PasswordInput label="New Password"     value={newPass}     onChange={e => setNewPass(e.target.value)}     show={showNew}     onToggle={() => setShowNew(v => !v)}     placeholder="Minimum 6 characters" />
              <PasswordInput label="Confirm Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Re-enter new password" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Btn onClick={handleChangePassword} disabled={passLoading}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}>
                  {passLoading ? 'Saving...' : 'Update Password'}
                </Btn>
              </div>
              <StatusMsg msg={passMsg} />
            </div>
          </SectionCard>

          {/* ── Admin Management ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
            title="Admin Management"
            sub="Add or remove administrator accounts"
          >
            {/* Create new admin form */}
            <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create New Admin Account
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <Input label="Full Name" value={newName}  onChange={e => setNewName(e.target.value)}  placeholder="e.g. Juan Dela Cruz" required />
                <Input label="Email"     value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. admin@barangay.gov.ph" required />
              </div>
              <div style={{ marginBottom: 14, maxWidth: 320 }}>
                <PasswordInput label="Temporary Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} show={showNewPw} onToggle={() => setShowNewPw(v => !v)} placeholder="Minimum 6 characters" />
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 8 }}>
                <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Share the temporary password with the new admin and ask them to change it after first login.
              </div>
              <Btn onClick={handleCreateAdmin} disabled={creating}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}>
                {creating ? 'Creating...' : 'Create Admin'}
              </Btn>
              {createMsg && <div style={{ marginTop: 12 }}><StatusMsg msg={createMsg} /></div>}
            </div>

            {/* Existing admins list */}
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Existing Admins ({admins.length})
            </div>

            {adminsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : admins.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>No admins found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {admins.map(a => {
                  const initials = a.full_name ? a.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : a.email.slice(0,2).toUpperCase();
                  const isMe = a.email === currentEmail;
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid #f1f5f9', background: isMe ? '#f0f9ff' : '#fff' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1E3A5F', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                          {a.full_name || '—'}
                          {isMe && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 999 }}>You</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{a.email}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#d1d5db', flexShrink: 0 }}>
                        {new Date(a.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {!isMe && (
                        <button onClick={() => handleRemoveAdmin(a)} disabled={removingId === a.id}
                          title="Remove admin"
                          style={{ background: 'none', border: 'none', cursor: removingId === a.id ? 'not-allowed' : 'pointer', color: '#d1d5db', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', flexShrink: 0, opacity: removingId === a.id ? 0.4 : 1, transition: 'color 0.15s, background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── Database Backup ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>}
            title="Database Backup"
            sub="Create and download a full snapshot of the system database"
          >
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              Create a backup of the entire system database including residents, requests, and reports. Backups are encrypted and stored securely.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn variant="primary" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                Create Backup
              </Btn>
              <Btn variant="secondary" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                Download Latest Backup
              </Btn>
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Last backup: No backups created yet
            </div>
          </SectionCard>

          {/* ── Automatic Backup ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>}
            title="Automatic Backup"
            sub="Schedule recurring backups to protect system data"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>Enable Automatic Backup</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Automatically back up the system on a set schedule</div>
                </div>
                <Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Backup Frequency</label>
                <select value={backupFreq} onChange={e => setBackupFreq(e.target.value)}
                  style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer', width: 220 }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  {backupFreq === 'daily' ? 'Backup runs every day at midnight' : backupFreq === 'weekly' ? 'Backup runs every Sunday at midnight' : 'Backup runs on the 1st of each month'}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── System Preferences ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}
            title="System Preferences"
            sub="Configure global system behavior and notifications"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>Email Notifications</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Send email alerts for new approvals and reports</div>
                </div>
                <Toggle value={notifications} onChange={() => setNotifications(!notifications)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: maintenanceMode ? '#fef2f2' : '#f8fafc', borderRadius: 10, border: `1px solid ${maintenanceMode ? '#fecaca' : '#e5e7eb'}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: maintenanceMode ? '#dc2626' : '#1f2937' }}>Maintenance Mode</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Temporarily disable access for non-admin users</div>
                </div>
                <Toggle value={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
              </div>
            </div>
          </SectionCard>

          {/* ── Data Management ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>}
            title="Data Management"
            sub="Clear old records and export system data"
          >
            <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', marginBottom: 20, display: 'flex', gap: 10 }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
                <strong>Warning:</strong> Clearing records is permanent and cannot be undone. Make sure to create a backup before proceeding.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn variant="danger" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>}>
                Clear Old Records
              </Btn>
              <Btn variant="ghost" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                Export All Data
              </Btn>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
