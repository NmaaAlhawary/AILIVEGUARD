import { Player } from '@/types/player';
import { AlertTriangle, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface SubstitutionAlertProps {
  player: Player | null;
  onClose: () => void;
}

export const SubstitutionAlert = ({ player, onClose }: SubstitutionAlertProps) => {
  if (!player || player.psi >= 40) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 border-destructive border-2 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-destructive">High Fatigue Alert</h3>
              <p className="text-sm text-muted-foreground">Immediate Action Required</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-bold">Player #{player.id} {player.name}</span> is experiencing
            critical fatigue levels (PSI: {player.psi.toFixed(2)}%).
          </p>
          
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Heart Rate:</span>
              <span className="font-bold text-destructive">{player.heartRate.toFixed(2)} bpm</span>
            </div>
            <div className="flex justify-between">
              <span>Fatigue:</span>
              <span className="font-bold text-destructive">{player.fatigue.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>PSI:</span>
              <span className="font-bold text-destructive">{player.psi.toFixed(2)}%</span>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
            <p className="text-sm font-semibold text-destructive">
              ⚠ Recommended Action: Substitute within 2 minutes
            </p>
          </div>

          <Button 
            onClick={onClose}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            Acknowledged
          </Button>
        </div>
      </Card>
    </div>
  );
};
