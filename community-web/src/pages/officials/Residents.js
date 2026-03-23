import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 38, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:'50%', background:avatarColors[index%avatarColors.length], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{initials}</div>;
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });

const STATUS_CFG = {
  pending:          { bg:'#fef9c3', color:'#854d0e', dot:'#f59e0b', label:'Pending'          },
  in_progress:      { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6', label:'In Progress'      },
  resolved:         { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Resolved'         },
  rejected:         { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Rejected'         },
  ready_for_pickup: { bg:'#ede9fe', color:'#6d28d9', dot:'#8b5cf6', label:'Ready for Pickup' },
  claimed:          { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Claimed'          },
};
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:s.bg, color:s.color, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}><span style={{ width:5, height:5, borderRadius:'50%', background:s.dot }} />{s.label}</span>;
}

// ── Activity Modal ──────────────────────────────────────────────────────────
function ActivityModal({ resident, onClose }) {
  const [actTab,    setActTab]    = useState('reports');
  const [reports,   setReports]   = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!resident?.auth_id) return;
    setLoading(true);
    Promise.all([
      supabase.from('reports').select('*').eq('user_id', resident.auth_id).order('created_at', { ascending: false }),
      supabase.from('requests').select('*').eq('user_id', resident.auth_id).order('created_at', { ascending: false }),
    ]).then(([{ data: rpts }, { data: reqs }]) => {
      setReports(rpts || []);
      setRequests(reqs || []);
      setLoading(false);
    });
  }, [resident]);

  const name = `${resident.first_name||''} ${resident.last_name||''}`.trim();

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, width:640, maxWidth:'100%', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#f3f4f6,#fafafa)', padding:'20px 24px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:'#6b7280', flexShrink:0 }}>
                {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#111827' }}>{name}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{resident.email}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Deletion info */}
          <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
              <span style={{ color:'#9ca3af', fontWeight:600 }}>Deleted on </span>
              <span style={{ color:'#374151', fontWeight:700 }}>{fmt(resident.deleted_at)}</span>
            </div>
            {resident.reason && (
              <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:8, padding:'8px 12px', fontSize:12, flex:1, minWidth:0 }}>
                <span style={{ color:'#92400e', fontWeight:600 }}>Reason: </span>
                <span style={{ color:'#78350f' }}>{resident.reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#f8fafc' }}>
          {[
            { key:'reports',  label:`Reports (${reports.length})`  },
            { key:'requests', label:`Requests (${requests.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActTab(t.key)} style={{ flex:1, padding:'12px', border:'none', background:'none', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color: actTab===t.key ? '#2563eb' : '#9ca3af', borderBottom: actTab===t.key ? '2px solid #2563eb' : '2px solid transparent', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
              <p style={{ color:'#9ca3af', fontSize:13 }}>Loading activity...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : actTab === 'reports' ? (
            reports.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No reports submitted.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Problem','Description','Status','Date'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r,i) => (
                    <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}>
                      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.problem}</td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description||'—'}</td>
                      <td style={{ padding:'12px 16px' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmt(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            requests.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No document requests submitted.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Document','Purpose','Status','Date'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r,i) => (
                    <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':'#f9fafb' }}>
                      <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#111827' }}>{r.document_type}</td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.purpose||'—'}</td>
                      <td style={{ padding:'12px 16px' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{fmt(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
function Residents() {
  const { barangay, barangayName, loading: profileLoading } = useOfficialProfile();

  const [tab,              setTab]              = useState('current'); // 'current' | 'deleted'
  const [residents,        setResidents]        = useState([]);
  const [deletedResidents, setDeletedResidents] = useState([]);
  const [fetching,         setFetching]         = useState(false);
  const [search,           setSearch]           = useState('');
  const [filter,           setFilter]           = useState('all');
  const [viewActivity,     setViewActivity]     = useState(null);

  const loadResidents = useCallback(async () => {
    if (!barangay) return;
    setFetching(true);
    const [{ data: active }, { data: deleted }] = await Promise.all([
      supabase.from('users')
        .select('id, first_name, last_name, email, phone, points, avatar_url, is_banned, ban_reason, created_at')
        .eq('barangay', barangay).eq('role', 'resident').order('first_name', { ascending: true }),
      supabase.from('deleted_accounts')
        .select('*')
        .eq('barangay', barangay)
        .order('deleted_at', { ascending: false }),
    ]);
    setResidents(active || []);
    setDeletedResidents(deleted || []);
    setFetching(false);
  }, [barangay]);

  useEffect(() => { loadResidents(); }, [loadResidents]);

  const rows = residents.map((r,i) => ({ ...r, name:`${r.first_name} ${r.last_name}`.trim(), index:i }));
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    const matchFilter = filter==='all' || (filter==='active'&&!r.is_banned) || (filter==='banned'&&r.is_banned);
    return matchSearch && matchFilter;
  });

  const filteredDeleted = deletedResidents.filter(r => {
    const q = search.toLowerCase();
    const name = `${r.first_name||''} ${r.last_name||''}`.trim();
    return !q || name.toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q);
  });

  const totalCount   = residents.length;
  const activeCount  = residents.filter(r => !r.is_banned).length;
  const bannedCount  = residents.filter(r =>  r.is_banned).length;
  const deletedCount = deletedResidents.length;

  const FILTERS = [
    { key:'all',    label:'All',    count:totalCount  },
    { key:'active', label:'Active', count:activeCount },
    { key:'banned', label:'Banned', count:bannedCount },
  ];

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {viewActivity && <ActivityModal resident={viewActivity} onClose={() => setViewActivity(null)} />}

          {/* Page header */}
          <div style={{ marginBottom:24 }}>
            <h1 className="off-page-title">Residents</h1>
            <p className="off-page-sub" style={{ margin:0 }}>
              {barangayName ? `Barangay ${barangayName}` : 'Your barangay'} · View only — contact admin to ban or unban
            </p>
          </div>

          {/* Stat cards */}
          {(() => {
            const activeCard = tab === 'deleted' ? 'deleted' : filter;
            const cards = [
              { id:'all',     label:'Total Residents',  value:totalCount,   accent:'#2563eb', iconBg:'#eff6ff',
                onClick:() => { setTab('current'); setFilter('all'); setSearch(''); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { id:'active',  label:'Active',           value:activeCount,  accent:'#059669', iconBg:'#d1fae5',
                onClick:() => { setTab('current'); setFilter('active'); setSearch(''); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
              { id:'banned',  label:'Banned',           value:bannedCount,  accent:bannedCount>0?'#dc2626':'#9ca3af', iconBg:bannedCount>0?'#fee2e2':'#f3f4f6',
                onClick:() => { setTab('current'); setFilter('banned'); setSearch(''); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bannedCount>0?'#dc2626':'#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
              { id:'deleted', label:'Deleted Accounts', value:deletedCount, accent:'#6b7280', iconBg:'#f3f4f6',
                onClick:() => { setTab('deleted'); setSearch(''); },
                icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> },
            ];
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                {cards.map(c => {
                  const isActive = activeCard === c.id;
                  return (
                    <div key={c.id} onClick={c.onClick} style={{ background: isActive ? c.iconBg : '#fff', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16, borderLeft:`4px solid ${c.accent}`, borderBottom: isActive ? `2px solid ${c.accent}` : '2px solid transparent', cursor:'pointer', transition:'background 0.15s', boxSizing:'border-box' }}>
                      <div style={{ width:46, height:46, borderRadius:12, background: isActive ? '#fff' : c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>{c.icon}</div>
                      <div>
                        <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{c.label}</div>
                        <div style={{ fontSize:28, fontWeight:800, color:c.accent, lineHeight:1 }}>{c.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Tab switcher */}
          <div style={{ display:'flex', gap:0, marginBottom:0, background:'#fff', borderRadius:'16px 16px 0 0', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            {[
              { key:'current', label:'Current Residents', count:totalCount  },
              { key:'deleted', label:'Deleted Accounts',  count:deletedCount },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilter('all'); }}
                style={{ flex:1, padding:'14px 20px', border:'none', fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', background: tab===t.key ? '#fff' : '#f8fafc', color: tab===t.key ? (t.key==='deleted'?'#6b7280':'#2563eb') : '#9ca3af', borderBottom: tab===t.key ? `2px solid ${t.key==='deleted'?'#6b7280':'#2563eb'}` : '2px solid transparent', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {t.label}
                <span style={{ padding:'1px 8px', borderRadius:999, background: tab===t.key?(t.key==='deleted'?'#f3f4f6':'#eff6ff'):'#f1f5f9', color: tab===t.key?(t.key==='deleted'?'#6b7280':'#2563eb'):'#9ca3af', fontSize:11, fontWeight:800 }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:'#fff', borderRadius:'0 0 16px 16px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>

            {/* Search + filter bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid #f1f5f9', gap:12, flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:'1 1 240px', maxWidth:340 }}>
                <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder={tab==='deleted'?'Search deleted residents…':'Search by name or email…'} value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', boxSizing:'border-box', fontFamily:'Poppins,sans-serif' }} />
              </div>

              {tab === 'current' && (
                <div style={{ display:'flex', gap:6 }}>
                  {FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight:600, cursor:'pointer', border: filter===f.key?'none':'1.5px solid #e5e7eb', background: filter===f.key?(f.key==='banned'?'#dc2626':f.key==='active'?'#059669':'#2563eb'):'#fff', color: filter===f.key?'#fff':'#6b7280', transition:'all 0.15s' }}>
                      {f.label}
                      <span style={{ marginLeft:6, padding:'1px 7px', borderRadius:999, background: filter===f.key?'rgba(255,255,255,0.25)':'#f1f5f9', color: filter===f.key?'#fff':'#9ca3af', fontSize:11, fontWeight:800 }}>{f.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            {fetching || profileLoading ? (
              <div style={{ padding:'60px 24px', textAlign:'center' }}>
                <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                <p style={{ color:'#9ca3af', fontSize:13 }}>Loading residents...</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>

            ) : tab === 'current' ? (
              filtered.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </div>
                  <p style={{ fontWeight:700, color:'#374151', fontSize:15 }}>No residents found</p>
                  <p style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>{search ? 'Try a different search term.' : 'No residents have registered yet.'}</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Resident','Email','Phone','Points','Status','Joined'].map(h => (
                          <th key={h} style={{ padding:'11px 20px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {filtered.map((r,i) => (
                          <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb', transition:'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor='#eff6ff'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                            <td style={{ padding:'14px 20px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                <ResidentAvatar url={r.avatar_url} name={r.name} size={38} index={r.index} />
                                <div>
                                  <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{r.name}</div>
                                  <div style={{ fontSize:11, color:'#9ca3af' }}>Resident</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:'14px 20px', fontSize:13, color:'#6b7280' }}>{r.email}</td>
                            <td style={{ padding:'14px 20px', fontSize:13, color:'#6b7280' }}>{r.phone||'—'}</td>
                            <td style={{ padding:'14px 20px' }}><span style={{ fontWeight:700, color:'#2563eb', fontSize:14 }}>{r.points??0}</span></td>
                            <td style={{ padding:'14px 20px' }}>
                              {r.is_banned ? (
                                <div>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fee2e2', color:'#dc2626', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#dc2626', flexShrink:0 }} />Banned
                                  </span>
                                  {r.ban_reason && <div style={{ fontSize:11, color:'#9ca3af', marginTop:4, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.ban_reason}>{r.ban_reason}</div>}
                                </div>
                              ) : (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#dcfce7', color:'#16a34a', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />Active
                                </span>
                              )}
                            </td>
                            <td style={{ padding:'14px 20px', fontSize:12, color:'#9ca3af' }}>{r.created_at?fmt(r.created_at):'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{filtered.length} of {totalCount} resident{totalCount!==1?'s':''}</span>
                    {search && <button onClick={() => setSearch('')} style={{ fontSize:12, color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'Poppins,sans-serif' }}>Clear search</button>}
                  </div>
                </>
              )

            ) : (
              /* Deleted tab */
              filteredDeleted.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </div>
                  <p style={{ fontWeight:700, color:'#374151', fontSize:15 }}>No deleted accounts</p>
                  <p style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>No residents from this barangay have deleted their accounts.</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>{['Resident','Email','Reason for Deletion','Deleted On','Activity'].map(h => (
                          <th key={h} style={{ padding:'11px 20px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {filteredDeleted.map((r,i) => {
                          const name = `${r.first_name||''} ${r.last_name||''}`.trim();
                          return (
                            <tr key={r.id||r.auth_id} style={{ backgroundColor:i%2===0?'#fff':'#f9fafb', transition:'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f3f4f6'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor=i%2===0?'#fff':'#f9fafb'}>
                              <td style={{ padding:'14px 20px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                  <div style={{ width:38, height:38, borderRadius:'50%', background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#9ca3af', flexShrink:0 }}>
                                    {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight:600, color:'#374151', fontSize:13 }}>{name}</div>
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, color:'#6b7280', fontWeight:600 }}>
                                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af' }} />Deleted
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding:'14px 20px', fontSize:13, color:'#6b7280' }}>{r.email||'—'}</td>
                              <td style={{ padding:'14px 20px', fontSize:12, color:'#6b7280', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.reason}>{r.reason||'—'}</td>
                              <td style={{ padding:'14px 20px', fontSize:12, color:'#9ca3af' }}>{r.deleted_at?fmt(r.deleted_at):'—'}</td>
                              <td style={{ padding:'14px 20px' }}>
                                <button onClick={() => setViewActivity(r)}
                                  style={{ padding:'5px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  View Activity
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9' }}>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{filteredDeleted.length} deleted account{filteredDeleted.length!==1?'s':''}</span>
                  </div>
                </>
              )
            )}
          </div>

          {/* Info note */}
          {tab==='current' && bannedCount>0 && (
            <div style={{ marginTop:16, padding:'14px 18px', borderRadius:10, background:'#fef9c3', border:'1px solid #fde047', fontSize:13, color:'#854d0e', display:'flex', alignItems:'center', gap:10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span><strong>{bannedCount} banned resident{bannedCount!==1?'s':''}</strong> in your barangay. Only the system admin can ban or unban residents.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Residents;
