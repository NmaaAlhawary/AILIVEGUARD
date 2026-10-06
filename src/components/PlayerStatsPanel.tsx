import { Player } from '@/types/player';
import { Activity, Zap, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/playerPhotos';

interface PlayerStatsPanelProps {
  players: Player[];
}

export const PlayerStatsPanel = ({ players }: PlayerStatsPanelProps) => {
  const activePlayers = players.filter(p => p.isOnField);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground mb-4">Active Players</h2>
      <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {activePlayers.map((player) => (
          <Card
            key={player.id}
            className={cn(
              "p-3 transition-all duration-300 hover:scale-[1.02]",
              player.status === 'risk' && "border-destructive border-2 animate-pulse"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-9 h-9 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {getInitials(player.name)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm">{player.name}</h3>
                  <p className="text-xs text-muted-foreground">{player.role} · #{player.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-bold leading-none",
                  player.status === 'fit' && "text-status-fit",
                  player.status === 'tired' && "text-status-tired",
                  player.status === 'risk' && "text-status-risk"
                )}>
                  {Math.round(player.psi)}%
                </div>
                {player.minutesToRisk !== null && player.minutesToRisk <= 10 && player.status !== 'risk' && (
                  <div className="flex items-center justify-end gap-1 text-[10px] text-status-tired mt-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>risk in ~{player.minutesToRisk} min</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Heart Rate
                </span>
                <span className="font-semibold">{Math.round(player.heartRate)} bpm</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Speed
                </span>
                <span className="font-semibold">{Math.round(player.speed)} km/h</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Fatigue
                </span>
                <span className="font-semibold">{Math.round(player.fatigue)}%</span>
              </div>

              <div className="mt-2">
                <Progress 
                  value={player.psi} 
                  className={cn(
                    "h-2",
                    player.status === 'fit' && "[&>div]:bg-status-fit",
                    player.status === 'tired' && "[&>div]:bg-status-tired",
                    player.status === 'risk' && "[&>div]:bg-status-risk"
                  )}
                />
              </div>

              {player.status !== 'fit' && player.reasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
                  {player.reasons.slice(0, 2).map((reason) => (
                    <p key={reason.label} className="text-[11px] text-muted-foreground leading-snug">
                      <span className="font-semibold text-foreground">{reason.label}</span> {reason.detail}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
