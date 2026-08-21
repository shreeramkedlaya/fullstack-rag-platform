import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../http';

type User = {
  email: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const exp = localStorage.getItem('access_exp');

    // If there is no token trace at all, they are definitely logged out.
    // If it exists but is expired, let the interceptor handle the refresh!
    if (!exp) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/auth/me/`);
      setUser(response.data.user);
    } catch (err) {
      // Not authenticated
      setUser(null);
      localStorage.removeItem('access_exp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up a global interceptor to catch expired sessions or invalid tokens automatically
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // The backend rejected the request (session expired or token invalid!)
          setUser(null);
          localStorage.removeItem('access_exp');

          // Fire a background request to the backend to explicitly delete the HttpOnly cookies
          axios.post(`/auth/logout/`).catch(() => { });

          // Force redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Check for an active session/token on mount
    fetchUser();

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const logout = async () => {
    try {
      // The transaction_id is in the HttpOnly cookie, so we don't need to send it in the body!
      await axios.post(`/auth/logout/`);
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      localStorage.removeItem('access_exp');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
