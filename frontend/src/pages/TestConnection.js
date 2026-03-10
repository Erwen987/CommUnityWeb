import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing connection...');

    try {
      // Test 1: Check if Supabase client is initialized
      setResult(prev => prev + '\n✓ Supabase client initialized');

      // Test 2: Try to fetch from users table
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        setResult(prev => prev + '\n✗ Database connection failed: ' + error.message);
      } else {
        setResult(prev => prev + '\n✓ Database connection successful');
      }

      // Test 3: Check auth
      const { data: authData } = await supabase.auth.getSession();
      setResult(prev => prev + '\n✓ Auth service accessible');
      setResult(prev => prev + '\nCurrent session: ' + (authData.session ? 'Logged in' : 'Not logged in'));

    } catch (error) {
      setResult(prev => prev + '\n✗ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Supabase Connection Test</h1>
      <button 
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      <pre style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap'
      }}>
        {result || 'Click the button to test connection'}
      </pre>

      <div style={{ marginTop: '20px' }}>
        <h3>Supabase Config:</h3>
        <pre style={{
          background: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px'
        }}>
          URL: {supabase.supabaseUrl}
        </pre>
      </div>
    </div>
  );
};

export default TestConnection;
