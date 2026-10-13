import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, ArrowRight, Building, Key, AlertCircle, Phone, MapPin, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('SIGN_IN'); // 'SIGN_IN' or 'SIGN_UP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign-Up state
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    homeDistrict: 'Chennai',
  });

  const handleGoogleOAuthLogin = async () => {
    setError('');
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error('OAuth Initiation Error:', err);
      setError(err.message || 'Failed to initiate Google OAuth redirection.');
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      redirectUser(loggedUser);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signUpData.fullName,
          email: signUpData.email,
          password: signUpData.password,
          phone: signUpData.phone,
          homeDistrict: signUpData.homeDistrict,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      localStorage.setItem('climashield_jwt_token', data.token);
      localStorage.setItem('climashield_user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/citizen');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (personaEmail) => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await demoLogin(personaEmail);
      redirectUser(loggedUser);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (userObj) => {
    if (userObj.role === 'ADMIN' || userObj.role === 'DISTRICT_OFFICER') {
      navigate('/admin');
    } else {
      navigate('/citizen');
    }
  };

  const personas = [
    {
      role: 'ADMIN',
      name: 'System SuperAdmin',
      email: 'admin@climashield.tn',
      district: 'Statewide HQ',
      desc: 'Full system control, shelter capacity overrides, broadcast dispatcher.',
      bg: '#e8f4f8',
      border: '#a8dadc',
      badgeColor: '#457b9d',
    },
    {
      role: 'DISTRICT_OFFICER',
      name: 'Officer (Chennai)',
      email: 'officer.chennai@tnsdma.gov.in',
      district: 'Chennai',
      desc: 'Disaster Command Center, Incident Moderation, Evacuation Ops.',
      bg: '#e6f4f1',
      border: '#b8e6d5',
      badgeColor: '#2a9d8f',
    },
    {
      role: 'DISTRICT_OFFICER',
      name: 'Officer (Thoothukudi)',
      email: 'officer.thoothukudi@tnsdma.gov.in',
      district: 'Thoothukudi',
      desc: 'Coastal Protection Command, Coastal Shelter & Risk Management.',
      bg: '#e6f4f1',
      border: '#b8e6d5',
      badgeColor: '#2a9d8f',
    },
    {
      role: 'CITIZEN',
      name: 'Darika (Citizen)',
      email: 'darika.citizen@gmail.com',
      district: 'Thoothukudi (9.1724, 77.8690)',
      desc: 'Home auto-locked, Risk score, Nearest shelter routing, Incident reporting.',
      bg: '#fffdf0',
      border: '#ffd97d',
      badgeColor: '#f4a261',
    },
    {
      role: 'CITIZEN',
      name: 'Anand (Citizen)',
      email: 'anand.citizen@gmail.com',
      district: 'Chennai (12.9815, 80.2180)',
      desc: 'Urban risk score, Shelter navigation, Verified community alerts.',
      bg: '#fffdf0',
      border: '#ffd97d',
      badgeColor: '#f4a261',
    },
  ];

  const tnDistricts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli',
    'Salem', 'Tirunelveli', 'Thoothukudi', 'Cuddalore'
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(180deg, #e6f4f1 0%, #f0f7f4 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(42, 157, 143, 0.12)', border: '1px solid #b8e6d5', color: '#2a9d8f', padding: '8px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>
            <Shield size={18} color="#2a9d8f" /> STATE DISASTER MANAGEMENT AUTHORIZATION
          </div>
          <h1 style={{ fontSize: '32px', color: '#2c3e50', margin: '0 0 8px 0', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
            ClimaShield TN Enterprise Portal
          </h1>
          <p style={{ color: '#6b8e9f', fontSize: '15px', margin: 0 }}>
            Role-Based Access Control (RBAC) & Authenticated Operations Portal
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr', gap: '32px' }}>
          {/* Direct Login / Registration Form */}
          <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
            {/* Segmented Toggle Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('SIGN_IN'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: authMode === 'SIGN_IN' ? '2px solid #0d9488' : 'none',
                  color: authMode === 'SIGN_IN' ? '#0d9488' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('SIGN_UP'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: authMode === 'SIGN_UP' ? '2px solid #0d9488' : 'none',
                  color: authMode === 'SIGN_UP' ? '#0d9488' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Create Citizen Account
              </button>
            </div>

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #f08080', color: '#e76f51', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuthLogin}
              className="oauth-google-button"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
              Continue with Google Workspace (OAuth 2.0)
            </button>

            <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
              <hr style={{ border: 'none', borderTop: '1px solid #e8f4f8' }} />
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ffffff', padding: '0 10px', color: '#6b8e9f', fontSize: '11px', fontWeight: '600' }}>
                OR {authMode === 'SIGN_IN' ? 'EMAIL LOGIN' : 'DIRECT REGISTER'}
              </span>
            </div>

            {authMode === 'SIGN_IN' ? (
              /* Sign In Form */
              <form onSubmit={handleCustomLogin}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '6px' }}>
                    User Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#6b8e9f" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                    <input
                      type="email"
                      required
                      placeholder="name@climashield.tn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '6px' }}>
                    Account Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#6b8e9f" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(42, 157, 143, 0.3)',
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* Create Citizen Account Form */
              <form onSubmit={handleSignUpSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    Full Legal Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#6b8e9f" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#6b8e9f" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                    <input
                      type="email"
                      required
                      placeholder="ramesh@gmail.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                      Home District
                    </label>
                    <select
                      value={signUpData.homeDistrict}
                      onChange={(e) => setSignUpData({ ...signUpData, homeDistrict: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #a8dadc', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fffe', color: '#2c3e50', outline: 'none' }}
                    >
                      {tnDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #0d9488, #2a9d8f)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  {loading ? 'Creating Account...' : 'Register Citizen Account'} <UserPlus size={18} />
                </button>
              </form>
            )}
          </div>

          {/* Demo Persona Quick-Fill Panel */}
          <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.08)' }}>
            <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Building size={20} color="#2a9d8f" /> Pre-Seeded Personas Quick-Fill
              </h2>
              <span style={{ background: '#e8f4f8', color: '#2a9d8f', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', border: '1px solid #a8dadc' }}>
                5 Personas Ready
              </span>
            </div>
            <p style={{ color: '#6b8e9f', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Click any pre-seeded persona below to auto-authenticate and test role-specific RBAC workflows:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {personas.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleDemoSelect(p.email)}
                  style={{
                    background: p.bg,
                    border: `1px solid ${p.border}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#2c3e50' }}>{p.name}</span>
                    <span style={{ background: p.badgeColor, color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      {p.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#2c3e50', fontWeight: '500', marginBottom: '4px' }}>
                    {p.email} • <em>{p.district}</em>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b8e9f' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
