import tracking from '@/data/realTracking.json';
import { normalise } from '@/utils/defaultPhotos';

// Real tracking data from two full professional matches, recorded at 25 frames per second
// (Metrica Sports open data, anonymised). Built by scripts/build_tracking.py.
export const REAL_DATA_SOURCE = 'Metrica Sports open tracking data';
export const REAL_DATA_URL = 'https://github.com/metrica-sports/sample-data';

export interface TrackingWindow {
  minute: number;
  metersPerMin: number;
  hsrPerMin: number;
  peakKmh: number;
  psi: number;
}

export interface TrackedGame {
  game: number;
  minutes: number;
  distanceKm: number;
  hsrMeters: number;
  sprints: number;
  topSpeedKmh: number;
  avgPsi: number;
  lowestPsi: number;
  series: TrackingWindow[];
}

export interface TrackedPlayer {
  id: number;
  team: 'Home' | 'Away';
  avgX: number;
  avgY: number;
  games: TrackedGame[];
}

const players = (tracking as { players: TrackedPlayer[] }).players;
const byId = new Map(players.map(p => [p.id, p]));

// Each squad member is matched to the real tracked player who played the same role,
// judged from where he stood on the pitch across both matches.
const assigned: Record<string, number> = {
  casias: 11, casillas: 11,           // goalkeeper
  kounde: 1,                          // right back
  araujo: 2, christensen: 3,          // centre backs
  balde: 4,                           // left back
  'de jong': 6, gavi: 7,              // central midfield
  'lionel messi': 5, messi: 5,        // attacking midfield
  'ansu fati': 8,                     // left wing
  rolando: 9, ronaldo: 9,             // striker
  yamal: 10,                          // right side attack
  'ter stegen': 25,                   // goalkeeper (other team)
  pedri: 12, 'fermin lopez': 13, raphinha: 14,
  lewandowski: 20, 'ferran torres': 15, 'joao felix': 16,
};

const spare = players
  .filter(p => !Object.values(assigned).includes(p.id) && p.games.some(g => g.minutes >= 60))
  .map(p => p.id);

export const getTrackedPlayer = (name: string): TrackedPlayer | null => {
  const key = normalise(name);
  if (!key) return null;
  if (key in assigned) return byId.get(assigned[key]) ?? null;
  // Someone typed in on Manage Players: give him one of the unused real players, always the same one.
  if (key === 'inaki pena') return null; // only two keepers were tracked
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return spare.length ? byId.get(spare[h % spare.length]) ?? null : null;
};
