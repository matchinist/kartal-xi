import { useState, useEffect, useRef } from 'react';
import { formations } from '../data/formations';
import { supabase } from '../lib/supabase';
import { calcPoints, POINTS } from '../lib/scoring';
import styles from './PredictorPitch.module.css';

const POSITION_LABELS = {
  GK:'GK', LB:'LB', RB:'RB', CB:'CB', CB1:'CB', CB2:'CB', CB3:'CB',
  CDM:'CDM', CDM1:'CDM', CDM2:'CDM', CM:'CM', CM1:'CM', CM2:'CM', CM3:'CM',
  CAM:'CAM', LW:'LW', RW:'RW', LM:'LM', RM:'RM',
  ST:'ST', ST1:'ST', ST2:'ST',
};
const SLOT_TYPE = {
  GK:'gk', LB:'def', RB:'def', CB:'def', CB1:'def', CB2:'def', CB3:'def',
  CDM:'mid', CDM1:'mid', CDM2:'mid', CM:'mid', CM1:'mid', CM2:'mid', CM3:'mid', CAM:'mid', LM:'mid', RM:'mid',
  LW:'fwd', RW:'fwd', ST:'fwd', ST1:'fwd', ST2:'fwd',
};
const POS_ORDER = ['Forward','Midfielder','Defender','Goalkeeper'];
const POS_MAP = { 'Forvet':'Forward','Ortasaha':'Midfielder','Defans':'Defender','Kaleci':'Goalkeeper','Forward':'Forward','Midfielder':'Midfielder','Defender':'Defender','Goalkeeper':'Goalkeeper' };

const COUNTRY_CODES = {
  'Türkiye':'tr','Turkiye':'tr','Portugal':'pt','Portekiz':'pt','Argentina':'ar','Arjantin':'ar',
  'Brazil':'br','Brezilya':'br','France':'fr','Fransa':'fr','Germany':'de','Almanya':'de',
  'Netherlands':'nl','Hollanda':'nl','Italy':'it','İtalya':'it','Spain':'es','İspanya':'es',
  'Belgium':'be','Belçika':'be','Serbia':'rs','Sırbistan':'rs','Morocco':'ma','Fas':'ma',
  'Nigeria':'ng','Nijerya':'ng','Ghana':'gh','Gana':'gh','Senegal':'sn','Cameroon':'cm','Kamerun':'cm',
  'Japan':'jp','Japonya':'jp','Australia':'au','Avustralya':'au','Uruguay':'uy',
  'Colombia':'co','Kolombiya':'co','Norway':'no','Norveç':'no','Sweden':'se','İsveç':'se',
  'Denmark':'dk','Danimarka':'dk','Poland':'pl','Polonya':'pl','Romania':'ro','Romanya':'ro',
  'Ukraine':'ua','Ukrayna':'ua','Greece':'gr','Yunanistan':'gr','Switzerland':'ch','İsviçre':'ch',
  'Kosovo':'xk','Kosova':'xk','Albania':'al','Arnavutluk':'al','Croatia':'hr','Hırvatistan':'hr',
  'Bosnia':'ba','Bosna Hersek':'ba','Macedonia':'mk','Makedonya':'mk','Hungary':'hu','Macaristan':'hu',
  'Austria':'at','Avusturya':'at','Slovakia':'sk','Slovakya':'sk','USA':'us','Mexico':'mx',
  'Jamaica':'jm','South Korea':'kr','Güney Kore':'kr','Algeria':'dz','Cezayir':'dz',
  'Tunisia':'tn','Tunus':'tn','Egypt':'eg','Mısır':'eg','Russia':'ru','Rusya':'ru',
  'England':'gb-eng','İngiltere':'gb-eng','Scotland':'gb-sct','İskoçya':'gb-sct',
  'Wales':'gb-wls','Galler':'gb-wls','Montenegro':'me','Karadağ':'me',
  'Czech Republic':'cz','Çek Cumhuriyeti':'cz','Benin':'benin','Slovenia':'si','Slovenya':'si',
};
const CUSTOM_FLAGS = {
  'benin':'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flag_of_Benin.svg/330px-Flag_of_Benin.svg.png',

};

// MU default lineup for 4-2-3-1
const MU_DEFAULT_SLOTS = {
  gk: 'André Onana',
  rb: 'Diogo Dalot', cb1: 'Harry Maguire', cb2: 'Lisandro Martínez', lb: 'Luke Shaw',
  cdm1: 'Kobbie Mainoo', cdm2: 'Manuel Ugarte',
  rw: 'Bryan Mbeumo', cam: 'Bruno Fernandes', lw: 'Matheus Cunha',
  st: 'Benjamin Šeško',
};

const GAME_TABS = [
  { id:'lineup',   label:'LINEUP'     },
  { id:'best',     label:'BEST PLAYER'},
  { id:'firstgoal',label:'FIRST GOAL' },
  { id:'firstsub', label:'FIRST SUB'  },
];

const BADGE_BEST = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8.5" fill="#1a1a0a" stroke="#f4c430" strokeWidth="1"/>
    <path d="M9 4l1.2 3.7h3.8l-3.1 2.2 1.2 3.7L9 11.4l-3.1 2.2 1.2-3.7L4 7.7h3.8z" fill="#f4c430"/>
  </svg>
);
const BADGE_GOAL = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8.5" fill="#0a160a" stroke="#4caf80" strokeWidth="1"/>
    <circle cx="9" cy="9" r="4.5" fill="none" stroke="#4caf80" strokeWidth="1.2"/>
    <path d="M9 5.5v3.5l2 2" stroke="#4caf80" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const BADGE_SUB = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8.5" fill="#0a0a1a" stroke="#6b8dd6" strokeWidth="1"/>
    <path d="M9 5v8M6 11l3 3 3-3" stroke="#6b8dd6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 7l3-3 3 3" stroke="#6b8dd6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

function formatName(n) {
  if (!n) return '';
  const p = n.trim().split(' ');
  return p.length === 1 ? p[0] : p[0][0] + '.' + p.slice(1).join(' ');
}

function migrateSlots(old, of, nf) {
  if (!old || !Object.keys(old).length) return {};
  const by = {gk:[],def:[],mid:[],fwd:[]};
  (formations[of]||[]).forEach(s => { const n=old[s.id]; if(n) by[SLOT_TYPE[s.id.toUpperCase()]||'mid'].push(n); });
  const ns={}, c={gk:0,def:0,mid:0,fwd:0};
  (formations[nf]||[]).forEach(s => { const t=SLOT_TYPE[s.id.toUpperCase()]||'mid'; if(c[t]<by[t].length) ns[s.id]=by[t][c[t]++]; });
  return ns;
}

export default function PredictorPitch({ club, session, onRequireAuth, officialSlots, officialAnswers, players }) {
  const isMU = club.id === 'manchester-united';
  const defaultFormation = '4-2-3-1';
  const defaultSlots = isMU ? MU_DEFAULT_SLOTS : {};

  const [gameTab, setGameTab] = useState('lineup');
  const [formation, setFormation] = useState(defaultFormation);
  const [slots, setSlots] = useState(defaultSlots);
  const [picks, setPicks] = useState({ best:null, firstgoal:null, firstsub:null });
  const [pendingData, setPendingData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [tabWarning, setTabWarning] = useState('');
  const bmcRef = useRef(null);
  const stateRef = useRef({ slots, picks, formation });

  // Keep ref in sync
  useEffect(() => { stateRef.current = { slots, picks, formation }; }, [slots, picks, formation]);

  // BMC script
  useEffect(() => {
    if (bmcRef.current && bmcRef.current.children.length === 0) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      ['data-name','data-slug','data-color','data-emoji','data-font','data-text','data-outline-color','data-font-color','data-coffee-color'].forEach((attr, i) => {
        s.setAttribute(attr, ['bmc-button','catenaccio','#e8e5d4','☕','Inter','Buy me a coffee','#000000','#000000','#FFDD00'][i]);
      });
      s.async = true;
      bmcRef.current.appendChild(s);
    }
  }, []);

  const slotDefs = formations[formation]||[];

  useEffect(() => {
    setGameTab('lineup'); setSaved(false); setActiveSlot(null); setTabWarning('');
    const def = club.id === 'manchester-united' ? MU_DEFAULT_SLOTS : {};
    setSlots(def); setPicks({best:null,firstgoal:null,firstsub:null}); setFormation(defaultFormation);
  }, [club.id]);

  useEffect(() => {
    if (session) loadExisting();
    else { setSlots(isMU ? MU_DEFAULT_SLOTS : {}); setPicks({best:null,firstgoal:null,firstsub:null}); setFormation(defaultFormation); setSaved(false); }
  }, [session, club.id]);

  useEffect(() => {
    if (session && pendingData) { savePrediction(pendingData.formation, pendingData.slots, pendingData.picks); setPendingData(null); }
  }, [session]);

  async function loadExisting() {
    const def = isMU ? MU_DEFAULT_SLOTS : {};
    setSlots(def); setPicks({best:null,firstgoal:null,firstsub:null}); setFormation(defaultFormation); setSaved(false);
    const { data } = await supabase.from('lineup_predictions').select('*')
      .eq('user_id', session.user.id).eq('club_id', club.id).limit(1);
    if (data?.[0]) {
      setFormation(data[0].formation || defaultFormation);
      setSlots(data[0].slots || def);
      const p = data[0].picks || {};
      setPicks({ best:p.best||null, firstgoal:p.firstgoal||null, firstsub:p.firstsub||null });
      setSaved(true);
    }
  }

  async function savePrediction(f, s, p) {
    setSaving(true);
    await supabase.from('lineup_predictions').upsert(
      { user_id:session.user.id, club_id:club.id, formation:f, slots:s, picks:p, updated_at:new Date().toISOString() },
      { onConflict:'user_id,club_id' }
    );
    setSaved(true); setSaving(false);
  }

  function handleFormationChange(f) { setFormation(f); setSlots(migrateSlots(slots,formation,f)); setSaved(false); }

  function handleTabClick(tabId) {
    if (tabId !== 'lineup') {
      if (Object.values(slots).filter(Boolean).length < 11) {
        setTabWarning('Fill your lineup first!');
        setTimeout(()=>setTabWarning(''), 2500); return;
      }
    }
    setTabWarning(''); setGameTab(tabId);
  }

  function handleSlotClick(slotId) {
    if (gameTab === 'lineup') { setActiveSlot(slotId); return; }
    const name = slots[slotId];
    if (name) { setPicks(p => ({...p,[gameTab]:p[gameTab]===name?null:name})); setSaved(false); }
  }

  function handleRemovePlayer(e, slotId) {
    e.stopPropagation();
    setSlots(s => { const n={...s}; delete n[slotId]; return n; });
    setSaved(false);
  }

  function handlePickPlayer(name) { setSlots(s=>({...s,[activeSlot]:name})); setActiveSlot(null); setSaved(false); }

  function handleSave() {
    if (Object.values(slots).filter(Boolean).length < 11) {
      setTabWarning('Fill all 11 players first!'); setTimeout(()=>setTabWarning(''),2500); return;
    }
    if (!session) { setPendingData({formation,slots,picks}); onRequireAuth(); return; }
    savePrediction(formation, slots, picks);
  }

  const grouped = POS_ORDER.map(pos => ({
    pos,
    players: players.filter(p => {
      const mapped = POS_MAP[p.pozisyon] || p.pozisyon;
      return mapped === pos;
    }),
  })).filter(g => g.players.length > 0);

  const officialNameSet = officialSlots && players.length > 0
    ? new Set(Object.values(officialSlots).map(uuid=>{ const p=players.find(pl=>pl.id===uuid); return p?.ad_soyad?.toLowerCase().trim(); }).filter(Boolean))
    : null;

  const bonus = POINTS?.all_correct_bonus || 40;
  const perPlayer = POINTS?.correct_player || 10;
  const perPick = POINTS?.best_player || 20;

  return (
    <div className={styles.wrap}>
      <div className={styles.gameTabs}>
        {GAME_TABS.map(t => (
          <button key={t.id}
            className={`${styles.gameTab} ${gameTab===t.id?styles.gameTabActive:''}`}
            style={gameTab===t.id?{borderBottomColor:club.color,color:club.color}:{}}
            onClick={() => handleTabClick(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {tabWarning && <div className={styles.tabWarning}>{tabWarning}</div>}

      <div className={styles.tabRule}>
        {gameTab==='lineup'    && `Every correct player scores ${perPlayer} pts · All correct = +${bonus} pts bonus`}
        {gameTab==='best'      && `Correctly predict the best player · ${perPick} pts (via Sofascore rating)`}
        {gameTab==='firstgoal' && `Correctly predict the first goal scorer · ${perPick} pts`}
        {gameTab==='firstsub'  && `Correctly predict the first substituted player · ${perPick} pts`}
      </div>

      {gameTab !== 'lineup' && (
        <div className={styles.pickHint}>
          {gameTab==='best'      && 'Tap the player you think will be rated best'}
          {gameTab==='firstgoal' && 'Tap the player you think will score first'}
          {gameTab==='firstsub'  && 'Tap the player you think will be substituted first'}
        </div>
      )}

      <div className={styles.pitchOuter}>
        <div className={styles.pitch}>
          {gameTab==='lineup' && (
            <select className={styles.formationSelect} value={formation}
              onChange={e=>handleFormationChange(e.target.value)} onClick={e=>e.stopPropagation()}>
              {Object.keys(formations).map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          )}
          <div className={styles.centerCircle}/>
          <div className={styles.centerLine}/>
          <div className={styles.penaltyTop}/>
          <div className={styles.penaltyBottom}/>

          {slotDefs.map(slot => {
            const name = slots[slot.id];
            const player = name ? players.find(p=>p.ad_soyad===name) : null;
            const code = player?.ulke ? COUNTRY_CODES[player.ulke] : null;
            const flagUrl = code ? (CUSTOM_FLAGS[code]||`https://flagcdn.com/w80/${code}.png`) : null;
            const isBest   = picks.best===name && name;
            const isGoal   = picks.firstgoal===name && name;
            const isSub    = picks.firstsub===name && name;
            const isCurPick = gameTab!=='lineup' && picks[gameTab]===name && name;
            const correct = officialNameSet && name ? officialNameSet.has(name.toLowerCase().trim()) : null;
            const hasBadge = isBest||isGoal||isSub;

            return (
              <div key={slot.id}
                className={`${styles.slot} ${name?styles.slotFilled:styles.slotEmpty} ${isCurPick?styles.slotHighlight:''}`}
                style={{left:`${slot.x}%`,top:`${slot.y}%`}}
                onClick={()=>handleSlotClick(slot.id)}
              >
                <div className={styles.badgeRow}>
                  {hasBadge && <span className={styles.badge}>{isBest?BADGE_BEST:isGoal?BADGE_GOAL:BADGE_SUB}</span>}
                </div>
                <div className={styles.slotAvatarWrap}>
                  <div className={styles.slotAvatar}>
                    {name
                      ? (flagUrl
                          ? <img src={flagUrl} alt={player?.ulke} className={styles.flagImg}/>
                          : <span className={styles.initials}>{name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>)
                      : <span className={styles.slotPlus}>+</span>}
                  </div>
                  {name && gameTab==='lineup' && (
                    <button className={styles.removeBtn} onClick={e=>handleRemovePlayer(e,slot.id)}>×</button>
                  )}
                </div>
                <div className={styles.slotName}>
                  {name ? formatName(name) : (POSITION_LABELS[slot.id.toUpperCase()]||slot.label)}
                </div>
                {correct !== null && (
                  <div className={correct?styles.slotPtsGood:styles.slotPtsBad}>
                    {correct ? perPlayer : 0}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.saveBtn}
          style={saved?{background:'#1a3a1a',color:'#4caf80'}:{background:club.color}}
          onClick={handleSave}
          disabled={saving||saved}
        >
          {saving?'Saving...':saved?'✓ Saved':'Save'}
        </button>
        <div ref={bmcRef} className={styles.bmcWrap} />
      </div>

      {activeSlot !== null && (
        <div className={styles.modalOverlay} onClick={()=>setActiveSlot(null)}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalLabel}>{POSITION_LABELS[activeSlot.toUpperCase()]||'Select Player'}</div>
            <div className={styles.playerList}>
              {players.length===0 && <div className={styles.playerListEmpty}>No players added for {club.name} yet.</div>}
              {grouped.map(({pos,players:group})=>(
                <div key={pos}>
                  <div className={styles.posLabel}>{pos}</div>
                  {group.map(p=>{
                    const used = Object.entries(slots).some(([sid,n])=>n===p.ad_soyad&&sid!==activeSlot);
                    return (
                      <button key={p.id}
                        className={`${styles.playerOption} ${used?styles.playerOptionUsed:''}`}
                        onClick={()=>handlePickPlayer(p.ad_soyad)} type="button">
                        {p.jersey_number!=null&&<span className={styles.playerNum} style={{color:club.color}}>{p.jersey_number}</span>}
                        <span className={styles.playerName}>{p.ad_soyad}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <button className={styles.modalBtnGhost} onClick={()=>setActiveSlot(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
