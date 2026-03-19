import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const GOOGLE_MAPS_KEY = 'AIzaSyDD1KBSgXW5ilJo5y_pYTGM0VD0CTehVSE';

// Approximate barangay hall coordinates for Dagupan City
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

// ── Google Maps Modal ─────────────────────────────────────────────────────────
function MapModal({ lat, lng, barangay, onClose }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const loadMap = () => {
      if (!mapRef.current || !window.google) return;

      const reportPos   = { lat, lng };
      const hallCoords  = BARANGAY_HALLS[barangay];
      const hallPos     = hallCoords || { lat: 16.0432, lng: 120.3335 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: reportPos,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      // Report location marker (red)
      new window.google.maps.Marker({
        position: reportPos,
        map,
        title: 'Issue Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Barangay hall marker (blue)
      new window.google.maps.Marker({
        position: hallPos,
        map,
        title: `${barangay} Barangay Hall`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#1E3A5F',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Draw route using OSRM (free, no billing needed)
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/` +
        `${hallPos.lng},${hallPos.lat};${reportPos.lng},${reportPos.lat}` +
        `?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then(r => r.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes.length > 0) {
            const route    = data.routes[0];
            const coords   = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
            const distance = (route.distance / 1000).toFixed(1);
            const minutes  = Math.round(route.duration / 60);

            new window.google.maps.Polyline({
              path:          coords,
              geodesic:      true,
              strokeColor:   '#1E3A5F',
              strokeOpacity: 0.9,
              strokeWeight:  5,
              map,
            });

            // Fit map to show full route
            const bounds = new window.google.maps.LatLngBounds();
            coords.forEach(c => bounds.extend(c));
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

            const routeInfo = document.getElementById('route-info');
            if (routeInfo) routeInfo.textContent =
              `${distance} km from ${barangay} Barangay Hall · ~${minutes} min`;
          }
        })
        .catch(() => {
          const routeInfo = document.getElementById('route-info');
          if (routeInfo) routeInfo.textContent = 'Route unavailable';
        });
    };

    if (window.google) {
      loadMap();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id  = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
        script.async = true;
        script.onload = loadMap;
        document.head.appendChild(script);
      } else {
        // Script loading — wait for it
        const interval = setInterval(() => {
          if (window.google) { clearInterval(interval); loadMap(); }
        }, 200);
      }
    }
  }, [lat, lng, barangay]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        width: 620, maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, color: '#1E3A5F', fontSize: 15 }}>📍 Issue Location</span>
            <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12 }}>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>● Report</span>
              <span style={{ color: '#1E3A5F', fontWeight: 600 }}>● Barangay Hall</span>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div ref={mapRef} style={{ width: '100%', height: 400 }} />

        <div style={{ padding: '10px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span id="route-info" style={{ fontSize: 12, color: '#1E3A5F', fontWeight: 600 }}>Calculating route...</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending:     { bg: '#fef3c7', color: '#92400e' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  resolved:    { bg: '#dcfce7', color: '#166534' },
};

function Reports() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [mapReport, setMapReport]   = useState(null); // report to show in map modal


  const fetchReports = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);

    // Step 1: get all auth_ids of residents in this barangay
    const { data: users } = await supabase
      .from('users')
      .select('auth_id')
      .eq('barangay', barangay);

    const userIds = (users || []).map(u => u.auth_id);

    if (userIds.length === 0) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch reports for those users
    const { data } = await supabase
      .from('reports')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    setReports(data || []);
    setLoading(false);
  }, [barangay]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('reports').update({ status }).eq('id', id);
    setUpdatingId(null);
    fetchReports();
  };

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search ||
      r.problem?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (status) => reports.filter(r => r.status === status).length;

  const stats = [
    { label: 'Total Reports', value: reports.length },
    { label: 'Pending',       value: count('pending') },
    { label: 'In Progress',   value: count('in_progress') },
    { label: 'Resolved',      value: count('resolved') },
  ];

  return (
    <>
    {mapReport && (
      <MapModal
        lat={mapReport.location_lat}
        lng={mapReport.location_lng}
        barangay={barangay}
        onClose={() => setMapReport(null)}
      />
    )}
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Reports</h1>
          <p className="off-page-sub">
            {!profileLoading && barangay ? `Showing reports for ${barangay}` : ''}
          </p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-4">
            {stats.map(s => (
              <div key={s.label} className="off-stat-card">
                <h4>{s.label}</h4>
                <div className="off-stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Reports table */}
          <div className="off-card">
            <h3 className="off-card-title">Reports Overview</h3>
            <div className="off-table-header">
              <input
                className="off-table-search"
                type="text"
                placeholder="Search by problem or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="off-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <table className="off-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Problem</th>
                  <th>Description</th>
                  <th>Image</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
                      No reports found for {barangay || 'your barangay'}.
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const s = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.id?.slice(0, 8)}...</td>
                      <td style={{ fontWeight: 600 }}>{r.problem}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>
                        {r.description || '—'}
                      </td>
                      <td>
                        {r.image_url ? (
                          <a href={r.image_url} target="_blank" rel="noreferrer"
                            style={{ color: '#1E3A5F', fontSize: 12, fontWeight: 600 }}>
                            View
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        {r.location_lat && r.location_lng ? (
                          <button
                            onClick={() => setMapReport(r)}
                            style={{
                              background: '#eff6ff', color: '#1E3A5F',
                              border: '1px solid #bfdbfe', borderRadius: 6,
                              padding: '3px 10px', fontSize: 11, fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            📍 View Map
                          </button>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{
                          background: s.bg, color: s.color,
                          padding: '3px 10px', borderRadius: 999,
                          fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                        }}>
                          {r.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280', fontSize: 12 }}>
                        {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <select
                          value={r.status}
                          disabled={updatingId === r.id}
                          onChange={e => updateStatus(r.id, e.target.value)}
                          style={{
                            border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px',
                            fontSize: 12, cursor: 'pointer', background: '#fff',
                            opacity: updatingId === r.id ? 0.5 : 1,
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}

export default Reports;
