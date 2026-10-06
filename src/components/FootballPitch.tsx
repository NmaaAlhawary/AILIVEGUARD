import { Player } from '@/types/player';
import { PlayerDot } from './PlayerDot';

interface FootballPitchProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
}

const line = 'border-pitch-line/70';

export const FootballPitch = ({ players, onPlayerClick }: FootballPitchProps) => {
  return (
    <div
      className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-white/10"
      style={{ boxShadow: 'var(--shadow-lifted)' }}
    >
      {/* Mown stripes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            180deg,
            hsl(var(--pitch-grass-light)) 0px,
            hsl(var(--pitch-grass-light)) 7.14%,
            hsl(var(--pitch-grass-dark)) 7.14%,
            hsl(var(--pitch-grass-dark)) 14.28%
          )`,
        }}
      />

      {/* Depth: light from the top, darkened corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, hsl(140 45% 40% / 0.35), transparent 55%), radial-gradient(140% 100% at 50% 50%, transparent 45%, hsl(220 50% 4% / 0.55) 100%)',
        }}
      />

      {/* Markings */}
      <div className="absolute inset-0 text-pitch-line">
        <div className={`absolute inset-3 rounded-sm border-2 ${line}`} />

        <div className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-pitch-line/70`} />
        <div
          className={`absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${line}`}
        />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pitch-line/80" />

        {/* Penalty and goal areas */}
        <div className={`absolute left-1/2 top-3 h-24 w-3/5 -translate-x-1/2 border-2 border-t-0 ${line}`} />
        <div className={`absolute left-1/2 top-3 h-10 w-2/5 -translate-x-1/2 border-2 border-t-0 ${line}`} />
        <div className={`absolute bottom-3 left-1/2 h-24 w-3/5 -translate-x-1/2 border-2 border-b-0 ${line}`} />
        <div className={`absolute bottom-3 left-1/2 h-10 w-2/5 -translate-x-1/2 border-2 border-b-0 ${line}`} />

        {/* Penalty spots */}
        <div className="absolute left-1/2 top-[72px] h-1 w-1 -translate-x-1/2 rounded-full bg-pitch-line/80" />
        <div className="absolute bottom-[72px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pitch-line/80" />

        {/* Corner arcs */}
        <div className={`absolute left-3 top-3 h-5 w-5 rounded-br-full border-b-2 border-r-2 ${line}`} />
        <div className={`absolute right-3 top-3 h-5 w-5 rounded-bl-full border-b-2 border-l-2 ${line}`} />
        <div className={`absolute bottom-3 left-3 h-5 w-5 rounded-tr-full border-r-2 border-t-2 ${line}`} />
        <div className={`absolute bottom-3 right-3 h-5 w-5 rounded-tl-full border-l-2 border-t-2 ${line}`} />
      </div>

      {players.map(player => (
        <PlayerDot key={player.id} player={player} onClick={() => onPlayerClick(player)} />
      ))}
    </div>
  );
};
