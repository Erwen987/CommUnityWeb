import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DebugLogin = () => {
  const [email, setEmail] = useState('pandahuntergamer09@gmail.com');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const testLogin = async () => {
    setLogs([]);
    setLoading(true);
    addLog('Starting login test...');

    try {
      // Step 1: Check if user exists in auth
      addLog(`Attempting to sign in with: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        addLog(`❌ Auth Error: ${error.message}`, 'error');
        addLog(`Error Code: ${error.status}`, 'error');
        setLoading(false);
        return;
      }

      addLog('✅ Authentication successful!', 'success');
      addLog(`User ID: ${data.user.id}`, 'success');
      addLog(`Email: ${data.user.email}`, 'success');

      // Step 2: Check if user profile exists
      addLog('Checking user profile in database...');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (userError) {
        addLog(`❌ Profile Error: ${userError.message}`, 'error');
        addLog('User authenticated but no profile found!', 'error');
        setLoading(false);
        return;
      }

      addLog('✅ User profile found!', 'success');
      addLog(`Name: ${userData.first_name} ${userData.last_name}`, 'success');
      addLog(`Role: ${userData.role || 'resident'}`, 'success');
      addLog(`Barangay: ${userData.barangay}`, 'success');

      // Step 3: Success
      addLog('🎉 Login successful! All checks passed.', 'success');

    } catch (error) {
      addLog(`❌ Unexpected Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserExists = async () => {
    setLogs([]);
    addLog('Checking if user exists in database...');

    try {
      // Check in users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

      if (error) {
        addLog(`❌ Database Error: ${error.message}`, 'error');
        return;
      }

      if (data && data.length > 0) {
        addLog(`✅ Found ${data.length} user(s) with this email`, 'success');
        data.forEach((user, index) => {
          addLog(`User ${index + 1}:`, 'info');
          addLog(`  - Name: ${user.first_name} ${user.last_name}`, 'info');
          addLog(`  - Auth ID: ${user.auth_id}`, 'info');
          addLog(`  - Role: ${user.role || 'resident'}`, 'info');
          addLog(`  - Barangay: ${user.barangay}`, 'info');
        });
      } else {
        addLog('❌ No user found with this email', 'error');
        addLog('Please sign up in the mobile app first!', 'error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔍 Debug Login</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
        <input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '14px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
        <input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={checkIfUserExists}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Check if User Exists
        </button>

        <button 
          onClick={testLogin}
          disabled={loading || !password}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            background: loading || !password ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>

      <div style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '300px',
        maxHeight: '500px',
        overflow: 'auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#4CAF50' }}>Console Log:</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#888' }}>No logs yet. Click a button to start testing.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '8px',
              color: log.type === 'error' ? '#f44336' : log.type === 'success' ? '#4CAF50' : '#d4d4d4'
            }}>
              <span style={{ color: '#888' }}>[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>💡 Instructions:</h4>
        <ol style={{ marginBottom: 0 }}>
          <li>First, click "Check if User Exists" to see if your account is in the database</li>
          <li>If user exists, enter your password and click "Test Login"</li>
          <li>If user doesn't exist, sign up in the mobile app first</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugLogin;
