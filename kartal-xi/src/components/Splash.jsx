import { useState } from 'react';
import { CLUBS } from '../data/clubs';
import styles from './Splash.module.css';

export default function Splash({ onEnter }) {
  const [selected, setSelected] = useState(CLUBS[0]);
  const [leaving, setLeaving] = useState(false);

  function handleEnter() {
    setLeaving(true);
    setTimeout(() => onEnter(selected), 400);
  }

  return (
    <div className={`${styles.wrap} ${leaving ? styles.leaving : ''}`}>
      <div className={styles.pitchBg}>
        <div className={styles.pitchLine} />
        <div className={styles.pitchCircle} />
        <div className={styles.pitchTop} />
        <div className={styles.pitchBottom} />
      </div>

      <div className={styles.inner}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>M</div>
          <span className={styles.logoText}>Mister</span>
        </div>

        <div className={styles.tagline}>Kadro Tahmin Oyunu</div>

        <div className={styles.sub}>
          Her maç öncesi kadroyu, en iyi oyuncuyu,<br/>
          ilk gol atanı ve ilk çıkanı tahmin et.<br/>
          En iyi mister olduğunu kanıtla.
        </div>

        <div className={styles.clubs}>
          {CLUBS.map(c => (
            <button key={c.id}
              className={`${styles.clubBtn} ${selected.id === c.id ? styles.clubBtnActive : ''}`}
              style={selected.id === c.id ? { borderColor: c.color, color: c.color } : {}}
              onClick={() => setSelected(c)}
            >{c.name}</button>
          ))}
        </div>

        <button className={styles.enterBtn} style={{ background: selected.color }} onClick={handleEnter}>
          Oyna →
        </button>
      </div>
    </div>
  );
}
