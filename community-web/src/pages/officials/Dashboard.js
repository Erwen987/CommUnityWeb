import React, { useState, useEffect, useRef } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';

const monthlyData = [];

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
  const [announcements, setAnnouncements] = useState([]);
  const [loadingList,   setLoadingList]   = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);

  useEffect(() => {
    if (barangay) fetchAnnouncements();
  }, [barangay]);

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

      const { error: insertErr } = await supabase.from('announcements').insert({
        barangay,
        title:      title.trim(),
        body:       body.trim(),
        image_url:  imageUrl,
        expires_at: expiresAt.toISOString(),
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
  const daysLeft = expiresAt => {
    const diff = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}d left` : 'Expired';
  };

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
                {(loadingList || announcements.length > 0) && (
                  <div style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ padding: '12px 24px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' }}>
                      Active Announcements ({announcements.length}/10)
                    </div>
                    {loadingList ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
                    ) : (
                      announcements.map((a, i) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: i < announcements.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>

                          {/* Thumbnail */}
                          {a.image_url
                            ? <img src={a.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              </div>
                          }

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              {fmtDate(a.created_at)} · <span style={{ color: '#16a34a', fontWeight: 600 }}>{daysLeft(a.expires_at)}</span>
                            </div>
                          </div>

                          {/* Delete */}
                          <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                            style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: deletingId === a.id ? 0.5 : 1 }}>
                            {deletingId === a.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>

              {/* Chart card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Monthly Reports & Requests</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Activity over time</div>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#93c5fd', display: 'inline-block' }} />Requests</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1d4ed8', display: 'inline-block' }} />Reports</div>
                  </div>
                </div>
                {monthlyData.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f8fafc', borderRadius: 12 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>No data yet</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="requests" fill="#93c5fd" radius={[4,4,0,0]} />
                      <Bar dataKey="reports"  fill="#1d4ed8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>

            {/* RIGHT */}
            <div className="off-dash-right">

              <div className="off-dash-stats-row">
                {[
                  { label: 'Total Reports',  value: 0, accent: '#1d4ed8', iconBg: '#dbeafe', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                  { label: 'Total Requests', value: 0, accent: '#7c3aed', iconBg: '#ede9fe', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg> },
                ].map(c => (
                  <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1, borderLeft: `4px solid ${c.accent}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937', marginBottom: 4 }}>Top Community Contributors</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Most active residents in your barangay</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No contributor records yet</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
