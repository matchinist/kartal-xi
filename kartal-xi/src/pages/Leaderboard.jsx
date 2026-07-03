import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CLUBS, getClubsByLeague } from '../data/clubs';
import styles from './Leaderboard.module.css';

const FAKE_USERS = {
  'manchester-united': [
    { username:'RedDevil99',   points:210, topClub:'manchester-united' },
    { username:'OldTrafford',  points:190, topClub:'manchester-united' },
    { username:'UTD_Fanatic',  points:175, topClub:'manchester-united' },
    { username:'Glazer_Out',   points:160, topClub:'manchester-united' },
    { username:'SirAlex_Fan',  points:145, topClub:'manchester-united' },
    { username:'Stretford_End',points:130, topClub:'manchester-united' },
    { username:'MaguireWall',  points:115, topClub:'manchester-united' },
    { username:'BrunoFan',     points:100, topClub:'manchester-united' },
    { username:'MainooMid',    points: 85, topClub:'manchester-united' },
    { username:'OnanaGK',      points: 70, topClub:'manchester-united' },
  ],
  superlig: [
    { username:'KaraKartal',   points:220, topClub:'besiktas' },
    { username:'FBTaraftar',   points:200, topClub:'fenerbahce' },
    { username:'GalataStar',   points:185, topClub:'galatasaray' },
    { username:'BJK1903',      points:170, topClub:'besiktas' },
    { username:'Fener1907',    points:155, topClub:'fenerbahce' },
    { username:'CimBom',       points:140, topClub:'galatasaray' },
    { username:'Vodafone_Park',points:125, topClub:'besiktas' },
    { username:'Ulker_Stad',   points:110, topClub:'fenerbahce' },
    { username:'RAMS_Park',    points: 95, topClub:'galatasaray' },
    { username:'SuperLig_Fan', points: 80, topClub:'besiktas' },
  ],
};

export default function Leaderboard() {
  const { leagueId } = useParams();
  const leagueClubs = getClubsByLeague(leagueId);
  const clubIds = leagueClubs.map(c => c.id);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const CLUB_MAP = Object.fromEntries(CLUBS.map(c => [c.id, c]));

  useEffect(() => { fetchLeaderboard(); }, [leagueId]);

  async function fetchLeaderboard() {
    setLoading(true);
    const { data: pts } = await supabase.from('user_points').select('user_id, points, club_id').in('club_id', clubIds);

    const byUser = {};
    (pts||[]).forEach(r => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { total:0, clubs:{} };
      byUser[r.user_id].total += r.points;
      byUser[r.user_id].clubs[r.club_id] = (byUser[r.user_id].clubs[r.club_id]||0) + r.points;
    });

    const userIds = Object.keys(byUser);
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, username').in('id', userIds)
      : { data: [] };
    const usernameMap = {};
    (profiles||[]).forEach(p => { usernameMap[p.id] = p.username; });

    // Real users
    const realRows = userIds.map(uid => {
      const clubs = byUser[uid].clubs;
      const topClub = Object.entries(clubs).sort((a,b)=>b[1]-a[1])[0]?.[0]||clubIds[0];
      return { uid, points: byUser[uid].total, topClub, username: usernameMap[uid]||uid.slice(0,8), fake: false };
    });

    // Merge with fake users, real users override fake if same username
    const fakeRows = (FAKE_USERS[leagueId]||[]).map((f,i) => ({ ...f, uid:'fake_'+i, fake:true }));
    const realUsernames = new Set(realRows.map(r=>r.username));
    const filteredFake = fakeRows.filter(f => !realUsernames.has(f.username));

    const merged = [...realRows, ...filteredFake]
      .sort((a,b) => b.points - a.points)
      .map((r,i) => ({ ...r, rank: i+1 }));

    setRows(merged);
    setLoading(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>Leaderboard</div>
      {loading && <div className={styles.loading}>Loading...</div>}
      {!loading && rows.length === 0 && <div className={styles.empty}>No scores yet.</div>}
      {!loading && rows.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thRank}>#</th>
              <th className={styles.thUser}>User</th>
              {leagueClubs.length > 1 && <th className={styles.thTeam}>Team</th>}
              <th className={styles.thPts}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const club = CLUB_MAP[r.topClub];
              return (
                <tr key={r.uid} className={`${r.rank<=3?styles.topRow:''} ${r.fake?styles.fakeRow:''}`}>
                  <td className={`${styles.tdRank} ${r.rank===1?styles.gold:r.rank===2?styles.silver:r.rank===3?styles.bronze:''}`}>{r.rank}</td>
                  <td className={styles.tdUser}>
                    <span className={styles.avatar}>{(r.username||'?').slice(0,2).toUpperCase()}</span>
                    {r.username}
                  </td>
                  {leagueClubs.length > 1 && (
                    <td className={styles.tdTeam}>
                      <span className={styles.dot} style={{ background: club?.color||'#555' }} />
                      {club?.name||r.topClub}
                    </td>
                  )}
                  <td className={styles.tdPts}>{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
