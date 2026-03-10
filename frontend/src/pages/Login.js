import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (userError) throw userError;

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      // Show success message
      alert(`Welcome back, ${userData.first_name} ${userData.last_name}!`);

      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Poppins", system-ui, sans-serif',
      color: '#ffffff'
    }}>
      {/* NAVBAR */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '28px 60px',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#9fd0ff'
        }}>CommUnity.</div>
        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
          <a href="#about" style={{ color: '#fff', textDecoration: 'none' }}>About</a>
          <a href="#features" style={{ color: '#fff', textDecoration: 'none' }}>Features</a>
          <a href="#contact" style={{ color: '#fff', textDecoration: 'none' }}>Contact</a>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px 20px',
        minHeight: 'calc(100vh - 100px)'
      }}>
        <div style={{
          display: 'flex',
          maxWidth: '1100px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          {/* LEFT SIDE - OVERVIEW */}
          <div style={{
            flex: 1,
            padding: '60px 40px',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h2 style={{
              fontSize: '32px',
              marginBottom: '20px',
              fontWeight: 700
            }}>Welcome to CommUnity</h2>
            <p style={{
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '30px',
              opacity: 0.9
            }}>
              CommUnity helps residents connect, report issues,
              request services, and build a stronger barangay together.
            </p>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              fontSize: '16px',
              lineHeight: '2'
            }}>
              <li>✔ Report community concerns</li>
              <li>✔ Request barangay services</li>
              <li>✔ Earn rewards for participation</li>
            </ul>
          </div>

          {/* RIGHT SIDE - LOGIN FORM */}
          <div style={{
            flex: 1,
            padding: '60px 40px',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333'
          }}>
            <h2 style={{
              fontSize: '28px',
              marginBottom: '30px',
              fontWeight: 700,
              color: '#667eea',
              textAlign: 'center'
            }}>WELCOME BACK!</h2>

            {error && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '6px',
                color: '#c33',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>Email</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border 0.3s'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>Password</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border 0.3s'
                  }}
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <a href="#" style={{
                  color: '#667eea',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}>Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s',
                  marginBottom: '20px'
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

              <p style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                Don't have an account? <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>Download the mobile app to sign up</a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
