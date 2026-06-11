import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PitchLineup from '../components/PitchLineup';
import StandingsAdmin from '../components/StandingsAdmin';
import { countries } from '../data/countries';
import styles from './Admin.module.css';

const ALLOWED_EMAIL = 'ercanvural.bm@gmail.com';
const TOURNAMENTS = ['Süper Lig','UEFA Conference League','UEFA Champions League','UEFA Europa League','Türkiye Kupası','Süper Kupa'];
const POZISYONLAR = ['Kaleci','Defans','Ortasaha','Forvet'];

const emptyMatch = { home_team:'',away_team:'',match_date:'',tournament:'Süper Lig',stadium:'',status:'scheduled' };
const emptyPlayer = { ad_soyad:'',ulke:'',dogum_tarihi:'',pozisyon:'Kaleci',jersey_number:'',bjk_total_games:'',market_value:'',boy:'' };

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('maclar');

  const [matchForm, setMatchForm] = useState(emptyMatch);
  const [matches, setMatches] = useState([]);
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchMsg, setMatchMsg] = useState('');

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
  const [mvGoalMsg, setMvGoalMsg] = useState('');
  const [mvHomeScore, setMvHomeScore] = useState('');
  const [mvAwayScore, setMvAwayScore] = useState('');
  const [mvScoreSaving, setMvScoreSaving] = useState(false);
  const [mvScoreMsg, setMvScoreMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) { fetchMatches(); fetchPlayers(); } }, [session]);

  async function fetchMatches() {
    const { data } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
    setMatches(data || []);
  }
  async function fetchPlayers() {
    const { data } = await supabase.from('players').select('*').order('jersey_number');
    setPlayers(data || []);
  }
  async function loadMatchData(matchId) {
    setMvMatchId(matchId); setMvLineupMsg(''); setMvGoalMsg(''); setMvScoreMsg('');
    if (!matchId) return;
    const match = matches.find(m => m.id === matchId);
    if (match) { setMvHomeScore(match.home_score ?? ''); setMvAwayScore(match.away_score ?? ''); }
    const { data: ldArr } = await supabase.from('lineups').select('*').eq('match_id', matchId).limit(1);
    const ld = ldArr?.[0] || null;
    if (ld) { setMvLineup({ formation: ld.formation, slots: ld.slots, subs: ld.subs || {}, status: ld.status || 'expected' }); setMvLineupId(ld.id); }
    else { setMvLineup({ formation:'4-3-3', slots:{}, subs:{}, status:'expected' }); setMvLineupId(null); }
    const { data: gd } = await supabase.from('goal_scorers').select('*, players(ad_soyad)').eq('match_id', matchId).order('minute');
    setMvGoals(gd || []);
  }
  async function handleMatchSubmit(e) {
    e.preventDefault(); setMatchSaving(true); setMatchMsg('');
    const { error } = await supabase.from('matches').insert([matchForm]);
    if (error) setMatchMsg('Hata: ' + error.message);
    else { setMatchMsg('Maç eklendi.'); setMatchForm(emptyMatch); fetchMatches(); }
    setMatchSaving(false);
  }
  async function handleDeleteMatch(id) {
    if (!confirm('Sil?')) return;
    await supabase.from('matches').delete().eq('id', id); fetchMatches();
  }
  async function handlePlayerSubmit(e) {
    e.preventDefault(); setPlayerSaving(true); setPlayerMsg('');
    const payload = { ...playerForm, jersey_number: playerForm.jersey_number !== '' ? parseInt(playerForm.jersey_number) : null, bjk_total_games: playerForm.bjk_total_games !== '' ? parseInt(playerForm.bjk_total_games) : 0, boy: playerForm.boy !== '' ? parseInt(playerForm.boy) : null };
    const { error } = await supabase.from('players').insert([payload]);
    if (error) setPlayerMsg('Hata: ' + error.message);
    else { setPlayerMsg('Oyuncu eklendi.'); setPlayerForm(emptyPlayer); fetchPlayers(); }
    setPlayerSaving(false);
  }
  async function handleDeletePlayer(id) {
    if (!confirm('Sil?')) return;
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
    const payload = { match_id: mvMatchId, formation: mvLineup.formation, slots: mvLineup.slots, subs: mvLineup.subs || {}, status: mvLineup.status || 'expected', updated_at: new Date().toISOString() };
    let error;
    if (mvLineupId) { ({ error } = await supabase.from('lineups').update(payload).eq('id', mvLineupId)); }
    else { const r = await supabase.from('lineups').insert([payload]).select().single(); error = r.error; if (!error) setMvLineupId(r.data.id); }
    setMvLineupMsg(error ? 'Hata: ' + error.message : 'Kadro kaydedildi.');
    setMvLineupSaving(false);
  }
  async function handleAddGoal() {
    if (!mvMatchId || !mvPlayerId || !mvMinute) { setMvGoalMsg('Tum alanlari doldurun.'); return; }
    setMvGoalSaving(true); setMvGoalMsg('');
    const { error } = await supabase.from('goal_scorers').insert([{ match_id: mvMatchId, player_id: mvPlayerId, minute: parseInt(mvMinute) }]);
    if (error) setMvGoalMsg('Hata: ' + error.message);
    else { setMvGoalMsg('Gol eklendi.'); setMvPlayerId(''); setMvMinute(''); loadMatchData(mvMatchId); }
    setMvGoalSaving(false);
  }
  async function handleDeleteGoal(id) {
    if (!confirm('Sil?')) return;
    await supabase.from('goal_scorers').delete().eq('id', id); loadMatchData(mvMatchId);
  }
  async function handleScoreSave() {
    if (!mvMatchId) return; setMvScoreSaving(true); setMvScoreMsg('');
    const { error } = await supabase.from('matches').update({ home_score: mvHomeScore !== '' ? parseInt(mvHomeScore) : null, away_score: mvAwayScore !== '' ? parseInt(mvAwayScore) : null }).eq('id', mvMatchId);
    if (error) setMvScoreMsg('Hata: ' + error.message);
    else { setMvScoreMsg('Skor kaydedildi.'); fetchMatches(); }
    setMvScoreSaving(false);
  }
  async function handleLogout() { await supabase.auth.signOut(); }

  if (loading) return <div className={styles.center}>// yükleniyor...</div>;
  if (!session) return (
    <div className={styles.loginWrap}>
      <div className={styles.loginBox}>
        <div className={styles.loginTitle}>ADMIN ACCESS</div>
        <form onSubmit={e => { e.preventDefault(); supabase.auth.signInWithPassword({ email, password }).then(({ error }) => { if (error) setAuthError(error.message); }); }} className={styles.loginForm}>
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={styles.input} type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required />
          {authError && <div className={styles.error}>{authError}</div>}
          <button className={styles.btn} type="submit">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
  if (session.user.email !== ALLOWED_EMAIL) return (
    <div className={styles.center}>
      <div className={styles.error}>Erişim reddedildi.</div>
      <button className={styles.btn} onClick={handleLogout} style={{marginTop:'16px'}}>Çıkış</button>
    </div>
  );

  const mvMatch = matches.find(m => m.id === mvMatchId);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>// ADMIN PANEL</div>
        <div className={styles.headerRight}>
          <span className={styles.userLabel}>{session.user.email}</span>
          <button className={styles.btnSmall} onClick={handleLogout}>Çıkış</button>
        </div>
      </div>

      <div className={styles.tabs}>
        {[['maclar','Maçlar'],['oyuncular','Oyuncular'],['mac-verisi','Maç Verisi'],['puan','Puan Tablosu']].map(([key,label]) => (
          <button key={key} className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* MAÇLAR */}
      {tab === 'maclar' && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Maç Ekle</div>
            <form onSubmit={handleMatchSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Ev Sahibi</label><input className={styles.input} value={matchForm.home_team} onChange={e => setMatchForm(f=>({...f,home_team:e.target.value}))} placeholder="Beşiktaş" required /></div>
                <div className={styles.field}><label>Deplasman</label><input className={styles.input} value={matchForm.away_team} onChange={e => setMatchForm(f=>({...f,away_team:e.target.value}))} placeholder="Fenerbahçe" required /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Tarih & Saat</label><input className={styles.input} type="datetime-local" value={matchForm.match_date} onChange={e => setMatchForm(f=>({...f,match_date:e.target.value}))} required /></div>
                <div className={styles.field}><label>Turnuva</label><select className={styles.input} value={matchForm.tournament} onChange={e => setMatchForm(f=>({...f,tournament:e.target.value}))}>{TOURNAMENTS.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Stadyum</label><input className={styles.input} value={matchForm.stadium} onChange={e => setMatchForm(f=>({...f,stadium:e.target.value}))} placeholder="Tüpraş Stadyumu" /></div>
                <div className={styles.field}><label>Durum</label><select className={styles.input} value={matchForm.status} onChange={e => setMatchForm(f=>({...f,status:e.target.value}))}><option value="scheduled">Planlandı</option><option value="live">Canlı</option><option value="finished">Tamamlandı</option></select></div>
              </div>
              {matchMsg && <div className={matchMsg.startsWith('Hata')?styles.error:styles.success}>{matchMsg}</div>}
              <button className={styles.btn} type="submit" disabled={matchSaving}>{matchSaving?'Kaydediliyor...':'Maç Ekle'}</button>
            </form>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Tüm Maçlar ({matches.length})</div>
            <div className={styles.matchList}>
              {matches.map(m => (
                <div className={styles.matchRow} key={m.id}>
                  <div className={styles.matchInfo}>
                    <span className={styles.matchTeams}>{m.home_team} vs {m.away_team}</span>
                    <span className={styles.matchMeta}>{m.tournament} · {new Date(m.match_date).toLocaleString('tr-TR')} · {m.status}</span>
                    {m.home_score !== null && m.home_score !== undefined && <span className={styles.matchScore}>{m.home_score} – {m.away_score}</span>}
                  </div>
                  <button className={styles.btnDelete} onClick={() => handleDeleteMatch(m.id)}>Sil</button>
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
            <div className={styles.sectionTitle}>Oyuncu Ekle</div>
            <form onSubmit={handlePlayerSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Ad Soyad</label><input className={styles.input} value={playerForm.ad_soyad} onChange={e=>setPlayerForm(f=>({...f,ad_soyad:e.target.value}))} placeholder="Rafa Silva" required /></div>
                <div className={styles.field}><label>Ülke</label>
                  <select className={styles.input} value={playerForm.ulke} onChange={e=>setPlayerForm(f=>({...f,ulke:e.target.value}))} required>
                    <option value="">Seçiniz...</option>
                    {countries.map(c=><option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Doğum Tarihi</label><input className={styles.input} type="date" value={playerForm.dogum_tarihi} onChange={e=>setPlayerForm(f=>({...f,dogum_tarihi:e.target.value}))} required /></div>
                <div className={styles.field}><label>Pozisyon</label><select className={styles.input} value={playerForm.pozisyon} onChange={e=>setPlayerForm(f=>({...f,pozisyon:e.target.value}))}>{POZISYONLAR.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Forma No</label><input className={styles.input} type="number" min="1" max="99" value={playerForm.jersey_number} onChange={e=>setPlayerForm(f=>({...f,jersey_number:e.target.value}))} placeholder="10" /></div>
                <div className={styles.field}><label>Boy (cm)</label><input className={styles.input} type="number" min="150" max="220" value={playerForm.boy} onChange={e=>setPlayerForm(f=>({...f,boy:e.target.value}))} placeholder="183" /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>BJK Toplam Maç</label><input className={styles.input} type="number" min="0" value={playerForm.bjk_total_games} onChange={e=>setPlayerForm(f=>({...f,bjk_total_games:e.target.value}))} placeholder="0" /></div>
                <div className={styles.field}><label>Piyasa Değeri</label><input className={styles.input} value={playerForm.market_value} onChange={e=>setPlayerForm(f=>({...f,market_value:e.target.value}))} placeholder="15M" /></div>
              </div>
              {playerMsg && <div className={playerMsg.startsWith('Hata')?styles.error:styles.success}>{playerMsg}</div>}
              <button className={styles.btn} type="submit" disabled={playerSaving}>{playerSaving?'Kaydediliyor...':'Oyuncu Ekle'}</button>
            </form>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Kadro ({players.length})</div>
            <div className={styles.matchList}>
              {players.map(p => (
                <div className={styles.matchRow} key={p.id}>
                  <div className={styles.matchInfo}>
                    <span className={styles.matchTeams}>{p.jersey_number != null ? p.jersey_number + '. ' : ''}{p.ad_soyad}</span>
                    <span className={styles.matchMeta}>{p.pozisyon} · {p.ulke} · {p.boy ? p.boy+'cm · ' : ''}{p.market_value || ''}</span>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className={styles.btnEdit} onClick={() => openEdit(p)}>Düzenle</button>
                    <button className={styles.btnDelete} onClick={() => handleDeletePlayer(p.id)}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MAÇ VERİSİ */}
      {tab === 'mac-verisi' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Maç Verisi</div>
          <div className={styles.field} style={{marginBottom:'20px',maxWidth:'440px'}}>
            <label>Maç Seç</label>
            <select className={styles.input} value={mvMatchId} onChange={e => loadMatchData(e.target.value)}>
              <option value="">Maç seçiniz...</option>
              {matches.map(m => <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} · {new Date(m.match_date).toLocaleDateString('tr-TR')} · {m.tournament}</option>)}
            </select>
          </div>

          {mvMatchId && <>
            {/* SKOR */}
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Skor</div>
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
              <div className={styles.subSectionTitle}>Goller</div>
              <div className={styles.addRow}>
                <div className={styles.field}><label>Golcü</label>
                  <select className={styles.input} value={mvPlayerId} onChange={e=>setMvPlayerId(e.target.value)}>
                    <option value="">Oyuncu...</option>
                    {players.map(p=><option key={p.id} value={p.id}>{p.jersey_number ? p.jersey_number+'. ' : ''}{p.ad_soyad}</option>)}
                  </select>
                </div>
                <div className={styles.fieldSmall}><label>Dakika</label><input className={styles.input} type="number" min="1" max="120" value={mvMinute} onChange={e=>setMvMinute(e.target.value)} placeholder="45" /></div>
                <button className={styles.btnAdd} onClick={handleAddGoal} disabled={mvGoalSaving} type="button">{mvGoalSaving?'...':'+ Ekle'}</button>
              </div>
              {mvGoalMsg && <div className={mvGoalMsg.startsWith('Hata')?styles.error:styles.success}>{mvGoalMsg}</div>}
              <div className={styles.goalList}>
                {mvGoals.length === 0 && <div className={styles.empty}>Henüz gol yok.</div>}
                {mvGoals.map(g => (
                  <div className={styles.goalRow} key={g.id}>
                    <span className={styles.minute}>{g.minute}'</span>
                    <span className={styles.scorer}>{g.players?.ad_soyad || '—'}</span>
                    <button className={styles.btnDelete} onClick={() => handleDeleteGoal(g.id)}>Sil</button>
                  </div>
                ))}
              </div>
            </div>

            {/* KADRO */}
            <div className={styles.subSection}>
              <div className={styles.subSectionTitle}>Kadro</div>
              <PitchLineup players={players} value={mvLineup} onChange={setMvLineup} />
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'12px'}}>
                <button className={styles.btn} onClick={handleLineupSave} disabled={mvLineupSaving} type="button">{mvLineupSaving?'Kaydediliyor...':mvLineupId?'Güncelle':'Kaydet'}</button>
                {mvLineupMsg && <div className={mvLineupMsg.startsWith('Hata')?styles.error:styles.success}>{mvLineupMsg}</div>}
              </div>
            </div>
          </>}
          {!mvMatchId && <div className={styles.empty}>Veri girmek için bir maç seçin.</div>}
        </div>
      )}

      {/* PUAN TABLOSU */}
      {tab === 'puan' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Puan Tablosu</div>
          <StandingsAdmin />
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPlayer && editForm && (
        <div className={styles.modalOverlay} onClick={() => setEditingPlayer(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Oyuncu Düzenle</div>
            <div className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}><label>Ad Soyad</label><input className={styles.input} value={editForm.ad_soyad} onChange={e=>setEditForm(f=>({...f,ad_soyad:e.target.value}))} /></div>
                <div className={styles.field}><label>Ülke</label>
                  <select className={styles.input} value={editForm.ulke} onChange={e=>setEditForm(f=>({...f,ulke:e.target.value}))}>
                    <option value="">Seçiniz...</option>
                    {countries.map(c=><option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Doğum Tarihi</label><input className={styles.input} type="date" value={editForm.dogum_tarihi} onChange={e=>setEditForm(f=>({...f,dogum_tarihi:e.target.value}))} /></div>
                <div className={styles.field}><label>Pozisyon</label><select className={styles.input} value={editForm.pozisyon} onChange={e=>setEditForm(f=>({...f,pozisyon:e.target.value}))}>{POZISYONLAR.map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>Forma No</label><input className={styles.input} type="number" min="1" max="99" value={editForm.jersey_number} onChange={e=>setEditForm(f=>({...f,jersey_number:e.target.value}))} /></div>
                <div className={styles.field}><label>Boy (cm)</label><input className={styles.input} type="number" value={editForm.boy} onChange={e=>setEditForm(f=>({...f,boy:e.target.value}))} /></div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}><label>BJK Toplam Maç</label><input className={styles.input} type="number" value={editForm.bjk_total_games} onChange={e=>setEditForm(f=>({...f,bjk_total_games:e.target.value}))} /></div>
                <div className={styles.field}><label>Piyasa Değeri</label><input className={styles.input} value={editForm.market_value} onChange={e=>setEditForm(f=>({...f,market_value:e.target.value}))} /></div>
              </div>
              {editMsg && <div className={editMsg.startsWith('Hata')?styles.error:styles.success}>{editMsg}</div>}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button className={styles.btn} onClick={handleEditSave} disabled={editSaving} type="button">{editSaving?'Kaydediliyor...':'Kaydet'}</button>
                <button className={styles.btnSmall} onClick={() => setEditingPlayer(null)} type="button">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
