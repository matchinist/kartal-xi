export const CLUBS = [
  { id: 'manchester-united', name: 'Manchester United', short: 'MUN', color: '#cc0000', league: 'manchester-united' },
  { id: 'besiktas',    name: 'Beşiktaş',      short: 'BJK', color: '#cc2200', league: 'superlig' },
  { id: 'fenerbahce',  name: 'Fenerbahçe',     short: 'FB',  color: '#005baa', league: 'superlig' },
  { id: 'galatasaray', name: 'Galatasaray',     short: 'GS',  color: '#a47449', league: 'superlig' },
];

export const LEAGUES = [
  { id: 'manchester-united', name: 'Manchester United', subtitle: 'Premier League', path: '/manchester-united', color: '#cc0000', clubs: ['manchester-united'] },
  { id: 'superlig', name: 'Süper Lig', subtitle: 'Beşiktaş · Fenerbahçe · Galatasaray', path: '/superlig', color: '#cc2200', clubs: ['besiktas', 'fenerbahce', 'galatasaray'] },
];

export function getClubsByLeague(leagueId) {
  const league = LEAGUES.find(l => l.id === leagueId);
  if (!league) return [];
  return CLUBS.filter(c => league.clubs.includes(c.id));
}
