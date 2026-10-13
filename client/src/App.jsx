import { Route, Routes } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Masthead from './components/Masthead.jsx';
import Admin from './pages/Admin.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="paper">
      <Masthead />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/section/:category" element={<Home />} />
          <Route path="/story/:slug" element={<ArticlePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/editor/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
