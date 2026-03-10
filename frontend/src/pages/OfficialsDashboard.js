import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const OfficialsDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (!profile || (profile.role !== 'official' && profile.role !== 'admin')) {
        alert('Access denied. This dashboard is for officials only.');
        navigate('/');
        return;
      }

      setUser(profile);
      loadData();
    } catch (error) {
      navigate('/login');
    }
  };

  const loadData = async () => {
    try {
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      setReports(reportsData || []);

      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: '250px',
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        {/* Brand */}
        <div style={{
          padding: '30px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>🏘️</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>CommUnity</span>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          <a href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px 25px',
            color: 'white',
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.1)',
            borderLeft: '4px solid white'
          }}>
            <span style={{ fontSize: '20px' }}>🏠</span>
            <span>Home</span>
          </a>

          <a href="/dashboard?tab=reports" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px 25px',
            color: 'white',
            textDecoration: 'none',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <span>Reports</span>
          </a>

          <a href="/dashboard?tab=requests" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px 25px',
            color: 'white',
            textDecoration: 'none',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '20px' }}>📝</span>
            <span>Requests</span>
          </a>

          <a href="/dashboard?tab=analytics" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px 25px',
            color: 'white',
            textDecoration: 'none',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <span>Analytics</span>
          </a>

          <a href="/dashboard?tab=rewards" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '15px 25px',
            color: 'white',
            textDecoration: 'none',
            opacity: 0.8
          }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <span>Reward</span>
          </a>
        </nav>

        {/* Logout */}
        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: '250px', flex: 1, padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 10px 0' }}>
            Hello, Barangay Officials 👋
          </h1>
          <p style={{ color: '#666', margin: 0 }}>Here's what's happening in your barangay today.</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>Total Reports</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{reports.length}</p>
          </div>

          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>Total Requests</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{requests.length}</p>
          </div>
        </div>

        {/* Announcement Section */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>Barangay Announcement</h2>
          <textarea
            placeholder="Write an announcement for barangay residents..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '15px'
            }}
          />
          <button style={{
            padding: '10px 24px',
            background: '#1e3a8a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Publish Announcement
          </button>
        </div>

        {/* Monthly Reports and Requests */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Monthly Reports and Requests</h2>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" name="view" defaultChecked />
              <span>Requests</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" name="view" />
              <span>Reports</span>
            </label>
          </div>

          {reports.length === 0 && requests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>No available records yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 5).map(report => (
                    <tr key={report.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{report.title || 'Untitled'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '12px'
                        }}>
                          {report.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#666' }}>
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Community Contributors */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginTop: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>Top Community Contributors</h2>
          <p style={{ color: '#999' }}>No contributor records yet.</p>
        </div>
      </main>
    </div>
  );
};

export default OfficialsDashboard;
