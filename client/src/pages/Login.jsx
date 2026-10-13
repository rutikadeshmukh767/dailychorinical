import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/editor" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/editor');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form form--narrow" onSubmit={submit}>
      <h1 className="form__title">Editors&rsquo; Entrance</h1>
      <p className="form__hint">Authorised staff only.</p>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <label>
        Email
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button className="btn" disabled={busy}>
        {busy ? 'Admitting…' : 'Enter'}
      </button>
    </form>
  );
}
