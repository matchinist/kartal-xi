import { useState, useEffect } from 'react';
import styles from './NextMatch.module.css';

function pad(n) { return String(n).padStart(2, '0'); }

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
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function NextMatch({ match }) {
  const [cd, setCd] = useState(getCountdown(match.match_date));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(match.match_date)), 1000);
    return () => clearInterval(t);
  }, [match.match_date]);

  return (
    <div className={styles.wrap}>
      <div className={styles.eventHeader}>
        <span className={styles.tournament}>{match.tournament}</span>
        <span className={styles.dot} />
        <span className={styles.stadium}>{match.stadium}</span>
        <span className={styles.dot} />
        <span className={styles.date}>{formatDate(match.match_date)}</span>
      </div>

      <div className={styles.matchup}>
        <div className={styles.teamName}>{match.home_team}</div>
        <div className={styles.vsBlock}>
          <div className={styles.vsDivider} />
          <div className={styles.vs}>VS</div>
          <div className={styles.vsDivider} />
        </div>
        <div className={styles.teamName}>{match.away_team}</div>
      </div>

      <div className={styles.countdown}>
        {[['d', 'Gun'], ['h', 'Saat'], ['m', 'Dak'], ['s', 'Sn']].map(([key, label], i) => (
          <div key={key} className={styles.cdGroup}>
            {i > 0 && <div className={styles.cdSep}>:</div>}
            <div className={styles.cdBlock}>
              <div className={styles.cdNum}>{cd[key]}</div>
              <div className={styles.cdUnit}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
