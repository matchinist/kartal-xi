import styles from './Sidebar.module.css';

export default function Sidebar({ scorers, standings }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.secLabel}>Top scorers</div>
      {scorers.map((s) => (
        <div className={styles.scorerRow} key={s.rank}>
          <div className={styles.rank}>{s.rank}</div>
          <div className={styles.info}>
            <div className={styles.name}>{s.name}</div>
            <div className={styles.pos}>{s.pos} · All comps</div>
          </div>
          <div className={styles.goals}>{s.goals}</div>
        </div>
      ))}

      <div className={styles.secLabel} style={{ marginTop: '4px' }}>Süper Lig table</div>
      {standings.map((s) => (
        <div className={`${styles.stRow} ${s.me ? styles.me : ''}`} key={s.pos}>
          <span className={`${styles.stPos} ${s.pos <= 2 ? styles.champ : ''} ${s.me ? styles.gold : ''}`}>
            {s.pos}
          </span>
          <span className={`${styles.stName} ${s.me ? styles.gold : ''}`}>{s.name}</span>
          <span className={styles.stPts}>{s.pts}</span>
          <span className={`${styles.stGd} ${s.me ? styles.gold : ''}`}>{s.gd}</span>
        </div>
      ))}
    </div>
  );
}
