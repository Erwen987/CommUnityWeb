import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

function AdminSettings() {
  const [backupFreq, setBackupFreq] = useState('daily');
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">System Settings</h1>
          <p className="off-page-sub">Manage system backup, recovery and data protection.</p>

          {/* Database Backup */}
          <div className="off-card" style={{ marginBottom: 20 }}>
            <h3 className="off-card-title">Database Backup</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Create a backup of the entire system database including residents, requests, and reports.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="off-publish-btn">Create Backup</button>
              <button style={{
                padding: '10px 24px', background: '#fff', color: '#2563eb',
                border: '1px solid #2563eb', borderRadius: 8,
                fontFamily: '"Poppins", sans-serif', fontWeight: 600,
                fontSize: 13, cursor: 'pointer'
              }}>
                Download Latest Backup
              </button>
            </div>
          </div>

          {/* Auto Backup */}
          <div className="off-card" style={{ marginBottom: 20 }}>
            <h3 className="off-card-title">Automatic Backup</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Enable automatic scheduled backups to protect system data.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Enable Auto Backup</span>
              <div
                onClick={() => setAutoBackup(!autoBackup)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: autoBackup ? '#2563eb' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: autoBackup ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Backup Frequency</label>
              <select
                className="off-filter-select"
                value={backupFreq}
                onChange={e => setBackupFreq(e.target.value)}
                style={{ width: 220 }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Data Management */}
          <div className="off-card">
            <h3 className="off-card-title">Data Management</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Manage system data and clear old records. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                padding: '10px 24px', background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 8,
                fontFamily: '"Poppins", sans-serif', fontWeight: 600,
                fontSize: 13, cursor: 'pointer'
              }}>
                Clear Old Records
              </button>
              <button style={{
                padding: '10px 24px', background: '#fff', color: '#374151',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontFamily: '"Poppins", sans-serif', fontWeight: 600,
                fontSize: 13, cursor: 'pointer'
              }}>
                Export All Data
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
