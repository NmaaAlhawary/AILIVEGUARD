import { Player } from '@/types/player';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/playerPhotos';

interface PlayerDotProps {
  player: Player;
  onClick: () => void;
}

const ring = {
  fit: 'ring-status-fit shadow-[0_0_18px_hsl(var(--status-fit)/0.55)]',
  tired: 'ring-status-tired shadow-[0_0_18px_hsl(var(--status-tired)/0.55)]',
  risk: 'ring-status-risk shadow-[0_0_22px_hsl(var(--status-risk)/0.75)] animate-pulse',
};

const bar = {
  fit: 'bg-status-fit',
  tired: 'bg-status-tired',
  risk: 'bg-status-risk',
};

const text = {
  fit: 'text-status-fit',
  tired: 'text-status-tired',
  risk: 'text-status-risk',
};

export const PlayerDot = ({ player, onClick }: PlayerDotProps) => {
  if (!player.isOnField) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${player.name}, ${player.role}, readiness ${Math.round(player.psi)} percent`}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-[left,top] duration-1000 ease-out hover:z-30 focus:z-30 focus:outline-none"
      style={{ left: `${player.position.x}%`, top: `${player.position.y}%` }}
    >
      {/* Readiness chip */}
      <div className="mb-1 flex flex-col items-center rounded-md bg-black/75 px-1.5 py-0.5 backdrop-blur-sm ring-1 ring-white/10">
        <span className={cn('text-[10px] font-black leading-none tabular', text[player.status])}>
          {Math.round(player.psi)}
        </span>
        <div className="mt-0.5 h-0.5 w-7 overflow-hidden rounded-full bg-white/25">
          <div
            className={cn('h-full rounded-full transition-all duration-700', bar[player.status])}
            style={{ width: `${Math.max(4, player.psi)}%` }}
          />
        </div>
        {player.minutesToRisk !== null && player.minutesToRisk <= 10 && player.status !== 'risk' && (
          <span className="mt-0.5 text-[8px] font-bold leading-none text-status-tired">
            {player.minutesToRisk}m
          </span>
        )}
      </div>

      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-800 ring-2 transition-transform duration-200 group-hover:scale-110',
          ring[player.status]
        )}
      >
        {player.photo ? (
          <img src={player.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] font-black text-white">{getInitials(player.name)}</span>
        )}
      </div>

      <div className="mt-1 rounded bg-black/80 px-1.5 py-px text-[9px] font-bold leading-tight text-white/90 ring-1 ring-white/10">
        {player.role} {player.id}
      </div>

      {/* Name appears on hover so the pitch stays readable */}
      <div className="pointer-events-none absolute top-full mt-7 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[11px] font-semibold text-white opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {player.name}
      </div>
    </button>
  );
};
