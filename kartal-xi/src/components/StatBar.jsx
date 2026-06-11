import styles from './StatBar.module.css';

export default function StatBar({ stats, season, league }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.season}>{season || '2026/27'}</span>
        <span className={styles.sep}>//</span>
        <span className={styles.league}>{league || 'Tum Kulvarlar'}</span>
      </div>
      <div className={styles.barWrap}>
        <div className={styles.bar}>
          {stats.map((s) => (
            <div className={styles.cell} key={s.key}>
              <div className={styles.key}>{s.key}</div>
              <div className={styles.val}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
