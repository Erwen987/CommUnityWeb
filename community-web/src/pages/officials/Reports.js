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
function AccountStatusBadge({ status }) {
  if (status === 'banned')  return <span style={{ fontSize:10, color:'#dc2626', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', flexShrink:0 }} />Banned</span>;
  if (status === 'deleted') return <span style={{ fontSize:10, color:'#6b7280', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af', flexShrink:0 }} />Deleted</span>;
  return <span style={{ fontSize:10, color:'#16a34a', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />Active</span>;
}
function StarDisplay({ rating }) {
  if (!rating) return <span style={{ fontSize:10, color:'#d1d5db', fontStyle:'italic' }}>No rating</span>;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= rating ? '#f59e0b' : '#e5e7eb'} stroke={s <= rating ? '#d97706' : '#d1d5db'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize:10, color:'#6b7280', marginLeft:3, fontWeight:600 }}>{rating}/5</span>
    </div>
  );
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

// ── CSV Export ─────────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  const cols = [
    { h: 'Resident',    v: r => r.residentName },
    { h: 'Problem',     v: r => r.problem || '' },
    { h: 'Barangay',    v: r => r.barangay || '' },
    { h: 'Description', v: r => r.description || '' },
    { h: 'Status',      v: r => r.status },
    { h: 'Rating',      v: r => r.rating ?? '' },
    { h: 'Date',        v: r => r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH') : '' },
  ];
  const csv = [cols.map(c => c.h).join(','), ...rows.map(r => cols.map(c => `"${String(c.v(r)).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
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
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                <AccountStatusBadge status={report.accountStatus} />
                <span style={{ fontSize:11, color:'#9ca3af', fontFamily:'monospace' }}>{report.id?.slice(0,8).toUpperCase()}</span>
              </div>
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
              { label:'Date',     value: fmt(report.created_at) },
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
          {report.rating ? (
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Rating</div>
              <StarDisplay rating={report.rating} />
            </div>
          ) : null}
          {report.image_url && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Photo</div>
              <img src={report.image_url} alt="report" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:10 }} />
            </div>
          )}
          {report.location_lat && report.location_lng && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#1E3A5F', fontWeight:600 }}>
              📍 {report.location_lat?.toFixed(5)}, {report.location_lng?.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Flag Modal ──────────────────────────────────────────────────────────────────
function FlagModal({ target, reason, onChangeReason, proofPreview, onChangeProof, onSubmit, onClose, loading }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Flag Resident for Abuse</h3>
            <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>Admin will review and take action</p>
          </div>
        </div>
        <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#78350f' }}>
          <strong>{target?.residentName}</strong> — Their reports will be reviewed by admin
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Quick Reasons</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['Submitting fake reports for points','Repeated false reports','Abusing the reward system','Reports could not be verified','Duplicate/spam reports'].map(r => (
              <button key={r} onClick={() => onChangeReason(r)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${reason===r?'#d97706':'#e5e7eb'}`, background:reason===r?'#fef3c7':'#f9fafb', color:reason===r?'#92400e':'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <textarea rows={3} placeholder="Describe the abusive behavior in detail..."
          value={reason} onChange={e => onChangeReason(e.target.value)} maxLength={300}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontFamily:'inherit', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', color:'#374151' }}
          onFocus={e => e.target.style.borderColor='#d97706'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />

        {/* Proof image upload */}
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
            Proof / Evidence <span style={{ fontSize:10, color:'#dc2626', fontWeight:600, textTransform:'none', letterSpacing:0 }}>* required</span>
          </div>
          {proofPreview ? (
            <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1.5px solid #fde68a' }}>
              <img src={proofPreview} alt="proof" style={{ width:'100%', maxHeight:160, objectFit:'cover', display:'block' }} />
              <button onClick={() => onChangeProof(null)}
                style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.55)', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <label style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 14px', borderRadius:10, border:'1.5px dashed #fde68a', background:'#fffbeb', cursor:'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{ fontSize:12, color:'#92400e', fontWeight:600 }}>Click to attach a screenshot or photo</span>
              <span style={{ fontSize:11, color:'#9ca3af' }}>PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onChangeProof(f); }} />
            </label>
          )}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={!reason.trim() || !proofPreview || loading}
            style={{ padding:'10px 22px', borderRadius:10, border:'none', background:!reason.trim()||!proofPreview||loading?'#fde68a':'#d97706', fontSize:13, fontWeight:600, cursor:!reason.trim()||!proofPreview||loading?'not-allowed':'pointer', color:'#fff', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:7 }}>
            {loading ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Submitting...</> : <>Submit Flag</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
function Reports() {
  const { barangay, isCapitan, loading: profileLoading } = useOfficialProfile();
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [updatingId, setUpdatingId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [mapReport, setMapReport]     = useState(null);
  const [page, setPage]               = useState(1);
  const [activeTab, setActiveTab]     = useState('reports'); // 'reports' | 'flagged'
  const PAGE_SIZE = 5;

  // Step 1: "Are you sure?" confirmation
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, problem, residentName }
  // Step 2: Reason entry modal
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError]   = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  // Flag state
  const [flagModal,        setFlagModal]        = useState(null); // { userId, residentName, reportId }
  const [flagReason,       setFlagReason]        = useState('');
  const [flagProofFile,    setFlagProofFile]     = useState(null);
  const [flagProofPreview, setFlagProofPreview]  = useState(null);
  const [flagLoading,      setFlagLoading]       = useState(false);
  const [officialId,       setOfficialId]        = useState(null);
  const [flaggedReportIds, setFlaggedReportIds]  = useState(new Set());
  const [flaggedReports,   setFlaggedReports]    = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setOfficialId(data.user?.id || null));
  }, []);

  const fetchReports = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const [{ data: reportsData }, { data: usersData }] = await Promise.all([
      supabase.from('reports').select('*').eq('barangay', barangay).order('created_at', { ascending: false }),
      supabase.from('users').select('auth_id, first_name, last_name, avatar_url, is_banned').eq('barangay', barangay),
    ]);
    const userMap = {};
    (usersData || []).forEach(u => { userMap[u.auth_id] = { name:`${u.first_name||''} ${u.last_name||''}`.trim(), avatar_url:u.avatar_url, is_banned:u.is_banned }; });
    setReports((reportsData||[]).map(r => ({
      ...r,
      residentName:   userMap[r.user_id]?.name || r.resident_name || 'Deleted Account',
      residentAvatar: userMap[r.user_id]?.avatar_url || null,
      accountStatus:  !userMap[r.user_id] ? 'deleted' : userMap[r.user_id].is_banned ? 'banned' : 'active',
    })));
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

  const fetchFlaggedReports = useCallback(async () => {
    if (!officialId || !barangay) return;
    const { data: flagData } = await supabase
      .from('abuse_flags')
      .select('report_ids')
      .eq('flagged_by_official_id', officialId);
    const ids = new Set((flagData || []).flatMap(f => f.report_ids || []));
    setFlaggedReportIds(ids);
    if (ids.size > 0) {
      const { data: flaggedRpts } = await supabase
        .from('reports')
        .select('*')
        .in('id', [...ids])
        .order('created_at', { ascending: false });
      const { data: usersData } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, avatar_url, is_banned')
        .eq('barangay', barangay);
      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.auth_id] = { name:`${u.first_name||''} ${u.last_name||''}`.trim(), avatar_url:u.avatar_url, is_banned:u.is_banned }; });
      setFlaggedReports((flaggedRpts || []).map(r => ({
        ...r,
        residentName:   userMap[r.user_id]?.name || r.resident_name || 'Deleted Account',
        residentAvatar: userMap[r.user_id]?.avatar_url || null,
        accountStatus:  !userMap[r.user_id] ? 'deleted' : userMap[r.user_id].is_banned ? 'banned' : 'active',
      })));
    } else {
      setFlaggedReports([]);
    }
  }, [officialId, barangay]);

  useEffect(() => { fetchFlaggedReports(); }, [fetchFlaggedReports]);

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

  const submitFlag = async () => {
    if (!flagReason.trim() || !flagModal || !flagProofFile) return;
    setFlagLoading(true);

    let proofImageUrl = null;
    if (flagProofFile) {
      const ext = flagProofFile.name.split('.').pop();
      const path = `proof-images/${officialId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('proof-images')
        .upload(path, flagProofFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('proof-images').getPublicUrl(path);
        proofImageUrl = urlData?.publicUrl || null;
      }
    }

    await supabase.from('abuse_flags').insert({
      flagged_user_id:        flagModal.userId,
      flagged_by_official_id: officialId,
      barangay,
      reason:          flagReason.trim(),
      report_ids:      flagModal.reportId ? [flagModal.reportId] : [],
      status:          'pending',
      proof_image_url: proofImageUrl,
    });
    setFlagLoading(false);
    setFlagModal(null);
    setFlagReason('');
    setFlagProofFile(null);
    setFlagProofPreview(null);
    fetchFlaggedReports();
  };

  const nonFlaggedReports = reports.filter(r => !flaggedReportIds.has(r.id));

  const filtered = nonFlaggedReports.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.problem?.toLowerCase().includes(q) || r.residentName?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const count  = s => nonFlaggedReports.filter(r => r.status === s).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const STATS = [
    { label:'Total',       filterKey:'all',         value:nonFlaggedReports.length, accent:'#1d4ed8', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label:'Pending',     filterKey:'pending',     value:count('pending'),         accent:'#f59e0b', iconBg:'#fef3c7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label:'In Progress', filterKey:'in_progress', value:count('in_progress'),     accent:'#3b82f6', iconBg:'#dbeafe',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg> },
    { label:'Resolved',    filterKey:'resolved',    value:count('resolved'),        accent:'#16a34a', iconBg:'#dcfce7',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label:'Rejected',    filterKey:'rejected',    value:count('rejected'),        accent:'#ef4444', iconBg:'#fee2e2',
      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <>
      {mapReport && <MapModal lat={mapReport.location_lat} lng={mapReport.location_lng} barangay={barangay} onClose={() => setMapReport(null)} />}
      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />

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
                <div key={c.label} onClick={() => { setFilter(c.filterKey); setActiveTab('reports'); }}
                  style={{ background: activeTab==='reports' && filter===c.filterKey ? c.iconBg : '#fff', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:10, borderLeft:`4px solid ${c.accent}`, cursor:'pointer', transition:'background 0.15s', minHeight:72, boxSizing:'border-box', borderBottom: activeTab==='reports' && filter===c.filterKey ? `2px solid ${c.accent}` : '2px solid transparent' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background: activeTab==='reports' && filter===c.filterKey ? '#fff' : c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280', marginBottom:3 }}>{c.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:'#1f2937', lineHeight:1 }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table panel */}
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>

              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', padding:'0 24px' }}>
                {[
                  { key:'reports', label:'All Reports',    count: nonFlaggedReports.length, color:'#2563eb', bg:'#eff6ff' },
                  { key:'flagged', label:'Flagged',        count: flaggedReports.length,    color:'#d97706', bg:'#fef3c7' },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'14px 18px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontFamily:'Poppins, sans-serif', fontWeight: activeTab===t.key ? 700 : 500, color: activeTab===t.key ? t.color : '#6b7280', borderBottom: activeTab===t.key ? `2.5px solid ${t.color}` : '2.5px solid transparent', marginBottom:-1, transition:'color 0.15s' }}>
                    {t.label}
                    <span style={{ background: activeTab===t.key ? t.bg : '#f1f5f9', color: activeTab===t.key ? t.color : '#9ca3af', borderRadius:999, padding:'2px 8px', fontSize:11, fontWeight:800 }}>{t.count}</span>
                  </button>
                ))}
              </div>

              {/* Panel header */}
              {activeTab === 'reports' && (
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Reports Overview</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{filtered.length} of {nonFlaggedReports.length} records · page {page} of {totalPages||1}</div>
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
                  <button onClick={() => exportCSV(filtered, `reports_${barangay || 'all'}_${new Date().toISOString().slice(0,10)}.csv`)}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', border:'1.5px solid #e5e7eb', borderRadius:9, background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export CSV
                  </button>
                </div>
              </div>
              )}

              {activeTab === 'reports' && <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, width:'18%' }}>Resident</th>
                      <th style={{ ...TH, width:'22%' }}>Problem</th>
                      <th style={{ ...TH, width:'10%' }}>Media</th>
                      <th style={{ ...TH, width:'12%' }}>Status</th>
                      <th style={{ ...TH, width:'10%' }}>Rating</th>
                      <th style={{ ...TH, width:'10%' }}>Date</th>
                      <th style={{ ...TH, width:'18%' }}>Actions</th>
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

                        {/* Resident */}
                        <td style={{ ...TD, overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={32} index={i} />
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:12, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.residentName}</div>
                              <AccountStatusBadge status={r.accountStatus} />
                            </div>
                          </div>
                        </td>

                        {/* Problem + Description */}
                        <td style={TD}>
                          <div style={{ fontWeight:700, fontSize:13, color:'#111827', marginBottom:2 }}>{r.problem}</div>
                          <div style={{ fontSize:11, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>
                            {r.rejection_reason
                              ? <span style={{ color:'#991b1b', fontStyle:'italic' }}>↳ {r.rejection_reason}</span>
                              : r.description || <span style={{ color:'#d1d5db' }}>No description</span>
                            }
                          </div>
                        </td>

                        {/* Media (image + location) */}
                        <td style={TD}>
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {r.image_url
                              ? <a href={r.image_url} target="_blank" rel="noreferrer"
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#1E3A5F', fontSize:11, fontWeight:600, background:'#e0e7ef', padding:'4px 9px', borderRadius:6, textDecoration:'none' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Photo
                                </a>
                              : null}
                            {r.location_lat && r.location_lng
                              ? <button onClick={() => setMapReport(r)}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#eff6ff', color:'#1E3A5F', border:'1px solid #bfdbfe', borderRadius:6, padding:'4px 9px', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Map
                                </button>
                              : null}
                            {!r.image_url && !(r.location_lat && r.location_lng) && <span style={{ color:'#d1d5db', fontSize:12 }}>—</span>}
                          </div>
                        </td>

                        <td style={TD}><StatusBadge status={r.status} /></td>
                        <td style={TD}><StarDisplay rating={r.rating} /></td>
                        <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmt(r.created_at)}</td>

                        {/* Actions — horizontal chips */}
                        <td style={TD}>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
                            <button onClick={() => setSelectedReport(r)}
                              style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', color:'#1E3A5F', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              View
                            </button>
                            {r.status === 'resolved' || r.status === 'rejected' ? null : isCapitan ? (
                              <>
                                {r.status === 'pending' && (
                                  <button onClick={() => updateStatus(r.id, 'in_progress')} disabled={updatingId===r.id}
                                    style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #bfdbfe', background:'#dbeafe', color:'#1d4ed8', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:updatingId===r.id?0.5:1 }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-9.5"/></svg>
                                    Progress
                                  </button>
                                )}
                                {r.status === 'in_progress' && (
                                  <button onClick={() => updateStatus(r.id, 'resolved')} disabled={updatingId===r.id}
                                    style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #86efac', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:updatingId===r.id?0.5:1 }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Resolve
                                  </button>
                                )}
                                <button onClick={() => openConfirm(r)} disabled={updatingId===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fca5a5', background:'#fee2e2', color:'#dc2626', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:updatingId===r.id?0.5:1 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize:10, color:'#9ca3af', fontWeight:600, background:'#f1f5f9', padding:'4px 8px', borderRadius:5 }}>View Only</span>
                            )}
                            {r.accountStatus !== 'deleted' && r.user_id && (
                              <button onClick={() => { setFlagModal({ userId: r.user_id, residentName: r.residentName, reportId: r.id }); setFlagReason(''); }}
                                style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', color:'#92400e', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Flag
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}

              {activeTab === 'reports' && totalPages > 1 && (
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

              {/* ── FLAGGED TAB ── */}
              {activeTab === 'flagged' && (
                flaggedReports.length === 0 ? (
                  <div style={{ padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#374151' }}>No flagged reports</div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>Reports you flag will appear here for review.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding:'12px 24px', borderBottom:'1px solid #f1f5f9', background:'#fefce8' }}>
                      <span style={{ fontSize:12, color:'#92400e', fontWeight:600 }}>
                        These reports have been flagged to the admin for review. They are read-only.
                      </span>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ ...TH, width:'20%' }}>Resident</th>
                            <th style={{ ...TH, width:'25%' }}>Problem</th>
                            <th style={{ ...TH, width:'12%' }}>Status</th>
                            <th style={{ ...TH, width:'10%' }}>Rating</th>
                            <th style={{ ...TH, width:'13%' }}>Date</th>
                            <th style={{ ...TH, width:'10%' }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flaggedReports.map((r, i) => (
                            <tr key={r.id} style={{ backgroundColor: i%2===0 ? '#fffbeb' : '#fef3c7' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor='#fde68a'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0 ? '#fffbeb' : '#fef3c7'}>
                              <td style={{ ...TD, overflow:'hidden' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <ResidentAvatar url={r.residentAvatar} name={r.residentName} size={32} index={i} />
                                  <div style={{ minWidth:0 }}>
                                    <div style={{ fontWeight:600, fontSize:12, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.residentName}</div>
                                    <AccountStatusBadge status={r.accountStatus} />
                                  </div>
                                </div>
                              </td>
                              <td style={TD}>
                                <div style={{ fontWeight:700, fontSize:13, color:'#111827', marginBottom:2 }}>{r.problem}</div>
                                <div style={{ fontSize:11, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{r.description || <span style={{ color:'#d1d5db' }}>No description</span>}</div>
                              </td>
                              <td style={TD}><StatusBadge status={r.status} /></td>
                              <td style={TD}><StarDisplay rating={r.rating} /></td>
                              <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmt(r.created_at)}</td>
                              <td style={TD}>
                                <button onClick={() => setSelectedReport(r)}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', color:'#92400e', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
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
      {flagModal && (
        <FlagModal
          target={flagModal}
          reason={flagReason}
          onChangeReason={setFlagReason}
          proofPreview={flagProofPreview}
          onChangeProof={file => {
            setFlagProofFile(file);
            setFlagProofPreview(file ? URL.createObjectURL(file) : null);
          }}
          onSubmit={submitFlag}
          onClose={() => { setFlagModal(null); setFlagReason(''); setFlagProofFile(null); setFlagProofPreview(null); }}
          loading={flagLoading}
        />
      )}
    </>
  );
}

export default Reports;
