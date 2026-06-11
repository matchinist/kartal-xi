import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './GoalScorers.module.css';

export default function GoalScorers({ matches, players }) {
  const [matchId, setMatchId] = useState('');
  const [goals, setGoals] = useState([]);
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (matchId) fetchGoals();
  }, [matchId]);

  async function fetchGoals() {
    const { data } = await supabase
      .from('goal_scorers')
      .select('*, players(ad_soyad)')
      .eq('match_id', matchId)
      .order('minute');
    setGoals(data || []);
  }

  async function handleAdd() {
    if (!matchId || !playerId || !minute) { setMsg('Tum alanlari doldurun.'); return; }
    setSaving(true); setMsg('');
    const { error } = await supabase.from('goal_scorers').insert([{
      match_id: matchId,
      player_id: playerId,
      minute: parseInt(minute),
    }]);
    if (error) { setMsg('Hata: ' + error.message); }
    else { setMsg('Gol eklendi.'); setPlayerId(''); setMinute(''); fetchGoals(); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Sil?')) return;
    await supabase.from('goal_scorers').delete().eq('id', id);
    fetchGoals();
  }

  const bjkMatches = matches.filter(m =>
    m.home_team?.toLowerCase().includes('be') ||
    m.away_team?.toLowerCase().includes('be')
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label>Mac Sec</label>
        <select className={styles.input} value={matchId} onChange={e => { setMatchId(e.target.value); setMsg(''); }}>
          <option value="">Mac secin...</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.home_team} vs {m.away_team} · {new Date(m.match_date).toLocaleDateString('tr-TR')}
            </option>
          ))}
        </select>
      </div>

      {matchId && (
        <>
          <div className={styles.addRow}>
            <div className={styles.field}>
              <label>Golcu</label>
              <select className={styles.input} value={playerId} onChange={e => setPlayerId(e.target.value)}>
                <option value="">Oyuncu sec...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.ad_soyad}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldSmall}>
              <label>Dakika</label>
              <input
                className={styles.input}
                type="number"
                min="1" max="120"
                value={minute}
                onChange={e => setMinute(e.target.value)}
                placeholder="45"
              />
            </div>
            <button className={styles.btnAdd} onClick={handleAdd} disabled={saving} type="button">
              {saving ? '...' : '+ Ekle'}
            </button>
          </div>

          {msg && <div className={msg.startsWith('Hata') ? styles.error : styles.success}>{msg}</div>}

          <div className={styles.goalList}>
            {goals.length === 0 && <div className={styles.empty}>Henuz gol yok.</div>}
            {goals.map(g => (
              <div className={styles.goalRow} key={g.id}>
                <span className={styles.minute}>{g.minute}'</span>
                <span className={styles.scorer}>{g.players?.ad_soyad || '—'}</span>
                <button className={styles.btnDel} onClick={() => handleDelete(g.id)}>Sil</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
