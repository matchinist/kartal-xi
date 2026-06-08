import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './styles/global.css';

function Placeholder({ name }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '11px', letterSpacing: '2px' }}>
      // {name.toUpperCase()} — coming soon
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="grid-bg" />
      <div className="scanline" />
      <div className="page-wrap">
        <Navbar />
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/matches"   element={<Placeholder name="Matches" />} />
          <Route path="/players"   element={<Placeholder name="Players" />} />
          <Route path="/standings" element={<Placeholder name="Standings" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
