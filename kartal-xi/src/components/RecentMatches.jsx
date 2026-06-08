import styles from './RecentMatches.module.css';

const COMP_LABELS = { SL: 'SL', UCL: 'UCL', TC: 'TC' };

export default function RecentMatches({ matches }) {
  const form = matches.map((m) => {
    const isBJKHome = m.home === 'Beşiktaş';
    return isBJKHome
      ? m.hs > m.as ? 'W' : m.hs === m.as ? 'D' : 'L'
      : m.as > m.hs ? 'W' : m.as === m.hs ? 'D' : 'L';
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.formRow}>
        <span className={styles.formLabel}>Form</span>
        {form.map((r, i) => (
          <div key={i} className={`${styles.fd} ${styles['fd' + r]}`}>{r}</div>
        ))}
        <span className={styles.formNote}>Last 5</span>
      </div>

      {matches.map((m, i) => {
        const isBJKHome = m.home === 'Beşiktaş';
        return (
          <div className={styles.row} key={i}>
            <span className={`${styles.compBadge} ${styles['comp' + m.comp]}`}>
              {COMP_LABELS[m.comp]}
            </span>

            <div className={styles.teams}>
              <span className={`${styles.team} ${isBJKHome ? styles.bjk : ''}`}>{m.home}</span>
              <div className={styles.score}>
                <span className={styles.scoreHome}>{m.hs}</span>
                <span className={styles.scoreSep}>—</span>
                <span className={styles.scoreAway}>{m.as}</span>
              </div>
              <span className={`${styles.team} ${!isBJKHome ? styles.bjk : ''}`}>{m.away}</span>
            </div>

            <span className={`${styles.resBadge} ${styles['res' + m.result]}`}>{m.result}</span>
            <span className={styles.date}>{m.date}</span>
          </div>
        );
      })}
    </div>
  );
}
