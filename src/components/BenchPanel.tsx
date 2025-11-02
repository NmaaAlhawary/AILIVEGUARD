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
      <h2 className="text-xl font-bold text-foreground mb-4">Available Substitutes</h2>
      <div className="space-y-2">
        {substitutes.map((sub) => (
          <Card key={sub.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{sub.name}</h3>
                <p className="text-xs text-muted-foreground">Ready to play</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xl font-bold text-status-fit">{sub.psi.toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">PSI</div>
                </div>
                <Button
                  size="icon"
                  variant="default"
                  onClick={() => onSubstitute(sub.id)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
