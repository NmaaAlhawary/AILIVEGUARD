import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FIELD_PHOTOS_KEY, SUB_PHOTOS_KEY, getInitials, loadPhotos } from '@/utils/playerPhotos';
import { getDefaultPhoto } from '@/utils/defaultPhotos';
import { getMatchHistory, getRole, loadProfile } from '@/utils/playerProfile';
import { RISK_THRESHOLD } from '@/utils/playerSimulator';

const defaultPlayers = [
  'casias', 'Araujo', 'Christensen', 'Kounde',
  'Balde', 'De Jong', 'Gavi', 'Lionel Messi',
  'Ansu Fati', 'Rolando', 'Yamal'
];
const defaultSubstitutes = ['Ter Stegen', 'Inaki Pena', 'Pedri', 'Fermin Lopez', 'Raphinha', 'Lewandowski', 'Ferran Torres', 'Joao Felix'];

const readList = (key: string, fallback: string[]): string[] => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const psiToken = (psi: number) =>
  psi >= 60 ? '--status-fit' : psi >= RISK_THRESHOLD ? '--status-tired' : '--status-risk';

interface SquadMember {
  name: string;
  photo?: string;
}

const PlayerTile = ({ player }: { player: SquadMember }) => {
  const navigate = useNavigate();
  const role = getRole(player.name, '—');
  const info = loadProfile(player.name);
  const history = getMatchHistory(player.name);
  const avgPsi = history.length ? Math.round(history.reduce((s, m) => s + m.avgPsi, 0) / history.length) : null;
  const injured = info.injuries.some(i => i.status !== 'recovered');

  const color = avgPsi !== null ? `hsl(var(${psiToken(avgPsi)}))` : 'hsl(var(--muted-foreground))';

  return (
    <button
      type="button"
      onClick={() => navigate(`/player/${encodeURIComponent(player.name)}`)}
      className="sweep group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-[hsl(224_40%_10%)] text-left shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] outline-none transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] hover:border-primary/80 hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.6),0_18px_40px_-10px_hsl(var(--primary)/0.55)] focus-visible:-translate-y-1.5 focus-visible:scale-[1.03] focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_hsl(var(--primary)),0_18px_40px_-10px_hsl(var(--primary)/0.6)]"
    >
      {player.photo ? (
        <img
          src={player.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-transparent">
          <span className="font-display text-5xl font-bold text-white/40">{getInitials(player.name)}</span>
        </div>
      )}

      {/* Readability: dark at the bottom for the name, tinted by readiness at the top. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(226_50%_5%)] via-[hsl(226_50%_5%/0.55)] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />

      <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {info.number && (
          <span className="font-display text-3xl font-bold leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            {info.number}
          </span>
        )}
        <span className="rounded-md bg-black/55 px-2 py-0.5 font-display text-sm font-bold tracking-wider text-white backdrop-blur">
          {role}
        </span>
      </div>
      {injured && (
        <span className="absolute right-3 top-3 rounded-md bg-status-risk px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Injured
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <div className="truncate font-display text-xl font-bold uppercase leading-tight tracking-wide text-white">
          {player.name}
        </div>
        {avgPsi !== null ? (
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Readiness</span>
              <span className="font-display text-lg font-bold leading-none tabular-nums" style={{ color }}>
                {avgPsi}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full" style={{ width: `${avgPsi}%`, backgroundColor: color }} />
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-white/50">No match data yet</div>
        )}
      </div>

    </button>
  );
};

const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <div className="mb-4 flex items-center gap-3">
    <span className="h-6 w-1.5 -skew-x-12 rounded-sm bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
    <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
    <span className="rounded-md bg-white/10 px-2 py-0.5 font-display text-sm font-bold">{count}</span>
    <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
  </div>
);

const Squad = () => {
  const navigate = useNavigate();

  const { starters, bench } = useMemo(() => {
    const fieldPhotos = loadPhotos(FIELD_PHOTOS_KEY);
    const subPhotos = loadPhotos(SUB_PHOTOS_KEY);
    return {
      starters: readList('playerNames', defaultPlayers)
        .map((name, i) => ({ name, photo: fieldPhotos[i] ?? getDefaultPhoto(name) }))
        .filter(p => p.name.trim()),
      bench: readList('substituteNames', defaultSubstitutes)
        .map((name, i) => ({ name, photo: subPhotos[i] ?? getDefaultPhoto(name) }))
        .filter(p => p.name.trim()),
    };
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')} aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">FotGuard</p>
              <h1 className="font-display text-4xl font-bold uppercase tracking-wide md:text-5xl">Squad</h1>
              <p className="text-muted-foreground">Choose a player to open his profile</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/manage')} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage names & photos
          </Button>
        </div>

        <section>
          <SectionHeading title="Starting XI" count={starters.length} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {starters.map(p => <PlayerTile key={p.name} player={p} />)}
          </div>
        </section>

        <section>
          <SectionHeading title="Substitutes" count={bench.length} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {bench.map(p => <PlayerTile key={p.name} player={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Squad;
