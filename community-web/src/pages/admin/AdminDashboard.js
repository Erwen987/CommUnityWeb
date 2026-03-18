import React, { useEffect, useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const monthlyData = [];

// ── EmailJS config ──────────────────────────────────────────────────────────
// 1. Sign up free at https://www.emailjs.com
// 2. Add a Gmail service → copy Service ID below
// 3. Create a template with variables: {{to_email}}, {{barangay}}
//    Subject: "CommUnity – Your account has been approved!"
//    Body:    "Hello! Your official account for {{barangay}} has been approved.
//              You can now log in at [your site URL]."
// 4. Copy Template ID and Public Key below
const EMAILJS_SERVICE_ID           = 'service_0pp2139';
const EMAILJS_APPROVAL_TEMPLATE_ID = 'template_2r9u3vk';
const EMAILJS_REJECTION_TEMPLATE_ID = 'template_xpisoa5';
const EMAILJS_PUBLIC_KEY           = 'MYsqjprp39Rb43jVR';

const sendEmail = async (templateId, toEmail, barangay) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id:     EMAILJS_PUBLIC_KEY,
        template_params: { to_email: toEmail, barangay },
      }),
    });
  } catch (_) {
    // Email failure is non-critical — action still goes through
  }
};

function AdminDashboard() {
  const [pending,   setPending]   = useState([]);
  const [approved,  setApproved]  = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    const { data: pendingData } = await supabase
      .from('officials')
      .select('id, barangay_name, barangay, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPending(pendingData || []);

    const { data: approvedData } = await supabase
      .from('officials')
      .select('id, barangay_name, barangay, email, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    setApproved(approvedData || []);
  };

  const updateStatus = async (id, status) => {
    setLoadingId(id);
    const { data: updated } = await supabase
      .from('officials')
      .update({ status })
      .eq('id', id)
      .select('email, barangay')
      .single();

    if (updated) {
      if (status === 'approved') {
        await sendEmail(EMAILJS_APPROVAL_TEMPLATE_ID, updated.email, updated.barangay);
      } else if (status === 'rejected') {
        await sendEmail(EMAILJS_REJECTION_TEMPLATE_ID, updated.email, updated.barangay);
      }
    }

    setLoadingId(null);
    fetchOfficials();
  };

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Welcome Admin 👋</h1>
          <p className="off-page-sub">Here's a quick overview of the system</p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-4">
            <div className="off-stat-card"><h4>Reports</h4><div className="off-stat-value">0</div></div>
            <div className="off-stat-card"><h4>Requests</h4><div className="off-stat-value">0</div></div>
            <div className="off-stat-card"><h4>Officials</h4><div className="off-stat-value">{approved.length}</div></div>
            <div className="off-stat-card"><h4>Pending Officials</h4><div className="off-stat-value" style={{ color: pending.length > 0 ? '#d97706' : undefined }}>{pending.length}</div></div>
          </div>

          {/* ── PENDING APPROVALS ── */}
          <div className="off-card" style={{ marginBottom: '24px' }}>
            <h3 className="off-card-title">
              Pending Official Approvals
              {pending.length > 0 && (
                <span style={{
                  marginLeft: '10px', background: '#fef3c7', color: '#92400e',
                  fontSize: '12px', fontWeight: '700', padding: '2px 10px',
                  borderRadius: '999px', border: '1px solid #fde68a',
                }}>
                  {pending.length} pending
                </span>
              )}
            </h3>

            {pending.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>No pending approval requests.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Barangay Name</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Barangay</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Submitted</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 12px', fontWeight: '600', color: '#1f2937' }}>{row.barangay_name}</td>
                      <td style={{ padding: '12px 12px', color: '#374151' }}>{row.barangay}</td>
                      <td style={{ padding: '12px 12px', color: '#374151' }}>{row.email}</td>
                      <td style={{ padding: '12px 12px', color: '#6b7280' }}>
                        {new Date(row.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => updateStatus(row.id, 'approved')}
                            disabled={loadingId === row.id}
                            style={{
                              background: '#16a34a', color: '#fff', border: 'none',
                              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer',
                              fontWeight: '600', fontSize: '12px', opacity: loadingId === row.id ? 0.6 : 1,
                            }}>
                            {loadingId === row.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => updateStatus(row.id, 'rejected')}
                            disabled={loadingId === row.id}
                            style={{
                              background: '#dc2626', color: '#fff', border: 'none',
                              padding: '6px 16px', borderRadius: '8px', cursor: 'pointer',
                              fontWeight: '600', fontSize: '12px', opacity: loadingId === row.id ? 0.6 : 1,
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
          </div>

          {/* ── APPROVED OFFICIALS ── */}
          <div className="off-card" style={{ marginBottom: '24px' }}>
            <h3 className="off-card-title">
              Approved Officials
              {approved.length > 0 && (
                <span style={{
                  marginLeft: '10px', background: '#dcfce7', color: '#166534',
                  fontSize: '12px', fontWeight: '700', padding: '2px 10px',
                  borderRadius: '999px', border: '1px solid #bbf7d0',
                }}>
                  {approved.length} active
                </span>
              )}
            </h3>
            {approved.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>No approved officials yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Barangay Name</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Barangay</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Approved Since</th>
                    <th style={{ padding: '10px 12px', color: '#6b7280', fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 12px', fontWeight: '600', color: '#1f2937' }}>{row.barangay_name}</td>
                      <td style={{ padding: '12px 12px', color: '#374151' }}>{row.barangay}</td>
                      <td style={{ padding: '12px 12px', color: '#374151' }}>{row.email}</td>
                      <td style={{ padding: '12px 12px', color: '#6b7280' }}>
                        {new Date(row.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <button
                          onClick={() => updateStatus(row.id, 'rejected')}
                          disabled={loadingId === row.id}
                          style={{
                            background: '#dc2626', color: '#fff', border: 'none',
                            padding: '6px 16px', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '12px', opacity: loadingId === row.id ? 0.6 : 1,
                          }}>
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="off-dash-grid">

            {/* LEFT — Chart */}
            <div className="off-card">
              <h3 className="off-card-title">Reports and Requests per Month</h3>
              {monthlyData.length === 0 ? (
                <div className="off-chart-empty">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>No records yet.</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Graph will appear once data is available.</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} name="Requests" />
                    <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} name="Reports"  />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="off-chart-legend">
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#93c5fd' }} /> Requests
                </div>
                <div className="off-legend-item">
                  <span className="off-legend-dot" style={{ background: '#1d4ed8' }} /> Reports
                </div>
              </div>
            </div>

            {/* RIGHT — Contributors + Activities */}
            <div className="off-dash-right">
              <div className="off-card">
                <h3 className="off-card-title">Top Contributors</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No contributor records yet.</p>
              </div>
              <div className="off-card">
                <h3 className="off-card-title">Recent Activities</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No recent activity.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
