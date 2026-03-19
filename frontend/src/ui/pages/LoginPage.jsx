import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, API_URL } from '../../lib/api.js';
import { setAuth } from '../../lib/auth.js';

export function LoginPage({ onAuthed }) {
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [params] = useSearchParams();

  React.useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      api.get('/auth/me').then((r) => {
        if (r.data?.user && r.data?.token) setAuth(r.data.token, r.data.user);
        onAuthed?.();
        window.location.href = '/';
      });
    }
  }, [params, onAuthed]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/login', { login, password });
      setAuth(res.data.token, res.data.user);
      onAuthed?.();
      window.location.href = '/';
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={submit} className="row">
          <input placeholder="login" value={login} onChange={(e) => setLogin(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="primary" type="submit">
            Sign in
          </button>
        </form>
        {err ? <div style={{ marginTop: 10, color: 'var(--danger)' }}>{err}</div> : null}
        <div style={{ marginTop: 12 }} className="muted">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>

      <div className="card">
        <h2>Google OAuth</h2>
        <div className="muted">If configured, you can sign in via Google.</div>
        <div style={{ marginTop: 12 }}>
          <a className="pill" href={`${API_URL}/api/auth/google`}>
            Continue with Google
          </a>
        </div>
        <div style={{ marginTop: 12 }} className="muted">
          Manager account exists by default: <span className="badge ok">manager / 12345</span>
        </div>
      </div>
    </div>
  );
}

