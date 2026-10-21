import { Player, SubstitutePlayer } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import { ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';

interface OutgoingPickerProps {
  incoming: SubstitutePlayer | null;
  players: Player[];
  onPick: (subId: number, playerId: number) => void;
  onClose: () => void;
}

const statusLabel = { fit: 'Fit', tired: 'Tiring', risk: 'At risk' };
const statusDot = { fit: 'bg-status-fit', tired: 'bg-status-tired', risk: 'bg-status-risk' };

// From the bench the coach has picked who comes on; this asks who comes off,
// most tired first so the obvious choice is at the top.
export const OutgoingPicker = ({ incoming, players, onPick, onClose }: OutgoingPickerProps) => {
  const onField = players.filter(p => p.isOnField).sort((a, b) => a.psi - b.psi);

  return (
    <Dialog open={incoming !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        {incoming && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {incoming.photo ? (
                  <img src={incoming.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black">{getInitials(incoming.name)}</span>
                )}
              </div>
              <div>
                <DialogTitle>Bring on {incoming.name}</DialogTitle>
                <DialogDescription>Who comes off? Most tired players are listed first.</DialogDescription>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              {onField.map((player, index) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onPick(incoming.id, player.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted',
                    index === 0 ? 'border-status-fit/60 bg-status-fit/10' : 'border-border'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {player.photo ? (
                      <img src={player.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-black">{getInitials(player.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">{player.name}</span>
                      {index === 0 && (
                        <span className="shrink-0 rounded-full bg-status-fit px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Suggested
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn('h-2 w-2 rounded-full', statusDot[player.status])} />
                      {player.role} · {statusLabel[player.status]} · {Math.round(player.psi)}%
                    </div>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
