export const POINTS = {
  correct_player: 10,
  all_correct_bonus: 40,
  best_player: 20,
  first_goal: 20,
  first_sub: 20,
};

export function calcPoints(userSlots, officialSlots, players) {
  if (!userSlots || !officialSlots || !players) return { points: 0, correct: 0 };
  const idToName = {};
  players.forEach(p => { idToName[p.id] = p.ad_soyad?.toLowerCase().trim(); });
  const officialNames = new Set(Object.values(officialSlots).filter(Boolean).map(uuid => idToName[uuid]).filter(Boolean));
  const remaining = new Set(officialNames);
  let correct = 0;
  Object.values(userSlots).filter(Boolean).forEach(name => {
    const n = name.toLowerCase().trim();
    if (remaining.has(n)) { correct++; remaining.delete(n); }
  });
  const bonus = correct === 11 ? POINTS.all_correct_bonus : 0;
  return { points: correct * POINTS.correct_player + bonus, correct };
}

export function calcPickPoints(userPicks, officialAnswers, players) {
  if (!userPicks || !officialAnswers || !players) return { pickPoints: 0, detail: {} };
  const idToName = {};
  players.forEach(p => { idToName[p.id] = p.ad_soyad?.toLowerCase().trim(); });
  let pickPoints = 0;
  const detail = {};
  if (userPicks.best && officialAnswers.best_player) {
    const correct = userPicks.best.toLowerCase().trim() === idToName[officialAnswers.best_player];
    detail.best = correct; if (correct) pickPoints += POINTS.best_player;
  }
  if (userPicks.firstgoal && officialAnswers.first_goal_scorer) {
    const correct = userPicks.firstgoal.toLowerCase().trim() === idToName[officialAnswers.first_goal_scorer];
    detail.firstgoal = correct; if (correct) pickPoints += POINTS.first_goal;
  }
  if (userPicks.firstsub && officialAnswers.first_sub_out) {
    const correct = userPicks.firstsub.toLowerCase().trim() === idToName[officialAnswers.first_sub_out];
    detail.firstsub = correct; if (correct) pickPoints += POINTS.first_sub;
  }
  return { pickPoints, detail };
}
