import { useState } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import {
  ArrowRightLeft,
  CircleCheck,
  Flag,
  Gauge,
  HeartPulse,
  Timer,
  TriangleAlert,
  LucideIcon,
} from 'lucide-react';
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

const reasonIcon: Record<string, LucideIcon> = {
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
const reasonLevel = (label: string, severity: number) => {
  const strain = Math.min(1, severity / (reasonWeight[label] ?? 0.33));
  if (strain >= 0.66) return { strain, word: 'High', token: '--status-risk' };
  if (strain >= 0.33) return { strain, word: 'Moderate', token: '--status-tired' };
  return { strain, word: 'Mild', token: '--status-fit' };
};

// Shield outline shared by the gold trim and the card face inside it.
const CARD_SHAPE = 'polygon(7% 0, 93% 0, 100% 4%, 100% 89%, 50% 100%, 0 89%, 0 4%)';
// Soft oval fade so the square headshot melts into the card instead of sitting on it as a box.
const PHOTO_FADE =
  'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 12%, black 62%, transparent 100%)';
const TRIM =
  'linear-gradient(135deg, #f8e7a1 0%, #c99a3c 30%, #fff4c2 50%, #a8782a 75%, #f1d98a 100%)';

const statusToken = {
  fit: '--status-fit',
  tired: '--status-tired',
  risk: '--status-risk',
} as const;

export const PlayerCard = ({ player, substitutes, onSubstitute, onClose }: PlayerCardProps) => {
  const [picking, setPicking] = useState(false);

  if (!player) return null;

  const token = statusToken[player.status];
  const stats = [
    {
      label: 'Heart rate',
      short: 'HR',
      value: Math.round(player.heartRate),
      unit: 'bpm',
    },
    {
      label: 'Speed now',
      short: 'SPD',
      value: Math.round(player.speed),
      unit: 'km/h',
    },
    {
      label: 'Top speed',
      short: 'TOP',
      value: Math.round(player.rollingTopSpeed),
      unit: 'km/h',
    },
    {
      label: 'Fatigue',
      short: 'FAT',
      value: Math.round(player.fatigue),
      unit: '%',
    },
    {
      label: 'Recovery',
      short: 'REC',
      value: Math.round(player.recoveryRate),
      unit: 'bpm/min',
    },
    {
      label: 'Risk in',
      short: 'RSK',
      value: player.minutesToRisk !== null ? player.minutesToRisk : '—',
      unit: player.minutesToRisk !== null ? 'min' : '',
    },
  ];

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
              {/* Collectible-card face: gold trim, then the status-tinted card inset by 4px. */}
              <div
                className="relative mx-auto aspect-[5/7] w-full max-w-[190px] p-[3px] drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
                style={{ clipPath: CARD_SHAPE, background: TRIM }}
              >
                <div
                  className="relative h-full w-full overflow-hidden"
                  style={{
                    clipPath: CARD_SHAPE,
                    background: `linear-gradient(160deg, hsl(var(${token})) 0%, hsl(var(${token}) / 0.55) 45%, hsl(222 47% 9%) 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 42%, transparent 55%), repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 9px)',
                    }}
                  />

                  <div className="absolute left-[9%] top-[9%] z-10 flex flex-col items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    <span className="text-3xl font-black leading-none">
                      {Math.round(player.psi)}
                    </span>
                    <span className="mt-0.5 text-xs font-extrabold tracking-wider">
                      {player.role}
                    </span>
                    <div className="my-1 h-px w-6" style={{ background: TRIM }} />
                    <span className="text-[10px] font-bold opacity-90">#{player.id}</span>
                  </div>

                  <div className="absolute right-[6%] top-[7%] h-[52%] w-[66%]">
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="h-full w-full object-cover object-top"
                        style={{
                          maskImage: PHOTO_FADE,
                          WebkitMaskImage: PHOTO_FADE,
                          maskComposite: 'intersect',
                          WebkitMaskComposite: 'source-in',
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-6xl font-black opacity-80">
                        {getInitials(player.name)}
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-x-[8%] top-[60%] text-center">
                    <DialogTitle className="truncate text-sm font-black uppercase tracking-wide drop-shadow">
                      {player.name}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Live readiness card for {player.name}, playing {player.role}. Readiness{' '}
                      {Math.round(player.psi)} percent, status {player.status}.
                    </DialogDescription>
                    <div className="mx-auto mt-1 h-px w-full" style={{ background: TRIM }} />
                  </div>

                  <div className="absolute inset-x-[12%] top-[71%] grid grid-cols-2 gap-x-2">
                    {[stats.slice(0, 3), stats.slice(3)].map((column, i) => (
                      <ul
                        key={i}
                        className={cn('space-y-0.5', i === 1 && 'border-l border-white/30 pl-2')}
                      >
                        {column.map(stat => (
                          <li key={stat.label} className="flex items-baseline gap-1.5">
                            <span className="w-6 text-right text-xs font-black leading-none tabular-nums">
                              {stat.value}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-wide opacity-85">
                              {stat.short}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                </div>
              </div>

              <dl className="mx-auto mt-3 grid max-w-[190px] grid-flow-col grid-cols-2 grid-rows-3 gap-x-2 gap-y-1 rounded-lg bg-white/[0.04] px-2.5 py-2 text-[9px] leading-tight">
                {stats.map(stat => (
                  <div
                    key={stat.label}
                    title={stat.unit ? `${stat.label} (${stat.unit})` : stat.label}
                    className="flex items-baseline gap-1"
                  >
                    <dt className="w-5 shrink-0 font-extrabold tracking-wide text-[#e9c870]">
                      {stat.short}
                    </dt>
                    <dd className="truncate text-white/60">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
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
