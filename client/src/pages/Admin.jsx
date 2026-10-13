import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { shortDate } from '../components/ArticleCard.jsx';
import { ErrorBox, Loading } from '../components/Status.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = ['World', 'Politics', 'Business', 'Sports', 'Society', 'Science', 'Opinion'];

export default function Admin() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="new" element={<Editor />} />
      <Route path="edit/:id" element={<Editor />} />
    </Routes>
  );
}

function Dashboard() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .adminList()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const remove = async (a) => {
    if (!window.confirm(`Strike "${a.title}" from the record?`)) return;
    try {
      await api.remove(a._id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section>
      <div className="section-head section-head--row">
        <h1>Editor&rsquo;s Desk</h1>
        <Link className="btn" to="/editor/new">
          + New Story
        </Link>
      </div>
      {error && <ErrorBox message={error} />}
      {!items && !error && <Loading />}
      {items && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Section</th>
                <th>Status</th>
                <th>Filed</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td data-label="Headline">
                    <Link to={`/story/${a.slug}`}>{a.title}</Link>
                    {a.featured && <span className="tag">Lead</span>}
                  </td>
                  <td data-label="Section">{a.category}</td>
                  <td data-label="Status">{a.published ? 'Published' : 'Draft'}</td>
                  <td data-label="Filed">{shortDate(a.createdAt)}</td>
                  <td className="table__actions">
                    <Link to={`/editor/edit/${a._id}`}>Edit</Link>
                    <button type="button" className="linklike linklike--danger" onClick={() => remove(a)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const EMPTY = {
  title: '',
  subtitle: '',
  byline: 'Staff Correspondent',
  dateline: '',
  category: 'World',
  excerpt: '',
  body: '',
  image: '',
  featured: false,
  published: true,
};

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .adminGet(id)
      .then((a) => setForm({ ...EMPTY, ...a }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (id) await api.update(id, form);
      else await api.create(form);
      navigate('/editor');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <form className="form" onSubmit={submit}>
      <h1 className="form__title">{id ? 'Amend Story' : 'File a New Story'}</h1>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <label>
        Headline
        <input required maxLength={160} value={form.title} onChange={set('title')} />
      </label>
      <label>
        Sub-headline
        <input maxLength={240} value={form.subtitle} onChange={set('subtitle')} />
      </label>
      <div className="form__row">
        <label>
          Section
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Byline
          <input maxLength={80} value={form.byline} onChange={set('byline')} />
        </label>
        <label>
          Dateline
          <input maxLength={60} placeholder="e.g. THE CITY" value={form.dateline} onChange={set('dateline')} />
        </label>
      </div>
      <label>
        Image URL (optional)
        <input type="url" placeholder="https://…" value={form.image} onChange={set('image')} />
      </label>
      <label>
        Summary (optional — auto-generated if blank)
        <textarea rows={2} maxLength={320} value={form.excerpt} onChange={set('excerpt')} />
      </label>
      <label>
        Story text <small>(separate paragraphs with a blank line)</small>
        <textarea required rows={14} value={form.body} onChange={set('body')} />
      </label>
      <div className="form__checks">
        <label className="check">
          <input type="checkbox" checked={form.published} onChange={set('published')} /> Published
        </label>
        <label className="check">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Mark as lead story
        </label>
      </div>
      <div className="form__actions">
        <button className="btn" disabled={busy}>
          {busy ? 'Sending to press…' : id ? 'Save changes' : 'Publish'}
        </button>
        <Link className="btn btn--ghost" to="/editor">
          Cancel
        </Link>
      </div>
    </form>
  );
}
