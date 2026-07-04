import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PitchLineup from '../components/PitchLineup';
import GoalTimeline from '../components/GoalTimeline';
import { CLUBS } from '../data/clubs';
import { countries } from '../data/countries';
import styles from './Admin.module.css';

const ALLOWED_EMAIL = 'ercanvural.bm@gmail.com';

const POZISYONLAR = ['Kaleci','Defans','Ortasaha','Forvet'];

const emptyMatch = { home_team:'',away_team:'',match_date:'',tournament:'',stadium:'',status:'scheduled',season:'2025/26' };
const emptyPlayer = { ad_soyad:'',ulke:'',dogum_tarihi:'',pozisyon:'Kaleci',jersey_number:'',bjk_total_games:'',market_value:'',boy:'' };

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('maclar');
  const [activeClub, setActiveClub] = useState(CLUBS[0]);

  const [matchForm, setMatchForm] = useState(emptyMatch);
  const [matches, setMatches] = useState([]);
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchMsg, setMatchMsg] = useState('');
  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchForm, setEditMatchForm] = useState(null);
  const [editMatchSaving, setEditMatchSaving] = useState(false);
  const [editMatchMsg, setEditMatchMsg] = useState('');

  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const [players, setPlayers] = useState([]);
  const [playerSaving, setPlayerSaving] = useState(false);
  const [playerMsg, setPlayerMsg] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // Maç Verisi state
  const [mvMatchId, setMvMatchId] = useState('');
  const [mvLineup, setMvLineup] = useState({ formation:'4-3-3', slots:{}, subs:{}, status:'expected' });
  const [mvLineupId, setMvLineupId] = useState(null);
  const [mvLineupSaving, setMvLineupSaving] = useState(false);
  const [mvLineupMsg, setMvLineupMsg] = useState('');
  const [mvGoals, setMvGoals] = useState([]);
  const [mvPlayerId, setMvPlayerId] = useState('');
  const [mvMinute, setMvMinute] = useState('');
  const [mvGoalSaving, setMvGoalSaving] = useState(false);
  const [mvGoalType, setMvGoalType] = useState('normal');
  const [mvGoalMsg, setMvGoalMsg] = useState('');
  const [mvHomeScore, setMvHomeScore] = useState('');
  const [mvAwayScore, setMvAwayScore] = useState('');
  const [mvScoreSaving, setMvScoreSaving] = useState(false);
  const [mvScoreMsg, setMvScoreMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) { fetchMatches(); fetchPlayers(); } }, [session, activeClub]);

  async function fetchMatches() {
    const { data } = await supabase.from('matches').select('*').eq('club_id', activeClub.id).order('match_date', { ascending: false });
    setMatches(data || []);
  }
  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').eq('club_id', activeClub.id).order('jersey_number');
    setPlayers(data || []);
  }
  async function loadMatchData(matchId) {
    setMvMatchId(matchId); setMvLineupMsg(''); setMvGoalMsg(''); setMvScoreMsg('');
    if (!matchId) return;
    const match = matches.find(m => m.id === matchId);
    if (match) { setMvHomeScore(match.home_score ?? ''); setMvAwayScore(match.away_score ?? ''); }
    const { data: ldArr } = await supabase.from('lineups').select('*').eq('match_id', matchId).neq('status', 'default').order('updated_at', { ascending: false }).limit(1);
    const ld = ldArr?.[0] || null;
    if (ld) { setMvLineup({ formation: ld.formation, slots: ld.slots, subs: ld.subs || {}, status: ld.status || 'expected' }); setMvLineupId(ld.id); }
    else { setMvLineup({ formation:'4-3-3', slots:{}, subs:{}, status:'expected' }); setMvLineupId(null); }
  }
  async function handleMatchSubmit(e) {
    e.preventDefault();
setMatchSaving(true); setMatchMsg('');
    const { error } = await supabase.from('matches').insert([{ ...matchForm, club_id: activeClub.id }]);
    if (error) setMatchMsg('Hata: ' + error.message);
    else { setMatchMsg('Match added.'); setMatchForm(emptyMatch); fetchMatches(); }
    setMatchSaving(false);
  }
  async function handleDeleteMatch(id) {
    if (!confirm('Delete?')) return;
    await supabase.from('matches').delete().eq('id', id); fetchMatches();
  }
  function openEditMatch(m) {
    setEditingMatch(m.id);
    setEditMatchForm({ ...m, match_date: m.match_date ? m.match_date.slice(0,16) : '' });
    setEditMatchMsg('');
  }

  async function handleEditMatchSave() {
    setEditMatchSaving(true); setEditMatchMsg('');
    const { error } = await supabase.from('matches').update({
      home_team: editMatchForm.home_team,
      away_team: editMatchForm.away_team,
      match_date: editMatchForm.match_date,
      tournament: editMatchForm.tournament,
      stadium: editMatchForm.stadium,
      status: editMatchForm.status,
      home_score: editMatchForm.home_score !== '' && editMatchForm.home_score != null ? parseInt(editMatchForm.home_score) : null,
      away_score: editMatchForm.away_score !== '' && editMatchForm.away_score != null ? parseInt(editMatchForm.away_score) : null,
    }).eq('id', editingMatch);
    if (error) setEditMatchMsg('Hata: ' + error.message);
    else { setEditMatchMsg('Kaydedildi.'); fetchMatches(); setTimeout(() => setEditingMatch(null), 800); }
    setEditMatchSaving(false);
  }

  async function handlePlayerSubmit(e) {
    e.preventDefault(); setPlayerSaving(true); setPlayerMsg('');
    const payload = { ...playerForm, club_id: activeClub.id, jersey_number: playerForm.jersey_number !== '' ? parseInt(playerForm.jersey_number) : null, bjk_total_games: playerForm.bjk_total_games !== '' ? parseInt(playerForm.bjk_total_games) : 0, boy: playerForm.boy !== '' ? parseInt(playerForm.boy) : null };
    const { error } = await supabase.from('players').insert([payload]);
    if (error) setPlayerMsg('Hata: ' + error.message);
    else { setPlayerMsg('Player added.'); setPlayerForm(emptyPlayer); fetchPlayers(); }
    setPlayerSaving(false);
  }
  async function handleDeletePlayer(id) {
    if (!confirm('Delete?')) return;
    await supabase.from('players').delete().eq('id', id); fetchPlayers();
  }
  function openEdit(p) {
    setEditingPlayer(p.id);
    setEditForm({ ...p, jersey_number: p.jersey_number ?? '', bjk_total_games: p.bjk_total_games ?? '', boy: p.boy ?? '', market_value: p.market_value ?? '' });
    setEditMsg('');
  }
  async function handleEditSave() {
    setEditSaving(true); setEditMsg('');
    const payload = { ...editForm, jersey_number: editForm.jersey_number !== '' ? parseInt(editForm.jersey_number) : null, bjk_total_games: editForm.bjk_total_games !== '' ? parseInt(editForm.bjk_total_games) : 0, boy: editForm.boy !== '' ? parseInt(editForm.boy) : null };
    const { error } = await supabase.from('players').update(payload).eq('id', editingPlayer);
    if (error) setEditMsg('Hata: ' + error.message);
    else { setEditMsg('Kaydedildi.'); fetchPlayers(); setTimeout(() => setEditingPlayer(null), 800); }
    setEditSaving(false);
  }
  async function handleLineupSave() {
    if (!mvMatchId) return; setMvLineupSaving(true); setMvLineupMsg('');
    let targetId = mvLineupId;
    // Default lineups are stored as a separate row per match. Never update the
    // expected/official row when saving a default — always replace the match's default.
    if (mvLineup.status === 'default') {
      await supabase.from('lineups').delete().eq('match_id', mvMatchId).eq('status', 'default');
      targetId = null;
    }
    const payload = { match_id: mvMatchId, club_id: activeClub.id, formation: mvLineup.formation, slots: mvLineup.slots, subs: mvLineup.subs || {}, status: mvLineup.status || 'expected', updated_at: new Date().toISOString() };
    let error;
    if (targetId) { ({ error } = await supabase.from('lineups').update(payload).eq('id', targetId)); }
    else { const r = await supabase.from('lineups').insert([payload]).select().single(); error = r.error; if (!error && mvLineup.status !== 'default') setMvLineupId(r.data.id); }
    setMvLineupMsg(error ? 'Error: ' + error.message : (mvLineup.status === 'default' ? 'Default lineup saved.' : 'Lineup saved.'));
    setMvLineupSaving(false);
  }
  async function handleScoreSave() {
    if (!mvMatchId) return; setMvScoreSaving(true); setMvScoreMsg('');
    const { error } = await supabase.from('matches').update({ home_score: mvHomeScore !== '' ? parseInt(mvHomeScore) : null, away_score: mvAwayScore !== '' ? parseInt(mvAwayScore) : null }).eq('id', mvMatchId);
    if (error) setMvScoreMsg('Hata: ' + error.message);
    else { setMvScoreMsg('Score saved.'); fetchMatches(); }
    setMvScoreSaving(false);
  }
  async function handleResetMatchData() {
    if (!mvMatchId) return;
    if (!window.confirm('All predictions and points for this match will be deleted. Are you sure?')) return;
    setResetting(true); setResetMsg('');
    await supabase.from('user_points').delete().eq('match_id', mvMatchId);
    await supabase.from('lineup_predictions').delete().eq('club_id', activeClub.id);
    await supabase.from('lineups').delete().eq('match_id', mvMatchId);
    setMvLineup({ formation:'4-3-3', slots:{}, subs:{}, status:'expected' });
    setMvLineupId(null);
    setResetMsg('All data reset.');
    setResetting(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  if (loading) return <div className={styles.center}>// loading...</div>;
  if (!session) return (
    <div className={styles.loginWrap}>
      <div className={styles.loginBox}>
        <div className={styles.loginTitle}>ADMIN ACCESS</div>
        <form onSubmit={e => { e.preventDefault(); supabase.auth.signInWithPassword({ email, password }).then(({ error }) => { if (error) setAuthError(error.message); }); }} className={styles.loginForm}>
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={styles.input} type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required />
          {authError && <div className={styles.error}>{authError}</div>}
          <button className={styles.btn} type="submit">Login</button>
        </form>
      </div>
    </div>
  );
  if (session.user.email !== ALLOWED_EMAIL) return (
    <div className={styles.center}>
      <div className={styles.error}>Access denied.</div>
      <button className={styles.btn} onClick={handleLogout} style={{marginTop:'16px'}}>Logout</button>
    </div>
  );

  const mvMatch = matches.find(m => m.id === mvMatchId);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>// ADMIN PANEL</div>
        <div className={styles.headerRight}>
          <span className={styles.userLabel}>{session.user.email}</span>
          <button className={styles.btnSmall} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className={styles.clubSelector}>
        {CLUBS.map(c => (
          <button
            key={c.id}
            className={`${styles.clubBtn} ${activeClub.id === c.id ? styles.clubBtnActive : ''}`}
            style={activeClub.id === c.id ? { borderColor: c.color, color: c.color } : {}}
            onClick={() => setActiveClub(c)}
            type="button"
          >
            {c.short}
          </button>
        ))}
      </div>

      <div className={styles.tabs}>
        {[['maclar','Matches'],['oyuncular','Players'],['mac-verisi','Match Data']].map(([key,label]) => (
          <button key={key} className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* MAÇLAR */}
      {tab === 'maclar' && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Add Match</div>
            <form onSubmit={handleMatchSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Home</label><input className={styles.input} value={matchForm.home_team} onChange={e => setMatchForm(f=>({...f,home_team:e.target.value}))} placeholder="Beşiktaş" required /></div>
                <div className={styles.field}><label>Away</label><input className={styles.input} value={matchForm.away_team} onChange={e => setMatchForm(f=>({...f,away_team:e.target.value}))} placeholder="Fenerbahçe" required /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Date & Time</label><input className={styles.input} type="datetime-local" value={matchForm.match_date} onChange={e => setMatchForm(f=>({...f,match_date:e.target.value}))} required /></div>
                <div className={styles.field}><label>Tournament</label><input className={styles.input} value={matchForm.tournament} onChange={e => setMatchForm(f=>({...f,tournament:e.target.value}))} placeholder="e.g. Premier League" /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Stadium</label><input className={styles.input} value={matchForm.stadium} onChange={e => setMatchForm(f=>({...f,stadium:e.target.value}))} placeholder="Tüpraş Stadyumu" /></div>
                <div className={styles.field}><label>Status</label><select className={styles.input} value={matchForm.status} onChange={e => setMatchForm(f=>({...f,status:e.target.value}))}><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option></select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Season</label><select className={styles.input} value={matchForm.season||'2025/26'} onChange={e => setMatchForm(f=>({...f,season:e.target.value}))}><option value="2025/26">2025/26</option><option value="2026/27">2026/27</option></select></div>
                <div className={styles.field}></div>
              </div>
              {matchMsg && <div className={matchMsg.startsWith('Hata')?styles.error:styles.success}>{matchMsg}</div>}
              <button className={styles.btn} type="submit" disabled={matchSaving}>{matchSaving?'Saving...':'Maç Ekle'}</button>
            </form>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>All Matches ({matches.length})</div>
            <div className={styles.matchList}>
              {matches.map(m => (
                <div className={styles.matchRow} key={m.id}>
                  <div className={styles.matchInfo}>
                    <span className={styles.matchTeams}>{m.home_team} vs {m.away_team}</span>
                    <span className={styles.matchMeta}>{m.tournament} · {new Date(m.match_date).toLocaleString('tr-TR')} · {m.status}</span>
                    {m.home_score !== null && m.home_score !== undefined && <span className={styles.matchScore}>{m.home_score} – {m.away_score}</span>}
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className={styles.btnEdit} onClick={() => openEditMatch(m)}>Edit</button>
                    <button className={styles.btnDelete} onClick={() => handleDeleteMatch(m.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* OYUNCULAR */}
      {tab === 'oyuncular' && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Add Player</div>
            <form onSubmit={handlePlayerSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Full Name</label><input className={styles.input} value={playerForm.ad_soyad} onChange={e=>setPlayerForm(f=>({...f,ad_soyad:e.target.value}))} placeholder="Rafa Silva" required /></div>
                <div className={styles.field}><label>Country</label>
                  <input
                    className={styles.input}
                    list="countries-list"
                    value={playerForm.ulke}
                    onChange={e=>setPlayerForm(f=>({...f,ulke:e.target.value}))}
                    placeholder="Search country..."
                    required
                    autoComplete="off"
                  />
                  <datalist id="countries-list">
                    {countries.map(c=><option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </datalist>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Date of Birth</label><input className={styles.input} type="date" value={playerForm.dogum_tarihi} onChange={e=>setPlayerForm(f=>({...f,dogum_tarihi:e.target.value}))} required /></div>
                <div className={styles.field}><label>Position</label><select className={styles.input} value={playerForm.pozisyon} onChange={e=>setPlayerForm(f=>({...f,pozisyon:e.target.value}))}>{POZISYONLAR.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Jersey No</label><input className={styles.input} type="number" min="1" max="99" value={playerForm.jersey_number} onChange={e=>setPlayerForm(f=>({...f,jersey_number:e.target.value}))} placeholder="10" /></div>
                <div className={styles.field}><label>Height (cm)</label><input className={styles.input} type="number" min="150" max="220" value={playerForm.boy} onChange={e=>setPlayerForm(f=>({...f,boy:e.target.value}))} placeholder="183" /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Total Games</label><input className={styles.input} type="number" min="0" value={playerForm.bjk_total_games} onChange={e=>setPlayerForm(f=>({...f,bjk_total_games:e.target.value}))} placeholder="0" /></div>
                <div className={styles.field}><label>Market Value</label><input className={styles.input} value={playerForm.market_value} onChange={e=>setPlayerForm(f=>({...f,market_value:e.target.value}))} placeholder="15M" /></div>
              </div>
              {playerMsg && <div className={playerMsg.startsWith('Hata')?styles.error:styles.success}>{playerMsg}</div>}
              <button className={styles.btn} type="submit" disabled={playerSaving}>{playerSaving?'Saving...':'Oyuncu Ekle'}</button>
            </form>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Squad ({players.length})</div>
            {['Forvet','Ortasaha','Defans','Kaleci'].map(pos => {
              const group = players.filter(p => p.pozisyon === pos);
              if (!group.length) return null;
              return (
                <div key={pos} className={styles.posGroup}>
                  <div className={styles.posGroupLabel}>{pos}</div>
                  {group.map(p => (
                    <div className={styles.matchRow} key={p.id}>
                      <div className={styles.matchInfo}>
                        <span className={styles.matchTeams}>{p.jersey_number != null ? p.jersey_number + '. ' : ''}{p.ad_soyad}</span>
                        <span className={styles.matchMeta}>{p.ulke} · {p.boy ? p.boy+'cm · ' : ''}{p.market_value || ''}{p.dogum_tarihi ? ' · ' + new Date(p.dogum_tarihi).toLocaleDateString('tr-TR') : ''}</span>
                      </div>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className={styles.btnEdit} onClick={() => openEdit(p)}>Edit</button>
                        <button className={styles.btnDelete} onClick={() => handleDeletePlayer(p.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MAÇ VERİSİ */}
      {tab === 'mac-verisi' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Match Data</div>
          <div className={styles.field} style={{marginBottom:'20px',maxWidth:'440px'}}>
            <label>Maç Seç</label>
            <select className={styles.input} value={mvMatchId} onChange={e => loadMatchData(e.target.value)}>
              <option value="">Select match...</option>
              {matches.map(m => <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} · {new Date(m.match_date).toLocaleDateString('tr-TR')} · {m.tournament}</option>)}
            </select>
          </div>

          {mvMatchId && <>
            {/* SKOR */}
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Score</div>
              <div className={styles.row} style={{maxWidth:'300px'}}>
                <div className={styles.field}><label>{mvMatch?.home_team || 'Ev'}</label><input className={styles.input} type="number" min="0" value={mvHomeScore} onChange={e=>setMvHomeScore(e.target.value)} placeholder="0" /></div>
                <div className={styles.field}><label>{mvMatch?.away_team || 'Dep'}</label><input className={styles.input} type="number" min="0" value={mvAwayScore} onChange={e=>setMvAwayScore(e.target.value)} placeholder="0" /></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'8px'}}>
                <button className={styles.btn} onClick={handleScoreSave} disabled={mvScoreSaving} type="button">{mvScoreSaving?'...':'Skoru Kaydet'}</button>
                {mvScoreMsg && <div className={mvScoreMsg.startsWith('Hata')?styles.error:styles.success}>{mvScoreMsg}</div>}
              </div>
            </div>

            {/* GOLLER */}
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Goals</div>
              <GoalTimeline
                matchId={mvMatchId}
                matchHome={mvMatch?.home_team}
                matchAway={mvMatch?.away_team}
                players={players}
              />
            </div>

                        {/* KADRO */}
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Lineup</div>
              <PitchLineup players={players} value={mvLineup} onChange={setMvLineup} />
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'12px',flexWrap:'wrap'}}>
                <button className={styles.btn} onClick={handleLineupSave} disabled={mvLineupSaving} type="button">{mvLineupSaving?'Saving...':mvLineupId?'Update':'Save'}</button>
                <button className={styles.btnDanger} onClick={handleResetMatchData} disabled={!mvMatchId||resetting} type="button">{resetting?'Resetting...':'Reset Match Data'}</button>
                {mvLineupMsg && <div className={mvLineupMsg.startsWith('Hata')?styles.error:styles.success}>{mvLineupMsg}</div>}
                {resetMsg && <div className={resetMsg.startsWith('Hata')?styles.error:styles.success}>{resetMsg}</div>}
              </div>
            </div>
          </>}
          {!mvMatchId && <div className={styles.empty}>Select a match to enter data.</div>}
        </div>
      )}

      {/* PUAN TABLOSU */}

      {/* EDIT MODAL */}
      {editingPlayer && editForm && (
        <div className={styles.modalOverlay} onClick={() => setEditingPlayer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Edit Player</div>
            <div className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Full Name</label><input className={styles.input} value={editForm.ad_soyad} onChange={e=>setEditForm(f=>({...f,ad_soyad:e.target.value}))} /></div>
                <div className={styles.field}><label>Country</label>
                  <input
                    className={styles.input}
                    list="countries-list-edit"
                    value={editForm.ulke}
                    onChange={e=>setEditForm(f=>({...f,ulke:e.target.value}))}
                    placeholder="Search country..."
                    autoComplete="off"
                  />
                  <datalist id="countries-list-edit">
                    {countries.map(c=><option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </datalist>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Date of Birth</label><input className={styles.input} type="date" value={editForm.dogum_tarihi} onChange={e=>setEditForm(f=>({...f,dogum_tarihi:e.target.value}))} /></div>
                <div className={styles.field}><label>Position</label><select className={styles.input} value={editForm.pozisyon} onChange={e=>setEditForm(f=>({...f,pozisyon:e.target.value}))}>{POZISYONLAR.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Jersey No</label><input className={styles.input} type="number" min="1" max="99" value={editForm.jersey_number} onChange={e=>setEditForm(f=>({...f,jersey_number:e.target.value}))} /></div>
                <div className={styles.field}><label>Height (cm)</label><input className={styles.input} type="number" value={editForm.boy} onChange={e=>setEditForm(f=>({...f,boy:e.target.value}))} /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Total Games</label><input className={styles.input} type="number" value={editForm.bjk_total_games} onChange={e=>setEditForm(f=>({...f,bjk_total_games:e.target.value}))} /></div>
                <div className={styles.field}><label>Market Value</label><input className={styles.input} value={editForm.market_value} onChange={e=>setEditForm(f=>({...f,market_value:e.target.value}))} /></div>
              </div>
              {editMsg && <div className={editMsg.startsWith('Hata')?styles.error:styles.success}>{editMsg}</div>}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button className={styles.btn} onClick={handleEditSave} disabled={editSaving} type="button">{editSaving?'Saving...':'Kaydet'}</button>
                <button className={styles.btnSmall} onClick={() => setEditingPlayer(null)} type="button">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingMatch && editMatchForm && (
        <div className={styles.modalOverlay} onClick={() => setEditingMatch(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Edit Match</div>
            <div className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Home</label><input className={styles.input} value={editMatchForm.home_team} onChange={e=>setEditMatchForm(f=>({...f,home_team:e.target.value}))} /></div>
                <div className={styles.field}><label>Away</label><input className={styles.input} value={editMatchForm.away_team} onChange={e=>setEditMatchForm(f=>({...f,away_team:e.target.value}))} /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Date & Time</label><input className={styles.input} type="datetime-local" value={editMatchForm.match_date} onChange={e=>setEditMatchForm(f=>({...f,match_date:e.target.value}))} /></div>
                <div className={styles.field}><label>Tournament</label><input className={styles.input} value={editMatchForm.tournament} onChange={e=>setEditMatchForm(f=>({...f,tournament:e.target.value}))} placeholder="e.g. Premier League" /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Stadium</label><input className={styles.input} value={editMatchForm.stadium||''} onChange={e=>setEditMatchForm(f=>({...f,stadium:e.target.value}))} /></div>
                <div className={styles.field}><label>Status</label><select className={styles.input} value={editMatchForm.status} onChange={e=>setEditMatchForm(f=>({...f,status:e.target.value}))}><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option></select></div>
              </div>
              {editMatchMsg && <div className={editMatchMsg.startsWith('Hata')?styles.error:styles.success}>{editMatchMsg}</div>}
              <div style={{display:'flex',gap:'8px'}}>
                <button className={styles.btn} onClick={handleEditMatchSave} disabled={editMatchSaving} type="button">{editMatchSaving?'Saving...':'Kaydet'}</button>
                <button className={styles.btnSmall} onClick={()=>setEditingMatch(null)} type="button">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
