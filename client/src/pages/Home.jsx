import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ArticleCard from '../components/ArticleCard.jsx';
import { Loading, ErrorBox } from '../components/Status.jsx';

export default function Home() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = parseInt(params.get('page'), 10) || 1;

  const [data, setData] = useState(null);
  const [popular, setPopular] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    api
      .listArticles({ category, q, page, limit: 11 })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    window.scrollTo({ top: 0 });
    return () => {
      live = false;
    };
  }, [category, q, page]);

  useEffect(() => {
    api
      .listArticles({ sort: 'views', limit: 5 })
      .then((d) => setPopular(d.items))
      .catch(() => {});
  }, []);

  const goPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next);
  };

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading label="Setting the type…" />;

  const heading = q ? `Search: “${q}”` : category ? category : null;
  const [lead, ...rest] = data.items;
  const showLead = page === 1 && !q && lead;
  const gridItems = showLead ? rest : data.items;

  return (
    <>
      {heading && (
        <div className="section-head">
          <h1>{heading}</h1>
          <p>
            {data.total} {data.total === 1 ? 'story' : 'stories'} found
          </p>
        </div>
      )}

      {data.items.length === 0 && (
        <p className="empty">
          No stories to report here. <Link to="/">Return to the front page.</Link>
        </p>
      )}

      <div className="front">
        <div className="front__main">
          {showLead && <ArticleCard article={lead} variant="lead" />}
          <div className="columns">
            {gridItems.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>

          {data.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                &larr; Earlier
              </button>
              <span>
                Page {page} of {data.pages}
              </span>
              <button disabled={page >= data.pages} onClick={() => goPage(page + 1)}>
                Later &rarr;
              </button>
            </nav>
          )}
        </div>

        <aside className="front__side" aria-label="Most read">
          <h3 className="box-title">Most Read</h3>
          <ol className="popular">
            {popular.map((a) => (
              <li key={a._id}>
                <Link to={`/story/${a.slug}`}>{a.title}</Link>
                <span>{a.views} readers</span>
              </li>
            ))}
          </ol>

          <div className="notice">
            <p className="notice__head">Notice</p>
            <p>
              Correspondents wishing to submit reports are directed to the Editor&rsquo;s Desk. All
              contributions are considered with care.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
