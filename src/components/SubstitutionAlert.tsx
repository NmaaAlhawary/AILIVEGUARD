import { Player, SubstitutePlayer } from '@/types/player';
import { useState } from 'react';
import { AlertTriangle, ArrowRightLeft, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ReadinessTrend } from './ReadinessTrend';
import { SubstitutePicker } from './SubstitutePicker';
import { getInitials } from '@/utils/playerPhotos';

interface SubstitutionAlertProps {
  player: Player | null;
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number, playerId: number) => void;
  onClose: () => void;
}

export const SubstitutionAlert = ({
  player,
  substitutes,
  onSubstitute,
  onClose,
}: SubstitutionAlertProps) => {
  const [picking, setPicking] = useState(false);

  if (!player || player.psi >= 40) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="max-h-[92vh] w-full max-w-md overflow-y-auto border-2 border-destructive p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 animate-pulse text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight text-destructive">
                High Fatigue Alert
              </h2>
              <p className="text-sm text-muted-foreground">Immediate action required</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close alert">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-destructive bg-muted">
            {player.photo ? (
              <img src={player.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-black text-muted-foreground">
                {getInitials(player.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold leading-tight">{player.name}</h3>
            <p className="text-sm text-muted-foreground">
              {player.role} · #{player.id}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black leading-none text-destructive">
              {Math.round(player.psi)}%
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">readiness</div>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-muted/40 p-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Why this alert
          </p>
          <dl className="space-y-2">
            {player.reasons.slice(0, 3).map(reason => (
              <div key={reason.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">{reason.label}</dt>
                <dd className="text-right text-sm font-semibold">{reason.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mb-4 text-foreground">
          <ReadinessTrend history={player.history} status={player.status} />
        </div>

        <div className="mb-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm font-semibold text-destructive">
            Recommended action: substitute within 2 minutes
          </p>
        </div>

        {picking ? (
          <div className="text-foreground">
            <SubstitutePicker
              substitutes={substitutes}
              outgoingName={player.name}
              onPick={subId => onSubstitute(subId, player.id)}
            />
            <Button variant="ghost" onClick={() => setPicking(false)} className="mt-2 w-full">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Not now
            </Button>
            <Button
              onClick={() => setPicking(true)}
              className="flex-1 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Substitute now
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
