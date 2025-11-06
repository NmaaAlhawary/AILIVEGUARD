import { useState, useEffect } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { initializePlayers, updatePlayerData } from '@/utils/playerSimulator';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerStatsPanel } from '@/components/PlayerStatsPanel';
import { SubstitutionAlert } from '@/components/SubstitutionAlert';
import { BenchPanel } from '@/components/BenchPanel';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const defaultSubNames = ['Al-Hassan', 'Al-Ghamdi', 'Al-Dosari', 'Bahbri'];

const Index = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [alertPlayer, setAlertPlayer] = useState<Player | null>(null);
  const [substitutes, setSubstitutes] = useState<SubstitutePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const loadingTimer = setTimeout(() => {
      const savedSubNames = localStorage.getItem('substituteNames');
      const subNames = savedSubNames ? JSON.parse(savedSubNames) : defaultSubNames;
      
      setSubstitutes(
        subNames.map((name: string, idx: number) => ({
          id: 100 + idx,
          name,
          psi: 95 + Math.random() * 5,
        }))
      );
      
      setPlayers(initializePlayers());
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prevPlayers => {
        const updated = prevPlayers.map(updatePlayerData);
        
        const criticalPlayer = updated.find(p => p.isOnField && p.psi < 40 && p.psi >= 35);
        if (criticalPlayer && (!alertPlayer || alertPlayer.id !== criticalPlayer.id)) {
          setAlertPlayer(criticalPlayer);
          toast.error(`⚠ Player ${criticalPlayer.name} needs immediate rest!`, {
            duration: 5000,
          });
        }
        
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [alertPlayer]);

  const handleSubstitute = (subId: number) => {
    const lowestPSIPlayer = players
      .filter(p => p.isOnField)
      .reduce((prev, current) => (prev.psi < current.psi ? prev : current));

    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === lowestPSIPlayer.id ? { ...p, isOnField: false } : p
      )
    );

    toast.success(`${lowestPSIPlayer.name} substituted successfully!`);
    setAlertPlayer(null);
  };

  const handlePlayerClick = (player: Player) => {
    toast.info(`${player.name} - PSI: ${player.psi}% | HR: ${player.heartRate} bpm`);
  };

  if (isLoading) {
    return <LoadingScreen message="Initializing Player Monitoring..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-status-fit mb-2">
              AILiveGuard System
            </h1>
            <p className="text-muted-foreground">
              Real-time fatigue tracking and substitution recommendations
            </p>
          </div>
          <Button onClick={() => navigate('/manage')} variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Players
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Stats */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <PlayerStatsPanel players={players} />
          </div>

          {/* Center - Pitch */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <FootballPitch players={players} onPlayerClick={handlePlayerClick} />
            
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-status-fit" />
                <span>Fit (60-100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-status-tired" />
                <span>Tired (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-status-risk" />
                <span>Risk (&lt;40%)</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Bench */}
          <div className="lg:col-span-3 order-3">
            <BenchPanel substitutes={substitutes} onSubstitute={handleSubstitute} />
          </div>
        </div>
      </div>

      <SubstitutionAlert player={alertPlayer} onClose={() => setAlertPlayer(null)} />
    </div>
  );
};

export default Index;
