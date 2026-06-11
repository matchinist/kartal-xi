import { useState } from 'react';
import { formations } from '../data/formations';
import styles from './PitchLineup.module.css';

export default function PitchLineup({ players, value, onChange }) {
  const [formation, setFormation] = useState(value?.formation || '4-3-3');
  const [slots, setSlots] = useState(value?.slots || {});
  const [status, setStatus] = useState(value?.status || 'expected');
  const [subs, setSubs] = useState(value?.subs || {});
  const [dragging, setDragging] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragFromSub, setDragFromSub] = useState(null);

  const slotDefs = formations[formation];

  function emit(f, s, st, sb) { onChange({ formation: f, slots: s, status: st, subs: sb }); }

  function handleFormationChange(f) { setFormation(f); setSlots({}); emit(f, {}, status, subs); }
  function handleStatusChange(s) { setStatus(s); emit(formation, slots, s, subs); }

  function handleDragStartPlayer(playerId) { setDragging(playerId); setDragFrom(null); setDragFromSub(null); }
  function handleDragStartSlot(slotId, playerId) { setDragging(playerId); setDragFrom(slotId); setDragFromSub(null); }
  function handleDragStartSub(subKey, playerId) { setDragging(playerId); setDragFrom(null); setDragFromSub(subKey); }

  function handleDropOnSlot(slotId) {
    if (!dragging) return;
    const newSlots = { ...slots };
    const newSubs = { ...subs };
    if (dragFrom) delete newSlots[dragFrom];
    if (dragFromSub) delete newSubs[dragFromSub];
    const existing = Object.entries(newSlots).find(([, v]) => v === dragging);
    if (existing) delete newSlots[existing[0]];
    newSlots[slotId] = dragging;
    setSlots(newSlots); setSubs(newSubs);
    emit(formation, newSlots, status, newSubs);
    setDragging(null); setDragFrom(null); setDragFromSub(null);
  }

  function handleDropOnSubs(e) {
    e.preventDefault();
    if (!dragging) return;
    const newSlots = { ...slots };
    const newSubs = { ...subs };
    if (dragFrom) delete newSlots[dragFrom];
    if (dragFromSub) delete newSubs[dragFromSub];
    // Add to subs if not already there
    const alreadyInSubs = Object.values(newSubs).includes(dragging);
    if (!alreadyInSubs) {
      const subKey = 'sub_' + Date.now();
      newSubs[subKey] = dragging;
    }
    setSlots(newSlots); setSubs(newSubs);
    emit(formation, newSlots, status, newSubs);
    setDragging(null); setDragFrom(null); setDragFromSub(null);
  }

  function handleDropOnBench(e) {
    e.preventDefault();
    if (!dragging) return;
    const newSlots = { ...slots };
    const newSubs = { ...subs };
    if (dragFrom) delete newSlots[dragFrom];
    if (dragFromSub) delete newSubs[dragFromSub];
    setSlots(newSlots); setSubs(newSubs);
    emit(formation, newSlots, status, newSubs);
    setDragging(null); setDragFrom(null); setDragFromSub(null);
  }

  function handleDragOver(e) { e.preventDefault(); }

  const placedIds = [...Object.values(slots), ...Object.values(subs)];
  function getPlayer(id) { return players.find(p => p.id === id); }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <div className={styles.formationPicker}>
          {Object.keys(formations).map(f => (
            <button key={f} className={`${styles.fBtn} ${formation === f ? styles.fActive : ''}`}
              onClick={() => handleFormationChange(f)} type="button">{f}</button>
          ))}
        </div>
        <div className={styles.statusPicker}>
          <button className={`${styles.statusBtn} ${status === 'expected' ? styles.statusActive : ''}`}
            onClick={() => handleStatusChange('expected')} type="button">Beklenen</button>
          <button className={`${styles.statusBtn} ${status === 'official' ? styles.statusOfficial : ''}`}
            onClick={() => handleStatusChange('official')} type="button">Resmi</button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* PITCH */}
        <div className={styles.pitchWrap}>
          <div className={styles.pitch}>
            <div className={styles.centerCircle} />
            <div className={styles.centerLine} />
            <div className={styles.penaltyTop} />
            <div className={styles.penaltyBottom} />
            <div className={styles.goalTop} />
            <div className={styles.goalBottom} />
            {slotDefs.map(slot => {
              const playerId = slots[slot.id];
              const player = playerId ? getPlayer(playerId) : null;
              return (
                <div key={slot.id}
                  className={`${styles.slot} ${playerId ? styles.slotFilled : styles.slotEmpty} ${dragging && !playerId ? styles.slotTarget : ''}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  onDragOver={handleDragOver} onDrop={() => handleDropOnSlot(slot.id)}
                  draggable={!!playerId}
                  onDragStart={playerId ? () => handleDragStartSlot(slot.id, playerId) : undefined}
                >
                  {player ? (
                    <>
                      <div className={styles.slotAvatar}>
                        {player.jersey_number != null
                          ? <span className={styles.jerseyNum}>{player.jersey_number}</span>
                          : player.ad_soyad.split(' ').map(w => w[0]).join('').slice(0,2)}
                      </div>
                      <div className={styles.slotName}>
                        {player.jersey_number != null ? `${player.jersey_number}. ` : ''}
                        {player.ad_soyad.split(' ').slice(-1)[0]}
                      </div>
                    </>
                  ) : (
                    <div className={styles.slotLabel}>{slot.label}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SUBSTITUTES ZONE */}
          <div className={styles.subsZone} onDragOver={handleDragOver} onDrop={handleDropOnSubs}>
            <div className={styles.subsZoneLabel}>Yedekler — surukle ve birak</div>
            <div className={styles.subsList}>
              {Object.entries(subs).map(([key, pid]) => {
                const p = getPlayer(pid);
                if (!p) return null;
                return (
                  <div key={key} className={styles.subChip}
                    draggable onDragStart={() => handleDragStartSub(key, pid)}>
                    <span className={styles.subNum}>{p.jersey_number ?? '—'}</span>
                    <span className={styles.subName}>{p.ad_soyad}</span>
                    <span className={styles.subPos}>{p.pozisyon}</span>
                  </div>
                );
              })}
              {Object.keys(subs).length === 0 && (
                <div className={styles.subsEmpty}>Yedek eklemek icin oyuncu surukleyin</div>
              )}
            </div>
          </div>
        </div>

        {/* PLAYER LIST */}
        <div className={styles.playerList} onDragOver={handleDragOver} onDrop={handleDropOnBench}>
          <div className={styles.playerListTitle}>Kadro ({players.length})</div>
          <div className={styles.playerListHint}>Sahaya veya yedek alanina surukle</div>
          {['Kaleci','Defans','Ortasaha','Forvet'].map(pos => {
            const group = players.filter(p => p.pozisyon === pos);
            if (!group.length) return null;
            return (
              <div key={pos} className={styles.posGroup}>
                <div className={styles.posLabel}>{pos}</div>
                {group.map(p => (
                  <div key={p.id}
                    className={`${styles.playerChip} ${placedIds.includes(p.id) ? styles.placed : ''}`}
                    draggable={!placedIds.includes(p.id)}
                    onDragStart={() => handleDragStartPlayer(p.id)}
                  >
                    {p.jersey_number != null && <span className={styles.chipNum}>{p.jersey_number}</span>}
                    <span className={styles.chipName}>{p.ad_soyad}</span>
                    {placedIds.includes(p.id) && <span className={styles.chipCheck}>✓</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.counter}>
        {Object.values(slots).filter(Boolean).length} / 11 ilk 11 · {Object.keys(subs).length} yedek · {status === 'official' ? 'Resmi Kadro' : 'Beklenen Kadro'}
      </div>
    </div>
  );
}
