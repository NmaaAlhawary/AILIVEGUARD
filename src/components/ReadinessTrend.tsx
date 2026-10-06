import { useState } from 'react';
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

const statusVar = {
  fit: '--status-fit',
  tired: '--status-tired',
  risk: '--status-risk',
};

export const ReadinessTrend = ({ history, status }: ReadinessTrendProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  // One point every 3s; thin to keep the path light over a long match.
  const samples = history.length > 90 ? history.filter((_, i) => i % 2 === 0) : history;

  if (samples.length < 2) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-black/45 text-sm opacity-80">
        Collecting readings…
      </div>
    );
  }

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
    <div className="rounded-xl bg-black/45 p-4">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-widest opacity-85">
          Readiness over time
        </span>
        <span className="text-xs opacity-80">last {minutesShown} min</span>
      </div>

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
          {minutesShown} min ago
        </text>
        <text x={WIDTH} y={HEIGHT - 4} fill="#fff" fontSize="11" opacity="0.75" textAnchor="end">
          now
        </text>
      </svg>
    </div>
  );
};
