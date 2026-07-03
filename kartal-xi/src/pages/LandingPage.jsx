import { useNavigate } from 'react-router-dom';
import { LEAGUES } from '../data/clubs';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>M</div>
          <span className={styles.logoText}>Mister</span>
        </div>
        <div className={styles.tagline}>Squad Prediction Game</div>
        <div className={styles.sub}>
          Predict the starting lineup before kickoff,<br/>
          score points, top the leaderboard,<br/>
          prove you're the best mister.
        </div>
      </div>

      <div className={styles.leagues}>
        {LEAGUES.map(league => (
          <button
            key={league.id}
            className={styles.leagueCard}
            onClick={() => navigate(league.path)}
            style={{ '--league-color': league.color }}
          >
            <div className={styles.cardAccent} style={{ background: league.color }} />
            <div className={styles.cardContent}>
              <div className={styles.cardName}>{league.name}</div>
              <div className={styles.cardSub}>{league.subtitle}</div>
              <div className={styles.cardCta} style={{ color: league.color }}>Play →</div>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.pitchBg}>
        <div className={styles.pitchLine} />
        <div className={styles.pitchCircle} />
      </div>
    </div>
  );
}
