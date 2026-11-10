import { Player } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import { Flag, TriangleAlert, X } from 'lucide-react';

interface FatigueToastProps {
  player: Player;
  tone: 'warning' | 'risk';
  onDismiss: () => void;
}

// Pop-up for a player heading into, or already in, the red zone: amber with a
// flag while there is still time, red with a warning once he needs to come off.
export const FatigueToast = ({ player, tone, onDismiss }: FatigueToastProps) => {
  const token = tone === 'risk' ? '--status-risk' : '--status-tired';
  const color = `hsl(var(${token}))`;
  const Icon = tone === 'risk' ? TriangleAlert : Flag;
  const [topReason] = player.reasons;

  return (
    <div
      className="relative flex w-[360px] max-w-[calc(100vw-2rem)] items-center gap-3 overflow-hidden rounded-2xl border bg-[hsl(222_47%_9%)] p-3.5 pl-4 text-white shadow-2xl"
      style={{ borderColor: `hsl(var(${token}) / 0.5)` }}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />

      <div className="relative shrink-0">
        <div
          className="h-12 w-12 overflow-hidden rounded-full border-2 bg-black/40"
          style={{ borderColor: color }}
        >
          {player.photo ? (
            <img src={player.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-sm font-black">
              {getInitials(player.name)}
            </span>
          )}
        </div>
        <span
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-black"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {tone === 'risk' ? 'Needs rest now' : 'Fatigue rising'}
        </p>
        <p className="truncate text-base font-bold leading-tight">
          {player.name}{' '}
          <span className="text-sm font-semibold text-white/50">
            {player.role} · #{player.id}
          </span>
        </p>
        {topReason && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/60">
            {topReason.label} {topReason.detail}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {tone === 'risk' ? (
          <div className="text-2xl font-black leading-none" style={{ color }}>
            {Math.round(player.psi)}%
          </div>
        ) : (
          <div className="text-2xl font-black leading-none" style={{ color }}>
            ~{player.minutesToRisk}
            <span className="ml-0.5 text-xs font-bold">min</span>
          </div>
        )}
        <div className="mt-1 text-[10px] font-semibold uppercase text-white/50">
          {tone === 'risk' ? 'readiness' : 'to high risk'}
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-white/40 hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
