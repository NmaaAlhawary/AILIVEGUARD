import { FatigueReason, Player, PlayerBaseline, PsiSample } from '@/types/player';
import { FIELD_PHOTOS_KEY, loadPhotos } from '@/utils/playerPhotos';

const roles = ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'];

const defaultPlayerNames = [
  'Ter Stegen', 'Araujo', 'Christensen', 'Kounde',
  'Balde', 'De Jong', 'Gavi', 'Pedri',
  'Raphinha', 'Lewandowski', 'Ferran Torres'
];

const getPlayerNames = (): string[] => {
  const saved = localStorage.getItem('playerNames');
  return saved ? JSON.parse(saved) : defaultPlayerNames;
};

const formations = {
  '4-3-3': [
    { x: 50, y: 90 },   // GK
    { x: 20, y: 70 },   // LB
    { x: 40, y: 75 },   // CB
    { x: 60, y: 75 },   // CB
    { x: 80, y: 70 },   // RB
    { x: 30, y: 50 },   // CM
    { x: 50, y: 55 },   // CM
    { x: 70, y: 50 },   // CM
    { x: 20, y: 20 },   // LW
    { x: 50, y: 15 },   // ST
    { x: 80, y: 20 },   // RW
  ]
};

// Each player has his own physiology and his own rate of tiring, so the same
// numbers mean different things for different players.
interface PlayerProfile {
  baseline: PlayerBaseline;
  startLoad: number;
  loadRate: number;
}

const profiles: PlayerProfile[] = [
  { baseline: { restingHeartRate: 56, maxHeartRate: 188, topSpeed: 26, recoveryRate: 32 }, startLoad: 0.05, loadRate: 0.00022 }, // GK
  { baseline: { restingHeartRate: 52, maxHeartRate: 196, topSpeed: 33, recoveryRate: 36 }, startLoad: 0.20, loadRate: 0.00083 }, // LB
  { baseline: { restingHeartRate: 55, maxHeartRate: 192, topSpeed: 31, recoveryRate: 33 }, startLoad: 0.14, loadRate: 0.00073 }, // CB
  { baseline: { restingHeartRate: 54, maxHeartRate: 194, topSpeed: 32, recoveryRate: 34 }, startLoad: 0.16, loadRate: 0.00073 }, // CB
  { baseline: { restingHeartRate: 53, maxHeartRate: 195, topSpeed: 33, recoveryRate: 35 }, startLoad: 0.22, loadRate: 0.00085 }, // RB
  { baseline: { restingHeartRate: 50, maxHeartRate: 198, topSpeed: 30, recoveryRate: 38 }, startLoad: 0.28, loadRate: 0.00095 }, // CM
  { baseline: { restingHeartRate: 51, maxHeartRate: 197, topSpeed: 29, recoveryRate: 37 }, startLoad: 0.35, loadRate: 0.00299 }, // CM
  { baseline: { restingHeartRate: 49, maxHeartRate: 199, topSpeed: 30, recoveryRate: 39 }, startLoad: 0.26, loadRate: 0.00104 }, // CM
  { baseline: { restingHeartRate: 52, maxHeartRate: 196, topSpeed: 34, recoveryRate: 36 }, startLoad: 0.24, loadRate: 0.00090 }, // LW
  { baseline: { restingHeartRate: 54, maxHeartRate: 193, topSpeed: 33, recoveryRate: 34 }, startLoad: 0.20, loadRate: 0.00078 }, // ST
  { baseline: { restingHeartRate: 53, maxHeartRate: 195, topSpeed: 34, recoveryRate: 35 }, startLoad: 0.23, loadRate: 0.00092 }, // RW
];

const RISK_THRESHOLD = 40;
const TICK_SECONDS = 3;
const HISTORY_LIMIT = 320;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// The three signals a real GPS vest can actually measure, each expressed as a
// deviation from this player's own normal rather than a fixed scale.
const readSignals = (player: Player) => {
  const { baseline } = player;
  const heartRateReserve =
    (player.heartRate - baseline.restingHeartRate) /
    (baseline.maxHeartRate - baseline.restingHeartRate);
  const speedDrop = (baseline.topSpeed - player.rollingTopSpeed) / baseline.topSpeed;
  const recoveryLoss = 1 - player.recoveryRate / baseline.recoveryRate;

  return {
    heartRateReserve,
    speedDrop,
    recoveryLoss,
    heartRateComponent: clamp01((heartRateReserve - 0.5) / 0.4),
    speedComponent: clamp01(speedDrop / 0.3),
    recoveryComponent: clamp01(recoveryLoss / 0.6),
  };
};

const WEIGHTS = { heartRate: 0.35, speed: 0.35, recovery: 0.3 };

const describeSignals = (player: Player): FatigueReason[] => {
  const s = readSignals(player);
  const reasons: FatigueReason[] = [
    {
      label: 'Sprint speed',
      detail: `down ${Math.round(s.speedDrop * 100)}% from his best`,
      severity: s.speedComponent * WEIGHTS.speed,
    },
    {
      label: 'Heart rate',
      detail: `at ${Math.round(s.heartRateReserve * 100)}% of his own maximum`,
      severity: s.heartRateComponent * WEIGHTS.heartRate,
    },
    {
      label: 'Recovery',
      detail: `${(1 / (1 - Math.min(0.85, s.recoveryLoss))).toFixed(1)}x slower than his normal`,
      severity: s.recoveryComponent * WEIGHTS.recovery,
    },
  ];

  return reasons.filter(r => r.severity > 0.03).sort((a, b) => b.severity - a.severity);
};

const calculatePSI = (player: Player): number => {
  const s = readSignals(player);
  const fatigueScore =
    s.heartRateComponent * WEIGHTS.heartRate +
    s.speedComponent * WEIGHTS.speed +
    s.recoveryComponent * WEIGHTS.recovery;

  return Math.round(100 - 72 * fatigueScore);
};

const getFatigueScore = (player: Player): number => {
  const s = readSignals(player);
  return Math.round(
    (s.heartRateComponent * WEIGHTS.heartRate +
      s.speedComponent * WEIGHTS.speed +
      s.recoveryComponent * WEIGHTS.recovery) * 100
  );
};

const getStatus = (psi: number): 'fit' | 'tired' | 'risk' => {
  if (psi >= 60) return 'fit';
  if (psi >= RISK_THRESHOLD) return 'tired';
  return 'risk';
};

// Least-squares slope over the recent samples, in PSI points per minute.
const getTrendPerMinute = (history: PsiSample[]): number => {
  // A full minute of samples: shorter windows fit the measurement noise
  // instead of the trend and produce confident nonsense.
  const window = history.slice(-20);
  if (window.length < 12) return 0;

  const n = window.length;
  const meanX = window.reduce((sum, p) => sum + p.elapsed, 0) / n;
  const meanY = window.reduce((sum, p) => sum + p.psi, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (const point of window) {
    numerator += (point.elapsed - meanX) * (point.psi - meanY);
    denominator += (point.elapsed - meanX) ** 2;
  }
  if (denominator === 0) return 0;

  return (numerator / denominator) * 60;
};

const getMinutesToRisk = (psi: number, trendPerMinute: number): number | null => {
  if (psi < RISK_THRESHOLD) return 0;
  // Below roughly 1 point per minute the slope is indistinguishable from noise.
  if (trendPerMinute > -1) return null;

  const minutes = (psi - RISK_THRESHOLD) / -trendPerMinute;
  return minutes > 30 ? null : Math.max(0, Math.round(minutes));
};

// Build the observable readings from the player's hidden accumulated load, so
// the fatigue score is calculated from the signals rather than invented.
const applyLoad = (player: Player, load: number): Player => {
  const { baseline } = player;
  const noise = () => (Math.random() - 0.5) * 0.02;

  const heartRateReserve = 0.5 + 0.33 * load + noise();
  const heartRate =
    baseline.restingHeartRate +
    heartRateReserve * (baseline.maxHeartRate - baseline.restingHeartRate);

  const rollingTopSpeed = baseline.topSpeed * (1 - 0.26 * load + noise());
  const recoveryRate = baseline.recoveryRate * Math.max(0.1, 1 - 0.52 * load);

  return {
    ...player,
    load,
    heartRate: Math.round(heartRate),
    rollingTopSpeed,
    recoveryRate,
    speed: Math.round(rollingTopSpeed * (0.45 + Math.random() * 0.45) * 10) / 10,
  };
};

export const initializePlayers = (): Player[] => {
  const playerNames = getPlayerNames();
  const photos = loadPhotos(FIELD_PHOTOS_KEY);

  return formations['4-3-3'].map((pos, index) => {
    const profile = profiles[index];
    const base: Player = {
      id: index + 1,
      name: playerNames[index],
      position: pos,
      heartRate: 0,
      speed: 0,
      fatigue: 0,
      psi: 100,
      status: 'fit',
      isOnField: true,
      role: roles[index],
      photo: photos[index],
      baseline: profile.baseline,
      load: profile.startLoad,
      rollingTopSpeed: profile.baseline.topSpeed,
      recoveryRate: profile.baseline.recoveryRate,
      reasons: [],
      history: [],
      elapsed: 0,
      trendPerMinute: 0,
      minutesToRisk: null,
    };

    const seeded = applyLoad(base, profile.startLoad);
    const psi = calculatePSI(seeded);

    return {
      ...seeded,
      psi,
      fatigue: getFatigueScore(seeded),
      status: getStatus(psi),
      reasons: describeSignals(seeded),
      history: [{ elapsed: 0, psi }],
    };
  });
};

export const updatePlayerData = (player: Player): Player => {
  if (!player.isOnField) return player;

  const profile = profiles[player.id - 1] ?? profiles[5];
  const load = Math.min(1.3, player.load + profile.loadRate * TICK_SECONDS);
  const updated = applyLoad(player, load);

  const psi = calculatePSI(updated);
  const elapsed = player.elapsed + TICK_SECONDS;
  const history = [...player.history, { elapsed, psi }].slice(-HISTORY_LIMIT);
  const trendPerMinute = getTrendPerMinute(history);

  const movementRange = 6;
  const newX = Math.max(5, Math.min(95, player.position.x + (Math.random() - 0.5) * movementRange));
  const newY = Math.max(5, Math.min(95, player.position.y + (Math.random() - 0.5) * movementRange));

  return {
    ...updated,
    psi,
    fatigue: getFatigueScore(updated),
    status: getStatus(psi),
    reasons: describeSignals(updated),
    elapsed,
    history,
    trendPerMinute,
    minutesToRisk: getMinutesToRisk(psi, trendPerMinute),
    position: { x: newX, y: newY },
  };
};

export { RISK_THRESHOLD };
