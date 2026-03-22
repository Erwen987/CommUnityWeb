import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
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
            const el = document.getElementById('admin-route-info');
            if (el) el.textContent = `${(route.distance/1000).toFixed(1)} km from ${barangay} Barangay Hall · ~${Math.round(route.duration/60)} min`;
          }
        }).catch(() => { const el = document.getElementById('admin-route-info'); if (el) el.textContent = 'Route unavailable'; });
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
          <span id="admin-route-info" style={{ fontSize:12, color:'#1E3A5F', fontWeight:600 }}>Calculating route...</span>
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
const fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}
function ResidentAvatar({ url, name, size=30, index=0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:'50%', background:avatarColors[index%5], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{initials}</div>;
}
function AccountStatusBadge({ status }) {
  if (status === 'banned')  return <span style={{ fontSize:10, color:'#dc2626', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', flexShrink:0 }} />Banned</span>;
  if (status === 'deleted') return <span style={{ fontSize:10, color:'#6b7280', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af', flexShrink:0 }} />Deleted</span>;
  return <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />Active</span>;
}
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || { bg:'#f1f5f9', color:'#374151', dot:'#9ca3af', label: status };
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, color:s.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}><span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} />{s.label}</span>;
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <ResidentAvatar url={report.residentAvatar} name={report.residentName} size={44} />
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:'#111827' }}>{report.residentName}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:2, fontFamily:'monospace' }}>{report.id.slice(0,8).toUpperCase()}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <StatusBadge status={report.status} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Problem',  value: report.problem },
              { label:'Resident', value: report.residentName },
              { label:'Barangay', value: report.barangay },
              { label:'Date',     value: fmtDate(report.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
          {report.description && (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Description</div>
              <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{report.description}</div>
            </div>
          )}
          {report.status === 'rejected' && report.rejection_reason && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Rejection Reason</div>
              <div style={{ fontSize:13, color:'#b91c1c', lineHeight:1.6 }}>{report.rejection_reason}</div>
            </div>
          )}
          {report.image_url && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Photo</div>
              <img src={report.image_url} alt="report" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:10 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
function AdminReports() {
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null);
  const [mapReport, setMapReport] = useState(null);
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rpts = [] }, { data: users = [] }] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('auth_id, first_name, last_name, avatar_url, is_banned'),
    ]);
    const userMap = {};
    users.forEach(u => { userMap[u.auth_id] = { name:`${u.first_name} ${u.last_name}`.trim(), avatar_url: u.avatar_url, is_banned: u.is_banned }; });
    setReports(rpts.map(r => ({
      ...r,
      residentName:   userMap[r.user_id]?.name || 'Deleted User',
      residentAvatar: userMap[r.user_id]?.avatar_url || null,
      accountStatus:  !userMap[r.user_id] ? 'deleted' : userMap[r.user_id].is_banned ? 'banned' : 'active',
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase.channel('admin-reports-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'reports' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  useEffect(() => setPage(1), [filter, search]);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.problem?.toLowerCase().includes(q) || r.residentName.toLowerCase().includes(q) || r.barangay?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const count = s => reports.filter(r => r.status === s).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const STATS = [
    { label:'Total',       filterKey:'all',         value:reports.length,       accent:'#1d4ed8', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label:'Pending',     filterKey:'pending',     value:count('pending'),     accent:'#f59e0b', iconBg:'#fef3c7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label:'In Progress', filterKey:'in_progress', value:count('in_progress'), accent:'#3b82f6', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label:'Resolved',    filterKey:'resolved',    value:count('resolved'),    accent:'#16a34a', iconBg:'#dcfce7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label:'Rejected',    filterKey:'rejected',    value:count('rejected'),    accent:'#ef4444', iconBg:'#fee2e2',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <>
      {mapReport && <MapModal lat={mapReport.location_lat} lng={mapReport.location_lng} barangay={mapReport.barangay} onClose={() => setMapReport(null)} />}
      <ReportModal report={selected} onClose={() => setSelected(null)} />

      <div className="off-layout">
        <AdminSidebar />
        <div className="off-main">
          <AdminTopbar />
          <div className="off-content">

            <div style={{ marginBottom:24 }}>
              <h1 className="off-page-title" style={{ marginBottom:2 }}>Reports</h1>
              <p className="off-page-sub" style={{ margin:0 }}>View and manage all reports submitted by residents across all barangays</p>
            </div>

            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:28 }}>
              {STATS.map(c => (
                <div key={c.label} onClick={() => setFilter(c.filterKey)}
                  style={{ background: filter===c.filterKey ? c.iconBg : '#fff', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:10, borderLeft:`4px solid ${c.accent}`, cursor:'pointer', transition:'background 0.15s', minHeight:72, boxSizing:'border-box', borderBottom: filter===c.filterKey ? `2px solid ${c.accent}` : '2px solid transparent' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background: filter===c.filterKey ? '#fff' : c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280', marginBottom:3 }}>{c.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:'#1f2937', lineHeight:1 }}>
                      {loading ? <span style={{ fontSize:16, color:'#d1d5db' }}>—</span> : c.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table panel */}
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Reports Overview</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{filtered.length} of {reports.length} records · page {page} of {totalPages||1}</div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search problem, resident, barangay…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ padding:'8px 12px 8px 32px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', width:260 }} />
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
                      <th style={{ ...TH, width:'14%' }}>Resident</th>
                      <th style={{ ...TH, width:'13%' }}>Problem</th>
                      <th style={{ ...TH, width:'12%' }}>Barangay</th>
                      <th style={{ ...TH, width:'16%' }}>Description</th>
                      <th style={{ ...TH, width:'6%'  }}>Image</th>
                      <th style={{ ...TH, width:'7%'  }}>Location</th>
                      <th style={{ ...TH, width:'10%' }}>Status</th>
                      <th style={{ ...TH, width:'9%'  }}>Date</th>
                      <th style={{ ...TH, width:'13%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} style={{ padding:'48px 24px', textAlign:'center' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, border:'3px solid #e0e7ef', borderTopColor:'#1E3A5F', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                          <span style={{ fontSize:13, color:'#9ca3af' }}>Loading reports...</span>
                        </div>
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding:'48px 24px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                          <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:'#374151' }}>No reports found</div>
                          <div style={{ fontSize:12, color:'#9ca3af' }}>Try adjusting your search or filter</div>
                        </div>
                      </td></tr>
                    ) : paginated.map((r, i) => (
                      <tr key={r.id}
                        style={{ backgroundColor: i%2===0 ? '#ffffff' : '#f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor='#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0 ? '#ffffff' : '#f9fafb'}>

                        <td style={{ ...TD, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
                            <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={28} index={i} />
                            <div style={{ overflow:'hidden', minWidth:0 }}>
                              <div style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{r.residentName}</div>
                              <AccountStatusBadge status={r.accountStatus} />
                            </div>
                          </div>
                        </td>
                        <td style={{ ...TD, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.problem || '—'}</td>
                        <td style={{ ...TD, overflow:'hidden' }}>
                          <span style={{ background:'#f1f5f9', color:'#374151', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, display:'inline-block', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.barangay || '—'}
                          </span>
                        </td>
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
                        <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>

                        {/* Actions — view only */}
                        <td style={TD}>
                          <button onClick={() => setSelected(r)}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#eff6ff', color:'#1E3A5F', border:'1px solid #bfdbfe', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View
                          </button>
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

    </>
  );
}

export default AdminReports;
