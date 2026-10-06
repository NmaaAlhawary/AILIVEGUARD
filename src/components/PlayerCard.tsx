import { useState } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import { ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { ReadinessTrend } from './ReadinessTrend';
import { SubstitutePicker } from './SubstitutePicker';
import { Button } from './ui/button';

interface PlayerCardProps {
  player: Player | null;
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number, playerId: number) => void;
  onClose: () => void;
}

const statusToken = {
  fit: '--status-fit',
  tired: '--status-tired',
  risk: '--status-risk',
} as const;

export const PlayerCard = ({
  player,
  substitutes,
  onSubstitute,
  onClose,
}: PlayerCardProps) => {
  const [picking, setPicking] = useState(false);

  if (!player) return null;

  const token = statusToken[player.status];
  const stats = [
    { label: 'Heart rate', value: Math.round(player.heartRate), unit: 'bpm' },
    { label: 'Speed now', value: Math.round(player.speed), unit: 'km/h' },
    { label: 'Top speed', value: Math.round(player.rollingTopSpeed), unit: 'km/h' },
    { label: 'Fatigue', value: Math.round(player.fatigue), unit: '%' },
    { label: 'Recovery', value: Math.round(player.recoveryRate), unit: 'bpm/min' },
    {
      label: 'Risk in',
      value: player.minutesToRisk !== null ? player.minutesToRisk : '—',
      unit: player.minutesToRisk !== null ? 'min' : '',
    },
  ];

  return (
    <Dialog open={!!player} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto border-none bg-transparent p-0 shadow-none">
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white"
          style={{
            backgroundColor: 'hsl(222 47% 7%)',
            backgroundImage: `linear-gradient(160deg, hsl(var(${token}) / 0.85) 0%, hsl(var(${token}) / 0.4) 40%, transparent 72%)`,
          }}
        >
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <span className="text-6xl font-black leading-none drop-shadow">
                {Math.round(player.psi)}
              </span>
              <span className="mt-1 text-base font-bold tracking-widest opacity-90">
                {player.role}
              </span>
              <div className="my-2 h-px w-8 bg-white/50" />
              <span className="text-sm font-bold opacity-80">#{player.id}</span>
            </div>

            <div className="flex flex-1 items-end justify-center">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  className="h-32 w-32 rounded-full border-4 border-white/70 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/50 bg-black/30 text-4xl font-black shadow-xl">
                  {getInitials(player.name)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 border-y border-white/30 py-2 text-center">
            <DialogTitle className="text-2xl font-black uppercase tracking-wide">
              {player.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Live readiness card for {player.name}, playing {player.role}. Readiness{' '}
              {Math.round(player.psi)} percent, status {player.status}.
            </DialogDescription>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-lg bg-black/25 px-1 py-2 text-center">
                <div className="text-2xl font-black leading-none">
                  {stat.value}
                  {stat.unit && (
                    <span className="ml-1 text-xs font-bold opacity-80">{stat.unit}</span>
                  )}
                </div>
                <div className="mt-1.5 text-xs font-semibold leading-none opacity-90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <ReadinessTrend history={player.history} status={player.status} />
          </div>

          {player.reasons.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-xl bg-black/45 p-4">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Why this reading
              </p>
              {player.reasons.slice(0, 3).map(reason => (
                <p key={reason.label} className="text-base leading-snug">
                  <span className="font-bold">{reason.label}</span>{' '}
                  <span className="opacity-85">{reason.detail}</span>
                </p>
              ))}
            </div>
          )}

          <div
            className={cn(
              'mt-3 rounded-xl py-3 text-center text-sm font-bold uppercase tracking-wide',
              player.status === 'fit' && 'bg-black/30',
              player.status === 'tired' && 'bg-black/40',
              player.status === 'risk' && 'bg-black/50'
            )}
          >
            {player.status === 'risk'
              ? 'Substitute now'
              : player.minutesToRisk !== null
                ? `High risk in about ${player.minutesToRisk} minutes`
                : 'Holding up well'}
          </div>

          {picking ? (
            <div className="mt-3">
              <SubstitutePicker
                substitutes={substitutes}
                outgoingName={player.name}
                onPick={subId => onSubstitute(subId, player.id)}
              />
              <Button
                variant="ghost"
                onClick={() => setPicking(false)}
                className="mt-2 w-full text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setPicking(true)}
              className={cn(
                'mt-3 w-full gap-2 border-none font-bold',
                player.status === 'risk'
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black/40 text-white hover:bg-black/55'
              )}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Substitute this player
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
