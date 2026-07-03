import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CLUBS, LEAGUES, getClubsByLeague } from '../data/clubs';
import AuthModal from './AuthModal';
import styles from './Navbar.module.css';

export default function Navbar({ activeClub, onClubChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const clubRef = useRef(null);
  const menuRef = useRef(null);
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const leagueClubs = getClubsByLeague(leagueId);
  const currentLeague = LEAGUES.find(l => l.id === leagueId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handle(e) {
      if (clubRef.current && !clubRef.current.contains(e.target)) setClubOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const basePath = `/${leagueId}`;

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} title="Home">
            ←
          </button>
          <NavLink to={basePath} className={styles.logo}>
            <div className={styles.logoMark}>M</div>
            <span className={styles.logoText}>Mister</span>
          </NavLink>
          {currentLeague && leagueClubs.length > 1 && (
            <span className={styles.leagueName}>{currentLeague.name}</span>
          )}
        </div>

        <div className={styles.navRight}>
          {/* Club picker - only show if league has multiple clubs */}
          {leagueClubs.length > 1 && activeClub && (
            <div className={styles.clubPickerWrap} ref={clubRef}>
              <button
                className={styles.clubPickerBtn}
                style={{ borderColor: activeClub.color, color: activeClub.color }}
                onClick={() => setClubOpen(o => !o)}
              >
                {activeClub.short} ▾
              </button>
              {clubOpen && (
                <div className={styles.clubDropdown}>
                  {leagueClubs.map(c => (
                    <button key={c.id}
                      className={`${styles.clubDropItem} ${activeClub?.id === c.id ? styles.clubDropActive : ''}`}
                      style={activeClub?.id === c.id ? { color: c.color } : {}}
                      onClick={() => { onClubChange?.(c); setClubOpen(false); }}
                    >{c.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!session && (
            <button className={styles.authBtn} onClick={() => setShowAuth(true)}>Login</button>
          )}

          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.burger} onClick={() => setMenuOpen(o => !o)}>
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen1 : ''}`} />
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen2 : ''}`} />
              <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerOpen3 : ''}`} />
            </button>
            {menuOpen && (
              <div className={styles.menuPopup}>
                <NavLink to={`${basePath}/leaderboard`} className={styles.menuLink} onClick={() => setMenuOpen(false)}>Leaderboard</NavLink>
                <NavLink to={`${basePath}/settings`} className={styles.menuLink} onClick={() => setMenuOpen(false)}>Settings</NavLink>
                {session && (
                  <>
                    <div className={styles.menuDivider} />
                    <div className={styles.menuUser}>{session.user.email}</div>
                    <button className={styles.menuLogout} onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}>Logout</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}
