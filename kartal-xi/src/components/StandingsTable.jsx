import styles from './StandingsTable.module.css';

const MOCK_H2H = {
  'Galatasaray':    { home: { result:'L', score:'1-2', round:14 }, away: { result:'W', score:'2-1', round:28 } },
  'Fenerbahce':     { home: { result:'W', score:'2-0', round:8  }, away: { result:'D', score:'1-1', round:22 } },
  'Fenerbahçe':     { home: { result:'W', score:'2-0', round:8  }, away: { result:'D', score:'1-1', round:22 } },
  'Trabzonspor':    { home: { result:'W', score:'3-1', round:5  }, away: { result:'W', score:'2-0', round:19 } },
  'Basaksehir':     { home: { result:'D', score:'0-0', round:11 }, away: { result:'W', score:'1-0', round:25 } },
  'Başakşehir':     { home: { result:'D', score:'0-0', round:11 }, away: { result:'W', score:'1-0', round:25 } },
  'Goztepe':        { home: { result:'W', score:'2-1', round:3  }, away: { result:'W', score:'3-0', round:17 } },
  'Göztepe':        { home: { result:'W', score:'2-1', round:3  }, away: { result:'W', score:'3-0', round:17 } },
  'Samsunspor':     { home: { result:'W', score:'1-0', round:7  }, away: { result:'D', score:'2-2', round:21 } },
  'Rizespor':       { home: { result:'W', score:'4-0', round:2  }, away: { result:null, score:null, round:31 } },
  'Konyaspor':      { home: { result:'W', score:'2-0', round:9  }, away: { result:null, score:null, round:30 } },
  'Kocaelispor':    { home: { result:'D', score:'1-1', round:6  }, away: { result:null, score:null, round:29 } },
  'Alanyaspor':     { home: { result:'W', score:'3-1', round:4  }, away: { result:null, score:null, round:32 } },
  'Gaziantep':      { home: { result:'W', score:'2-0', round:10 }, away: { result:null, score:null, round:33 } },
  'Kasimpasa':      { home: { result:'L', score:'0-1', round:13 }, away: { result:null, score:null, round:27 } },
  'Kasımpaşa':      { home: { result:'L', score:'0-1', round:13 }, away: { result:null, score:null, round:27 } },
  'Genclerbirligi': { home: { result:'W', score:'3-0', round:1  }, away: { result:null, score:null, round:26 } },
  'Gençlerbirliği': { home: { result:'W', score:'3-0', round:1  }, away: { result:null, score:null, round:26 } },
  'Eyupspor':       { home: { result:'D', score:'0-0', round:15 }, away: { result:null, score:null, round:34 } },
  'Eyüpspor':       { home: { result:'D', score:'0-0', round:15 }, away: { result:null, score:null, round:34 } },
  'Antalyaspor':    { home: { result:'W', score:'2-1', round:12 }, away: { result:null, score:null, round:24 } },
  'Kayserispor':    { home: { result:'W', score:'4-1', round:16 }, away: { result:null, score:null, round:23 } },
  'Karagumruk':     { home: { result:'W', score:'2-0', round:18 }, away: { result:null, score:null, round:20 } },
  'Karagümrük':     { home: { result:'W', score:'2-0', round:18 }, away: { result:null, score:null, round:20 } },
};

function H2HBadge({ data }) {
  if (data === null) return <div className={styles.h2hSelf}>—</div>;
  if (!data) return <div className={styles.h2hEmpty}>?</div>;
  if (!data.result) return <div className={styles.h2hPending}>H{data.round}</div>;
  return (
    <div className={`${styles.h2hBadge} ${styles['h2h'+data.result]}`} title={data.score}>
      <span className={styles.h2hResult}>{data.result}</span>
      <span className={styles.h2hScore}>{data.score}</span>
    </div>
  );
}

export default function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) return null;
  const isBJK = name => name && (name.toLowerCase().includes('besiktas') || name.toLowerCase().includes('beşiktaş'));

  return (
    <div className={styles.wrap}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPos}>#</th>
              <th className={styles.thTeam}>Takim</th>
              <th className={styles.thNum} title="Oynadigi">O</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Galibiyet">G</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Beraberlik">B</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Maglubiyet">M</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Atilan Gol">AG</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Yenilen Gol">YG</th>
              <th className={`${styles.thNum} ${styles.desktopOnly}`} title="Averaj">AV</th>
              <th className={styles.thPts}>P</th>
              <th className={styles.thH2h}>Ev</th>
              <th className={styles.thH2h}>Dep</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => {
              const name = s.team || s.name;
              const bjk = isBJK(name);
              const h2h = MOCK_H2H[name];
              const gd = s.gd != null ? (s.gd > 0 ? '+'+s.gd : s.gd) : (s.gf != null ? (s.gf-s.ga > 0 ? '+'+(s.gf-s.ga) : s.gf-s.ga) : '—');
              return (
                <tr key={s.pos} className={bjk ? styles.bjkRow : ''}>
                  <td className={`${styles.tdPos} ${s.pos <= 6 ? styles.europe : ''} ${bjk ? styles.bjkAccent : ''}`}>{s.pos}</td>
                  <td className={`${styles.tdTeam} ${bjk ? styles.bjkAccent : ''}`}>{name}</td>
                  <td className={styles.tdNum}>{s.played}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{s.won || '—'}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{s.drawn || '—'}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{s.lost || '—'}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{s.gf || '—'}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{s.ga || '—'}</td>
                  <td className={`${styles.tdNum} ${styles.desktopOnly}`}>{gd}</td>
                  <td className={`${styles.tdPts} ${bjk ? styles.bjkAccent : ''}`}>{s.pts}</td>
                  <td className={styles.tdH2h}><H2HBadge data={bjk ? null : h2h?.home} /></td>
                  <td className={styles.tdH2h}><H2HBadge data={bjk ? null : h2h?.away} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
