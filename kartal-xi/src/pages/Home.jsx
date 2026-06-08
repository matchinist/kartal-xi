import { nextMatch, seasonStats, recentMatches, topScorers, standings } from '../data/mockData';
import StatBar from '../components/StatBar';
import NextMatch from '../components/NextMatch';
import RecentMatches from '../components/RecentMatches';
import Sidebar from '../components/Sidebar';
import SectionLabel from '../components/SectionLabel';
import styles from './Home.module.css';

export default function Home() {
  return (
    <>
      <div className={styles.heroStrip}>
        <div className={styles.heroTitle}>
          BEŞİKTAŞ<br /><span>JK</span>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.heroMetaLine}>Season</div>
          <div className={styles.heroSeason}>2025 – 26</div>
          <div className={styles.heroMetaLine} style={{ marginTop: '6px' }}>All competitions</div>
        </div>
      </div>

      <StatBar stats={seasonStats} />

      <SectionLabel tag="Live countdown" dot>Next match</SectionLabel>
      <NextMatch match={nextMatch} />

      <div className={styles.twoCol}>
        <div className={styles.mainCol}>
          <SectionLabel>Recent matches</SectionLabel>
          <RecentMatches matches={recentMatches} />
        </div>
        <Sidebar scorers={topScorers} standings={standings} />
      </div>

      <footer className={styles.footer}>
        <div>KARTAL STATS · <span className={styles.gold}>Beşiktaş JK</span> · 2025–26</div>
        <div>Data curated manually · Updated after every match</div>
      </footer>
    </>
  );
}
