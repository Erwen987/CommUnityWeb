import React, { useEffect, useState, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const STATUS_COLORS = {
  reviewing:        { bg: '#fef3c7', color: '#92400e' },
  processing:       { bg: '#dbeafe', color: '#1e40af' },
  ready_for_pickup: { bg: '#ede9fe', color: '#6d28d9' },
  released:         { bg: '#dcfce7', color: '#166534' },
  rejected:         { bg: '#fee2e2', color: '#991b1b' },
};

function Requests() {
  const { barangay, loading: profileLoading } = useOfficialProfile();
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');

  const fetchRequests = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('barangay', barangay)
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [barangay]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('requests').update({ status }).eq('id', id);
    setUpdatingId(null);
    fetchRequests();
  };

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search ||
      r.document_type?.toLowerCase().includes(search.toLowerCase()) ||
      r.reference_number?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (status) => requests.filter(r => r.status === status).length;

  const stats = [
    { label: 'Total Requests',   value: requests.length },
    { label: 'Reviewing',        value: count('reviewing') },
    { label: 'Processing',       value: count('processing') },
    { label: 'Ready for Pickup', value: count('ready_for_pickup') },
    { label: 'Released',         value: count('released') },
  ];

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar badge />
        <div className="off-content">

          <h1 className="off-page-title">Requests</h1>
          <p className="off-page-sub">
            {!profileLoading && barangay ? `Showing document requests for ${barangay}` : 'Monitor and manage barangay document requests.'}
          </p>

          {/* Stat cards */}
          <div className="off-stats-row off-stats-row-5">
            {stats.map(s => (
              <div key={s.label} className="off-stat-card">
                <h4>{s.label}</h4>
                <div className="off-stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Requests table */}
          <div className="off-card">
            <h3 className="off-card-title">Requests List</h3>
            <div className="off-table-header">
              <input
                className="off-table-search"
                type="text"
                placeholder="Search by document or reference no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="off-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="reviewing">Reviewing</option>
                <option value="processing">Processing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="released">Released</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <table className="off-table">
              <thead>
                <tr>
                  <th>Ref No.</th>
                  <th>Document</th>
                  <th>Purpose</th>
                  <th>Payment</th>
                  <th>Proof</th>
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
                      No requests found for {barangay || 'your barangay'}.
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const s = STATUS_COLORS[r.status] || STATUS_COLORS.reviewing;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.reference_number}</td>
                      <td style={{ fontWeight: 600 }}>{r.document_type}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>
                        {r.purpose}
                      </td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>
                        {r.payment_method?.replace('_', ' ')}
                      </td>
                      <td>
                        {r.proof_url ? (
                          <a href={r.proof_url} target="_blank" rel="noreferrer"
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
                          {r.status?.replace(/_/g, ' ')}
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
                          <option value="reviewing">Reviewing</option>
                          <option value="processing">Processing</option>
                          <option value="ready_for_pickup">Ready for Pickup</option>
                          <option value="released">Released</option>
                          <option value="rejected">Rejected</option>
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

export default Requests;
