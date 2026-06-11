import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './StandingsAdmin.module.css';

const LEAGUES = ['Super Lig', 'UEFA Conference League', 'UEFA Champions League', 'UEFA Europa League', 'Turkiye Kupasi'];

function parsePaste(raw) {
  const cleaned = raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const lines = cleaned.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const skipWords = ['#', 'team', 'takim', 'club', 'p', 'mp', 'diff', 'pts', 'gd', 'puan', 'played'];
  const dataLines = lines.filter(l => !skipWords.includes(l.toLowerCase()));
  const isOnePerLine = dataLines.length >= 4 &&
    dataLines.filter((l, i) => i % 4 === 0).every(l => isNaN(parseInt(l)) || l.length > 3);
  if (isOnePerLine) {
    const rows = [];
    for (let i = 0; i + 3 < dataLines.length; i += 4) {
      const team = dataLines[i];
      const played = parseInt(dataLines[i + 1]) || 0;
      const gd = parseInt(dataLines[i + 2]) || 0;
      const pts = parseInt(dataLines[i + 3]) || 0;
      rows.push({ pos: rows.length + 1, team, played, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd, pts });
    }
    if (rows.length > 0) return rows;
  }
  const rows = [];
  for (const line of dataLines) {
    const cols = line.split(/\t+|\s{2,}/).map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    let offset = 0;
    const firstNum = parseInt(cols[0]);
    if (!isNaN(firstNum) && firstNum > 0 && firstNum <= 30) offset = 1;
    const teamCol = cols[offset];
    if (!teamCol || /^\d+$/.test(teamCol)) continue;
    const nums = cols.slice(offset + 1).map(n => parseInt(n)).filter(n => !isNaN(n));
    if (nums.length < 2) continue;
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, gd = 0, pts = 0;
    if (nums.length >= 8) [played, won, drawn, lost, gf, ga, gd, pts] = nums;
    else if (nums.length >= 7) { [played, won, drawn, lost, gf, ga, pts] = nums; gd = gf - ga; }
    else if (nums.length >= 6) [played, won, drawn, lost, gd, pts] = nums;
    else if (nums.length >= 5) [played, won, drawn, lost, pts] = nums;
    else if (nums.length >= 3) [played, gd, pts] = nums;
    else [played, pts] = nums;
    rows.push({ pos: rows.length + 1, team: teamCol, played, won, drawn, lost, gf, ga, gd, pts });
  }
  return rows;
}

export default function StandingsAdmin() {
  const [league, setLeague] = useState('Super Lig');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [existing, setExisting] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [parseError, setParseError] = useState('');

  useEffect(() => { fetchExisting(); }, [league]);

  async function fetchExisting() {
    const { data } = await supabase.from('standings').select('*').eq('league', league).order('pos');
    setExisting(data || []);
  }

  function handleParse() {
    setParseError(''); setMsg('');
    if (!pasteText.trim()) { setParseError('Tablo metni bos.'); return; }
    const rows = parsePaste(pasteText);
    if (rows.length === 0) { setParseError('Tablo okunamadi. Sekme veya boslukla ayrilmis veri yapistirdiginizdan emin olun.'); return; }
    setParsed(rows);
  }

  function handleEditRow(i, field, value) {
    setParsed(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: field === 'team' ? value : parseInt(value) || 0 } : r));
  }

  async function handleSave() {
    if (parsed.length === 0) return;
    setSaving(true); setMsg('');
    await supabase.from('standings').delete().eq('league', league);
    const payload = parsed.map(r => ({ ...r, league, updated_at: new Date().toISOString() }));
    let error = null;
    for (let i = 0; i < payload.length; i += 5) {
      const batch = payload.slice(i, i + 5);
      const { error: batchError } = await supabase.from('standings').insert(batch);
      if (batchError) { error = batchError; break; }
    }
    if (error) { setMsg('Hata: ' + error.message); }
    else { setMsg(league + ' tablosu kaydedildi. (' + parsed.length + ' takim)'); setParsed([]); setPasteText(''); fetchExisting(); }
    setSaving(false);
  }

  const isBJK = name => name && (name.toLowerCase().includes('besiktas') || name.toLowerCase().includes('be\u015fikta\u015f'));

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label>Lig</label>
        <select className={styles.input} value={league} onChange={e => { setLeague(e.target.value); setParsed([]); setPasteText(''); }}>
          {LEAGUES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className={styles.pasteSection}>
        <div className={styles.sectionTitle}>Tablo Yapistir</div>
        <div className={styles.hint}>
          Herhangi bir futbol sitesinden (Mackolik, Google, Transfermarkt) puan tablosunu kopyalayip asagiya yapistirin.
        </div>
        <textarea
          className={styles.textarea}
          value={pasteText}
          onChange={e => { setPasteText(e.target.value); setParsed([]); }}
          placeholder={'1  Galatasaray  30  20  5  5  58  24  34  65\n2  Fenerbahce   30  18  7  5  55  28  27  61\n3  Besiktas     30  17  6  7  52  31  21  57'}
          rows={10}
        />
        {parseError && <div className={styles.error}>{parseError}</div>}
        <button className={styles.btn} onClick={handleParse} type="button">Ayristir</button>
      </div>

      {parsed.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.sectionTitle}>Onizleme — {parsed.length} takim · Duzenleyebilirsiniz</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>#</th><th>Takim</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>P</th></tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} className={isBJK(r.team) ? styles.bjkRow : ''}>
                    <td><input className={styles.numInput} value={r.pos} onChange={e => handleEditRow(i, 'pos', e.target.value)} /></td>
                    <td><input className={styles.teamInput} value={r.team} onChange={e => handleEditRow(i, 'team', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.played} onChange={e => handleEditRow(i, 'played', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.won} onChange={e => handleEditRow(i, 'won', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.drawn} onChange={e => handleEditRow(i, 'drawn', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.lost} onChange={e => handleEditRow(i, 'lost', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.gf} onChange={e => handleEditRow(i, 'gf', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.ga} onChange={e => handleEditRow(i, 'ga', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.gd} onChange={e => handleEditRow(i, 'gd', e.target.value)} /></td>
                    <td><input className={styles.numInput} value={r.pts} onChange={e => handleEditRow(i, 'pts', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {msg && <div className={msg.startsWith('Hata') ? styles.error : styles.success}>{msg}</div>}
          <button className={styles.btnSave} onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {existing.length > 0 && parsed.length === 0 && (
        <div className={styles.existingSection}>
          <div className={styles.sectionTitle}>Mevcut Tablo — {league}</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>#</th><th>Takim</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr>
              </thead>
              <tbody>
                {existing.map(r => (
                  <tr key={r.id} className={isBJK(r.team) ? styles.bjkRow : ''}>
                    <td>{r.pos}</td><td>{r.team}</td><td>{r.played}</td>
                    <td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                    <td>{r.gd > 0 ? '+' + r.gd : r.gd}</td>
                    <td className={styles.pts}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.updated}>Son guncelleme: {new Date(existing[0]?.updated_at).toLocaleString('tr-TR')}</div>
        </div>
      )}
    </div>
  );
}
