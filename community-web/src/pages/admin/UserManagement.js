import React, { useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const USERS = [
  { name: 'Maria Santos',   email: 'maria@email.com',   status: 'Pending'  },
  { name: 'Carlos Rivera',  email: 'carlos@email.com',  status: 'Pending'  },
  { name: 'Angela Bautista',email: 'angela@email.com',  status: 'Pending'  },
  { name: 'Jose Reyes',     email: 'jose@email.com',    status: 'Active'   },
  { name: 'Liza Cruz',      email: 'liza@email.com',    status: 'Active'   },
];

function UserManagement() {
  const [search, setSearch] = useState('');

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">User Management</h1>
          <p className="off-page-sub">Approve and manage barangay residents</p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-4">
            <div className="off-stat-card"><h4>All Users</h4><div className="off-stat-value">10</div></div>
            <div className="off-stat-card"><h4>Active Users</h4><div className="off-stat-value">3</div></div>
            <div className="off-stat-card"><h4>Pending Registrations</h4><div className="off-stat-value">4</div></div>
            <div className="off-stat-card"><h4>Blocked Users</h4><div className="off-stat-value">1</div></div>
          </div>

          <div className="off-card">
            <input
              className="off-table-search"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 20, width: '100%' }}
            />

            <h3 className="off-card-title">New Registrations</h3>

            <table className="off-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: '#1a3a6b', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 700, flexShrink: 0
                        }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: u.status === 'Pending' ? '#f59e0b' : '#10b981',
                        fontWeight: 600, fontSize: 13
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button style={{
                        background: 'none', border: '1px solid #e2e8f0',
                        borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                        fontSize: 18, color: '#6b7280'
                      }}>···</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserManagement;
