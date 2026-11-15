import { normalise } from '@/utils/defaultPhotos';

// Public facts about the real players in the default squad (club and federation profiles).
// Age is worked out from the date of birth so it never goes stale. Weight is left out:
// clubs don't publish it and the figures quoted online disagree.
interface PlayerFacts {
  number: string;
  born: string; // YYYY-MM-DD
  height: string; // cm
  foot: 'Left' | 'Right';
  nationality: string;
}

const facts: Record<string, PlayerFacts> = {
  casias:          { number: '1',  born: '1981-05-20', height: '182', foot: 'Right', nationality: 'Spain' },
  araujo:          { number: '4',  born: '1999-03-07', height: '188', foot: 'Right', nationality: 'Uruguay' },
  christensen:     { number: '15', born: '1996-04-10', height: '187', foot: 'Right', nationality: 'Denmark' },
  kounde:          { number: '23', born: '1998-11-12', height: '178', foot: 'Right', nationality: 'France' },
  balde:           { number: '3',  born: '2003-10-18', height: '175', foot: 'Left',  nationality: 'Spain' },
  'de jong':       { number: '21', born: '1997-05-12', height: '181', foot: 'Right', nationality: 'Netherlands' },
  gavi:            { number: '6',  born: '2004-08-05', height: '173', foot: 'Right', nationality: 'Spain' },
  'lionel messi':  { number: '10', born: '1987-06-24', height: '170', foot: 'Left',  nationality: 'Argentina' },
  'ansu fati':     { number: '31', born: '2002-10-31', height: '178', foot: 'Right', nationality: 'Spain' },
  rolando:         { number: '7',  born: '1985-02-05', height: '187', foot: 'Right', nationality: 'Portugal' },
  yamal:           { number: '19', born: '2007-07-13', height: '180', foot: 'Left',  nationality: 'Spain' },
  'ter stegen':    { number: '1',  born: '1992-04-30', height: '187', foot: 'Right', nationality: 'Germany' },
  'inaki pena':    { number: '13', born: '1999-03-02', height: '184', foot: 'Right', nationality: 'Spain' },
  pedri:           { number: '8',  born: '2002-11-25', height: '174', foot: 'Right', nationality: 'Spain' },
  'fermin lopez':  { number: '16', born: '2003-05-11', height: '174', foot: 'Right', nationality: 'Spain' },
  raphinha:        { number: '11', born: '1996-12-14', height: '176', foot: 'Left',  nationality: 'Brazil' },
  lewandowski:     { number: '9',  born: '1988-08-21', height: '185', foot: 'Right', nationality: 'Poland' },
  'ferran torres': { number: '7',  born: '2000-02-29', height: '184', foot: 'Right', nationality: 'Spain' },
  'joao felix':    { number: '14', born: '1999-11-10', height: '181', foot: 'Right', nationality: 'Portugal' },
};
facts.casillas = facts.casias;
facts.messi = facts['lionel messi'];
facts.ronaldo = facts.rolando;
facts['lamine yamal'] = facts.yamal;

const ageOn = (born: string, today = new Date()) => {
  const [y, m, d] = born.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
};

export const getPlayerFacts = (name: string) => {
  const f = facts[normalise(name)];
  if (!f) return null;
  return {
    number: f.number,
    age: String(ageOn(f.born)),
    height: f.height,
    foot: f.foot,
    nationality: f.nationality,
  };
};

// Major injuries from public club and press reports. Days out are approximate.
interface PastInjury {
  date: string;
  description: string;
  daysOut: string;
}

const injuries: Record<string, PastInjury[]> = {
  casias: [
    { date: '2019-05-01', description: 'Heart attack in training at Porto; did not play again and retired in 2020', daysOut: '' },
  ],
  araujo: [
    { date: '2024-07-10', description: 'Hamstring tear at the Copa América (vs Colombia), needed surgery', daysOut: '180' },
  ],
  'de jong': [
    { date: '2024-04-21', description: 'Right ankle ligament injury, made worse in El Clásico; missed Euro 2024', daysOut: '170' },
  ],
  gavi: [
    { date: '2023-11-19', description: 'Right knee ACL and lateral meniscus tear, playing for Spain vs Georgia', daysOut: '336' },
  ],
  'ansu fati': [
    { date: '2020-11-07', description: 'Left knee meniscus tear vs Real Betis; four operations', daysOut: '322' },
  ],
  rolando: [
    { date: '2016-07-10', description: 'Left knee ligament injury in the Euro 2016 final vs France', daysOut: '95' },
  ],
  yamal: [
    { date: '2025-10-03', description: 'Pubalgia (groin) flared up again', daysOut: '18' },
    { date: '2025-09-12', description: 'Pubalgia (groin pain) after the international break', daysOut: '20' },
    { date: '2024-12-15', description: 'Grade 1 ankle ligament sprain vs Leganés', daysOut: '24' },
    { date: '2024-11-09', description: 'Ankle injury', daysOut: '18' },
  ],
  'ter stegen': [
    { date: '2024-09-22', description: 'Right knee patellar tendon rupture vs Villarreal, needed surgery', daysOut: '200' },
  ],
  pedri: [
    { date: '2024-07-05', description: 'Left knee sprain at Euro 2024 (vs Germany)', daysOut: '40' },
  ],
};
injuries.casillas = injuries.casias;
injuries.ronaldo = injuries.rolando;
injuries['lamine yamal'] = injuries.yamal;

export const getPastInjuries = (name: string) =>
  (injuries[normalise(name)] ?? []).map(i => ({ ...i, status: 'recovered' as const }));
