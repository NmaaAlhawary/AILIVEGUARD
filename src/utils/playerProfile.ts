import { PlayerBaseline } from '@/types/player';
import { normalise } from '@/utils/defaultPhotos';
import { getNaturalPosition } from '@/utils/playerPositions';
import { getBaselineForRole, RISK_THRESHOLD } from '@/utils/playerSimulator';
import { TrackingWindow, getTrackedPlayer } from '@/utils/realData';

export const PROFILES_KEY = 'playerProfiles';

export interface InjuryEntry {
  date: string;
  description: string;
  daysOut: string;
  status?: 'recovering' | 'recovered';
}

export interface NoteEntry {
  date: string;
  text: string;
}

export interface CustomField {
  label: string;
  value: string;
}

// What the coach types in. Everything is optional: nothing is invented about a real player.
export interface ProfileInfo {
  number: string;
  age: string;
  height: string;
  weight: string;
  foot: string;
  nationality: string;
  notes: string;
  injuries: InjuryEntry[];
  notesLog: NoteEntry[];
  customFields: CustomField[];
}

export const emptyProfile: ProfileInfo = {
  number: '',
  age: '',
  height: '',
  weight: '',
  foot: '',
  nationality: '',
  notes: '',
  injuries: [],
  notesLog: [],
  customFields: [],
};

export const loadProfile = (name: string): ProfileInfo => {
  try {
    const all = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '{}');
    const saved: ProfileInfo = { ...emptyProfile, ...(all[normalise(name)] ?? {}) };
    // Older profiles kept one free-text note; turn it into the first dated entry.
    if (saved.notes.trim() && saved.notesLog.length === 0) {
      saved.notesLog = [{ date: new Date().toISOString().slice(0, 10), text: saved.notes.trim() }];
      saved.notes = '';
    }
    return saved;
  } catch {
    return { ...emptyProfile };
  }
};

export const saveProfile = (name: string, info: ProfileInfo) => {
  let all: Record<string, ProfileInfo> = {};
  try {
    all = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '{}');
  } catch {
    all = {};
  }
  all[normalise(name)] = info;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(all));
};

export interface MatchRecord {
  game: number;
  label: string;
  side: 'Home' | 'Away';
  minutes: number;
  startMinute: number;
  avgPsi: number;
  lowestPsi: number;
  distanceKm: number;
  hsrMeters: number;
  sprints: number;
  topSpeed: number;
  alerts: number;
  subbedOn: boolean;
  subbedOff: boolean;
  series: TrackingWindow[];
}

export const getRole = (name: string, fallback = 'CM') => getNaturalPosition(name) ?? fallback;

// Heart-rate figures are not in the tracking data, so those stay estimates for his position;
// top speed is the fastest he actually ran.
export const getBaseline = (name: string): PlayerBaseline & { heartRateEstimated: boolean } => {
  const base = getBaselineForRole(getRole(name));
  const tracked = getTrackedPlayer(name);
  const best = tracked ? Math.max(...tracked.games.map(g => g.topSpeedKmh)) : base.topSpeed;
  return { ...base, topSpeed: Math.round(best * 10) / 10, heartRateEstimated: true };
};

// Real matches for this player, oldest first.
export const getMatchHistory = (name: string): MatchRecord[] => {
  const tracked = getTrackedPlayer(name);
  if (!tracked) return [];
  return tracked.games.map(g => {
    const startMinute = g.series[0]?.minute ?? 0;
    return {
      game: g.game,
      label: `Game ${g.game}`,
      side: tracked.team,
      minutes: g.minutes,
      startMinute,
      avgPsi: g.avgPsi,
      lowestPsi: g.lowestPsi,
      distanceKm: g.distanceKm,
      hsrMeters: g.hsrMeters,
      sprints: g.sprints,
      topSpeed: g.topSpeedKmh,
      alerts: g.series.filter(w => w.psi < RISK_THRESHOLD).length,
      subbedOn: startMinute > 1,
      subbedOff: startMinute <= 1 && g.minutes < 88,
      series: g.series,
    };
  });
};
