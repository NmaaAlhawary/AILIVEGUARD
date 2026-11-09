import { SubstitutePlayer } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import { getNaturalPosition, positionFit } from '@/utils/playerPositions';
import { ArrowRightLeft } from 'lucide-react';

interface SubstitutePickerProps {
  substitutes: SubstitutePlayer[];
  outgoingName: string;
  outgoingRole: string;
  onPick: (subId: number) => void;
}

export const SubstitutePicker = ({
  substitutes,
  outgoingName,
  outgoingRole,
  onPick,
}: SubstitutePickerProps) => {
  if (substitutes.length === 0) {
    return (
      <p className="rounded-xl bg-black/40 p-4 text-center text-sm">
        No substitutes left on the bench.
      </p>
    );
  }

  // Best fit for the open slot first; sort is stable, so ties keep bench order.
  const ranked = [...substitutes].sort(
    (a, b) => positionFit(b.name, outgoingRole) - positionFit(a.name, outgoingRole),
  );

  return (
    <div className="space-y-2 rounded-xl bg-black/40 p-3">
      <p className="text-xs font-bold uppercase tracking-widest opacity-80">
        Who comes on for {outgoingName} ({outgoingRole})?
      </p>
      {ranked.map(sub => {
        const natural = getNaturalPosition(sub.name);
        const fit = positionFit(sub.name, outgoingRole);
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onPick(sub.id)}
            className="flex w-full items-center gap-3 rounded-lg bg-white/10 p-2.5 text-left transition-colors hover:bg-white/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/40">
              {sub.photo ? (
                <img src={sub.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black">{getInitials(sub.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold">{sub.name}</span>
                {natural && (
                  <span className="shrink-0 rounded bg-white/15 px-1.5 py-px text-[10px] font-bold">
                    {natural}
                  </span>
                )}
              </div>
              <div className="text-xs opacity-75">
                Fresh · {Math.round(sub.psi)}%{fit === 2 && ' · same position'}
                {natural && fit === 0 && ' · out of position'}
              </div>
            </div>
            <ArrowRightLeft className="h-4 w-4 shrink-0 opacity-80" />
          </button>
        );
      })}
    </div>
  );
};
