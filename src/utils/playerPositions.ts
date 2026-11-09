import { normalise } from '@/utils/defaultPhotos';

// Where each player in the default squad actually plays. A name that isn't
// here (someone typed in on Manage Players) keeps the slot it was entered in.
const naturalPositions: Record<string, string> = {
  casias: 'GK',
  casillas: 'GK',
  'ter stegen': 'GK',
  'inaki pena': 'GK',
  balde: 'LB',
  araujo: 'CB',
  christensen: 'CB',
  kounde: 'RB',
  'de jong': 'CM',
  gavi: 'CM',
  pedri: 'CM',
  'fermin lopez': 'CAM',
  'lionel messi': 'CAM',
  messi: 'CAM',
  'ansu fati': 'LW',
  raphinha: 'LW',
  'ferran torres': 'LW',
  rolando: 'ST',
  ronaldo: 'ST',
  lewandowski: 'ST',
  'joao felix': 'ST',
  yamal: 'RW',
};

const lines: Record<string, string> = {
  GK: 'GK',
  LB: 'DEF',
  CB: 'DEF',
  RB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LW: 'ATT',
  ST: 'ATT',
  RW: 'ATT',
};

export const getNaturalPosition = (name: string): string | undefined =>
  naturalPositions[normalise(name)];

// How well a player fits a slot: 2 = his own position, 1 = same line, 0 = out of position.
export const positionFit = (name: string, slotRole: string): number => {
  const natural = getNaturalPosition(name);
  if (!natural) return 0;
  if (natural === slotRole) return 2;
  return lines[natural] === lines[slotRole] ? 1 : 0;
};

// Seat each name in a slot that suits him: own position first, then his line,
// then whatever is left. Returns, for each slot, the index of the name in it.
export const seatByPosition = (names: string[], slotRoles: string[]): number[] => {
  const seat: (number | undefined)[] = slotRoles.map(() => undefined);
  const placed = new Set<number>();

  for (const wanted of [2, 1]) {
    names.forEach((name, nameIndex) => {
      if (placed.has(nameIndex)) return;
      const slot = slotRoles.findIndex(
        (role, i) => seat[i] === undefined && positionFit(name, role) === wanted
      );
      if (slot === -1) return;
      seat[slot] = nameIndex;
      placed.add(nameIndex);
    });
  }

  names.forEach((_, nameIndex) => {
    if (placed.has(nameIndex)) return;
    const slot = seat[nameIndex] === undefined ? nameIndex : seat.indexOf(undefined);
    seat[slot] = nameIndex;
    placed.add(nameIndex);
  });

  return seat as number[];
};
