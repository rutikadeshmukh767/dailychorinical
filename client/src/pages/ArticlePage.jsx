import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox, Loading } from '../components/Status.jsx';

export default function ArticlePage() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setA(null);
    setError('');
    api
      .article(slug)
      .then((d) => {
        if (live) {
          setA(d);
          document.title = `${d.title} — The Daily Chronicle`;
        }
      })
      .catch((e) => live && setError(e.message));
    window.scrollTo({ top: 0 });
    return () => {
      live = false;
      document.title = 'The Daily Chronicle';
    };
  }, [slug]);

  if (error) return <ErrorBox message={error} />;
  if (!a) return <Loading label="Fetching the story…" />;

  const paragraphs = a.body.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="story">
      <p className="kicker kicker--center">
        <Link to={`/section/${a.category}`}>{a.category}</Link>
      </p>
      <h1 className="story__title">{a.title}</h1>
      {a.subtitle && <p className="story__sub">{a.subtitle}</p>}
      <p className="byline byline--center">
        {a.byline} &middot;{' '}
        <time dateTime={a.createdAt}>
          {new Date(a.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </p>
      {a.image && <img className="story__img" src={a.image} alt="" />}
      <div className="story__body">
        {paragraphs.map((para, i) => (
          <p key={i} className={i === 0 ? 'first' : undefined}>
            {i === 0 && a.dateline ? <span className="dateline">{a.dateline} &mdash; </span> : null}
            {para}
          </p>
        ))}
      </div>
      <p className="story__end">&#10086;</p>
      <p className="story__back">
        <Link to="/">&larr; Back to the Front Page</Link>
      </p>
    </article>
  );
}
