import { useState, useEffect, useRef } from 'react';
import { Player, SubstitutePlayer } from '@/types/player';
import { initializePlayers, updatePlayerData } from '@/utils/playerSimulator';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerStatsPanel } from '@/components/PlayerStatsPanel';
import { SubstitutionAlert } from '@/components/SubstitutionAlert';
import { BenchPanel } from '@/components/BenchPanel';
import { PlayerCard } from '@/components/PlayerCard';
import { SUB_PHOTOS_KEY, loadPhotos } from '@/utils/playerPhotos';
import { getDefaultPhoto } from '@/utils/defaultPhotos';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const defaultSubNames = ['Inaki Pena', 'Fermin Lopez', 'Joao Felix', 'Yamal', 'Ansu Fati'];

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
        photo: subPhotos[idx] ?? getDefaultPhoto(name),
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

  const onField = players.filter(p => p.isOnField);
  const squadCounts = {
    fit: onField.filter(p => p.status === 'fit').length,
    tired: onField.filter(p => p.status === 'tired').length,
    risk: onField.filter(p => p.status === 'risk').length,
  };
  const matchProgress = Math.min(100, Math.max(0, ((matchTime - 75 * 60) / (15 * 60)) * 100));

  const formatMatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // A substitution swaps the fresh player into the tired one's shirt: same
  // position and number, his own name and photo, and a clean slate of load.
  const handleSubstitute = (subId: number, targetPlayerId?: number) => {
    const incoming = substitutes.find(s => s.id === subId);
    if (!incoming) return;

    const onField = players.filter(p => p.isOnField);
    if (onField.length === 0) return;

    const outgoing = targetPlayerId
      ? onField.find(p => p.id === targetPlayerId)
      : onField.reduce((prev, current) => (prev.psi < current.psi ? prev : current));
    if (!outgoing) return;

    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === outgoing.id
          ? {
              ...p,
              name: incoming.name,
              photo: incoming.photo,
              load: 0.05,
              history: [],
              elapsed: 0,
              trendPerMinute: 0,
              minutesToRisk: null,
              reasons: [],
            }
          : p
      )
    );

    setSubstitutes(prev => prev.filter(s => s.id !== subId));
    alertedRef.current.delete(outgoing.id);
    forecastWarnedRef.current.delete(outgoing.id);

    toast.success(`${incoming.name} on for ${outgoing.name}`);
    setAlertPlayer(null);
    setCardPlayer(null);
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
        <header className="mb-6 lg:mb-8 border-b border-border pb-5">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <div className="mb-2 flex items-center justify-center gap-3 md:justify-start">
                <h1 className="text-3xl font-bold text-status-fit md:text-4xl lg:text-5xl">
                  AILiveGuard System
                </h1>
                <span className="flex items-center gap-1.5 rounded-full border border-status-risk/40 bg-status-risk/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-status-risk">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-risk" />
                  Live
                </span>
              </div>
              <p className="text-sm text-muted-foreground md:text-base">
                Real-time fatigue tracking and substitution recommendations
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-3">
              <div className="text-center">
                <span className="text-xs text-muted-foreground">Match Time</span>
                <div className="font-mono text-2xl font-bold leading-tight text-status-fit md:text-3xl">
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
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {[
              { label: 'fit', count: squadCounts.fit, dot: 'bg-status-fit' },
              { label: 'tiring', count: squadCounts.tired, dot: 'bg-status-tired' },
              { label: 'at risk', count: squadCounts.risk, dot: 'bg-status-risk' },
              { label: 'on the bench', count: substitutes.length, dot: 'bg-muted-foreground' },
            ].map(item => (
              <span
                key={item.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
              >
                <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                <span className="font-bold">{item.count}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </span>
            ))}
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
            
            <div className="mt-4 lg:mt-6 flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
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
            <BenchPanel substitutes={substitutes} onSubstitute={handleSubstitute} onManagePlayers={() => navigate('/manage')} />
          </div>
        </div>
      </div>

      <PlayerCard
        player={liveCardPlayer}
        substitutes={substitutes}
        onSubstitute={handleSubstitute}
        onClose={() => setCardPlayer(null)}
      />
      <SubstitutionAlert
        player={liveAlertPlayer}
        substitutes={substitutes}
        onSubstitute={handleSubstitute}
        onClose={() => setAlertPlayer(null)}
      />
    </div>
  );
};

export default Index;
