export interface PlayerBaseline {
  restingHeartRate: number;
  maxHeartRate: number;
  topSpeed: number;
  recoveryRate: number;
}

export interface FatigueReason {
  label: string;
  detail: string;
  severity: number;
}

export interface PsiSample {
  elapsed: number;
  psi: number;
}

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
  baseline: PlayerBaseline;
  load: number;
  rollingTopSpeed: number;
  recoveryRate: number;
  reasons: FatigueReason[];
  history: PsiSample[];
  elapsed: number;
  trendPerMinute: number;
  minutesToRisk: number | null;
}

export interface SubstitutePlayer {
  id: number;
  name: string;
  psi: number;
}
