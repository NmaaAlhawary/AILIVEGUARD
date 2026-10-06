import { SubstitutePlayer } from '@/types/player';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { UserPlus, Settings } from 'lucide-react';
import { getInitials } from '@/utils/playerPhotos';

interface BenchPanelProps {
  substitutes: SubstitutePlayer[];
  onSubstitute: (subId: number) => void;
  onManagePlayers: () => void;
}

export const BenchPanel = ({ substitutes, onSubstitute, onManagePlayers }: BenchPanelProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground mb-4">Available Substitutes</h2>
      <div className="space-y-2">
        {substitutes.map((sub) => (
          <Card key={sub.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sub.photo ? (
                  <img
                    src={sub.photo}
                    alt={sub.name}
                    className="w-9 h-9 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {getInitials(sub.name)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm">{sub.name}</h3>
                  <p className="text-xs text-muted-foreground">Ready to play</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="default"
                onClick={() => onSubstitute(sub.id)}
                className="bg-status-fit hover:bg-status-fit/90"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Button 
        onClick={onManagePlayers} 
        variant="outline" 
        className="w-full gap-2 mt-4"
      >
        <Settings className="h-4 w-4" />
        Manage Players
      </Button>
    </div>
  );
};
