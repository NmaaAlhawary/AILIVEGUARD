import { useState, useEffect, useRef } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { initializePlayers, updatePlayerData } from '@/utils/playerSimulator';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerStatsPanel } from '@/components/PlayerStatsPanel';
import { SubstitutionAlert } from '@/components/SubstitutionAlert';
import { BenchPanel } from '@/components/BenchPanel';
import { PlayerCard } from '@/components/PlayerCard';
import { SUB_PHOTOS_KEY, loadPhotos } from '@/utils/playerPhotos';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const defaultSubNames = ['Al-Hassan', 'Al-Ghamdi', 'Al-Dosari', 'Bahbri'];

const Index = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [alertPlayer, setAlertPlayer] = useState<Player | null>(null);
  const [substitutes, setSubstitutes] = useState<SubstitutePlayer[]>([]);
  const [matchTime, setMatchTime] = useState(75 * 60); // Start at 75 minutes
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const alertedRef = useRef<Set<number>>(new Set());
  const forecastWarnedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const savedSubNames = localStorage.getItem('substituteNames');
    const subNames = savedSubNames ? JSON.parse(savedSubNames) : defaultSubNames;
    
    const subPhotos = loadPhotos(SUB_PHOTOS_KEY);
    setSubstitutes(
      subNames.map((name: string, idx: number) => ({
        id: 100 + idx,
        name,
        psi: 95 + Math.random() * 5,
        photo: subPhotos[idx],
      }))
    );
    
    setPlayers(initializePlayers());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchTime(prev => prev < 90 * 60 ? prev + 1 : prev);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prevPlayers => {
        const updated = prevPlayers.map(updatePlayerData);

        // Early warning, while there is still time to react.
        updated.forEach(player => {
          const approaching =
            player.isOnField &&
            player.status !== 'risk' &&
            player.minutesToRisk !== null &&
            player.minutesToRisk <= 5;

          if (approaching && !forecastWarnedRef.current.has(player.id)) {
            forecastWarnedRef.current.add(player.id);
            const [topReason] = player.reasons;
            toast.warning(
              `${player.name}: fatigue rising — high risk in about ${player.minutesToRisk} minutes`,
              {
                description: topReason ? `${topReason.label} ${topReason.detail}` : undefined,
                duration: 6000,
              }
            );
          }
        });

        // Fire the moment a player crosses into the red zone, once per player.
        const crossed = updated.find(
          player => player.isOnField && player.status === 'risk' && !alertedRef.current.has(player.id)
        );
        if (crossed) {
          alertedRef.current.add(crossed.id);
          setAlertPlayer(crossed);
          toast.error(`⚠ ${crossed.name} needs immediate rest!`, { duration: 5000 });
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const atRisk = players.filter(p => p.isOnField && p.status === 'risk').length;
  const matchProgress = Math.min(100, Math.max(0, ((matchTime - 75 * 60) / (15 * 60)) * 100));

  const formatMatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const liveCardPlayer = cardPlayer
    ? players.find(p => p.id === cardPlayer.id) ?? cardPlayer
    : null;

  const liveAlertPlayer = alertPlayer
    ? players.find(p => p.id === alertPlayer.id) ?? alertPlayer
    : null;

  const handlePlayerClick = (player: Player) => {
    setCardPlayer(player);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center lg:mb-8">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-status-risk/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-status-risk ring-1 ring-status-risk/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-risk" />
                Live
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {atRisk > 0 ? `${atRisk} player${atRisk > 1 ? 's' : ''} at risk` : 'All players stable'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl lg:text-4xl">
              <span className="text-status-fit">AILiveGuard</span>{' '}
              <span className="text-foreground/90">System</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time fatigue tracking and substitution recommendations
            </p>
          </div>

          <div
            className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/80 px-5 py-3"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div>
              <span className="panel-heading">Match Time</span>
              <div className="font-mono text-2xl font-black leading-tight text-status-fit tabular md:text-3xl">
                {formatMatchTime(matchTime)}
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="w-24">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>75'</span>
                <span>90'</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-status-fit transition-all duration-1000"
                  style={{ width: `${matchProgress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Panel - Stats */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <PlayerStatsPanel players={players} />
          </div>

          {/* Center - Pitch */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <FootballPitch players={players} onPlayerClick={handlePlayerClick} />
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:mt-5">
              {[
                { color: 'bg-status-fit', label: 'Fit', range: '60-100%' },
                { color: 'bg-status-tired', label: 'Tiring', range: '40-59%' },
                { color: 'bg-status-risk', label: 'At risk', range: 'under 40%' },
              ].map(item => (
                <span
                  key={item.label}
                  className="flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-muted-foreground">{item.range}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right Panel - Bench */}
          <div className="lg:col-span-3 order-3">
            <BenchPanel substitutes={substitutes} onSubstitute={handleSubstitute} onManagePlayers={() => navigate('/manage')} />
          </div>
        </div>
      </div>

      <PlayerCard player={liveCardPlayer} onClose={() => setCardPlayer(null)} />
      <SubstitutionAlert player={liveAlertPlayer} onClose={() => setAlertPlayer(null)} />
    </div>
  );
};

export default Index;
