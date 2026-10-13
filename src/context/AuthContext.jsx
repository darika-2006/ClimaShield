import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:5000/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('climashield_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('climashield_jwt_token') || null;
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('climashield_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('climashield_jwt_token', data.token);
    localStorage.setItem('climashield_user', JSON.stringify(data.user));
    return data.user;
  };

  const demoLogin = async (personaEmail) => {
    // Demo passwords corresponding to seedData.js
    let password = 'CitizenPass123';
    if (personaEmail.includes('admin')) {
      password = 'AdminPassword123';
    } else if (personaEmail.includes('officer')) {
      password = 'OfficerPass123';
    }
    return login(personaEmail, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('climashield_jwt_token');
    localStorage.removeItem('climashield_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isOfficer: user?.role === 'DISTRICT_OFFICER' || user?.role === 'ADMIN',
        isCitizen: user?.role === 'CITIZEN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
