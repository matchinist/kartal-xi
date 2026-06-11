import { useState } from 'react';
import { formations } from '../data/formations';
import styles from './LineupDisplay.module.css';

function getCountryCode(country) {
  const map = {
    'Turkiye':'tr','Türkiye':'tr','Portekiz':'pt','Arjantin':'ar',
    'Brezilya':'br','Fransa':'fr','Almanya':'de','Hollanda':'nl',
    'Italya':'it','İtalya':'it','İspanya':'es','Belcika':'be',
    'Belçika':'be','Sirbistan':'rs','Sırbistan':'rs','Fas':'ma',
    'Nijerya':'ng','Gana':'gh','Senegal':'sn','Kamerun':'cm',
    'Japonya':'jp','Avustralya':'au','Uruguay':'uy','Kolombiya':'co',
    'Norveç':'no','İsveç':'se','Danimarka':'dk','Polonya':'pl',
    'Romanya':'ro','Ukrayna':'ua','Yunanistan':'gr','İsviçre':'ch',
    'Kosova':'xk','Arnavutluk':'al','Karadağ':'me','Hırvatistan':'hr',
    'Bosna Hersek':'ba','Makedonya':'mk','Çek Cumhuriyeti':'cz',
    'Macaristan':'hu','Avusturya':'at','Slovakya':'sk',
    'Amerika Birlesik Devletleri':'us','Meksika':'mx','Jamaika':'jm',
    'Guney Kore':'kr','Cezayir':'dz','Tunus':'tn','Mısır':'eg','Rusya':'ru',
  };
  return map[country] || null;
}

function formatName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return parts[0][0] + '. ' + parts.slice(1).join(' ');
}

function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function parseMarketValue(val) {
  if (!val) return 0;
  const s = String(val).toLowerCase().replace(',', '.');
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (s.includes('m')) return num;
  if (s.includes('k')) return num / 1000;
  return num;
}

function formatTotalMarket(players) {
  const total = players.reduce((sum, p) => sum + parseMarketValue(p.market_value), 0);
  if (total === 0) return null;
  return total >= 1 ? total.toFixed(1) + 'M €' : (total * 1000).toFixed(0) + 'K €';
}

export default function LineupDisplay({ lineup, players }) {
  const [tab, setTab] = useState('bjk');
  const [subsOpen, setSubsOpen] = useState(false);

  if (!lineup) return null;
  const { formation, slots, status, subs } = lineup;
  const slotDefs = formations[formation] || [];
  const filledCount = Object.values(slots || {}).filter(Boolean).length;
  if (filledCount === 0) return null;

  function getPlayer(id) { return players.find(p => p.id === id); }

  const startingPlayers = slotDefs
    .map(s => slots[s.id] ? getPlayer(slots[s.id]) : null)
    .filter(Boolean);

  const avgAge = tab === 'yas' && startingPlayers.length > 0
    ? (startingPlayers.reduce((s, p) => s + (calcAge(p.dogum_tarihi) || 0), 0) / startingPlayers.length).toFixed(1)
    : null;

  const avgBoy = tab === 'boy' && startingPlayers.length > 0 && startingPlayers.some(p => p.boy)
    ? Math.round(startingPlayers.filter(p => p.boy).reduce((s, p) => s + p.boy, 0) / startingPlayers.filter(p => p.boy).length)
    : null;

  const totalMarket = tab === 'market' ? formatTotalMarket(startingPlayers) : null;

  function getBelowName(player) {
    if (tab === 'bjk') return status === 'official' ? (player.bjk_total_games || 0) + '' : null;
    if (tab === 'yas') return calcAge(player.dogum_tarihi) != null ? calcAge(player.dogum_tarihi) + '' : null;
    if (tab === 'boy') return player.boy ? player.boy + 'cm' : null;
    if (tab === 'market') return player.market_value || null;
    return null;
  }

  const subList = subs ? Object.values(subs).filter(Boolean).map(id => getPlayer(id)).filter(Boolean) : [];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Muhtemel 11</span>
          {status === 'official' && <span className={styles.officialBadge}>Resmi</span>}
        </div>
        <span className={styles.formation}>{formation}</span>
      </div>

      <div className={styles.tabs}>
        {[['bjk','BJK'],['yas','Yaş'],['boy','Boy'],['market','Piyasa']].map(([key,label]) => (
          <button key={key} className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {(avgAge || avgBoy || totalMarket) && (
        <div className={styles.avgBar}>
          {avgAge && <span>Ortalama Yaş: <strong>{avgAge}</strong></span>}
          {avgBoy && <span>Ortalama Boy: <strong>{avgBoy}cm</strong></span>}
          {totalMarket && <span>Toplam Piyasa: <strong>{totalMarket}</strong></span>}
        </div>
      )}

      <div className={styles.pitch}>
        <div className={styles.centerLine} />
        <div className={styles.penaltyTop} />
        <div className={styles.penaltyBottom} />

        {slotDefs.map(slot => {
          const playerId = slots[slot.id];
          const player = playerId ? getPlayer(playerId) : null;
          if (!player) return null;
          const code = getCountryCode(player.ulke);
          const belowVal = getBelowName(player);

          return (
            <div key={slot.id} className={styles.slot} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
              <div className={styles.avatar}>
                {code
                  ? <img src={`https://flagcdn.com/w80/${code}.png`} alt={player.ulke} className={styles.flagImg} />
                  : <div className={styles.flagFallback}>{player.ad_soyad.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                }
              </div>
              <div className={styles.name}>
                {formatName(player.ad_soyad).includes('. ')
                  ? formatName(player.ad_soyad).split('. ')[1]
                  : player.ad_soyad.split(' ').slice(-1)[0]}
              </div>
              {belowVal && <div className={styles.belowVal}>{belowVal}</div>}
            </div>
          );
        })}
      </div>

      {subList.length > 0 && (
        <div className={styles.subsSection}>
          <button className={styles.subsToggle} onClick={() => setSubsOpen(o => !o)}>
            Yedekler ({subList.length}) {subsOpen ? '▲' : '▼'}
          </button>
          {subsOpen && (
            <div className={styles.subsList}>
              {subList.map(p => (
                <div key={p.id} className={styles.subRow}>
                  <span className={styles.subNum}>{p.jersey_number ?? '—'}</span>
                  <span className={styles.subName}>{formatName(p.ad_soyad)}</span>
                  <span className={styles.subExtra}>
                    {tab === 'bjk' && status === 'official' ? (p.bjk_total_games || 0) + ' maç' : ''}
                    {tab === 'yas' ? (calcAge(p.dogum_tarihi) ?? '') + (calcAge(p.dogum_tarihi) ? ' yaş' : '') : ''}
                    {tab === 'boy' ? (p.boy ? p.boy + 'cm' : '') : ''}
                    {tab === 'market' ? (p.market_value || '') : ''}
                  </span>
                  <span className={styles.subPos}>{p.pozisyon}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
