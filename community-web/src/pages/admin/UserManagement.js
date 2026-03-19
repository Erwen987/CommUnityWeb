import React, { useEffect, useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';

// ── EmailJS ──────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID            = 'service_0pp2139';
const EMAILJS_APPROVAL_TEMPLATE_ID  = 'template_2r9u3vk';
const EMAILJS_REJECTION_TEMPLATE_ID = 'template_xpisoa5';
const EMAILJS_PUBLIC_KEY            = 'MYsqjprp39Rb43jVR';

const sendEmail = async (templateId, toEmail, barangay) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:      EMAILJS_SERVICE_ID,
        template_id:     templateId,
        user_id:         EMAILJS_PUBLIC_KEY,
        template_params: { to_email: toEmail, barangay },
      }),
    });
  } catch (_) {}
};

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:  { bg: '#fef3c7', color: '#92400e', label: 'Pending'  },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
    }}>{s.label}</span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function UserManagement() {
  const [tab,       setTab]       = useState('pending');   // 'pending' | 'approved' | 'residents'
  const [pending,   setPending]   = useState([]);
  const [approved,  setApproved]  = useState([]);
  const [residents, setResidents] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [search,    setSearch]    = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: p }, { data: a }, { data: r }] = await Promise.all([
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at').eq('status','pending').order('created_at',{ascending:true}),
      supabase.from('officials').select('id,barangay_name,barangay,email,created_at').eq('status','approved').order('created_at',{ascending:true}),
      supabase.from('users').select('id,first_name,last_name,email,barangay,created_at').order('created_at',{ascending:false}),
    ]);
    setPending(p   || []);
    setApproved(a  || []);
    setResidents(r || []);
  };

  const updateStatus = async (id, status) => {
    setLoadingId(id);
    const { data: updated } = await supabase
      .from('officials').update({ status }).eq('id', id)
      .select('email,barangay').single();
    if (updated) {
      if (status === 'approved') await sendEmail(EMAILJS_APPROVAL_TEMPLATE_ID,  updated.email, updated.barangay);
      if (status === 'rejected') await sendEmail(EMAILJS_REJECTION_TEMPLATE_ID, updated.email, updated.barangay);
    }
    setLoadingId(null);
    fetchAll();
  };

  const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  const filterOfficial = list =>
    list.filter(r =>
      !search ||
      r.barangay_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.barangay?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase())
    );

  const filterResident = list =>
    list.filter(r =>
      !search ||
      r.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.barangay?.toLowerCase().includes(search.toLowerCase())
    );

  const tabs = [
    { key: 'pending',   label: 'Pending Approvals', count: pending.length,   countColor: '#d97706' },
    { key: 'approved',  label: 'Approved Officials', count: approved.length,  countColor: '#16a34a' },
    { key: 'residents', label: 'Residents',          count: residents.length, countColor: '#1E3A5F' },
  ];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">User Management</h1>
          <p className="off-page-sub">Manage official accounts and view registered residents</p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-3">
            <div className="off-stat-card">
              <h4>Pending Approvals</h4>
              <div className="off-stat-value" style={{ color: pending.length > 0 ? '#d97706' : undefined }}>
                {pending.length}
              </div>
            </div>
            <div className="off-stat-card">
              <h4>Approved Officials</h4>
              <div className="off-stat-value">{approved.length}</div>
            </div>
            <div className="off-stat-card">
              <h4>Registered Residents</h4>
              <div className="off-stat-value">{residents.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(''); }}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  background: tab === t.key ? '#1E3A5F' : '#f1f5f9',
                  color:      tab === t.key ? '#fff'    : '#6b7280',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {t.label}
                <span style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color:      tab === t.key ? '#fff' : t.countColor,
                  borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 800,
                }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="off-card">
            <div className="off-table-header" style={{ marginBottom: 16 }}>
              <input
                className="off-table-search"
                type="text"
                placeholder={
                  tab === 'residents'
                    ? 'Search by name, email or barangay...'
                    : 'Search by barangay or email...'
                }
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* ── PENDING TAB ── */}
            {tab === 'pending' && (
              <>
                <h3 className="off-card-title">
                  Pending Official Approvals
                  {pending.length > 0 && (
                    <span style={{
                      marginLeft: 10, background: '#fef3c7', color: '#92400e',
                      fontSize: 11, fontWeight: 700, padding: '2px 10px',
                      borderRadius: 999, border: '1px solid #fde68a',
                    }}>{pending.length} waiting</span>
                  )}
                </h3>
                {filterOfficial(pending).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', padding: '16px 0' }}>
                    No pending approval requests.
                  </p>
                ) : (
                  <table className="off-table">
                    <thead>
                      <tr>
                        <th>Official</th>
                        <th>Barangay</th>
                        <th>Email</th>
                        <th>Submitted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterOfficial(pending).map(row => (
                        <tr key={row.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: '#1E3A5F', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14, flexShrink: 0,
                              }}>
                                {row.barangay_name?.[0] || '?'}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.barangay_name}</span>
                            </div>
                          </td>
                          <td>{row.barangay}</td>
                          <td style={{ color: '#6b7280' }}>{row.email}</td>
                          <td style={{ color: '#9ca3af', fontSize: 12 }}>{fmt(row.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => updateStatus(row.id, 'approved')}
                                disabled={loadingId === row.id}
                                style={{
                                  background: '#16a34a', color: '#fff', border: 'none',
                                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                  fontWeight: 600, fontSize: 12, opacity: loadingId === row.id ? 0.6 : 1,
                                }}>
                                {loadingId === row.id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => updateStatus(row.id, 'rejected')}
                                disabled={loadingId === row.id}
                                style={{
                                  background: '#dc2626', color: '#fff', border: 'none',
                                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                  fontWeight: 600, fontSize: 12, opacity: loadingId === row.id ? 0.6 : 1,
                                }}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── APPROVED TAB ── */}
            {tab === 'approved' && (
              <>
                <h3 className="off-card-title">
                  Approved Officials
                  <span style={{
                    marginLeft: 10, background: '#dcfce7', color: '#166534',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 999, border: '1px solid #bbf7d0',
                  }}>{approved.length} active</span>
                </h3>
                {filterOfficial(approved).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', padding: '16px 0' }}>No approved officials yet.</p>
                ) : (
                  <table className="off-table">
                    <thead>
                      <tr>
                        <th>Official</th>
                        <th>Barangay</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Since</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterOfficial(approved).map(row => (
                        <tr key={row.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: '#16a34a', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14, flexShrink: 0,
                              }}>
                                {row.barangay_name?.[0] || '?'}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.barangay_name}</span>
                            </div>
                          </td>
                          <td>{row.barangay}</td>
                          <td style={{ color: '#6b7280' }}>{row.email}</td>
                          <td><StatusBadge status="approved" /></td>
                          <td style={{ color: '#9ca3af', fontSize: 12 }}>{fmt(row.created_at)}</td>
                          <td>
                            <button
                              onClick={() => updateStatus(row.id, 'rejected')}
                              disabled={loadingId === row.id}
                              style={{
                                background: 'none', color: '#dc2626',
                                border: '1px solid #dc2626',
                                padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
                                fontWeight: 600, fontSize: 12, opacity: loadingId === row.id ? 0.6 : 1,
                              }}>
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── RESIDENTS TAB ── */}
            {tab === 'residents' && (
              <>
                <h3 className="off-card-title">Registered Residents</h3>
                {filterResident(residents).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', padding: '16px 0' }}>No residents found.</p>
                ) : (
                  <table className="off-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Barangay</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterResident(residents).map(row => (
                        <tr key={row.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: '#1E3A5F', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14, flexShrink: 0,
                              }}>
                                {row.first_name?.[0] || '?'}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>
                                {row.first_name} {row.last_name}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: '#6b7280' }}>{row.email}</td>
                          <td>{row.barangay || '—'}</td>
                          <td style={{ color: '#9ca3af', fontSize: 12 }}>{fmt(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
