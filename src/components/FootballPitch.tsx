import { Player } from '@/types/player';
import { PlayerDot } from './PlayerDot';

interface FootballPitchProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

export const FootballPitch = ({ players, onPlayerClick }: FootballPitchProps) => {
  return (
    <div className="relative w-full aspect-[2/3] bg-pitch-grass rounded-lg border-4 border-pitch-line shadow-2xl overflow-hidden">
      {/* Pitch markings */}
      <div className="absolute inset-0">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-pitch-line rounded-full opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-pitch-line rounded-full" />
        
        {/* Halfway line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-pitch-line opacity-60" />
        
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-24 border-2 border-pitch-line border-t-0 opacity-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-24 border-2 border-pitch-line border-b-0 opacity-60" />
        
        {/* Goal areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/5 h-12 border-2 border-pitch-line border-t-0 opacity-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/5 h-12 border-2 border-pitch-line border-b-0 opacity-60" />
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
