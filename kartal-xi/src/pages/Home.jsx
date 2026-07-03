import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { calcPoints, calcPickPoints } from '../lib/scoring';
import PredictorPitch from '../components/PredictorPitch';
import NextMatchCompact from '../components/NextMatchCompact';
import AuthModal from '../components/AuthModal';
import styles from './Home.module.css';

export default function Home({ activeClub, setActiveClub, leagueClubs, leagueId }) {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [officialSlots, setOfficialSlots] = useState(null);
  const [officialAnswers, setOfficialAnswers] = useState(null);
  const [players, setPlayers] = useState([]);
  const [weekPoints, setWeekPoints] = useState(null);

  // Use visibility API to prevent tab-switching from clearing state
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') { /* no-op, state preserved */ } };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMatches([]); setMatchIndex(0); setOfficialSlots(null); setOfficialAnswers(null);
    fetchMatches(); fetchPlayers();
  }, [activeClub]);

  useEffect(() => {
    if (matches.length > 0) loadMatchDetails(matches[matchIndex]);
  }, [matchIndex, matches]);

  useEffect(() => {
    if (session) fetchWeekPoints();
    else setWeekPoints(null);
  }, [session, activeClub]);

  async function fetchMatches() {
    const { data } = await supabase.from('matches').select('*')
      .eq('club_id', activeClub.id).order('match_date', { ascending: true });
    if (data && data.length > 0) {
      setMatches(data);
      const idx = data.findIndex(m => m.status === 'scheduled');
      setMatchIndex(idx >= 0 ? idx : data.length - 1);
    }
  }

  async function loadMatchDetails(match) {
    if (!match) return;
    setOfficialSlots(null); setOfficialAnswers(null);
    const { data: lineup } = await supabase.from('lineups').select('slots, best_player, first_sub_out')
      .eq('match_id', match.id).eq('status', 'official').limit(1);
    if (!lineup?.[0]) return;
    setOfficialSlots(lineup[0].slots);
    const { data: goals } = await supabase.from('goal_scorers').select('player_id, minute, sort_order')
      .eq('match_id', match.id).eq('is_opponent', false).order('sort_order').order('minute').limit(1);
    const answers = {
      best_player: lineup[0].best_player || null,
      first_sub_out: lineup[0].first_sub_out || null,
      first_goal_scorer: goals?.[0]?.player_id || null,
    };
    setOfficialAnswers(answers);
    if (session) calculateAndStorePoints(match.id, lineup[0].slots, answers);
  }

  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').eq('club_id', activeClub.id).order('jersey_number');
    setPlayers(data || []);
  }

  async function fetchWeekPoints() {
    if (!session) return;
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const { data } = await supabase.from('user_points').select('points')
      .eq('user_id', session.user.id).eq('club_id', activeClub.id).gte('calculated_at', weekAgo);
    setWeekPoints((data||[]).reduce((s,r)=>s+r.points,0));
  }

  async function calculateAndStorePoints(matchId, officialSlots, answers) {
    if (!session) return;
    const { data: pred } = await supabase.from('lineup_predictions').select('slots, picks')
      .eq('user_id', session.user.id).eq('club_id', activeClub.id).limit(1);
    if (!pred?.[0]) return;
    const { data: playerData } = await supabase.from('players').select('id, ad_soyad').eq('club_id', activeClub.id);
    const { points: lineupPts, correct } = calcPoints(pred[0].slots||{}, officialSlots, playerData||[]);
    const { pickPoints } = calcPickPoints(pred[0].picks||{}, answers, playerData||[]);
    await supabase.from('user_points').upsert({
      user_id: session.user.id, match_id: matchId, club_id: activeClub.id,
      points: lineupPts + pickPoints, correct_players: correct, calculated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' });
    fetchWeekPoints();
  }

  const currentMatch = matches[matchIndex] || null;

  return (
    <div className={styles.wrap}>
      <NextMatchCompact
        match={currentMatch} club={activeClub}
        onPrev={() => setMatchIndex(i=>Math.max(0,i-1))}
        onNext={() => setMatchIndex(i=>Math.min(matches.length-1,i+1))}
        hasPrev={matchIndex > 0} hasNext={matchIndex < matches.length-1}
      />

      {session && weekPoints !== null && (
        <div className={styles.weekPoints}>
          <div className={styles.weekInner}>
            <span className={styles.weekLabel}>this week</span>
            <span className={styles.weekPtsVal}>{weekPoints} pts</span>
          </div>
        </div>
      )}

      <PredictorPitch
        club={activeClub} session={session}
        onRequireAuth={() => setShowAuth(true)}
        officialSlots={officialSlots} officialAnswers={officialAnswers} players={players}
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
