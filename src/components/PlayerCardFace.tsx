import { Player } from '@/types/player';
import { getInitials } from '@/utils/playerPhotos';
import { cn } from '@/lib/utils';

// Shield outline shared by the gold trim and the card face inside it.
const CARD_SHAPE = 'polygon(7% 0, 93% 0, 100% 4%, 100% 89%, 50% 100%, 0 89%, 0 4%)';
// Soft oval fade so the square headshot melts into the card instead of sitting on it as a box.
const PHOTO_FADE =
  'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 12%, black 62%, transparent 100%)';
const TRIM =
  'linear-gradient(135deg, #f8e7a1 0%, #c99a3c 30%, #fff4c2 50%, #a8782a 75%, #f1d98a 100%)';

export const statusToken = {
  fit: '--status-fit',
  tired: '--status-tired',
  risk: '--status-risk',
} as const;

// The collectible card itself plus its stat key. Shared by the player popup and
// the fatigue alert, so a player looks the same wherever he shows up.
export const PlayerCardFace = ({ player }: { player: Player }) => {
  const token = statusToken[player.status];
  const stats = [
    {
      label: 'Heart rate',
      short: 'HR',
      value: Math.round(player.heartRate),
      unit: 'bpm',
    },
    {
      label: 'Speed now',
      short: 'SPD',
      value: Math.round(player.speed),
      unit: 'km/h',
    },
    {
      label: 'Top speed',
      short: 'TOP',
      value: Math.round(player.rollingTopSpeed),
      unit: 'km/h',
    },
    {
      label: 'Fatigue',
      short: 'FAT',
      value: Math.round(player.fatigue),
      unit: '%',
    },
    {
      label: 'Recovery',
      short: 'REC',
      value: Math.round(player.recoveryRate),
      unit: 'bpm/min',
    },
    {
      label: 'Risk in',
      short: 'RSK',
      value: player.minutesToRisk !== null ? player.minutesToRisk : '—',
      unit: player.minutesToRisk !== null ? 'min' : '',
    },
  ];

  return (
    <>
      {/* Collectible-card face: gold trim, then the status-tinted card inset by 4px. */}
      <div
        className="relative mx-auto aspect-[5/7] w-full max-w-[190px] p-[3px] drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
        style={{ clipPath: CARD_SHAPE, background: TRIM }}
      >
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            clipPath: CARD_SHAPE,
            background: `linear-gradient(160deg, hsl(var(${token})) 0%, hsl(var(${token}) / 0.55) 45%, hsl(222 47% 9%) 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 42%, transparent 55%), repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 9px)',
            }}
          />

          <div className="absolute left-[9%] top-[9%] z-10 flex flex-col items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <span className="text-3xl font-black leading-none">{Math.round(player.psi)}</span>
            <span className="mt-0.5 text-xs font-extrabold tracking-wider">{player.role}</span>
            <div className="my-1 h-px w-6" style={{ background: TRIM }} />
            <span className="text-[10px] font-bold opacity-90">#{player.id}</span>
          </div>

          <div className="absolute right-[6%] top-[7%] h-[52%] w-[66%]">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                style={{
                  maskImage: PHOTO_FADE,
                  WebkitMaskImage: PHOTO_FADE,
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl font-black opacity-80">
                {getInitials(player.name)}
              </div>
            )}
          </div>

          <div className="absolute inset-x-[8%] top-[60%] text-center">
            <h3 className="truncate text-sm font-black uppercase tracking-wide drop-shadow">
              {player.name}
            </h3>
            <div className="mx-auto mt-1 h-px w-full" style={{ background: TRIM }} />
          </div>

          <div className="absolute inset-x-[12%] top-[71%] grid grid-cols-2 gap-x-2">
            {[stats.slice(0, 3), stats.slice(3)].map((column, i) => (
              <ul key={i} className={cn('space-y-0.5', i === 1 && 'border-l border-white/30 pl-2')}>
                {column.map(stat => (
                  <li key={stat.label} className="flex items-baseline gap-1.5">
                    <span className="w-6 text-right text-xs font-black leading-none tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wide opacity-85">
                      {stat.short}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      <dl className="mx-auto mt-3 grid max-w-[190px] grid-flow-col grid-cols-2 grid-rows-3 gap-x-2 gap-y-1 rounded-lg bg-white/[0.04] px-2.5 py-2 text-[9px] leading-tight">
        {stats.map(stat => (
          <div
            key={stat.label}
            title={stat.unit ? `${stat.label} (${stat.unit})` : stat.label}
            className="flex items-baseline gap-1"
          >
            <dt className="w-5 shrink-0 font-extrabold tracking-wide text-[#e9c870]">
              {stat.short}
            </dt>
            <dd className="truncate text-white/60">{stat.label}</dd>
          </div>
        ))}
      </dl>
    </>
  );
};
