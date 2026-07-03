import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEAGUES, getClubsByLeague } from '../data/clubs';
import Home from './Home';
import styles from './LeaguePage.module.css';

export default function LeaguePage() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const league = LEAGUES.find(l => l.id === leagueId);
  const clubs = getClubsByLeague(leagueId);
  const [activeClub, setActiveClub] = useState(clubs[0] || null);

  useEffect(() => {
    if (!league) navigate('/');
    setActiveClub(clubs[0] || null);
  }, [leagueId]);

  if (!league || !activeClub) return null;

  return (
    <Home
      activeClub={activeClub}
      setActiveClub={setActiveClub}
      leagueClubs={clubs}
      leagueId={leagueId}
    />
  );
}
