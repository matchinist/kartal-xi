import styles from './StatBar.module.css';

export default function StatBar({ stats }) {
  return (
    <div className={styles.bar}>
      {stats.map((s) => (
        <div className={styles.cell} key={s.key}>
          <div className={styles.key}>{s.key}</div>
          <div className={styles.val}>{s.value}</div>
          {s.sub   && <div className={styles.sub}>{s.sub}</div>}
          {s.delta && <div className={`${styles.delta} ${s.up ? styles.up : styles.dn}`}>
            {s.up ? '↑' : '↓'} {s.delta}
          </div>}
        </div>
      ))}
    </div>
  );
}
