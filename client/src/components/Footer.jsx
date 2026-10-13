import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="footer__rule" />
      <p className="footer__line">
        <strong>The Daily Chronicle</strong> &middot; Printed and published every morning &middot; Est. 1920
      </p>
      <p className="footer__small">
        &copy; {new Date().getFullYear()} The Daily Chronicle. All rights reserved.{' '}
        {!user && (
          <Link to="/login" className="footer__login">
            Editors&rsquo; entrance
          </Link>
        )}
      </p>
    </footer>
  );
}
