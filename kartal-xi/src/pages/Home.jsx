import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { nextMatch as mockNextMatch, seasonStats, recentMatches, topScorers } from '../data/mockData';
import StatBar from '../components/StatBar';
import NextMatch from '../components/NextMatch';
import RecentMatches from '../components/RecentMatches';
import LineupDisplay from '../components/LineupDisplay';
import StandingsTable from '../components/StandingsTable';
import SectionLabel from '../components/SectionLabel';
import styles from './Home.module.css';

export default function Home() {
  const [lineup, setLineup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [liveStandings, setLiveStandings] = useState([]);

  useEffect(() => {
    fetchNextMatch();
    fetchPlayers();
    fetchStandings();
  }, []);

  async function fetchNextMatch() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .order('match_date', { ascending: true })
      .limit(1)
      .single();
    if (data) {
      setNextMatch({ home_team: data.home_team, away_team: data.away_team, stadium: data.stadium || 'TBA', tournament: data.tournament, match_date: data.match_date });
      fetchLineup(data.id);
    }
  }

  async function fetchLineup(matchId) {
    const { data } = await supabase.from('lineups').select('*').eq('match_id', matchId).limit(1);
    if (data?.[0]) setLineup(data[0]);
  }

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('ad_soyad');
    if (data && data.length > 0) setPlayers(data);
  }

  async function fetchStandings() {
    const { data } = await supabase.from('standings').select('*').eq('league', 'Super Lig').order('pos');
    if (data && data.length > 0) setLiveStandings(data);
  }

  const match = nextMatch || mockNextMatch;
  const standingsData = liveStandings;

  return (
    <>
      <StatBar stats={seasonStats} />

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <SectionLabel>Son Maclar</SectionLabel>
          <RecentMatches matches={recentMatches} />
          <SectionLabel>Super Lig Puan Tablosu</SectionLabel>
          <StandingsTable standings={standingsData} />
        </div>

        <div className={styles.sidebar}>
          <SectionLabel tag="Canli sayac" dot>Sonraki Mac</SectionLabel>
          <NextMatch match={match} />
          {lineup && players.length > 0 && (
            <LineupDisplay lineup={lineup} players={players} />
          )}
          <div className={styles.secLabel}>En Cok Gol</div>
          {topScorers.map((s) => (
            <div className={styles.scorerRow} key={s.rank}>
              <div className={styles.rank}>{s.rank}</div>
              <div className={styles.info}>
                <div className={styles.name}>{s.name}</div>
                <div className={styles.pos}>{s.pos}</div>
              </div>
              <div className={styles.goals}>{s.goals}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <div>KARTAL STATS · <span className={styles.red}>Besiktas JK</span> · 2025-26</div>
        <div>Veriler manuel guncellenir</div>
      </footer>
    </>
  );
}
