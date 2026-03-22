import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const GOOGLE_MAPS_KEY = 'AIzaSyDD1KBSgXW5ilJo5y_pYTGM0VD0CTehVSE';

const BARANGAY_HALLS = {
  'Mangin':{ lat:16.0453,lng:120.3672 },'Bolosan':{ lat:16.0441,lng:120.3378 },'Calmay':{ lat:16.0389,lng:120.3501 },
  'Pantal':{ lat:16.0312,lng:120.3398 },'Lucao':{ lat:16.0298,lng:120.3512 },'Bonuan Binloc':{ lat:16.0201,lng:120.3489 },
  'Bonuan Boquig':{ lat:16.0178,lng:120.3412 },'Bonuan Gueset':{ lat:16.0223,lng:120.3601 },'Malued':{ lat:16.0501,lng:120.3298 },
  'Mayombo':{ lat:16.0478,lng:120.3512 },'Perez':{ lat:16.0432,lng:120.3445 },'Bacayao Norte':{ lat:16.0389,lng:120.3223 },
  'Bacayao Sur':{ lat:16.0356,lng:120.3201 },'Caranglaan':{ lat:16.0512,lng:120.3601 },'Carael':{ lat:16.0534,lng:120.3512 },
  'Herrero':{ lat:16.0445,lng:120.3489 },'Lasip Chico':{ lat:16.0567,lng:120.3423 },'Lasip Grande':{ lat:16.0589,lng:120.3401 },
  'Lomboy':{ lat:16.0312,lng:120.3601 },'Mamalingling':{ lat:16.0601,lng:120.3512 },'Pugaro Suit':{ lat:16.0223,lng:120.3312 },
  'Quezon':{ lat:16.0434,lng:120.3398 },'Salvador':{ lat:16.0456,lng:120.3512 },'Salapingao':{ lat:16.0378,lng:120.3623 },
  'Sta. Barbara':{ lat:16.0512,lng:120.3489 },'Sta. Maria':{ lat:16.0489,lng:120.3445 },'Tebeng':{ lat:16.0534,lng:120.3378 },
  'Pogo Chico':{ lat:16.0267,lng:120.3534 },'Pogo Grande':{ lat:16.0245,lng:120.3556 },
  'Barangay I (Poblacion)':{ lat:16.0432,lng:120.3335 },'Barangay II (Poblacion)':{ lat:16.0445,lng:120.3312 },
  'Barangay III (Poblacion)':{ lat:16.0423,lng:120.3356 },'Barangay IV (Poblacion)':{ lat:16.0412,lng:120.3378 },
};

// ── Map Modal ──────────────────────────────────────────────────────────────────
function MapModal({ lat, lng, barangay, onClose }) {
  const mapRef = useRef(null);
  useEffect(() => {
    const loadMap = () => {
      if (!mapRef.current || !window.google) return;
      const reportPos = { lat, lng };
      const hallPos   = BARANGAY_HALLS[barangay] || { lat: 16.0432, lng: 120.3335 };
      const map = new window.google.maps.Map(mapRef.current, { center: reportPos, zoom: 15, mapTypeControl: false, fullscreenControl: false, streetViewControl: false });
      new window.google.maps.Marker({ position: reportPos, map, title: 'Issue Location', icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#dc2626', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } });
      new window.google.maps.Marker({ position: hallPos, map, title: `${barangay} Barangay Hall`, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#1E3A5F', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } });
      fetch(`https://router.project-osrm.org/route/v1/driving/${hallPos.lng},${hallPos.lat};${reportPos.lng},${reportPos.lat}?overview=full&geometries=geojson`)
        .then(r => r.json()).then(data => {
          if (data.code === 'Ok' && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
            new window.google.maps.Polyline({ path: coords, geodesic: true, strokeColor: '#1E3A5F', strokeOpacity: 0.9, strokeWeight: 5, map });
            const bounds = new window.google.maps.LatLngBounds();
            coords.forEach(c => bounds.extend(c));
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
            const el = document.getElementById('route-info');
            if (el) el.textContent = `${(route.distance/1000).toFixed(1)} km from ${barangay} Barangay Hall · ~${Math.round(route.duration/60)} min`;
          }
        }).catch(() => { const el = document.getElementById('route-info'); if (el) el.textContent = 'Route unavailable'; });
    };
    if (window.google) loadMap();
    else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script'); s.id = scriptId; s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`; s.async = true; s.onload = loadMap; document.head.appendChild(s);
      } else { const iv = setInterval(() => { if (window.google) { clearInterval(iv); loadMap(); } }, 200); }
    }
  }, [lat, lng, barangay]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', width:620, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <span style={{ fontWeight:700, color:'#1E3A5F', fontSize:15 }}>📍 Issue Location</span>
            <div style={{ display:'flex', gap:16, marginTop:4, fontSize:12 }}>
              <span style={{ color:'#dc2626', fontWeight:600 }}>● Report</span>
              <span style={{ color:'#1E3A5F', fontWeight:600 }}>● Barangay Hall</span>
            </div>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'#6b7280' }}>✕</button>
        </div>
        <div ref={mapRef} style={{ width:'100%', height:400 }} />
        <div style={{ padding:'10px 20px', background:'#f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span id="route-info" style={{ fontSize:12, color:'#1E3A5F', fontWeight:600 }}>Calculating route...</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:     { bg:'#fef9c3', color:'#854d0e', dot:'#f59e0b', label:'Pending'     },
  in_progress: { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6', label:'In Progress' },
  resolved:    { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Resolved'    },
  rejected:    { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Rejected'    },
};

const TH = { padding:'10px 12px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap', textAlign:'left' };
const TD = { padding:'12px 12px', fontSize:13, color:'#374151' };
const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}
function ResidentAvatar({ url, name, size=28, index=0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:'50%', background:avatarColors[index%5], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{initials}</div>;
}
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, color:s.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}><span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} />{s.label}</span>;
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });

const QUICK_REASONS = [
  'Report appears to be a duplicate',
  'Insufficient evidence provided',
  'Issue could not be verified',
  'Outside barangay jurisdiction',
  'Incomplete information',
];

// ── Main ───────────────────────────────────────────────────────────────────────
function Reports() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [updatingId, setUpdatingId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [mapReport, setMapReport]     = useState(null);
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 10;

  // Step 1: "Are you sure?" confirmation
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, problem, residentName }
  // Step 2: Reason entry modal
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError]   = useState('');

  const fetchReports = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data: users } = await supabase.from('users').select('auth_id, first_name, last_name, avatar_url').eq('barangay', barangay);
    const userIds = (users || []).map(u => u.auth_id);
    if (userIds.length === 0) { setReports([]); setLoading(false); return; }
    const userMap = {};
    (users || []).forEach(u => { userMap[u.auth_id] = { name:`${u.first_name||''} ${u.last_name||''}`.trim(), avatar_url:u.avatar_url }; });
    const { data } = await supabase.from('reports').select('*').in('user_id', userIds).order('created_at', { ascending: false });
    setReports((data||[]).map(r => ({ ...r, residentName: userMap[r.user_id]?.name||'Unknown', residentAvatar: userMap[r.user_id]?.avatar_url||null })));
    setLoading(false);
  }, [barangay]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    if (!barangay) return;
    const channel = supabase.channel(`reports-realtime-${barangay}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'reports' }, () => fetchReports())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [barangay, fetchReports]);

  useEffect(() => setPage(1), [filter, search]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('reports').update({ status }).eq('id', id);
    setUpdatingId(null);
    fetchReports();
  };

  const openConfirm = (r) => {
    setConfirmTarget({ id: r.id, problem: r.problem, residentName: r.residentName });
  };

  const proceedToReject = () => {
    setRejectReason('');
    setRejectError('');
    setRejectModal(confirmTarget);
    setConfirmTarget(null);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { setRejectError('Please enter a reason for rejection.'); return; }
    setUpdatingId(rejectModal.id);
    await supabase.from('reports').update({ status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectModal.id);
    setUpdatingId(null);
    setRejectModal(null);
    fetchReports();
  };

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.problem?.toLowerCase().includes(q) || r.residentName?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const count  = s => reports.filter(r => r.status === s).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const STATS = [
    { label:'Total',       filterKey:'all',         value:reports.length,     accent:'#1d4ed8', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label:'Pending',     filterKey:'pending',     value:count('pending'),   accent:'#f59e0b', iconBg:'#fef3c7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label:'In Progress', filterKey:'in_progress', value:count('in_progress'), accent:'#3b82f6', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label:'Resolved',    filterKey:'resolved',    value:count('resolved'),  accent:'#16a34a', iconBg:'#dcfce7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label:'Rejected',    filterKey:'rejected',    value:count('rejected'),  accent:'#ef4444', iconBg:'#fee2e2',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <>
      {mapReport && <MapModal lat={mapReport.location_lat} lng={mapReport.location_lng} barangay={barangay} onClose={() => setMapReport(null)} />}

      <div className="off-layout">
        <OfficialSidebar />
        <div className="off-main">
          <OfficialTopbar badge />
          <div className="off-content">

            <div style={{ marginBottom:24 }}>
              <h1 className="off-page-title" style={{ marginBottom:2 }}>Reports</h1>
              <p className="off-page-sub" style={{ margin:0 }}>
                {!profileLoading && barangay ? `Showing reports for Barangay ${barangay}` : 'Monitor and manage community reports'}
              </p>
            </div>

            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:28 }}>
              {STATS.map(c => (
                <div key={c.label} onClick={() => setFilter(c.filterKey)}
                  style={{ background: filter===c.filterKey ? c.iconBg : '#fff', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:10, borderLeft:`4px solid ${c.accent}`, cursor:'pointer', transition:'background 0.15s', minHeight:72, boxSizing:'border-box', borderBottom: filter===c.filterKey ? `2px solid ${c.accent}` : '2px solid transparent' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background: filter===c.filterKey ? '#fff' : c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280', marginBottom:3 }}>{c.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:'#1f2937', lineHeight:1 }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table panel */}
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>

              {/* Panel header */}
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Reports Overview</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{filtered.length} of {reports.length} records · page {page} of {totalPages||1}</div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search problem or resident…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ padding:'8px 12px 8px 32px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', width:220 }} />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', cursor:'pointer' }}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, width:'15%' }}>Resident</th>
                      <th style={{ ...TH, width:'15%' }}>Problem</th>
                      <th style={{ ...TH, width:'18%' }}>Description</th>
                      <th style={{ ...TH, width:'7%'  }}>Image</th>
                      <th style={{ ...TH, width:'8%'  }}>Location</th>
                      <th style={{ ...TH, width:'11%' }}>Status</th>
                      <th style={{ ...TH, width:'10%' }}>Date</th>
                      <th style={{ ...TH, width:'16%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', color:'#9ca3af', padding:'40px', fontSize:13 }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>
                          Loading reports...
                        </div>
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding:'48px 24px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                          <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#374151' }}>No reports found</div>
                          <div style={{ fontSize:12, color:'#9ca3af' }}>{search||filter!=='all' ? 'Try adjusting your search or filter.' : `No reports submitted for ${barangay||'your barangay'} yet.`}</div>
                        </div>
                      </td></tr>
                    ) : paginated.map((r, i) => (
                      <tr key={r.id}
                        style={{ backgroundColor: i%2===0 ? '#ffffff' : '#f0f4ff' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0 ? '#ffffff' : '#f0f4ff'}>

                        <td style={{ ...TD, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
                            <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={28} index={i} />
                            <span style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{r.residentName}</span>
                          </div>
                        </td>
                        <td style={{ ...TD, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.problem}</td>
                        <td style={{ ...TD, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#6b7280', fontSize:12 }}>
                          {r.rejection_reason
                            ? <span style={{ color:'#991b1b', fontStyle:'italic' }}>Rejected: {r.rejection_reason}</span>
                            : r.description || '—'
                          }
                        </td>
                        <td style={TD}>
                          {r.image_url
                            ? <a href={r.image_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#1E3A5F', fontSize:12, fontWeight:600, background:'#e0e7ef', padding:'3px 10px', borderRadius:6, textDecoration:'none' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>View
                              </a>
                            : <span style={{ color:'#d1d5db' }}>—</span>}
                        </td>
                        <td style={TD}>
                          {r.location_lat && r.location_lng
                            ? <button onClick={() => setMapReport(r)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#eff6ff', color:'#1E3A5F', border:'1px solid #bfdbfe', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                📍 Map
                              </button>
                            : <span style={{ color:'#d1d5db' }}>—</span>}
                        </td>
                        <td style={TD}><StatusBadge status={r.status} /></td>
                        <td style={{ ...TD, color:'#9ca3af', fontSize:12 }}>{fmt(r.created_at)}</td>

                        {/* Actions */}
                        <td style={TD}>
                          {r.status === 'resolved' || r.status === 'rejected' ? (
                            <span style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>Closed</span>
                          ) : (
                            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                              {r.status === 'pending' && (
                                <button onClick={() => updateStatus(r.id, 'in_progress')} disabled={updatingId===r.id}
                                  style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  → In Progress
                                </button>
                              )}
                              {r.status === 'in_progress' && (
                                <button onClick={() => updateStatus(r.id, 'resolved')} disabled={updatingId===r.id}
                                  style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  ✓ Resolve
                                </button>
                              )}
                              <button onClick={() => openConfirm(r)} disabled={updatingId===r.id}
                                style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#fee2e2', color:'#991b1b', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                      style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:page===1?'#f9fafb':'#fff', color:page===1?'#d1d5db':'#374151', fontWeight:600, fontSize:12, cursor:page===1?'not-allowed':'pointer', fontFamily:'inherit' }}>← Prev</button>
                    {Array.from({ length:totalPages },(_,i)=>i+1)
                      .filter(p => p===1||p===totalPages||Math.abs(p-page)<=1)
                      .reduce((acc,p,idx,arr) => { if(idx>0&&p-arr[idx-1]>1) acc.push('…'); acc.push(p); return acc; },[])
                      .map((p,i) => p==='…'
                        ? <span key={`e${i}`} style={{ padding:'6px 4px', color:'#9ca3af', fontSize:12 }}>…</span>
                        : <button key={p} onClick={() => setPage(p)}
                            style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', background:page===p?'#2563eb':'#fff', color:page===p?'#fff':'#374151', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>{p}</button>
                      )}
                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                      style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:page===totalPages?'#f9fafb':'#fff', color:page===totalPages?'#d1d5db':'#374151', fontWeight:600, fontSize:12, cursor:page===totalPages?'not-allowed':'pointer', fontFamily:'inherit' }}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 — Confirmation dialog */}
      {confirmTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmTarget(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:420, maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg, #fef2f2, #fff1f1)', padding:'24px 24px 20px', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'#fee2e2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#111827' }}>Reject this report?</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.5 }}>
                  You are about to reject <strong style={{ color:'#374151' }}>{confirmTarget.problem}</strong> submitted by <strong style={{ color:'#374151' }}>{confirmTarget.residentName}</strong>. You will need to provide a reason.
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmTarget(null)}
                style={{ padding:'9px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={proceedToReject}
                style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Rejection modal — matches document request rejection style */}
      {rejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:480, maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg, #fef2f2, #fff1f1)', padding:'20px 24px 16px', borderBottom:'1px solid #fecaca' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'#fee2e2', border:'1.5px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16, color:'#111827' }}>Reject Report</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>The resident will be notified with your reason</div>
                  </div>
                </div>
                <button onClick={() => setRejectModal(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, borderRadius:6, lineHeight:1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Report info pill */}
              <div style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #fecaca', borderRadius:8, padding:'6px 12px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{rejectModal.problem}</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>• {rejectModal.residentName}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:'20px 24px' }}>

              {/* Quick reason chips */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Quick Reasons</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {QUICK_REASONS.map(reason => (
                    <button key={reason} onClick={() => { setRejectReason(reason); setRejectError(''); }}
                      style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${rejectReason === reason ? '#dc2626' : '#e5e7eb'}`, background: rejectReason === reason ? '#fee2e2' : '#f9fafb', color: rejectReason === reason ? '#dc2626' : '#374151', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason textarea */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                  Or write a custom reason
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe why this report is being rejected..."
                  value={rejectReason}
                  onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
                  maxLength={300}
                  style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${rejectError ? '#ef4444' : '#e5e7eb'}`, borderRadius:10, fontSize:13, color:'#374151', resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box', lineHeight:1.5 }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  {rejectError
                    ? <span style={{ color:'#ef4444', fontSize:12 }}>{rejectError}</span>
                    : <span />}
                  <span style={{ fontSize:11, color: rejectReason.length > 260 ? '#f59e0b' : '#d1d5db' }}>{rejectReason.length}/300</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding:'12px 24px 20px', display:'flex', gap:10, justifyContent:'flex-end', borderTop:'1px solid #f1f5f9' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ padding:'9px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmReject}
                style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reports;
