import styles from './SectionLabel.module.css';

export default function SectionLabel({ children, tag, dot }) {
  return (
    <div className={styles.label}>
      <span className={styles.title}>{children}</span>
      {tag && (
        <span className={styles.tag}>
          {dot && <span className={`${styles.dot} pulse`} />}
          {tag}
        </span>
      )}
    </div>
  );
}
