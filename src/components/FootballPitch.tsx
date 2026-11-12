import { Player } from '@/types/player';
import { PlayerDot } from './PlayerDot';

interface FootballPitchProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

export const FootballPitch = ({ players, onPlayerClick }: FootballPitchProps) => {
  return (
    <div
      className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl border-2 border-white/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_0_40px_-6px_hsl(var(--primary)/0.45),0_30px_60px_-20px_rgba(0,0,0,0.8)]"
      style={{
        // Mowed stripes, a floodlight from above and darker corners, like a broadcast camera view.
        backgroundColor: 'hsl(140 45% 24%)',
        backgroundImage: [
          'radial-gradient(ellipse 90% 60% at 50% 35%, hsl(120 60% 70% / 0.18), transparent 70%)',
          'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, hsl(150 60% 4% / 0.55))',
          'repeating-linear-gradient(180deg, hsl(140 48% 27%) 0 8.33%, hsl(140 44% 22%) 8.33% 16.66%)',
        ].join(', '),
      }}
    >
      {/* Pitch markings */}
      <div className="absolute inset-0">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 border-2 border-pitch-line rounded-full opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-pitch-line rounded-full" />
        
        {/* Halfway line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-pitch-line opacity-60" />
        
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-16 sm:h-24 border-2 border-pitch-line border-t-0 opacity-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-16 sm:h-24 border-2 border-pitch-line border-b-0 opacity-60" />
        
        {/* Goal areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/5 h-8 sm:h-12 border-2 border-pitch-line border-t-0 opacity-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/5 h-8 sm:h-12 border-2 border-pitch-line border-b-0 opacity-60" />
      </div>

      {/* Players */}
      {players.map((player) => (
        <PlayerDot
          key={player.id}
          player={player}
          onClick={() => onPlayerClick(player)}
        />
      ))}
    </div>
  );
};
