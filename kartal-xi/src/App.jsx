import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';
import { LEAGUES, getClubsByLeague } from './data/clubs';
import './styles/global.css';

export default function App() {
  return (
    <HashRouter>
      <div className="grid-bg" />
      <div className="scanline" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:leagueId/*" element={<LeagueLayout />} />
      </Routes>
    </HashRouter>
  );
}

function LeagueLayout() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const clubs = getClubsByLeague(leagueId);
  const [activeClub, setActiveClub] = useState(clubs[0] || null);

  useEffect(() => {
    const league = LEAGUES.find(l => l.id === leagueId);
    if (!league) { navigate('/'); return; }
    setActiveClub(getClubsByLeague(leagueId)[0] || null);
  }, [leagueId]);

  if (!activeClub) return null;

  return (
    <div className="page-wrap">
      <Navbar activeClub={activeClub} onClubChange={setActiveClub} />
      <Routes>
        <Route path="" element={<Home activeClub={activeClub} setActiveClub={setActiveClub} leagueClubs={clubs} leagueId={leagueId} />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}
