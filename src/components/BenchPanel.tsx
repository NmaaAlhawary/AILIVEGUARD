import { SubstitutePlayer } from '@/types/player';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { UserPlus } from 'lucide-react';

interface BenchPanelProps {
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number) => void;
}

export const BenchPanel = ({ substitutes, onSubstitute }: BenchPanelProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-foreground mb-4 drop-shadow">🪑 Bench Players</h2>
      <div className="space-y-2">
        {substitutes.map((sub) => (
          <Card key={sub.id} className="p-4 shadow-lg border-4 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">{sub.name}</h3>
                <p className="text-sm text-muted-foreground font-bold">Ready! 💪</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-2xl font-black text-status-fit">{Math.round(sub.psi)}%</div>
                  <div className="text-xs text-muted-foreground font-bold">Energy</div>
                </div>
                <Button
                  size="lg"
                  variant="default"
                  onClick={() => onSubstitute(sub.id)}
                  className="bg-primary hover:bg-primary/90 shadow-lg text-lg"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
