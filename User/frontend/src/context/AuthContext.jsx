import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const sessionVersion = useRef(0);

  useEffect(() => {
    const checkAuth = async () => {
      const versionAtStart = sessionVersion.current;
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authAPI.getCurrentUser();
          if (versionAtStart !== sessionVersion.current) return;
          setToken(storedToken);
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch {
          if (versionAtStart !== sessionVersion.current) return;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } else {
        if (versionAtStart !== sessionVersion.current) return;
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      if (versionAtStart === sessionVersion.current) setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, user: userData } = response.data;

      sessionVersion.current += 1;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      setLoading(false);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail;
      return {
        success: false,
        error: message || (error.code === 'ERR_NETWORK'
          ? 'Cannot reach the login server. Start the User backend and open the User app URL printed by the launcher.'
          : error.message || 'Login failed. Please check your credentials and try again.')
      };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = () => {
    sessionVersion.current += 1;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
