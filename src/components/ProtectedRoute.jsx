import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#6b8e9f' }}>
        <p>Verifying Security Credentials & Session Token...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '36px', background: '#fff5f5', border: '1px solid #f08080', borderRadius: '16px', boxShadow: '0 8px 24px rgba(231, 111, 81, 0.1)', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#e76f51" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#e76f51', margin: '0 0 12px 0', fontFamily: 'Poppins, sans-serif' }}>403 FORBIDDEN - ACCESS RESTRICTED</h2>
        <p style={{ color: '#2c3e50', fontSize: '14px', lineHeight: '1.6' }}>
          Your active account role (<strong>{user?.role}</strong>) does not have authorization clearance for this administrative command module.
        </p>
        <div style={{ marginTop: '24px' }}>
          <a
            href="/citizen"
            style={{ display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #00bfa6, #2a9d8f)', color: '#fff', textDecoration: 'none', borderRadius: '24px', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 16px rgba(42, 157, 143, 0.3)' }}
          >
            Return to Citizen Safety Hub
          </a>
        </div>
      </div>
    );
  }

  return children;
}
