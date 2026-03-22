import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

// ── Reusable UI ───────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 46, height: 26, borderRadius: 13, cursor: 'pointer', background: value ? '#2563eb' : '#d1d5db', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function SectionCard({ icon, title, sub, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      <div style={{ padding: '22px 24px' }}>{children}</div>
    </div>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 14px', borderRadius: 9, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
      {msg.type === 'success'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {msg.text}
    </div>
  );
}

function Btn({ onClick, variant = 'primary', disabled, loading, children, icon }) {
  const styles = {
    primary:   { background: disabled || loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#2563eb', border: '1.5px solid #2563eb' },
    danger:    { background: disabled || loading ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none' },
    ghost:     { background: '#f1f5f9', color: '#374151', border: '1.5px solid #e5e7eb' },
    dark:      { background: disabled || loading ? '#9ca3af' : '#1E3A5F', color: '#fff', border: 'none' },
    warning:   { background: disabled || loading ? '#fcd34d' : '#d97706', color: '#fff', border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ ...styles[variant], display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: disabled || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s' }}>
      {loading
        ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        : icon
      }
      {children}
    </button>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, variant = 'danger', onConfirm, onCancel, loading, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: children ? 16 : 24 }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <Btn onClick={onConfirm} variant={variant} loading={loading}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: type === 'error' ? '#dc2626' : '#059669', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 3000, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10 }}>
      {type === 'error'
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      }
      {msg}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const FREQ_DAYS = { daily: 1, weekly: 7, monthly: 30 };

function getBackupStatus(lastBackup, frequency) {
  if (!lastBackup) return { overdue: true, daysAgo: null, nextDue: null };
  const days = FREQ_DAYS[frequency] || 7;
  const msAgo = Date.now() - new Date(lastBackup).getTime();
  const daysAgo = Math.floor(msAgo / 86400000);
  const overdue = msAgo > days * 86400000;
  const nextDue = new Date(new Date(lastBackup).getTime() + days * 86400000);
  return { overdue, daysAgo, nextDue };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function AdminSettings() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // ── System preferences (from DB) ──────────────────────────────────────────
  const [prefs, setPrefs] = useState({ maintenance_mode: false, email_notifications: true, backup_frequency: 'weekly', auto_backup: true });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsDirty, setPrefsDirty] = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('key,value').then(({ data }) => {
      if (!data) { setPrefsLoaded(true); return; }
      const map = {};
      data.forEach(r => { map[r.key] = r.value; });
      setPrefs({
        maintenance_mode:    map.maintenance_mode    === 'true',
        email_notifications: map.email_notifications !== 'false',
        backup_frequency:    map.backup_frequency    || 'weekly',
        auto_backup:         map.auto_backup         !== 'false',
      });
      setPrefsLoaded(true);
    });
  }, []);

  const setPref = (key, val) => { setPrefs(p => ({ ...p, [key]: val })); setPrefsDirty(true); };

  const savePrefs = async () => {
    setSavingPrefs(true);
    const updates = Object.entries(prefs).map(([key, value]) =>
      supabase.from('system_settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    );
    await Promise.all(updates);
    setSavingPrefs(false);
    setPrefsDirty(false);
    showToast('Settings saved successfully.');
  };

  // ── Admin management ───────────────────────────────────────────────────────
  const [admins,        setAdmins]        = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [removingId,    setRemovingId]    = useState(null);
  const [newName,       setNewName]       = useState('');
  const [newEmail,      setNewEmail]      = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [showNewPw,     setShowNewPw]     = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [createMsg,     setCreateMsg]     = useState(null);
  const [currentEmail,  setCurrentEmail]  = useState('');
  const [removeTarget,  setRemoveTarget]  = useState(null);

  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (user?.email) setCurrentEmail(user.email); }); }, []);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
    setAdmins(data || []);
    setAdminsLoading(false);
  }, []);
  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleCreateAdmin = async () => {
    setCreateMsg(null);
    if (!newName.trim())         return setCreateMsg({ type: 'error', text: 'Full name is required.' });
    if (!newEmail.trim())        return setCreateMsg({ type: 'error', text: 'Email is required.' });
    if (newPassword.length < 6)  return setCreateMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    setCreating(true);

    // Save current admin session before signUp (signUp may auto-login the new user)
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email: newEmail.trim().toLowerCase(), password: newPassword });

    // Always restore the admin's session regardless of outcome
    if (adminSession) {
      await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
    }

    if (signUpErr) { setCreating(false); return setCreateMsg({ type: 'error', text: signUpErr.message }); }
    if (!signUpData.user?.id) { setCreating(false); return setCreateMsg({ type: 'error', text: 'Failed to create auth user. The email may already be in use.' }); }

    const { error: insertErr } = await supabase.from('admins').insert({ auth_id: signUpData.user.id, email: newEmail.trim().toLowerCase(), full_name: newName.trim() });
    setCreating(false);
    if (insertErr) return setCreateMsg({ type: 'error', text: insertErr.message });
    setCreateMsg({ type: 'success', text: `Admin account created for ${newEmail.trim()}.` });
    setNewName(''); setNewEmail(''); setNewPassword('');
    loadAdmins();
  };

  const handleRemoveAdmin = async () => {
    const admin = removeTarget;
    setRemovingId(admin.id);
    await supabase.from('admins').delete().eq('id', admin.id);
    setRemovingId(null);
    setRemoveTarget(null);
    loadAdmins();
    showToast('Admin account removed.');
  };

  // ── Export / Backup ────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup,    setLastBackup]    = useState(localStorage.getItem('last_backup_time') || null);
  const [reminderDismissed, setReminderDismissed] = useState(
    sessionStorage.getItem('backup_reminder_dismissed') === 'true'
  );

  // Compute backup status whenever prefs or lastBackup changes (after prefs loaded)
  const backupStatus = prefsLoaded ? getBackupStatus(lastBackup, prefs.backup_frequency) : null;
  const showReminderBanner = prefsLoaded && prefs.auto_backup && backupStatus?.overdue && !reminderDismissed;

  const dismissReminder = () => {
    sessionStorage.setItem('backup_reminder_dismissed', 'true');
    setReminderDismissed(true);
  };

  const fmtDate = ts => ts ? new Date(ts).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  const fmtDateShort = ts => ts ? new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExportLoading(true);
    const [{ data: users }, { data: reports }, { data: requests }, { data: officials }] = await Promise.all([
      supabase.from('users').select('id,first_name,last_name,email,barangay,role,points,created_at,is_banned'),
      supabase.from('reports').select('*'),
      supabase.from('requests').select('*'),
      supabase.from('officials').select('id,barangay_name,barangay,email,status,created_at'),
    ]);
    downloadJSON({ exported_at: new Date().toISOString(), users, reports, requests, officials }, `community_export_${new Date().toISOString().slice(0,10)}.json`);
    setExportLoading(false);
    showToast('Data exported successfully.');
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    const [{ data: users }, { data: reports }, { data: requests }, { data: officials }, { data: settings }] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('reports').select('*'),
      supabase.from('requests').select('*'),
      supabase.from('officials').select('*'),
      supabase.from('system_settings').select('*'),
    ]);
    const timestamp = new Date().toISOString();
    downloadJSON(
      { backup_version: '1.0', created_at: timestamp, tables: { users, reports, requests, officials, system_settings: settings } },
      `community_backup_${timestamp.slice(0,19).replace(/:/g,'-')}.json`
    );
    localStorage.setItem('last_backup_time', timestamp);
    setLastBackup(timestamp);
    // Clear dismissed flag so the next overdue period shows fresh reminder
    sessionStorage.removeItem('backup_reminder_dismissed');
    setReminderDismissed(false);
    setBackupLoading(false);
    showToast('Backup created and downloaded.');
  };

  // ── Clear old records ──────────────────────────────────────────────────────
  const [clearModal,  setClearModal]  = useState(false);
  const [clearMonths, setClearMonths] = useState('6');
  const [clearType,   setClearType]   = useState({ reports: true, requests: true });
  const [clearing,    setClearing]    = useState(false);
  const [clearMsg,    setClearMsg]    = useState(null);

  const handleClear = async () => {
    setClearing(true);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - parseInt(clearMonths));
    const cutoffISO = cutoff.toISOString();
    let deleted = 0;
    if (clearType.reports) {
      const { data } = await supabase.from('reports').delete().lt('created_at', cutoffISO).select('id');
      deleted += data?.length || 0;
    }
    if (clearType.requests) {
      const { data } = await supabase.from('requests').delete().lt('created_at', cutoffISO).select('id');
      deleted += data?.length || 0;
    }
    setClearing(false);
    setClearModal(false);
    showToast(`Cleared ${deleted} old record${deleted !== 1 ? 's' : ''} successfully.`);
  };

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title">System Settings</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage admin accounts, backup, and system preferences — to change your password, go to <a href="/admin/profile" style={{ color: '#2563eb', fontWeight: 600 }}>Profile</a></p>
          </div>

          {/* ── Backup Reminder Banner ── */}
          {showReminderBanner && (
            <div style={{
              marginBottom: 20, padding: '16px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #f59e0b',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              boxShadow: '0 2px 12px rgba(245,158,11,0.15)',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
                  {lastBackup ? 'Backup Overdue' : 'No Backup Created Yet'}
                </div>
                <div style={{ fontSize: 12, color: '#b45309', marginTop: 3, lineHeight: 1.5 }}>
                  {lastBackup
                    ? `Your last backup was ${backupStatus.daysAgo === 0 ? 'today' : `${backupStatus.daysAgo} day${backupStatus.daysAgo !== 1 ? 's' : ''} ago`} (${fmtDateShort(lastBackup)}). Your schedule is set to <strong>${prefs.backup_frequency}</strong>.`
                    : 'You have not created any backup yet. It\'s recommended to back up your data regularly.'
                  }
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn onClick={handleBackup} loading={backupLoading} variant="warning"
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                  Backup Now
                </Btn>
                <button onClick={dismissReminder} style={{ padding: '10px 16px', borderRadius: 9, border: '1.5px solid #fbbf24', background: 'transparent', color: '#92400e', fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* ── Admin Management ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
            title="Admin Management" sub="Add or remove administrator accounts">

            {/* Create form */}
            <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create New Admin Account
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[['Full Name','text',newName,e=>setNewName(e.target.value),'e.g. Juan Dela Cruz'],['Email','email',newEmail,e=>setNewEmail(e.target.value),'e.g. admin@barangay.gov.ph']].map(([label,type,val,onChange,ph]) => (
                  <div key={label}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label} <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type={type} value={val} onChange={onChange} placeholder={ph} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14, maxWidth: 320 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporary Password <span style={{ color: '#dc2626' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters"
                    style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
                    {showNewPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 8 }}>
                <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Share the temporary password with the new admin and ask them to change it after first login.
              </div>
              <Btn onClick={handleCreateAdmin} loading={creating} variant="dark"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}>
                {creating ? 'Creating...' : 'Create Admin'}
              </Btn>
              {createMsg && <div style={{ marginTop: 12 }}><StatusMsg msg={createMsg} /></div>}
            </div>

            {/* Existing admins */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Existing Admins ({admins.length})</div>
            {adminsLoading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div style={{ width: 28, height: 28, border: '3px solid #e0e7ef', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {admins.map(a => {
                    const initials = (a.full_name || a.email).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                    const isMe = a.email === currentEmail;
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${isMe ? '#bfdbfe' : '#f1f5f9'}`, background: isMe ? '#f0f9ff' : '#fff' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1E3A5F', flexShrink: 0 }}>{initials}</div>
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
                          <button onClick={() => setRemoveTarget(a)} disabled={removingId === a.id} title="Remove admin"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.15s, background 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
            }
          </SectionCard>

          {/* ── System Preferences ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}
            title="System Preferences" sub="Configure global system behavior — changes are saved to the database">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {/* Email notifications */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>Email Notifications</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Send email alerts for new approvals and reports</div>
                </div>
                <Toggle value={prefs.email_notifications} onChange={() => setPref('email_notifications', !prefs.email_notifications)} />
              </div>

              {/* Maintenance mode */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: prefs.maintenance_mode ? '#fef2f2' : '#f8fafc', borderRadius: 10, border: `1px solid ${prefs.maintenance_mode ? '#fecaca' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: prefs.maintenance_mode ? '#dc2626' : '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Maintenance Mode
                    {prefs.maintenance_mode && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>When ON — officials and residents are blocked from logging in. Admin access is unaffected.</div>
                </div>
                <Toggle value={prefs.maintenance_mode} onChange={() => setPref('maintenance_mode', !prefs.maintenance_mode)} />
              </div>
            </div>

            {prefsDirty && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Btn onClick={savePrefs} loading={savingPrefs} variant="primary"
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}>
                  {savingPrefs ? 'Saving...' : 'Save Changes'}
                </Btn>
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Unsaved changes</span>
              </div>
            )}
          </SectionCard>

          {/* ── Backup & Reminder Schedule ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>}
            title="Database Backup" sub="Download a full snapshot and configure reminder schedule">

            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              Creates a downloadable JSON backup of all users, reports, requests, and settings. Store it in a safe location.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <Btn onClick={handleBackup} loading={backupLoading} variant="dark"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                {backupLoading ? 'Creating...' : 'Create & Download Backup'}
              </Btn>
            </div>

            {/* Backup status row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Last Backup</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: lastBackup ? '#1f2937' : '#9ca3af' }}>
                  {lastBackup ? fmtDate(lastBackup) : 'Never'}
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Next Reminder Due</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: backupStatus?.overdue ? '#dc2626' : '#1f2937' }}>
                  {!prefs.auto_backup
                    ? <span style={{ color: '#9ca3af' }}>Reminders off</span>
                    : backupStatus?.overdue
                      ? <span style={{ color: '#dc2626' }}>Overdue now</span>
                      : backupStatus?.nextDue
                        ? fmtDateShort(backupStatus.nextDue)
                        : '—'
                  }
                </div>
              </div>
            </div>

            {/* Reminder schedule settings */}
            <div style={{ paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 4 }}>Backup Reminder Schedule</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                When enabled, a reminder banner will appear on this page when a backup is overdue.
              </div>

              {/* Enable toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>Enable Backup Reminders</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Show a reminder banner when a backup is overdue based on your schedule</div>
                </div>
                <Toggle value={prefs.auto_backup} onChange={() => setPref('auto_backup', !prefs.auto_backup)} />
              </div>

              {/* Frequency + save */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reminder Frequency</label>
                  <select value={prefs.backup_frequency} onChange={e => setPref('backup_frequency', e.target.value)}
                    disabled={!prefs.auto_backup}
                    style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: prefs.auto_backup ? '#374151' : '#9ca3af', outline: 'none', background: prefs.auto_backup ? '#f9fafb' : '#f3f4f6', cursor: prefs.auto_backup ? 'pointer' : 'not-allowed', width: 200, fontFamily: 'inherit' }}>
                    <option value="daily">Daily (every 1 day)</option>
                    <option value="weekly">Weekly (every 7 days)</option>
                    <option value="monthly">Monthly (every 30 days)</option>
                  </select>
                </div>

                {/* Frequency helper text */}
                {prefs.auto_backup && (
                  <div style={{ fontSize: 12, color: '#6b7280', paddingBottom: 10 }}>
                    Reminder fires every <strong>{FREQ_DAYS[prefs.backup_frequency]} day{FREQ_DAYS[prefs.backup_frequency] !== 1 ? 's' : ''}</strong> since last backup
                  </div>
                )}
              </div>

              {prefsDirty && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <Btn onClick={savePrefs} loading={savingPrefs} variant="primary"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}>
                    {savingPrefs ? 'Saving...' : 'Save Schedule'}
                  </Btn>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Unsaved changes</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Data Management ── */}
          <SectionCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>}
            title="Data Management" sub="Export or clear records from the system">

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Export */}
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 6 }}>Export All Data</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, lineHeight: 1.5 }}>Download all users, reports, and requests as a JSON file.</div>
                <Btn onClick={handleExport} loading={exportLoading} variant="ghost"
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}>
                  {exportLoading ? 'Exporting...' : 'Export JSON'}
                </Btn>
              </div>

              {/* Clear records */}
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', marginBottom: 6 }}>Clear Old Records</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, lineHeight: 1.5 }}>Permanently delete old resolved reports and requests.</div>
                <Btn onClick={() => setClearModal(true)} variant="danger"
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>}>
                  Clear Records
                </Btn>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: '#fef9c3', borderRadius: 9, border: '1px solid #fde047', display: 'flex', gap: 10, fontSize: 12, color: '#854d0e' }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Always create a backup before clearing records. Deleted data cannot be recovered.</span>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* ── Remove admin confirm ── */}
      {removeTarget && (
        <ConfirmModal
          title="Remove Admin"
          message={`Are you sure you want to remove ${removeTarget.full_name || removeTarget.email} as an admin? They will lose all admin access immediately.`}
          confirmLabel="Remove Admin"
          variant="danger"
          onConfirm={handleRemoveAdmin}
          onCancel={() => setRemoveTarget(null)}
          loading={!!removingId}
        />
      )}

      {/* ── Clear records confirm ── */}
      {clearModal && (
        <ConfirmModal
          title="Clear Old Records"
          message="This will permanently delete resolved reports and requests older than the selected period. This cannot be undone."
          confirmLabel="Clear Records"
          variant="danger"
          onConfirm={handleClear}
          onCancel={() => { setClearModal(false); setClearMsg(null); }}
          loading={clearing}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delete records older than</label>
              <select value={clearMonths} onChange={e => setClearMonths(e.target.value)}
                style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', fontFamily: 'inherit', width: '100%' }}>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">1 year</option>
                <option value="24">2 years</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Which records to clear</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['reports','Reports'],['requests','Requests']].map(([k,l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" checked={clearType[k]} onChange={() => setClearType(t => ({ ...t, [k]: !t[k] }))} style={{ width: 15, height: 15, accentColor: '#dc2626' }} />{l}
                  </label>
                ))}
              </div>
            </div>
            {clearMsg && <StatusMsg msg={clearMsg} />}
          </div>
        </ConfirmModal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

export default AdminSettings;
