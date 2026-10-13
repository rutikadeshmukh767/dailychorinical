import { Link } from 'react-router-dom';

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** variant: 'lead' | 'standard' | 'brief' */
export default function ArticleCard({ article, variant = 'standard' }) {
  const a = article;
  return (
    <article className={`card card--${variant}`}>
      <p className="kicker">
        <Link to={`/section/${a.category}`}>{a.category}</Link>
      </p>
      <h2 className="card__title">
        <Link to={`/story/${a.slug}`}>{a.title}</Link>
      </h2>
      {variant !== 'brief' && a.subtitle ? <p className="card__sub">{a.subtitle}</p> : null}
      <p className="byline">
        {a.byline} &middot; <time dateTime={a.createdAt}>{shortDate(a.createdAt)}</time>
      </p>
      {variant !== 'brief' && a.image ? (
        <img className="card__img" src={a.image} alt="" loading="lazy" />
      ) : null}
      {variant !== 'brief' && a.excerpt ? (
        <p className="card__excerpt dropcap-lite">
          {a.dateline ? <span className="dateline">{a.dateline} &mdash; </span> : null}
          {a.excerpt}
        </p>
      ) : null}
      {variant !== 'brief' ? (
        <Link className="readmore" to={`/story/${a.slug}`}>
          Continue reading &rarr;
        </Link>
      ) : null}
    </article>
  );
}
