export interface Player {
  id: number;
  name: string;
  position: { x: number; y: number };
  heartRate: number;
  speed: number;
  fatigue: number;
  psi: number;
  status: 'fit' | 'tired' | 'risk';
  isOnField: boolean;
}

export interface SubstitutePlayer {
  id: number;
  name: string;
  psi: number;
}
