import { Player, SubstitutePlayer } from '@/types/player';
import { useEffect, useState } from 'react';
import { ArrowRightLeft, Gauge, X } from 'lucide-react';
import { Button } from './ui/button';
import { SubstitutePicker } from './SubstitutePicker';
import { PlayerCardFace } from './PlayerCardFace';
import { reasonIcon, reasonLevel } from '@/utils/reasons';

interface SubstitutionAlertProps {
  player: Player | null;
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number, playerId: number) => void;
  onClose: () => void;
}

// The recommendation is to have him off within two minutes of the alert.
const ACT_WITHIN_SECONDS = 120;

const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const SubstitutionAlert = ({
  player,
  substitutes,
  onSubstitute,
  onClose,
}: SubstitutionAlertProps) => {
  const [picking, setPicking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ACT_WITHIN_SECONDS);
  const playerId = player?.id;

  // Restart the countdown for each new player the alert is raised for.
  useEffect(() => {
    if (playerId === undefined) return;
    setSecondsLeft(ACT_WITHIN_SECONDS);
    setPicking(false);
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSecondsLeft(Math.max(0, ACT_WITHIN_SECONDS - elapsed));
    }, 1000);
    return () => clearInterval(timer);
  }, [playerId]);

  if (!player || player.psi >= 40) return null;

  const overdue = secondsLeft === 0;
  const timeUsed = 1 - secondsLeft / ACT_WITHIN_SECONDS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div
        role="alertdialog"
        aria-labelledby="fatigue-alert-title"
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] text-white shadow-[0_30px_80px_-10px_hsl(var(--status-risk)/0.55)] md:max-w-2xl"
        style={{
          background:
            'linear-gradient(150deg, hsl(0 78% 46%) 0%, hsl(0 72% 34%) 45%, hsl(0 60% 16%) 100%)',
        }}
      >
        {/* Glossy sheen across the top, like light catching a referee's card. */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px]"
          style={{
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 35%), repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 10px)',
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-5 sm:p-6">
          <header className="mb-5 flex items-center gap-3 pr-8">
            <div className="h-10 w-7 shrink-0 -rotate-12 rounded-[4px] border-2 border-white/80 bg-[hsl(0_85%_52%)] shadow-[0_6px_16px_rgba(0,0,0,0.4)]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
                Red zone · fatigue alert
              </p>
              <h2
                id="fatigue-alert-title"
                className="truncate text-2xl font-black uppercase leading-tight tracking-wide sm:text-3xl"
              >
                Take {player.name} off
              </h2>
            </div>
          </header>

          <div className="md:grid md:grid-cols-[200px_1fr] md:items-center md:gap-6">
            <div className="mb-5 md:mb-0">
              <PlayerCardFace player={player} />
            </div>

            <div className="space-y-4">
              <div className="flex items-stretch gap-3">
                <div className="flex-1 rounded-2xl bg-black/25 p-3 text-center">
                  <div className="text-4xl font-black leading-none">
                    {Math.round(player.psi)}
                    <span className="text-xl">%</span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/65">
                    Readiness
                  </div>
                </div>
                <div className="flex-1 rounded-2xl bg-black/25 p-3 text-center">
                  <div
                    className={`text-4xl font-black leading-none tabular-nums ${overdue ? 'animate-pulse' : ''}`}
                  >
                    {overdue ? 'NOW' : formatClock(secondsLeft)}
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/65">
                    {overdue ? 'Overdue' : 'Sub within'}
                  </div>
                  <div className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-1000 ease-linear"
                      style={{ width: `${(1 - timeUsed) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {player.reasons.length > 0 && (
                <ul className="grid grid-cols-3 gap-2">
                  {player.reasons.slice(0, 3).map(reason => {
                    const Icon = reasonIcon[reason.label] ?? Gauge;
                    const level = reasonLevel(reason.label, reason.severity);
                    return (
                      <li key={reason.label} className="rounded-xl bg-black/25 p-2.5">
                        <div className="flex items-center justify-between">
                          <Icon className="h-4 w-4 text-white/85" />
                          <span className="text-[9px] font-bold uppercase tracking-wide text-white/60">
                            {level.word}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold">{reason.label}</div>
                        <div className="mt-0.5 text-[11px] leading-snug text-white/70">
                          {reason.detail}
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${Math.max(6, level.strain * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-5">
            {picking ? (
              <div className="text-white">
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
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 border border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Not now
                </Button>
                <Button
                  onClick={() => setPicking(true)}
                  className="flex-[2] gap-2 bg-white font-bold text-[hsl(0_72%_38%)] hover:bg-white/90"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Substitute now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
