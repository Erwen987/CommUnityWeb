import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

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

function AdminSettings() {
  const [backupFreq, setBackupFreq] = useState('daily');
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const Btn = ({ onClick, variant = 'primary', children, icon }) => {
    const styles = {
      primary:   { background: '#1E3A5F', color: '#fff', border: 'none' },
      secondary: { background: '#fff',    color: '#1E3A5F', border: '1.5px solid #1E3A5F' },
      danger:    { background: '#dc2626', color: '#fff', border: 'none' },
      ghost:     { background: '#f1f5f9', color: '#374151', border: '1.5px solid #e5e7eb' },
    };
    return (
      <button onClick={onClick} style={{ ...styles[variant], display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        {icon}{children}
      </button>
    );
  };

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>System Settings</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage system backup, recovery, and data protection</p>
          </div>

          {/* Database Backup */}
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

          {/* Automatic Backup */}
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

          {/* System Preferences */}
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

          {/* Data Management */}
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
