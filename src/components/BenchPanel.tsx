import { SubstitutePlayer } from '@/types/player';
import { Button } from './ui/button';
import { Settings, UserPlus } from 'lucide-react';
import { getInitials } from '@/utils/playerPhotos';

interface BenchPanelProps {
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number) => void;
  onManagePlayers: () => void;
}

export const BenchPanel = ({ substitutes, onSubstitute, onManagePlayers }: BenchPanelProps) => {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="panel-heading">Substitutes</h2>
        <span className="text-[11px] font-semibold text-muted-foreground tabular">
          {substitutes.length} available
        </span>
      </header>

      <div className="space-y-2">
        {substitutes.map(sub => (
          <article
            key={sub.id}
            className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/80 p-3 transition-colors hover:border-status-fit/50"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-status-fit/50">
              {sub.photo ? (
                <img src={sub.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] font-black text-muted-foreground">
                  {getInitials(sub.name)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold leading-tight">{sub.name}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-fit" />
                Fresh · {Math.round(sub.psi)}%
              </p>
            </div>

            <Button
              size="icon"
              onClick={() => onSubstitute(sub.id)}
              aria-label={`Bring on ${sub.name}`}
              className="h-9 w-9 shrink-0 bg-status-fit text-white hover:bg-status-fit/90"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </article>
        ))}
      </div>

      <Button onClick={onManagePlayers} variant="outline" className="mt-4 w-full gap-2">
        <Settings className="h-4 w-4" />
        Manage Players
      </Button>
    </section>
  );
};
