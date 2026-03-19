import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { clearAuth, getStoredUser, setAuth } from '../lib/auth.js';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ManagerDashboard } from './pages/ManagerDashboard.jsx';
import { EmployeeDashboard } from './pages/EmployeeDashboard.jsx';

function useAuth() {
  const [user, setUser] = React.useState(() => getStoredUser());
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user && res.data?.token) {
        setAuth(res.data.token, res.data.user);
        setUser(res.data.user);
      } else {
        clearAuth();
        setUser(null);
      }
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = React.useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return { user, loading, refresh, logout };
}

function Layout({ user, onLogout, children }) {
  return (
    <div className="container">
      <div className="nav">
        <div className="brand">
          <b>Duty Scheduling</b>
          {user ? <span className="pill">{user.login}</span> : <span className="pill">Guest</span>}
          {user?.role ? <span className="pill">{user.role}</span> : null}
          {user && !user.approvedAt ? <span className="pill">pending approval</span> : null}
        </div>
        <div className="row">
          {user ? (
            <button className="danger" onClick={onLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function RequireAuth({ user, loading, children }) {
  const loc = useLocation();
  if (loading) return <div className="card">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export function App() {
  const { user, loading, logout, refresh } = useAuth();

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/login" element={<LoginPage onAuthed={refresh} />} />
        <Route path="/register" element={<RegisterPage onAuthed={refresh} />} />
        <Route
          path="/"
          element={
            <RequireAuth user={user} loading={loading}>
              {user?.role === 'manager' ? (
                <ManagerDashboard />
              ) : user?.role === 'employee' ? (
                <EmployeeDashboard />
              ) : (
                <div className="card">
                  <h2>Pending approval</h2>
                  <div className="muted">A manager must approve your account to assign the employee role.</div>
                </div>
              )}
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

