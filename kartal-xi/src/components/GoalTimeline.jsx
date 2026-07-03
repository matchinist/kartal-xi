import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './GoalTimeline.module.css';

export default function GoalTimeline({ matchId, matchHome, matchAway, players }) {
  const [goals, setGoals] = useState([]);
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [isOpponent, setIsOpponent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (matchId) fetchGoals(); }, [matchId]);

  async function fetchGoals() {
    const { data } = await supabase.from('goal_scorers').select('*').eq('match_id', matchId).order('sort_order').order('minute');
    setGoals(data || []);
  }

  async function handleAdd() {
    setSaving(true); setMsg('');
    const { error } = await supabase.from('goal_scorers').insert([{
      match_id: matchId, player_id: isOpponent ? null : (playerId || null),
      minute: minute ? parseInt(minute) : null, is_opponent: isOpponent,
      sort_order: goals.length
    }]);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Added.'); fetchGoals(); setPlayerId(''); setMinute(''); }
    setSaving(false);
  }

  async function handleDelete(id) {
    await supabase.from('goal_scorers').delete().eq('id', id);
    fetchGoals();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.goals}>
        {goals.map((g, i) => {
          const p = players.find(pl => pl.id === g.player_id);
          return (
            <div key={g.id} className={styles.goalRow}>
              <span className={styles.goalMin}>{g.minute}'</span>
              <span className={styles.goalTeam}>{g.is_opponent ? matchAway : matchHome}</span>
              <span className={styles.goalPlayer}>{p ? p.ad_soyad : (g.is_opponent ? 'Opponent' : '?')}</span>
              <button className={styles.delBtn} onClick={() => handleDelete(g.id)}>×</button>
            </div>
          );
        })}
        {goals.length === 0 && <div className={styles.empty}>No goals yet</div>}
      </div>
      <div className={styles.addRow}>
        <label><input type="checkbox" checked={isOpponent} onChange={e => setIsOpponent(e.target.checked)} /> Opponent goal</label>
        {!isOpponent && (
          <select className={styles.sel} value={playerId} onChange={e => setPlayerId(e.target.value)}>
            <option value="">Player...</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.jersey_number ? p.jersey_number + '. ' : ''}{p.ad_soyad}</option>)}
          </select>
        )}
        <input className={styles.min} type="number" placeholder="min" value={minute} onChange={e => setMinute(e.target.value)} />
        <button className={styles.addBtn} onClick={handleAdd} disabled={saving}>Add</button>
        {msg && <span className={styles.msg}>{msg}</span>}
      </div>
    </div>
  );
}
