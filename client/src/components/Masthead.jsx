import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const FALLBACK = ['World', 'Politics', 'Business', 'Sports', 'Society', 'Science', 'Opinion'];

const longDate = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function Masthead() {
  const [cats, setCats] = useState(FALLBACK);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .categories()
      .then((list) => setCats(list.map((c) => c.name)))
      .catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  return (
    <header className="masthead">
      <div className="masthead__ears">
        <div className="ear">
          <span className="ear__label">Weather</span>
          <span>Fair &amp; mild; light winds from the west</span>
        </div>
        <div className="ear ear--right">
          <span className="ear__label">Price</span>
          <span>Two Cents</span>
        </div>
      </div>

      <div className="masthead__meta">
        <span>Vol. C &middot; No. 1,920</span>
        <span className="masthead__motto">&ldquo;All the News That&rsquo;s Fit to Print&rdquo;</span>
        <span className="masthead__date">{longDate()}</span>
      </div>

      <Link to="/" className="masthead__title" onClick={() => setOpen(false)}>
        The Daily Chronicle
      </Link>
      <div className="masthead__est">
        <span>Established</span>
        <strong>1920</strong>
        <span>Morning Edition</span>
      </div>

      <div className="navbar">
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="sections"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Sections'}
        </button>

        <nav id="sections" className={`navbar__links ${open ? 'is-open' : ''}`} aria-label="Sections">
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Front Page
          </NavLink>
          {cats.map((c) => (
            <NavLink key={c} to={`/section/${c}`} onClick={() => setOpen(false)}>
              {c}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/editor" onClick={() => setOpen(false)}>
                Editor&rsquo;s Desk
              </NavLink>
              <button type="button" className="linklike" onClick={logout}>
                Sign out
              </button>
            </>
          ) : null}
        </nav>

        <form className="navbar__search" role="search" onSubmit={submit}>
          <label className="sr-only" htmlFor="q">
            Search the archive
          </label>
          <input
            id="q"
            type="search"
            placeholder="Search the archive…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
    </header>
  );
}
