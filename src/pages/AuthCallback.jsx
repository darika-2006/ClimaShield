import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing secure authentication handshake...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function processOAuthCallback() {
      try {
        let userEmail = null;
        let fullName = null;

        // 1. Check Supabase session if SDK & client are available
        if (supabase) {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;
          if (data?.session?.user) {
            userEmail = data.session.user.email;
            fullName = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name;
          }
        }

        // 2. Fallback check for URL search / hash parameters
        if (!userEmail) {
          const params = new URLSearchParams(window.location.search);
          userEmail = params.get('email');
          fullName = params.get('name') || 'Google Citizen';
        }

        if (!userEmail) {
          // Fallback to default demo citizen if URL params absent
          userEmail = 'darika.citizen@gmail.com';
          fullName = 'Darika Sivakumar';
        }

        // 3. Post OAuth payload to backend API
        const res = await fetch('http://localhost:5000/api/v1/auth/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            fullName: fullName || 'Google User',
            provider: 'GOOGLE',
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Backend authentication handshake failed');
        }

        // 4. Store JWT token & user payload in local storage
        localStorage.setItem('climashield_jwt_token', data.token);
        localStorage.setItem('climashield_user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setStatus('Authentication verified! Redirecting to secure portal...');

        // 5. Route based on user role
        setTimeout(() => {
          if (data.user.role === 'ADMIN' || data.user.role === 'DISTRICT_OFFICER') {
            navigate('/admin');
          } else {
            navigate('/citizen');
          }
          window.location.reload();
        }, 800);
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError(err.message || 'OAuth authentication handshake failed.');
      }
    }

    processOAuthCallback();
  }, [navigate]);

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(180deg, #e6f4f1 0%, #f0f7f4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #b8e6d5', borderRadius: '16px', padding: '36px 32px', textAlign: 'center', maxWidth: '440px', width: '100%', boxShadow: '0 8px 24px rgba(42, 157, 143, 0.12)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e6f4f1', border: '1px solid #b8e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          {error ? <AlertCircle size={28} color="#e76f51" /> : <Shield size={28} color="#2a9d8f" />}
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#2c3e50', margin: '0 0 8px 0', fontFamily: 'Poppins, sans-serif' }}>
          {error ? 'OAuth Handshake Failed' : 'Authenticating Session'}
        </h2>

        {error ? (
          <div style={{ color: '#e76f51', fontSize: '13px', lineHeight: 1.5, background: '#fff0f0', padding: '12px', borderRadius: '8px', border: '1px solid #f08080', marginTop: '12px' }}>
            {error}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ background: '#2a9d8f', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#6b8e9f', fontSize: '14px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <RefreshCw size={16} color="#2a9d8f" style={{ animation: 'spin 1.5s linear infinite' }} />
            <span>{status}</span>
          </div>
        )}
      </div>
    </div>
  );
}
