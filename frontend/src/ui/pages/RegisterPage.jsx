import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { setAuth } from '../../lib/auth.js';

export function RegisterPage({ onAuthed }) {
  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [err, setErr] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.post('/auth/register', { login, password, displayName: displayName || undefined });
      setAuth(res.data.token, res.data.user);
      onAuthed?.();
      window.location.href = '/';
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={submit} className="row">
        <input placeholder="login" value={login} onChange={(e) => setLogin(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input placeholder="display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <button className="primary" type="submit">
          Create account
        </button>
      </form>
      {err ? <div style={{ marginTop: 10, color: 'var(--danger)' }}>{err}</div> : null}
      <div style={{ marginTop: 12 }} className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}

