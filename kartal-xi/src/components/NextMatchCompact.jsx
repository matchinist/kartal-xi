import styles from './NextMatchCompact.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function NextMatchCompact({ match, club, onPrev, onNext, hasPrev, hasNext }) {
  const showArrows = hasPrev || hasNext;
  if (!match) return <div className={styles.wrap}><div className={styles.empty}>No upcoming matches</div></div>;
  const hasScore = match.home_score !== null && match.home_score !== undefined &&
                   match.away_score !== null && match.away_score !== undefined;
  return (
    <div className={styles.wrap}>
      {showArrows && <button className={styles.arrow} onClick={onPrev} disabled={!hasPrev}>‹</button>}
      <div className={styles.content}>
        <div className={styles.meta}>{match.tournament} · {formatDate(match.match_date)}</div>
        <div className={styles.teams}>
          <span className={styles.team}>{match.home_team}</span>
          {hasScore
            ? <span className={styles.score} style={{ color: club?.color }}>{match.home_score} – {match.away_score}</span>
            : <span className={styles.vs}>vs</span>}
          <span className={styles.team}>{match.away_team}</span>
        </div>
      </div>
      {showArrows && <button className={styles.arrow} onClick={onNext} disabled={!hasNext}>›</button>}
    </div>
  );
}
