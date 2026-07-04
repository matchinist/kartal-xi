import { useState, useEffect } from 'react';
import styles from './PitchLineup.module.css';

const SLOT_LABELS = {
  gk:'GK', rb:'RB', cb1:'CB', cb2:'CB', cb3:'CB', lb:'LB',
  cdm1:'CDM', cdm2:'CDM', cm1:'CM', cm2:'CM', cm3:'CM', cam:'CAM',
  rm:'RM', lm:'LM', rw:'RW', lw:'LW', st:'ST', st1:'ST', st2:'ST',
};
const POS_ORDER = ['Forvet','Ortasaha','Defans','Kaleci'];

export default function PitchLineup({ players, value, onChange }) {
  const [formation, setFormation] = useState(value?.formation || '4-3-3');
  const [slots, setSlots] = useState(value?.slots || {});
  const [status, setStatus] = useState(value?.status || 'expected');
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    if (value) {
      setFormation(value.formation || '4-3-3');
      setSlots(value.slots || {});
      setStatus(value.status || 'expected');
    }
  }, [value]);

  function update(f, s, st) {
    onChange({ formation: f, slots: s, subs: {}, status: st });
  }

  function handleSlotClick(slotId) { setActiveSlot(slotId); }

  function handlePickPlayer(playerId) {
    const newSlots = { ...slots, [activeSlot]: playerId };
    setSlots(newSlots);
    update(formation, newSlots, status);
    setActiveSlot(null);
  }

  function handleFormationChange(f) {
    setFormation(f);
    update(f, slots, status);
  }

  function handleStatusChange(s) {
    setStatus(s);
    update(formation, slots, s);
  }

  // Import formations inline to avoid circular deps
  const formationDefs = {
    '4-3-3': [
      {id:'gk',x:50,y:88},{id:'rb',x:82,y:70},{id:'cb1',x:61,y:70},{id:'cb2',x:39,y:70},{id:'lb',x:18,y:70},
      {id:'cm1',x:80,y:45},{id:'cm2',x:50,y:45},{id:'cm3',x:20,y:45},
      {id:'rw',x:80,y:18},{id:'st',x:50,y:18},{id:'lw',x:20,y:18},
    ],
    '4-2-3-1': [
      {id:'gk',x:50,y:88},{id:'rb',x:82,y:72},{id:'cb1',x:61,y:72},{id:'cb2',x:39,y:72},{id:'lb',x:18,y:72},
      {id:'cdm1',x:62,y:53},{id:'cdm2',x:38,y:53},
      {id:'rw',x:80,y:33},{id:'cam',x:50,y:33},{id:'lw',x:20,y:33},
      {id:'st',x:50,y:14},
    ],
    '4-4-2': [
      {id:'gk',x:50,y:88},{id:'rb',x:85,y:70},{id:'cb1',x:62,y:70},{id:'cb2',x:38,y:70},{id:'lb',x:15,y:70},
      {id:'rm',x:85,y:45},{id:'cm1',x:62,y:45},{id:'cm2',x:38,y:45},{id:'lm',x:15,y:45},
      {id:'st1',x:62,y:18},{id:'st2',x:38,y:18},
    ],
  };

  const slotDefs = formationDefs[formation] || formationDefs['4-3-3'];
  const grouped = POS_ORDER.map(pos => ({ pos, players: players.filter(p => p.pozisyon === pos) })).filter(g => g.players.length);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <select className={styles.sel} value={formation} onChange={e => handleFormationChange(e.target.value)}>
          {Object.keys(formationDefs).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className={styles.sel} value={status} onChange={e => handleStatusChange(e.target.value)}>
          <option value="expected">Expected</option>
          <option value="official">Official</option>
          <option value="default">Default (starting template)</option>
        </select>
      </div>

      <div className={styles.pitch}>
        {slotDefs.map(slot => {
          const pid = slots[slot.id];
          const player = pid ? players.find(p => p.id === pid) : null;
          return (
            <div key={slot.id} className={`${styles.slot} ${pid ? styles.slotFilled : ''}`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => handleSlotClick(slot.id)}>
              <div className={styles.avatar}>{player ? (player.jersey_number || player.ad_soyad?.slice(0,2)) : (SLOT_LABELS[slot.id] || slot.id.toUpperCase())}</div>
              {player && <div className={styles.name}>{player.ad_soyad?.split(' ').slice(-1)[0]}</div>}
            </div>
          );
        })}
      </div>

      {activeSlot && (
        <div className={styles.overlay} onClick={() => setActiveSlot(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Select Player — {SLOT_LABELS[activeSlot] || activeSlot}</div>
            {grouped.map(({ pos, players: group }) => (
              <div key={pos}>
                <div className={styles.posLabel}>{pos}</div>
                {group.map(p => (
                  <button key={p.id} className={styles.playerBtn} onClick={() => handlePickPlayer(p.id)}>
                    {p.jersey_number ? p.jersey_number + '. ' : ''}{p.ad_soyad}
                  </button>
                ))}
              </div>
            ))}
            <button className={styles.cancelBtn} onClick={() => setActiveSlot(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
