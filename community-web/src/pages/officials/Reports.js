import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const STATUS_COLORS = {
  pending:     { bg: '#fef3c7', color: '#92400e' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  resolved:    { bg: '#dcfce7', color: '#166534' },
};

function Reports() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');

  const fetchReports = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('barangay', barangay)
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
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: 13 }}>
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
  );
}

export default Reports;
