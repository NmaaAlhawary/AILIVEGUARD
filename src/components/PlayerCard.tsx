import { useState } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import {
  ArrowRightLeft,
  CircleCheck,
  Flag,
  Gauge,
  TriangleAlert,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { ReadinessTrend } from './ReadinessTrend';
import { SubstitutePicker } from './SubstitutePicker';
import { PlayerCardFace, statusToken } from './PlayerCardFace';
import { reasonIcon, reasonLevel } from '@/utils/reasons';
import { Button } from './ui/button';

interface PlayerCardProps {
  player: Player | null;
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number, playerId: number) => void;
  onClose: () => void;
}

export const PlayerCard = ({ player, substitutes, onSubstitute, onClose }: PlayerCardProps) => {
  const [picking, setPicking] = useState(false);

  if (!player) return null;

  const token = statusToken[player.status];

  // The one line a coach reads first: red to act now, amber when risk is coming, green otherwise.
  const verdict =
    player.status === 'risk'
      ? { text: 'Substitute now', token: '--status-risk', Icon: TriangleAlert, urgent: true }
      : player.minutesToRisk !== null
        ? {
            text: `High risk in about ${player.minutesToRisk} minutes`,
            token: '--status-tired',
            Icon: Flag,
            urgent: false,
          }
        : { text: 'Holding up well', token: '--status-fit', Icon: CircleCheck, urgent: false };

  return (
    <Dialog open={!!player} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto overscroll-contain md:max-w-3xl rounded-3xl border-none bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-3xl bg-[hsl(222_47%_7%)] p-4 text-white sm:p-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
            style={{
              backgroundImage: `radial-gradient(ellipse at 50% 0%, hsl(var(${token}) / 0.55), transparent 70%)`,
            }}
          />

          {/* Wide screens: card on the left, live readiness on the right, so it fits without scrolling. */}
          <div className="relative md:grid md:grid-cols-[220px_1fr] md:items-center md:gap-6">
            <div>
              <DialogTitle className="sr-only">{player.name}</DialogTitle>
              <DialogDescription className="sr-only">
                Live readiness card for {player.name}, playing {player.role}. Readiness{' '}
                {Math.round(player.psi)} percent, status {player.status}.
              </DialogDescription>
              <PlayerCardFace player={player} />
            </div>

            <div>
              <div className="mt-3 md:mt-0">
                <ReadinessTrend history={player.history} status={player.status} />
              </div>

              {player.reasons.length > 0 && (
                <div className="mt-3 rounded-xl bg-black/45 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-80">
                    Why this reading
                  </p>
                  <ul className="space-y-3">
                    {player.reasons.slice(0, 3).map(reason => {
                      const Icon = reasonIcon[reason.label] ?? Gauge;
                      const level = reasonLevel(reason.label, reason.severity);
                      const color = `hsl(var(${level.token}))`;
                      return (
                        <li key={reason.label} className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `hsl(var(${level.token}) / 0.18)`,
                              color,
                            }}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-bold">{reason.label}</span>
                              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-75">
                                {level.word}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(6, level.strain * 100)}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-xs opacity-75">{reason.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div
                role={verdict.urgent ? 'alert' : undefined}
                className={cn(
                  'mt-3 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold uppercase tracking-wide',
                  verdict.urgent && 'animate-pulse',
                )}
                style={{
                  color: `hsl(var(${verdict.token}))`,
                  backgroundColor: `hsl(var(${verdict.token}) / 0.12)`,
                  borderColor: `hsl(var(${verdict.token}) / 0.45)`,
                }}
              >
                <verdict.Icon className="h-4 w-4 shrink-0" />
                {verdict.text}
              </div>

              {picking ? (
                <div className="mt-3">
                  <SubstitutePicker
                    substitutes={substitutes}
                    outgoingName={player.name}
                    outgoingRole={player.role}
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
                      : 'bg-black/40 text-white hover:bg-black/55',
                  )}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Substitute this player
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
