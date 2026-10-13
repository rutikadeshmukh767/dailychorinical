import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="status">
      <h1 className="story__title">Page Not Found</h1>
      <p>
        The page you seek has gone missing from our archive. <Link to="/">Return to the Front Page.</Link>
      </p>
    </div>
  );
}
