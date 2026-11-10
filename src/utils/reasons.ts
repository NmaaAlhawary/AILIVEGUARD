import { Gauge, HeartPulse, LucideIcon, Timer } from 'lucide-react';

export const reasonIcon: Record<string, LucideIcon> = {
  'Sprint speed': Gauge,
  'Heart rate': HeartPulse,
  Recovery: Timer,
};

const reasonWeight: Record<string, number> = {
  'Sprint speed': 0.35,
  'Heart rate': 0.35,
  Recovery: 0.3,
};

// How hard this signal is pulling readiness down, 0–1, as a word and a colour.
export const reasonLevel = (label: string, severity: number) => {
  const strain = Math.min(1, severity / (reasonWeight[label] ?? 0.33));
  if (strain >= 0.66) return { strain, word: 'High', token: '--status-risk' };
  if (strain >= 0.33) return { strain, word: 'Moderate', token: '--status-tired' };
  return { strain, word: 'Mild', token: '--status-fit' };
};
