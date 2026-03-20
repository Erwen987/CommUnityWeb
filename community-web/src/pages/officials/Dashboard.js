import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}
function ResidentAvatar({ url, name, size = 30, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>{initials}</div>;
}

function getLastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
}

const EXPIRY_OPTIONS = [
  { label: '3 days',  days: 3  },
  { label: '7 days',  days: 7  },
  { label: '10 days', days: 10 },
  { label: '30 days', days: 30 },
];

function Dashboard() {
  const { barangay, loading } = useOfficialProfile();

  // Post form state
  const [title,       setTitle]       = useState('');
  const [body,        setBody]        = useState('');
  const [expiryDays,  setExpiryDays]  = useState(10);
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview,setImagePreview]= useState(null);
  const [posting,     setPosting]     = useState(false);
  const [postError,   setPostError]   = useState('');
  const fileRef = useRef();

  // Active announcements list
  const [announcements,   setAnnouncements]   = useState([]);
  const [loadingList,     setLoadingList]     = useState(false);
  const [deletingId,      setDeletingId]      = useState(null);
  const [listExpanded,    setListExpanded]    = useState(true);

  // Dashboard stats
  const [statsLoading,    setStatsLoading]    = useState(false);
  const [totalReports,    setTotalReports]    = useState(null);
  const [totalRequests,   setTotalRequests]   = useState(null);
  const [monthlyData,     setMonthlyData]     = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const loadStats = useCallback(async () => {
    if (!barangay) return;
    setStatsLoading(true);

    const months      = getLastSixMonths();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      { data: reports  = [] },
      { data: requests = [] },
      { data: users    = [] },
    ] = await Promise.all([
      supabase.from('reports').select('id, created_at, user_id').eq('barangay', barangay),
      supabase.from('requests').select('id, created_at').eq('barangay', barangay),
      supabase.from('users').select('auth_id, first_name, last_name, avatar_url').eq('barangay', barangay),
    ]);

    setTotalReports(reports.length);
    setTotalRequests(requests.length);

    // Monthly chart — last 6 months
    const recentReports  = reports.filter(r  => new Date(r.created_at)  >= sixMonthsAgo);
    const recentRequests = requests.filter(r => new Date(r.created_at) >= sixMonthsAgo);
    setMonthlyData(months.map(m => ({
      month:    m.label,
      reports:  recentReports.filter(r  => { const d = new Date(r.created_at);  return d.getFullYear() === m.year && d.getMonth() === m.month; }).length,
      requests: recentRequests.filter(r => { const d = new Date(r.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length,
    })));

    // Top contributors — most reports submitted
    const countMap = {};
    reports.forEach(r => { countMap[r.user_id] = (countMap[r.user_id] || 0) + 1; });
    const userMap  = {};
    users.forEach(u => { userMap[u.auth_id] = { name: `${u.first_name} ${u.last_name}`.trim(), avatar_url: u.avatar_url }; });
    const ranked = Object.entries(countMap)
      .map(([uid, count]) => ({ ...(userMap[uid] || { name: 'Unknown', avatar_url: null }), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopContributors(ranked);

    setStatsLoading(false);
  }, [barangay]);

  useEffect(() => {
    if (barangay) { fetchAnnouncements(); loadStats(); }
  }, [barangay, loadStats]);

  const fetchAnnouncements = async () => {
    if (!barangay) return;
    setLoadingList(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('barangay', barangay)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(10);
    setAnnouncements(data || []);
    setLoadingList(false);
  };

  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async () => {
    if (!title.trim())  { setPostError('Please enter a title.'); return; }
    if (!barangay)      { setPostError('Barangay not loaded yet.'); return; }
    setPosting(true);
    setPostError('');

    try {
      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop();
        const path = `${barangay}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('announcements')
          .upload(path, imageFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('announcements').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertErr } = await supabase.from('announcements').insert({
        barangay,
        title:        title.trim(),
        body:         body.trim(),
        image_url:    imageUrl,
        expires_at:   expiresAt.toISOString(),
        is_published: true,
        published_at: new Date().toISOString(),
        posted_by:    user?.id ?? null,
      });
      if (insertErr) throw insertErr;

      // Reset form
      setTitle('');
      setBody('');
      setImageFile(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = '';
      setExpiryDays(10);
      fetchAnnouncements();
    } catch (err) {
      setPostError(err.message || 'Failed to post announcement.');
    }
    setPosting(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    await supabase.from('announcements').delete().eq('id', id);
    setDeletingId(null);
    fetchAnnouncements();
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Hello, Officials! 👋</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay ? `Here's what's happening in ${barangay} today.` : "Here's what's happening in your barangay today."}
            </p>
          </div>

          <div className="off-dash-grid">

            {/* LEFT */}
            <div className="off-dash-left">

              {/* ── Announcement card ── */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20, overflow: 'hidden' }}>

                {/* Card header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Barangay Announcement</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Post a message or image to your residents</div>
                  </div>
                </div>

                {/* Form */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Title */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Upcoming Barangay Fiesta"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <textarea
                      placeholder="Write more details about the announcement..."
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                        <button onClick={handleRemoveImage}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 16px', border: '1.5px dashed #d1d5db', borderRadius: 10, cursor: 'pointer', background: '#fafafa' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Click to upload image</span>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>

                  {/* Bottom row: expiry + publish */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Expires in</label>
                      <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))}
                        style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', cursor: 'pointer' }}>
                        {EXPIRY_OPTIONS.map(o => (
                          <option key={o.days} value={o.days}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <button onClick={handlePost} disabled={posting || !title.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: posting || !title.trim() ? '#9ca3af' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 600, fontSize: 13, cursor: posting || !title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      {posting ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>

                  {postError && (
                    <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{postError}</div>
                  )}
                </div>

                {/* Active announcements list */}
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  {/* Section header */}
                  <button onClick={() => setListExpanded(v => !v)}
                    style={{ width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Announcements</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: announcements.length >= 8 ? '#dc2626' : '#1E3A5F', background: announcements.length >= 8 ? '#fef2f2' : '#e0e7ef', padding: '2px 10px', borderRadius: 999 }}>
                        {announcements.length} / 10
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: listExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {listExpanded && loadingList ? (
                    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>Loading announcements...</span>
                    </div>
                  ) : listExpanded && announcements.length === 0 ? (
                    <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>No active announcements</span>
                      <span style={{ fontSize: 12, color: '#d1d5db' }}>Post your first announcement above</span>
                    </div>
                  ) : listExpanded ? (
                    <div style={{ padding: '8px 16px 16px' }}>
                      {announcements.map((a) => {
                        const days = Math.ceil((new Date(a.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                        const expiryColor = days <= 1 ? '#dc2626' : days <= 3 ? '#f59e0b' : '#16a34a';
                        const expiryBg   = days <= 1 ? '#fef2f2' : days <= 3 ? '#fffbeb' : '#f0fdf4';
                        const expiryLabel = days <= 0 ? 'Expired' : days === 1 ? 'Last day' : `${days}d left`;
                        return (
                          <div key={a.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, marginBottom: 6, background: '#fff', border: '1px solid #f1f5f9', transition: 'box-shadow 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                            {/* Thumbnail */}
                            {a.image_url
                              ? <img src={a.image_url} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #f1f5f9' }} />
                              : <div style={{ width: 46, height: 46, borderRadius: 10, background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </div>
                            }

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Posted {fmtDate(a.created_at)}</div>
                            </div>

                            {/* Expiry pill */}
                            <span style={{ fontSize: 11, fontWeight: 700, color: expiryColor, background: expiryBg, padding: '3px 10px', borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}>
                              {expiryLabel}
                            </span>

                            {/* Delete icon button */}
                            <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                              title="Delete announcement"
                              style={{ background: 'none', border: 'none', cursor: deletingId === a.id ? 'not-allowed' : 'pointer', color: '#d1d5db', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: deletingId === a.id ? 0.4 : 1, transition: 'color 0.15s, background 0.15s' }}
                              onMouseEnter={e => { if (deletingId !== a.id) { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}}
                              onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}>
                              {deletingId === a.id
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              }
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

              </div>

              {/* Chart card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Monthly Reports &amp; Requests</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Activity over last 6 months</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Reports</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#7c3aed', display: 'inline-block' }} />Requests</div>
                  </div>
                </div>
                {statsLoading ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : !monthlyData.some(m => m.reports > 0 || m.requests > 0) ? (
                  <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>No activity yet</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                      <Bar dataKey="reports"  name="Reports"  fill="#93c5fd" radius={[4,4,0,0]} />
                      <Bar dataKey="requests" name="Requests" fill="#7c3aed" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>

            {/* RIGHT */}
            <div className="off-dash-right">

              <div className="off-dash-stats-row">
                {[
                  { label: 'Total Reports',  value: totalReports,  accent: '#1d4ed8', iconBg: '#dbeafe', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                  { label: 'Total Requests', value: totalRequests, accent: '#7c3aed', iconBg: '#ede9fe', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
                ].map(c => (
                  <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1, borderLeft: `4px solid ${c.accent}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
                        {statsLoading || c.value === null ? <span style={{ fontSize: 14, color: '#d1d5db' }}>—</span> : c.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 2 }}>Top Community Contributors</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Most active residents in your barangay</div>

                {statsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    <div style={{ width: 24, height: 24, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : topContributors.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No contributor records yet</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {topContributors.map((r, i) => {
                      const medals  = ['🥇','🥈','🥉'];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topContributors.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ResidentAvatar url={r.avatar_url} name={r.name} size={30} index={i} />
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i < 3 && <span style={{ fontSize: 14 }}>{medals[i]}</span>}
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A5F', background: '#e0e7ef', padding: '2px 9px', borderRadius: 999 }}>{r.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
