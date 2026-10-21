import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PsiSample } from '@/types/player';

interface ReadinessTrendProps {
  history: PsiSample[];
  status: 'fit' | 'tired' | 'risk';
}

const WIDTH = 300;
const HEIGHT = 120;
const TOP = 14;
const BOTTOM = 26;
const Y_MIN = 20;
const Y_MAX = 100;
const RISK_LINE = 40;

const FIT_LINE = 60;

const formatSpan = (seconds: number) =>
  seconds < 60 ? `${Math.max(1, Math.round(seconds))}s` : `${Math.round(seconds / 60)} min`;

const statusVar = {
  fit: '--status-fit',
  tired: '--status-tired',
  risk: '--status-risk',
};

const LineView = ({ history, status }: ReadinessTrendProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  // One point every 3s; thin to keep the path light over a long match.
  const samples = history.length > 90 ? history.filter((_, i) => i % 2 === 0) : history;

  const first = samples[0].elapsed;
  const last = samples[samples.length - 1].elapsed;
  const span = last - first || 1;

  const x = (elapsed: number) => ((elapsed - first) / span) * WIDTH;
  const y = (psi: number) => {
    const clamped = Math.min(Y_MAX, Math.max(Y_MIN, psi));
    return TOP + (1 - (clamped - Y_MIN) / (Y_MAX - Y_MIN)) * (HEIGHT - TOP - BOTTOM);
  };

  const line = samples.map(s => `${x(s.elapsed).toFixed(1)},${y(s.psi).toFixed(1)}`).join(' ');
  const area = `${line} ${WIDTH},${HEIGHT - BOTTOM} 0,${HEIGHT - BOTTOM}`;

  const latest = samples[samples.length - 1];
  const active = hovered === null ? latest : samples[hovered];
  const minutesShown = Math.round(span / 60);
  const stroke = `hsl(var(${statusVar[status]}))`;

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const index = Math.round(ratio * (samples.length - 1));
    setHovered(Math.min(samples.length - 1, Math.max(0, index)));
  };

  return (
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHovered(null)}
        role="img"
        aria-label={`Readiness over the last ${minutesShown} minutes, now ${Math.round(latest.psi)} percent`}
      >
        <defs>
          <linearGradient id={`fill-${status}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Risk threshold */}
        <line
          x1="0"
          x2={WIDTH}
          y1={y(RISK_LINE)}
          y2={y(RISK_LINE)}
          stroke="hsl(var(--status-risk))"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.75"
        />
        <text x="2" y={y(RISK_LINE) - 3} fill="hsl(var(--status-risk))" fontSize="11" fontWeight="800">
          RISK 40%
        </text>

        <polygon points={area} fill={`url(#fill-${status})`} />
        <polyline
          points={line}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {hovered !== null && (
          <line
            x1={x(active.elapsed)}
            x2={x(active.elapsed)}
            y1={TOP}
            y2={HEIGHT - BOTTOM}
            stroke="#fff"
            strokeWidth="1"
            opacity="0.5"
          />
        )}

        <circle
          cx={x(active.elapsed)}
          cy={y(active.psi)}
          r="5.5"
          fill="#fff"
          stroke={stroke}
          strokeWidth="2.5"
        />

        <text
          x={Math.min(WIDTH - 4, Math.max(16, x(active.elapsed)))}
          y={Math.max(9, y(active.psi) - 9)}
          fill="#fff"
          fontSize="14"
          fontWeight="800"
          textAnchor={x(active.elapsed) > WIDTH - 40 ? 'end' : 'middle'}
        >
          {Math.round(active.psi)}%
        </text>

        <text x="0" y={HEIGHT - 4} fill="#fff" fontSize="11" opacity="0.75">
          {formatSpan(span)} ago
        </text>
        <text x={WIDTH} y={HEIGHT - 4} fill="#fff" fontSize="11" opacity="0.75" textAnchor="end">
          now
        </text>
      </svg>
  );
};

const zoneOf = (psi: number): ReadinessTrendProps['status'] =>
  psi >= FIT_LINE ? 'fit' : psi >= RISK_LINE ? 'tired' : 'risk';

const zoneLabel = { fit: 'Fit', tired: 'Tiring', risk: 'At risk' };

const BAR_COUNT = 12;

// The same window as the line, averaged into equal slices so each bar is
// one stretch of play, coloured by the zone it ended up in.
const BarsView = ({ history }: Pick<ReadinessTrendProps, 'history'>) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const first = history[0].elapsed;
  const span = history[history.length - 1].elapsed - first || 1;
  const count = Math.min(BAR_COUNT, history.length);
  const buckets = Array.from({ length: count }, (_, i) => {
    const from = first + (span * i) / count;
    const to = first + (span * (i + 1)) / count;
    const inSlice = history.filter(s =>
      i === count - 1 ? s.elapsed >= from : s.elapsed >= from && s.elapsed < to
    );
    const avg = inSlice.length
      ? inSlice.reduce((sum, s) => sum + s.psi, 0) / inSlice.length
      : 0;
    return { psi: avg, secondsAgo: Math.round(history[history.length - 1].elapsed - to) };
  }).filter(b => b.psi > 0);

  const plotH = HEIGHT - TOP - BOTTOM;
  const gap = 2;
  const barW = WIDTH / buckets.length - gap;
  const y = (psi: number) => TOP + (1 - Math.min(100, psi) / 100) * plotH;
  const active = hovered === null ? buckets.length - 1 : hovered;
  const minutesShown = Math.round(span / 60);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full touch-none"
      onPointerLeave={() => setHovered(null)}
      role="img"
      aria-label={`Readiness in ${buckets.length} slices over the last ${minutesShown} minutes`}
    >
      <line
        x1="0"
        x2={WIDTH}
        y1={y(RISK_LINE)}
        y2={y(RISK_LINE)}
        stroke="hsl(var(--status-risk))"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.75"
      />

      {buckets.map((b, i) => {
        const bx = i * (barW + gap) + gap / 2;
        const top = y(b.psi);
        const h = HEIGHT - BOTTOM - top;
        const r = Math.min(4, barW / 2, h);
        return (
          <g key={i} onPointerEnter={() => setHovered(i)}>
            {/* Full-height hit target, wider than the bar itself */}
            <rect x={bx - gap / 2} y={TOP} width={barW + gap} height={plotH} fill="transparent" />
            <path
              d={`M${bx},${HEIGHT - BOTTOM} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + barW - r} Q${bx + barW},${top} ${bx + barW},${top + r} V${HEIGHT - BOTTOM} Z`}
              fill={`hsl(var(${statusVar[zoneOf(b.psi)]}))`}
              opacity={i === active ? 1 : 0.55}
            />
          </g>
        );
      })}

      <text
        x={Math.min(WIDTH - 2, Math.max(2, active * (barW + gap) + barW / 2))}
        y={Math.max(11, y(buckets[active].psi) - 5)}
        fill="#fff"
        fontSize="13"
        fontWeight="800"
        textAnchor={active === 0 ? 'start' : active === buckets.length - 1 ? 'end' : 'middle'}
      >
        {Math.round(buckets[active].psi)}%
      </text>

      <text x="0" y={HEIGHT - 4} fill="#fff" fontSize="11" opacity="0.75">
        {hovered === null
          ? `${formatSpan(span)} ago`
          : buckets[active].secondsAgo <= 0
            ? 'latest slice'
            : `${buckets[active].secondsAgo}s ago`}
      </text>
      <text x={WIDTH} y={HEIGHT - 4} fill="#fff" fontSize="11" opacity="0.75" textAnchor="end">
        now
      </text>
    </svg>
  );
};

// A half-dial with the three zones marked on it; the needle is the current
// reading and the line underneath says which way it has moved.
const GaugeView = ({ history, status }: ReadinessTrendProps) => {
  const latest = history[history.length - 1].psi;
  const change = latest - history[0].psi;
  const period = formatSpan(history[history.length - 1].elapsed - history[0].elapsed);

  const cx = WIDTH / 2;
  const cy = 98;
  const r = 78;
  const point = (pct: number, radius = r) => {
    const a = Math.PI * (1 - Math.min(100, Math.max(0, pct)) / 100);
    return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
  };
  const arc = (from: number, to: number) => {
    const a = point(from);
    const b = point(to);
    return `M${a.x},${a.y} A${r},${r} 0 0 1 ${b.x},${b.y}`;
  };
  const needle = point(latest, r);
  const zones: [number, number, ReadinessTrendProps['status']][] = [
    [0, RISK_LINE - 0.8, 'risk'],
    [RISK_LINE + 0.8, FIT_LINE - 0.8, 'tired'],
    [FIT_LINE + 0.8, 100, 'fit'],
  ];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label={`Readiness ${Math.round(latest)} percent, ${zoneLabel[status]}`}
    >
      {zones.map(([from, to, zone]) => (
        <path
          key={zone}
          d={arc(from, to)}
          fill="none"
          stroke={`hsl(var(${statusVar[zone]}))`}
          strokeWidth="12"
          opacity={zone === status ? 1 : 0.3}
        />
      ))}
      <circle cx={needle.x} cy={needle.y} r="8" fill="#fff" stroke={`hsl(var(${statusVar[status]}))`} strokeWidth="3" />

      <text x={cx} y={cy - 22} fill="#fff" fontSize="30" fontWeight="800" textAnchor="middle">
        {Math.round(latest)}%
      </text>
      <text x={cx} y={cy - 4} fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle" opacity="0.85">
        {zoneLabel[status].toUpperCase()}
      </text>
      <text x={cx} y={HEIGHT - 2} fill="#fff" fontSize="11" textAnchor="middle" opacity="0.75">
        {Math.abs(change) < 1
          ? `steady over the last ${period}`
          : `${change < 0 ? '▼' : '▲'} ${Math.abs(Math.round(change))} pts in the last ${period}`}
      </text>
      <text x={cx - r} y={cy + 14} fill="#fff" fontSize="10" textAnchor="middle" opacity="0.6">0</text>
      <text x={cx + r} y={cy + 14} fill="#fff" fontSize="10" textAnchor="middle" opacity="0.6">100</text>
    </svg>
  );
};

type View = 'line' | 'bars' | 'gauge';
const VIEW_KEY = 'readinessView';
const views: { id: View; label: string }[] = [
  { id: 'line', label: 'Line' },
  { id: 'bars', label: 'Bars' },
  { id: 'gauge', label: 'Gauge' },
];

const loadView = (): View => {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    return saved === 'bars' || saved === 'gauge' ? saved : 'line';
  } catch {
    return 'line';
  }
};

export const ReadinessTrend = ({ history, status }: ReadinessTrendProps) => {
  const [view, setView] = useState<View>(loadView);

  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Fine without it; the choice just won't be remembered.
    }
  };

  return (
    <div className="rounded-xl bg-black/45 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest opacity-85">
          Readiness {view === 'gauge' ? 'now' : 'over time'}
        </span>
        <div className="flex rounded-full bg-black/40 p-0.5" role="tablist" aria-label="Chart style">
          {views.map(v => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => choose(v.id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                view === v.id ? 'bg-white text-black' : 'opacity-75 hover:opacity-100'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {history.length < 2 ? (
        <div className="flex h-28 items-center justify-center text-sm opacity-80">
          Collecting readings…
        </div>
      ) : view === 'line' ? (
        <LineView history={history} status={status} />
      ) : view === 'bars' ? (
        <BarsView history={history} />
      ) : (
        <GaugeView history={history} status={status} />
      )}

    </div>
  );
};
