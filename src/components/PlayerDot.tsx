import { Player } from '@/types/player';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PlayerDotProps {
  player: Player;
  onClick: () => void;
}

export const PlayerDot = ({ player, onClick }: PlayerDotProps) => {
  if (!player.isOnField) return null;

  const statusColors = {
    fit: 'bg-status-fit shadow-[0_0_30px_hsl(var(--status-fit)/0.7)]',
    tired: 'bg-status-tired shadow-[0_0_30px_hsl(var(--status-tired)/0.7)]',
    risk: 'bg-status-risk shadow-[0_0_30px_hsl(var(--status-risk)/0.7)] animate-pulse',
  };

  const progressColors = {
    fit: '[&>div]:bg-status-fit',
    tired: '[&>div]:bg-status-tired',
    risk: '[&>div]:bg-status-risk',
  };

  return (
    <div
      className="absolute cursor-pointer transition-all duration-1000 ease-out hover:scale-125"
      style={{
        left: `${player.position.x}%`,
        top: `${player.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {/* Progress bar above player */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 bg-black/60 rounded-full p-1">
        <Progress 
          value={player.psi} 
          className={cn('h-2', progressColors[player.status])}
        />
        <div className="text-[10px] text-white text-center font-semibold mt-0.5">
          {Math.round(player.psi)}%
        </div>
        {player.minutesToRisk !== null && player.minutesToRisk <= 10 && player.status !== 'risk' && (
          <div className="text-[9px] text-status-tired text-center font-bold leading-tight">
            ~{player.minutesToRisk}m
          </div>
        )}
      </div>

      <div
        className={cn(
          'w-10 h-10 rounded-full border-2 border-white flex items-center justify-center transition-all duration-1000',
          statusColors[player.status]
        )}
      >
        <User className="w-6 h-6 text-white" />
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap bg-black/70 px-2 py-0.5 rounded">
        {player.id}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6 text-xs font-semibold text-white whitespace-nowrap bg-black/80 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
        {player.name}
      </div>
    </div>
  );
};
