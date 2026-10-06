import { Player } from '@/types/player';
import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/playerPhotos';

interface PlayerStatsPanelProps {
  players: Player[];
}

const accent = {
  fit: { text: 'text-status-fit', bar: 'bg-status-fit', ring: 'ring-status-fit/70' },
  tired: { text: 'text-status-tired', bar: 'bg-status-tired', ring: 'ring-status-tired/70' },
  risk: { text: 'text-status-risk', bar: 'bg-status-risk', ring: 'ring-status-risk/80' },
};

const statusLabel = { fit: 'Fit', tired: 'Tiring', risk: 'At risk' };

export const PlayerStatsPanel = ({ players }: PlayerStatsPanelProps) => {
  const activePlayers = players.filter(p => p.isOnField);

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="panel-heading">Active Players</h2>
        <span className="text-[11px] font-semibold text-muted-foreground tabular">
          {activePlayers.length} on pitch
        </span>
      </header>

      <div className="max-h-[calc(100vh-11rem)] space-y-2 overflow-y-auto pr-1">
        {activePlayers.map(player => {
          const tone = accent[player.status];

          return (
            <article
              key={player.id}
              className={cn(
                'rounded-xl border border-border/70 bg-card/80 p-3 transition-colors',
                player.status === 'risk' && 'border-status-risk/60 bg-status-risk/5'
              )}
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2',
                    tone.ring
                  )}
                >
                  {player.photo ? (
                    <img src={player.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-black text-muted-foreground">
                      {getInitials(player.name)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold leading-tight">{player.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">
                      {player.role}
                    </span>
                    <span className={cn('text-[10px] font-semibold', tone.text)}>
                      {statusLabel[player.status]}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={cn('text-2xl font-black leading-none tabular', tone.text)}>
                    {Math.round(player.psi)}
                    <span className="text-xs font-bold opacity-70">%</span>
                  </div>
                  {player.minutesToRisk !== null &&
                    player.minutesToRisk <= 10 &&
                    player.status !== 'risk' && (
                      <div className="mt-1 flex items-center justify-end gap-0.5 text-[10px] font-semibold text-status-tired">
                        <TrendingDown className="h-3 w-3" />
                        <span className="tabular">{player.minutesToRisk} min</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', tone.bar)}
                  style={{ width: `${Math.max(2, player.psi)}%` }}
                />
              </div>

              <dl className="mt-2.5 grid grid-cols-3 gap-1 text-center">
                {[
                  { label: 'bpm', value: Math.round(player.heartRate) },
                  { label: 'km/h', value: Math.round(player.speed) },
                  { label: 'fatigue', value: `${Math.round(player.fatigue)}%` },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-muted/40 py-1">
                    <dd className="text-sm font-bold leading-none tabular">{stat.value}</dd>
                    <dt className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>

              {player.status !== 'fit' && player.reasons.length > 0 && (
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  <span className="font-semibold text-foreground">{player.reasons[0].label}</span>{' '}
                  {player.reasons[0].detail}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
