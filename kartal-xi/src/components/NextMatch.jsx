import { useState, useEffect } from 'react';
import styles from './NextMatch.module.css';

function pad(n) {
  return String(n).padStart(2, '0');
}

function getCountdown(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return { d: '00', h: '00', m: '00', s: '00' };
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  };
}

function formatDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} · ${hh}:${min}`;
}

export default function NextMatch({ match }) {
  const [cd, setCd] = useState(getCountdown(match.match_date));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(match.match_date)), 1000);
    return () => clearInterval(t);
  }, [match.match_date]);

  const isBJKHome = match.home_team === 'Beşiktaş';

  return (
    <div className={styles.wrap}>
      <div className={styles.corner + ' ' + styles.tl} />
      <div className={styles.corner + ' ' + styles.tr} />
      <div className={styles.corner + ' ' + styles.bl} />
      <div className={styles.corner + ' ' + styles.br} />

      <div className={styles.matchup}>
        <div className={`${styles.team} ${isBJKHome ? styles.bjk : ''}`}>
          <div className={styles.teamName}>{match.home_team}</div>
          <div className={styles.teamSide}>Home</div>
        </div>

        <div className={styles.vsBlock}>
          <div className={styles.vsDivider} />
          <div className={styles.vs}>VS</div>
          <div className={styles.vsDivider} />
        </div>

        <div className={`${styles.team} ${styles.away} ${!isBJKHome ? styles.bjk : ''}`}>
          <div className={styles.teamName}>{match.away_team}</div>
          <div className={styles.teamSide}>Away</div>
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoCell}>
          <div className={styles.infoKey}>Stadium</div>
          <div className={styles.infoVal}>{match.stadium}</div>
        </div>
        <div className={styles.infoCell}>
          <div className={styles.infoKey}>Competition</div>
          <div className={`${styles.infoVal} ${styles.gold}`}>{match.tournament}</div>
        </div>
        <div className={styles.infoCell}>
          <div className={styles.infoKey}>Kick-off</div>
          <div className={`${styles.infoVal} ${styles.gold}`}>{formatDate(match.match_date)}</div>
        </div>
      </div>

      <div className={styles.countdown}>
        {[['d', 'Days'], ['h', 'Hours'], ['m', 'Mins'], ['s', 'Secs']].map(([key, label], i) => (
          <>
            {i > 0 && <div className={styles.cdSep}>:</div>}
            <div className={styles.cdBlock} key={key}>
              <div className={styles.cdNum}>{cd[key]}</div>
              <div className={styles.cdUnit}>{label}</div>
            </div>
          </>
        ))}
      </div>
    </div>
  );
}
