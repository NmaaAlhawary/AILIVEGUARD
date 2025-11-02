import { useState, useEffect } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { initializePlayers, updatePlayerData } from '@/utils/playerSimulator';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerStatsPanel } from '@/components/PlayerStatsPanel';
import { SubstitutionAlert } from '@/components/SubstitutionAlert';
import { BenchPanel } from '@/components/BenchPanel';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const defaultSubNames = ['Inaki Pena', 'Fermin Lopez', 'Joao Felix', 'Yamal', 'Ansu Fati'];

const Index = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [alertPlayer, setAlertPlayer] = useState<Player | null>(null);
  const [substitutes, setSubstitutes] = useState<SubstitutePlayer[]>([]);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-100 to-pink-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-2 drop-shadow-lg">
              ⚽ Barcelona Team Tracker! 🎮
            </h1>
            <p className="text-lg text-foreground font-semibold">
              Watch your players and keep them happy! 😊
            </p>
          </div>
          <Button onClick={() => navigate('/manage')} variant="default" size="lg" className="gap-2 shadow-fun text-lg">
            <Settings className="h-5 w-5" />
            Change Names
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
            
            <div className="mt-6 flex items-center justify-center gap-4 text-base font-bold">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-status-fit" />
                <span>😊 Happy</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-status-tired" />
                <span>😓 Tired</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-status-risk" />
                <span>😰 Need Rest!</span>
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
