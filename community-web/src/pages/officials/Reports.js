import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const GOOGLE_MAPS_KEY = 'AIzaSyDD1KBSgXW5ilJo5y_pYTGM0VD0CTehVSE';

const BARANGAY_HALLS = {
  'Mangin':           { lat: 16.0453, lng: 120.3672 },
  'Bolosan':          { lat: 16.0441, lng: 120.3378 },
  'Calmay':           { lat: 16.0389, lng: 120.3501 },
  'Pantal':           { lat: 16.0312, lng: 120.3398 },
  'Lucao':            { lat: 16.0298, lng: 120.3512 },
  'Bonuan Binloc':    { lat: 16.0201, lng: 120.3489 },
  'Bonuan Boquig':    { lat: 16.0178, lng: 120.3412 },
  'Bonuan Gueset':    { lat: 16.0223, lng: 120.3601 },
  'Malued':           { lat: 16.0501, lng: 120.3298 },
  'Mayombo':          { lat: 16.0478, lng: 120.3512 },
  'Perez':            { lat: 16.0432, lng: 120.3445 },
  'Bacayao Norte':    { lat: 16.0389, lng: 120.3223 },
  'Bacayao Sur':      { lat: 16.0356, lng: 120.3201 },
  'Caranglaan':       { lat: 16.0512, lng: 120.3601 },
  'Carael':           { lat: 16.0534, lng: 120.3512 },
  'Herrero':          { lat: 16.0445, lng: 120.3489 },
  'Lasip Chico':      { lat: 16.0567, lng: 120.3423 },
  'Lasip Grande':     { lat: 16.0589, lng: 120.3401 },
  'Lomboy':           { lat: 16.0312, lng: 120.3601 },
  'Mamalingling':     { lat: 16.0601, lng: 120.3512 },
  'Pugaro Suit':      { lat: 16.0223, lng: 120.3312 },
  'Quezon':           { lat: 16.0434, lng: 120.3398 },
  'Salvador':         { lat: 16.0456, lng: 120.3512 },
  'Salapingao':       { lat: 16.0378, lng: 120.3623 },
  'Sta. Barbara':     { lat: 16.0512, lng: 120.3489 },
  'Sta. Maria':       { lat: 16.0489, lng: 120.3445 },
  'Tebeng':           { lat: 16.0534, lng: 120.3378 },
  'Pogo Chico':       { lat: 16.0267, lng: 120.3534 },
  'Pogo Grande':      { lat: 16.0245, lng: 120.3556 },
  'Barangay I (Poblacion)':  { lat: 16.0432, lng: 120.3335 },
  'Barangay II (Poblacion)': { lat: 16.0445, lng: 120.3312 },
  'Barangay III (Poblacion)':{ lat: 16.0423, lng: 120.3356 },
  'Barangay IV (Poblacion)': { lat: 16.0412, lng: 120.3378 },
};

// ── Map Modal ─────────────────────────────────────────────────────────────────
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
    if (window.google) { loadMap(); }
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

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:     { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b', label: 'Pending'     },
  in_progress: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Resolved'    },
};

const TH = { padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textAlign: 'left' };
const TD = { padding: '13px 16px', fontSize: 13, color: '#374151' };

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, color:s.color, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} />{s.label}
    </span>
  );
}

const fmt = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Main ──────────────────────────────────────────────────────────────────────
function Reports() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [mapReport, setMapReport]   = useState(null);

  const fetchReports = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data: users } = await supabase.from('users').select('auth_id').eq('barangay', barangay);
    const userIds = (users || []).map(u => u.auth_id);
    if (userIds.length === 0) { setReports([]); setLoading(false); return; }
    const { data } = await supabase.from('reports').select('*').in('user_id', userIds).order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, [barangay]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('reports').update({ status }).eq('id', id);
    setUpdatingId(null);
    fetchReports();
  };

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.problem?.toLowerCase().includes(search.toLowerCase()) || r.id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = s => reports.filter(r => r.status === s).length;

  const STATS = [
    { label: 'Total Reports', value: reports.length, accent: '#1d4ed8', iconBg: '#dbeafe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Pending',       value: count('pending'),     accent: '#f59e0b', iconBg: '#fef3c7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'In Progress',   value: count('in_progress'), accent: '#3b82f6', iconBg: '#dbeafe',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label: 'Resolved',      value: count('resolved'),    accent: '#16a34a', iconBg: '#dcfce7',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  return (
    <>
      {mapReport && <MapModal lat={mapReport.location_lat} lng={mapReport.location_lng} barangay={barangay} onClose={() => setMapReport(null)} />}
      <div className="off-layout">
        <OfficialSidebar />
        <div className="off-main">
          <OfficialTopbar badge />
          <div className="off-content">

            <div style={{ marginBottom: 24 }}>
              <h1 className="off-page-title" style={{ marginBottom: 2 }}>Reports</h1>
              <p className="off-page-sub" style={{ margin: 0 }}>
                {!profileLoading && barangay ? `Showing reports for Barangay ${barangay}` : 'Monitor and manage community reports'}
              </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              {STATS.map(c => (
                <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${c.accent}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table panel */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

              {/* Panel header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Reports Overview</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{filtered.length} of {reports.length} records</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search problem or ID…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ padding: '8px 12px 8px 32px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 220 }} />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Report ID</th>
                      <th style={TH}>Problem</th>
                      <th style={TH}>Description</th>
                      <th style={TH}>Image</th>
                      <th style={TH}>Location</th>
                      <th style={TH}>Status</th>
                      <th style={TH}>Date</th>
                      <th style={TH}>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>
                          Loading reports...
                        </div>
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '48px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No reports found</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{search || filter !== 'all' ? 'Try adjusting your search or filter.' : `No reports submitted for ${barangay || 'your barangay'} yet.`}</div>
                        </div>
                      </td></tr>
                    ) : filtered.map((r, i) => (
                      <tr key={r.id}
                        style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background= i % 2 === 0 ? '#fff' : '#f8fafc'}>
                        <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>{r.id?.slice(0,8)}…</td>
                        <td style={{ ...TD, fontWeight: 600, color: '#111827' }}>{r.problem}</td>
                        <td style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>{r.description || '—'}</td>
                        <td style={TD}>
                          {r.image_url
                            ? <a href={r.image_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1E3A5F', fontSize: 12, fontWeight: 600, background: '#e0e7ef', padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>View
                              </a>
                            : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        <td style={TD}>
                          {r.location_lat && r.location_lng
                            ? <button onClick={() => setMapReport(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1E3A5F', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                📍 View Map
                              </button>
                            : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        <td style={TD}><StatusBadge status={r.status} /></td>
                        <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmt(r.created_at)}</td>
                        <td style={TD}>
                          <select value={r.status} disabled={updatingId===r.id} onChange={e => updateStatus(r.id, e.target.value)}
                            style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', background: '#fff', color: '#374151', opacity: updatingId===r.id ? 0.5 : 1, outline: 'none' }}>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Reports;
