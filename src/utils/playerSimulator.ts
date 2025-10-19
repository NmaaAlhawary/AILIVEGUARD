import { Player } from '@/types/player';

const defaultPlayerNames = [
  'Al-Dawsari', 'Al-Shehri', 'Al-Faraj', 'Al-Burayk', 'Otaif',
  'Al-Amri', 'Al-Bulaihi', 'Al-Shahrani', 'Al-Owais', 'Kanno', 'Al-Najei'
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

export const initializePlayers = (): Player[] => {
  const playerNames = getPlayerNames();
  return formations['4-3-3'].map((pos, index) => ({
    id: index + 1,
    name: playerNames[index],
    position: pos,
    heartRate: 70 + Math.random() * 30,
    speed: 15 + Math.random() * 10,
    fatigue: Math.random() * 30,
    psi: 85 + Math.random() * 15,
    status: 'fit',
    isOnField: true,
  }));
};

const calculatePSI = (heartRate: number, fatigue: number): number => {
  const normalizedHR = Math.max(0, 1 - (heartRate - 60) / 140);
  const normalizedFatigue = Math.max(0, 1 - fatigue / 100);
  return Math.round((normalizedHR * 0.6 + normalizedFatigue * 0.4) * 100);
};

const getStatus = (psi: number): 'fit' | 'tired' | 'risk' => {
  if (psi >= 60) return 'fit';
  if (psi >= 40) return 'tired';
  return 'risk';
};

export const updatePlayerData = (player: Player): Player => {
  if (!player.isOnField) return player;

  const hrChange = (Math.random() - 0.5) * 5;
  const speedChange = (Math.random() - 0.5) * 2;
  const fatigueChange = Math.random() * 2;

  const newHeartRate = Math.max(60, Math.min(180, player.heartRate + hrChange));
  const newSpeed = Math.max(0, Math.min(30, player.speed + speedChange));
  const newFatigue = Math.max(0, Math.min(100, player.fatigue + fatigueChange));

  const newPSI = calculatePSI(newHeartRate, newFatigue);
  const newStatus = getStatus(newPSI);

  // Simulate player movement within a zone around their position
  const movementRange = 6; // percentage points they can move
  const newX = Math.max(5, Math.min(95, player.position.x + (Math.random() - 0.5) * movementRange));
  const newY = Math.max(5, Math.min(95, player.position.y + (Math.random() - 0.5) * movementRange));

  return {
    ...player,
    heartRate: Math.round(newHeartRate),
    speed: Math.round(newSpeed * 10) / 10,
    fatigue: Math.round(newFatigue),
    psi: newPSI,
    status: newStatus,
    position: { x: newX, y: newY },
  };
};
