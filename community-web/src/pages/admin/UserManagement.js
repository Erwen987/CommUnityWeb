import React, { useEffect, useState } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { supabase } from '../../supabaseClient';

// ── EmailJS ───────────────────────────────────────────────────────────────────
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

// ── Shared UI helpers ─────────────────────────────────────────────────────────
const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

const TH = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const TD = { padding: '14px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9' };

function Avatar({ label, color }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
      {label}
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    pending:  { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'  },
    approved: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>{sub}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function UserManagement() {
  const [tab,       setTab]       = useState('pending');
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
    const { data: updated } = await supabase.from('officials').update({ status }).eq('id', id).select('email,barangay').single();
    if (updated) {
      if (status === 'approved') await sendEmail(EMAILJS_APPROVAL_TEMPLATE_ID,  updated.email, updated.barangay);
      if (status === 'rejected') await sendEmail(EMAILJS_REJECTION_TEMPLATE_ID, updated.email, updated.barangay);
    }
    setLoadingId(null);
    fetchAll();
  };

  const filterOfficial = list => list.filter(r => !search || r.barangay_name?.toLowerCase().includes(search.toLowerCase()) || r.barangay?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));
  const filterResident  = list => list.filter(r => !search || r.first_name?.toLowerCase().includes(search.toLowerCase()) || r.last_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()) || r.barangay?.toLowerCase().includes(search.toLowerCase()));

  const TABS = [
    { key: 'pending',   label: 'Pending Approvals', count: pending.length,   activeColor: '#d97706', activeBg: '#fef3c7',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'approved',  label: 'Approved Officials', count: approved.length,  activeColor: '#16a34a', activeBg: '#dcfce7',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
    { key: 'residents', label: 'Residents',          count: residents.length, activeColor: '#1E3A5F', activeBg: '#e0e7ef',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];
  const activeTab = TABS.find(t => t.key === tab);

  const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>User Management</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>Manage official accounts and view registered residents</p>
          </div>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Pending Approvals',  value: pending.length,   accent: '#f59e0b', iconBg: '#fef3c7', labelColor: '#92400e', valueColor: pending.length > 0 ? '#d97706' : '#1f2937', sub: pending.length === 0 ? 'No pending requests' : `${pending.length} awaiting review`,
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { label: 'Approved Officials', value: approved.length,  accent: '#16a34a', iconBg: '#dcfce7', labelColor: '#166534', valueColor: '#1f2937', sub: approved.length === 0 ? 'No approved officials' : `${approved.length} active official${approved.length !== 1 ? 's' : ''}`,
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
              { label: 'Registered Residents', value: residents.length, accent: '#1E3A5F', iconBg: '#e0e7ef', labelColor: '#1E3A5F', valueColor: '#1f2937', sub: residents.length === 0 ? 'No residents yet' : `${residents.length} registered user${residents.length !== 1 ? 's' : ''}`,
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: c.labelColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: c.valueColor, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Panel ── */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
              {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '16px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? t.activeColor : '#6b7280', borderBottom: active ? `2.5px solid ${t.activeColor}` : '2.5px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
                    <span style={{ color: active ? t.activeColor : '#9ca3af' }}>{t.icon}</span>
                    {t.label}
                    <span style={{ background: active ? t.activeBg : '#f1f5f9', color: active ? t.activeColor : '#6b7280', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 20, maxWidth: 380 }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder={tab === 'residents' ? 'Search by name, email or barangay…' : 'Search by barangay or email…'} value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
              </div>

              {/* ── PENDING ── */}
              {tab === 'pending' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Pending Official Approvals</span>
                    {pending.length > 0 && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid #fde68a' }}>{pending.length} waiting</span>}
                  </div>
                  {filterOfficial(pending).length === 0
                    ? <EmptyState icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} title="No pending approvals" sub="All official requests have been reviewed." />
                    : <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead><tr><th style={TH}>Official</th><th style={TH}>Barangay</th><th style={TH}>Email</th><th style={TH}>Submitted</th><th style={TH}>Actions</th></tr></thead>
                          <tbody>
                            {filterOfficial(pending).map(row => (
                              <tr key={row.id} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                                <td style={TD}><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar label={row.barangay_name?.[0]?.toUpperCase()||'?'} color="#1E3A5F" /><div><div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{row.barangay_name}</div><div style={{ fontSize:11, color:'#9ca3af' }}>Official account</div></div></div></td>
                                <td style={TD}><span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>{row.barangay}</span></td>
                                <td style={{ ...TD, color:'#6b7280' }}>{row.email}</td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(row.created_at)}</td>
                                <td style={TD}>
                                  <div style={{ display:'flex', gap:8 }}>
                                    <button onClick={() => updateStatus(row.id,'approved')} disabled={loadingId===row.id} style={{ background:'#16a34a', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, opacity:loadingId===row.id?0.6:1, display:'inline-flex', alignItems:'center', gap:5 }}>
                                      {loadingId===row.id ? '…' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Approve</>}
                                    </button>
                                    <button onClick={() => updateStatus(row.id,'rejected')} disabled={loadingId===row.id} style={{ background:'none', color:'#dc2626', border:'1.5px solid #fca5a5', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, opacity:loadingId===row.id?0.6:1, display:'inline-flex', alignItems:'center', gap:5 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  }
                </>
              )}

              {/* ── APPROVED ── */}
              {tab === 'approved' && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#1f2937' }}>Approved Officials</span>
                    <span style={{ background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, border:'1px solid #bbf7d0' }}>{approved.length} active</span>
                  </div>
                  {filterOfficial(approved).length === 0
                    ? <EmptyState icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>} title="No approved officials" sub="Approve pending requests to see them here." />
                    : <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead><tr><th style={TH}>Official</th><th style={TH}>Barangay</th><th style={TH}>Email</th><th style={TH}>Status</th><th style={TH}>Approved Since</th><th style={TH}>Actions</th></tr></thead>
                          <tbody>
                            {filterOfficial(approved).map(row => (
                              <tr key={row.id} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                                <td style={TD}><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar label={row.barangay_name?.[0]?.toUpperCase()||'?'} color="#16a34a" /><div><div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{row.barangay_name}</div><div style={{ fontSize:11, color:'#9ca3af' }}>Official account</div></div></div></td>
                                <td style={TD}><span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>{row.barangay}</span></td>
                                <td style={{ ...TD, color:'#6b7280' }}>{row.email}</td>
                                <td style={TD}><StatusDot status="approved" /></td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(row.created_at)}</td>
                                <td style={TD}>
                                  <button onClick={() => updateStatus(row.id,'rejected')} disabled={loadingId===row.id} style={{ background:'none', color:'#dc2626', border:'1.5px solid #fca5a5', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12, opacity:loadingId===row.id?0.6:1, display:'inline-flex', alignItems:'center', gap:5 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 17.36"/><path d="M21 3 3 21"/></svg>Revoke
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  }
                </>
              )}

              {/* ── RESIDENTS ── */}
              {tab === 'residents' && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#1f2937' }}>Registered Residents</span>
                    <span style={{ background:'#e0e7ef', color:'#1E3A5F', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999 }}>{residents.length} total</span>
                  </div>
                  {filterResident(residents).length === 0
                    ? <EmptyState icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} title="No residents found" sub={search ? 'Try a different search term.' : 'No residents have registered yet.'} />
                    : <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead><tr><th style={TH}>Resident</th><th style={TH}>Email</th><th style={TH}>Barangay</th><th style={TH}>Joined</th></tr></thead>
                          <tbody>
                            {filterResident(residents).map((row, i) => (
                              <tr key={row.id} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background=''}>
                                <td style={TD}><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar label={row.first_name?.[0]?.toUpperCase()||'?'} color={avatarColors[i%5]} /><div><div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{row.first_name} {row.last_name}</div><div style={{ fontSize:11, color:'#9ca3af' }}>Resident</div></div></div></td>
                                <td style={{ ...TD, color:'#6b7280' }}>{row.email}</td>
                                <td style={TD}>{row.barangay ? <span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>{row.barangay}</span> : <span style={{ color:'#d1d5db' }}>—</span>}</td>
                                <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(row.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  }
                </>
              )}

              {/* Footer */}
              <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#9ca3af' }}>
                  {tab==='pending'   && `${filterOfficial(pending).length} of ${pending.length} request${pending.length!==1?'s':''}`}
                  {tab==='approved'  && `${filterOfficial(approved).length} of ${approved.length} official${approved.length!==1?'s':''}`}
                  {tab==='residents' && `${filterResident(residents).length} of ${residents.length} resident${residents.length!==1?'s':''}`}
                </span>
                {search && <button onClick={() => setSearch('')} style={{ fontSize:12, color:activeTab?.activeColor, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Clear search</button>}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserManagement;
