export const nextMatch = {
  home_team: 'Beşiktaş',
  away_team: 'Fenerbahçe',
  stadium: 'Tüpraş Stadyumu',
  tournament: 'Süper Lig',
  match_date: '2026-07-06T19:00:00+03:00',
};

export const seasonStats = [
  { key: 'Matches played', value: '38', sub: 'All comps' },
  { key: 'Goals scored',   value: '62', delta: '+8 vs last season', up: true },
  { key: 'Goals conceded', value: '34', delta: 'Best in 4 yrs',     up: true },
  { key: 'Avg possession', value: '54%', delta: '+3% vs last season', up: true },
  { key: 'xG total',       value: '54.2', delta: 'Overperforming',  up: true },
];

export const recentMatches = [
  { comp: 'SL',  home: 'Beşiktaş',   away: 'Trabzonspor', hs: 3, as: 1, result: 'W', date: 'Jun 1'  },
  { comp: 'UCL', home: 'Porto',       away: 'Beşiktaş',   hs: 2, as: 2, result: 'D', date: 'May 28' },
  { comp: 'SL',  home: 'Beşiktaş',   away: 'Fenerbahçe', hs: 2, as: 0, result: 'W', date: 'May 22' },
  { comp: 'TC',  home: 'Galatasaray', away: 'Beşiktaş',   hs: 1, as: 0, result: 'L', date: 'May 15' },
  { comp: 'SL',  home: 'Beşiktaş',   away: 'Kayserispor', hs: 4, as: 1, result: 'W', date: 'May 8'  },
];

export const topScorers = [
  { rank: 1, name: 'Rafa Silva',    pos: 'FW', goals: 17 },
  { rank: 2, name: 'Ciro Immobile', pos: 'FW', goals: 11 },
  { rank: 3, name: 'Salih Uçan',    pos: 'MF', goals: 7  },
  { rank: 4, name: 'Al-Rashid',     pos: 'MF', goals: 6  },
];

export const standings = [
  { pos: 1, name: 'Galatasaray', pts: 74, gd: '+38', me: false },
  { pos: 2, name: 'Fenerbahçe',  pts: 71, gd: '+29', me: false },
  { pos: 3, name: 'Beşiktaş',    pts: 65, gd: '+24', me: true  },
  { pos: 4, name: 'Trabzonspor', pts: 58, gd: '+12', me: false },
  { pos: 5, name: 'Başakşehir',  pts: 51, gd: '+8',  me: false },
];
