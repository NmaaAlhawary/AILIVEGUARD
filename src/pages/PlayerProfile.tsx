import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bell,
  Check,
  Footprints,
  Gauge,
  HeartPulse,
  Pencil,
  Plus,
  Ruler,
  Shirt,
  Stethoscope,
  StickyNote,
  Timer,
  Trash2,
  Weight,
  Zap,
  Cake,
  Flag,
  Tag,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FIELD_PHOTOS_KEY, SUB_PHOTOS_KEY, getInitials, loadPhotos } from '@/utils/playerPhotos';
import { getDefaultPhoto, normalise } from '@/utils/defaultPhotos';
import {
  CustomField,
  InjuryEntry,
  ProfileInfo,
  getBaseline,
  getMatchHistory,
  getRole,
  loadProfile,
  saveProfile,
} from '@/utils/playerProfile';
import { RISK_THRESHOLD } from '@/utils/playerSimulator';
import { REAL_DATA_SOURCE, REAL_DATA_URL } from '@/utils/realData';

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

// Find where this name sits in the squad so the profile shows the same photo as everywhere else.
const findSquadEntry = (name: string) => {
  const key = normalise(name);
  const field = readList('playerNames', defaultPlayers);
  const subs = readList('substituteNames', defaultSubstitutes);

  const fieldIndex = field.findIndex(n => normalise(n) === key);
  if (fieldIndex >= 0) {
    return { squad: 'Starting XI', photo: loadPhotos(FIELD_PHOTOS_KEY)[fieldIndex] ?? getDefaultPhoto(name) };
  }
  const subIndex = subs.findIndex(n => normalise(n) === key);
  if (subIndex >= 0) {
    return { squad: 'Substitute', photo: loadPhotos(SUB_PHOTOS_KEY)[subIndex] ?? getDefaultPhoto(name) };
  }
  return { squad: 'Not in squad', photo: getDefaultPhoto(name) };
};

const psiToken = (psi: number) =>
  psi >= 60 ? '--status-fit' : psi >= RISK_THRESHOLD ? '--status-tired' : '--status-risk';
const psiColor = (psi: number) => `hsl(var(${psiToken(psi)}))`;
const psiWord = (psi: number) => (psi >= 60 ? 'Fit' : psi >= RISK_THRESHOLD ? 'Tiring' : 'At risk');

const today = () => new Date().toISOString().slice(0, 10);
const longDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };
const chartTooltip = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 10,
    fontSize: 13,
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 700 },
  cursor: { fill: 'hsl(var(--muted) / 0.35)' },
};

type FactKey = 'number' | 'age' | 'height' | 'weight' | 'foot' | 'nationality';

const facts: { key: FactKey; label: string; Icon: typeof Ruler; unit?: string; placeholder: string }[] = [
  { key: 'number', label: 'Shirt number', Icon: Shirt, placeholder: '10' },
  { key: 'age', label: 'Age', Icon: Cake, unit: 'yrs', placeholder: '24' },
  { key: 'height', label: 'Height', Icon: Ruler, unit: 'cm', placeholder: '180' },
  { key: 'weight', label: 'Weight', Icon: Weight, unit: 'kg', placeholder: '75' },
  { key: 'foot', label: 'Preferred foot', Icon: Footprints, placeholder: 'Right' },
  { key: 'nationality', label: 'Nationality', Icon: Flag, placeholder: 'Jordan' },
];

const feet = ['Left', 'Right', 'Both'];

// Half-ring showing average readiness, matching the gauge on the live card.
const ReadinessRing = ({ value }: { value: number }) => {
  const r = 52;
  const c = Math.PI * r;
  return (
    <div className="relative h-[96px] w-[160px]">
      <svg viewBox="0 0 140 84" className="h-full w-full">
        <path d="M18 74 A52 52 0 0 1 122 74" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" strokeLinecap="round" />
        <path
          d="M18 74 A52 52 0 0 1 122 74"
          fill="none"
          stroke={psiColor(value)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-[26px] font-black leading-none tabular-nums" style={{ color: psiColor(value) }}>
          {value}%
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
    {action}
  </div>
);

const Panel = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <section className={cn('rounded-2xl border border-border bg-card p-5', className)}>{children}</section>
);

const PlayerProfile = () => {
  const navigate = useNavigate();
  const { name: rawName = '' } = useParams();
  const name = decodeURIComponent(rawName);

  const entry = useMemo(() => findSquadEntry(name), [name]);
  const role = getRole(name, '—');
  const baseline = useMemo(() => getBaseline(name), [name]);
  const history = useMemo(() => getMatchHistory(name), [name]);

  const [info, setInfo] = useState<ProfileInfo>(() => loadProfile(name));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProfileInfo>(info);
  const [injuryOpen, setInjuryOpen] = useState(false);
  const [injuryDraft, setInjuryDraft] = useState<InjuryEntry>({ date: today(), description: '', daysOut: '', status: 'recovering' });
  const [noteText, setNoteText] = useState('');
  const firstRender = useRef(true);

  // Save automatically on every change, so nothing is lost by forgetting a button.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      saveProfile(name, info);
      setSavedAt(Date.now());
    } catch {
      setSavedAt(null);
    }
  }, [info, name]);

  const totals = useMemo(() => {
    const n = history.length || 1;
    const sum = (pick: (m: (typeof history)[number]) => number) => history.reduce((s, m) => s + pick(m), 0);
    return {
      matches: n,
      minutes: sum(m => m.minutes),
      avgPsi: Math.round(sum(m => m.avgPsi) / n),
      avgDistance: +(sum(m => m.distanceKm) / n).toFixed(1),
      avgSprints: Math.round(sum(m => m.sprints) / n),
      bestSpeed: history.length ? Math.max(...history.map(m => m.topSpeed)).toFixed(1) : '—',
      alerts: sum(m => m.alerts),
    };
  }, [history]);

  const lastMatch = history[history.length - 1];
  const gameColors = ['hsl(var(--status-fit))', 'hsl(var(--secondary))'];

  // One row per 5-minute window, one column per game, so both matches share the minute axis.
  const timeline = useMemo(() => {
    const rows = new Map<number, Record<string, number>>();
    history.forEach(m =>
      m.series.forEach(w => {
        const minute = Math.round(w.minute / 5) * 5;
        const row = rows.get(minute) ?? { minute };
        row[`psi${m.game}`] = w.psi;
        row[`mpm${m.game}`] = w.metersPerMin;
        row[`hsr${m.game}`] = w.hsrPerMin;
        rows.set(minute, row);
      })
    );
    return [...rows.values()].sort((a, b) => a.minute - b.minute);
  }, [history]);

  const openEdit = (field: string | null = null) => {
    setDraft(info);
    setFocusField(field);
    setEditOpen(true);
  };

  const saveEdit = () => {
    setInfo({
      ...draft,
      customFields: draft.customFields.filter(f => f.label.trim() || f.value.trim()),
    });
    setEditOpen(false);
  };

  const setDraftField = (key: FactKey, value: string) => setDraft(prev => ({ ...prev, [key]: value }));
  const setCustom = (index: number, patch: Partial<CustomField>) =>
    setDraft(prev => ({
      ...prev,
      customFields: prev.customFields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));

  const addInjury = () => {
    if (!injuryDraft.description.trim()) return;
    setInfo(prev => ({
      ...prev,
      injuries: [...prev.injuries, injuryDraft].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    setInjuryDraft({ date: today(), description: '', daysOut: '', status: 'recovering' });
    setInjuryOpen(false);
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setInfo(prev => ({ ...prev, notesLog: [{ date: today(), text: noteText.trim() }, ...prev.notesLog] }));
    setNoteText('');
  };

  const activeInjury = info.injuries.find(i => i.status !== 'recovered');

  const kpis = [
    { label: 'Avg readiness', value: `${totals.avgPsi}%`, Icon: Gauge, color: psiColor(totals.avgPsi) },
    { label: 'Minutes played', value: totals.minutes, Icon: Timer },
    { label: 'Avg distance', value: `${totals.avgDistance} km`, Icon: Footprints },
    { label: 'Avg sprints', value: totals.avgSprints, Icon: Zap },
    { label: 'Best speed', value: `${totals.bestSpeed} km/h`, Icon: Activity },
    { label: 'Risk spells', value: totals.alerts, Icon: Bell, color: totals.alerts > 3 ? 'hsl(var(--status-risk))' : undefined },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity',
              savedAt ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Check className="h-3.5 w-3.5 text-status-fit" />
            Changes saved
          </span>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at 10% 0%, hsl(var(${psiToken(totals.avgPsi)}) / 0.28), transparent 55%)`,
            }}
          />
          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/10 bg-muted shadow-xl">
                  {entry.photo ? (
                    <img src={entry.photo} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-muted-foreground">{getInitials(name)}</span>
                  )}
                </div>
                {info.number && (
                  <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-status-fit font-mono text-lg font-black text-black shadow-lg">
                    {info.number}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="font-display text-4xl font-bold uppercase tracking-wide md:text-6xl">{name}</h1>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-status-fit/15 px-3 py-1 text-sm font-bold text-status-fit">{role}</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm">{entry.squad}</span>
                  {activeInjury && (
                    <span className="flex items-center gap-1 rounded-full bg-status-risk/15 px-3 py-1 text-sm font-semibold text-status-risk">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Injured: {activeInjury.description}
                    </span>
                  )}
                </div>
                <Button onClick={() => openEdit()} variant="outline" className="mt-4 gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit player info
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 rounded-2xl bg-background/40 px-6 py-4">
              <div className="text-center">
                <ReadinessRing value={totals.avgPsi} />
                <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Avg readiness · {psiWord(totals.avgPsi)}
                </div>
              </div>
              {lastMatch && (
                <div className="border-l border-border pl-6 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last match</div>
                  <div className="mt-1 font-bold">{lastMatch.label}</div>
                  <div className="text-muted-foreground">
                    {lastMatch.subbedOn ? `Came on at ${Math.round(lastMatch.startMinute)}'` : lastMatch.subbedOff ? 'Started, subbed off' : 'Full match'}
                  </div>
                  <div className="mt-2 flex gap-3">
                    <span className="font-black tabular-nums" style={{ color: psiColor(lastMatch.lowestPsi) }}>
                      {lastMatch.lowestPsi}% <span className="text-xs font-medium text-muted-foreground">lowest</span>
                    </span>
                    <span className="font-black tabular-nums">
                      {lastMatch.minutes}' <span className="text-xs font-medium text-muted-foreground">played</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick facts: empty ones invite the coach to add them */}
          <div className="relative grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {facts.map(({ key, label, Icon, unit }) => {
              const value = info[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openEdit(key)}
                  className="group flex flex-col items-start gap-1 bg-card px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                  {value ? (
                    <span className="text-xl font-bold">
                      {value}
                      {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-semibold text-status-fit/80 group-hover:text-status-fit">
                      <Plus className="h-4 w-4" />
                      Add
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {info.customFields.length > 0 && (
            <div className="relative flex flex-wrap gap-2 border-t border-border px-5 py-4">
              {info.customFields.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openEdit(`custom-${i}`)}
                  className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-bold">{f.value}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <Tabs defaultValue="overview">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-card p-1.5 sm:w-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-xl px-4 py-2 font-display text-base font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.6)]">
              <Gauge className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2 rounded-xl px-4 py-2 font-display text-base font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.6)]">
              <Activity className="h-4 w-4" /> Matches
            </TabsTrigger>
            <TabsTrigger value="medical" className="gap-2 rounded-xl px-4 py-2 font-display text-base font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.6)]">
              <Stethoscope className="h-4 w-4" /> Medical
              {info.injuries.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs">{info.injuries.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 rounded-xl px-4 py-2 font-display text-base font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.6)]">
              <StickyNote className="h-4 w-4" /> Notes
              {info.notesLog.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs">{info.notesLog.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-5 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {kpis.map(({ label, value, Icon, color }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="mt-1.5 text-2xl font-black tabular-nums" style={color ? { color } : undefined}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {history.length === 0 ? (
              <Panel>
                <p className="py-8 text-center text-muted-foreground">No tracked matches for this player yet.</p>
              </Panel>
            ) : (
              <>
            <Panel>
              <SectionTitle
                title="Readiness through the match"
                hint={`Every 5 minutes, from how much his running dropped compared with his own best spell early on. Below ${RISK_THRESHOLD} is high risk.`}
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="minute" type="number" domain={[0, 95]} ticks={[0, 15, 30, 45, 60, 75, 90]} tickFormatter={v => `${v}'`} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTooltip} cursor={{ stroke: 'hsl(var(--border))' }} labelFormatter={v => `Minute ${v}`} formatter={(v: number) => `${v}%`} />
                    <ReferenceLine
                      y={RISK_THRESHOLD}
                      stroke="hsl(var(--status-risk))"
                      strokeDasharray="5 4"
                      label={{ value: 'risk', position: 'insideBottomRight', fill: 'hsl(var(--status-risk))', fontSize: 11 }}
                    />
                    <ReferenceLine x={45} stroke="hsl(var(--muted-foreground) / 0.5)" label={{ value: 'HT', position: 'insideTop', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    {history.map((m, i) => (
                      <Line key={m.game} type="monotone" dataKey={`psi${m.game}`} name={m.label} stroke={gameColors[i % 2]} strokeWidth={3} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-5 text-sm text-muted-foreground">
                {history.map((m, i) => (
                  <span key={m.game} className="flex items-center gap-2">
                    <span className="h-1 w-5 rounded-full" style={{ backgroundColor: gameColors[i % 2] }} /> {m.label}
                  </span>
                ))}
                <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-status-risk" /> Risk line</span>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel>
                <SectionTitle title="Work rate" hint="Metres run per minute, in 5-minute blocks" />
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="minute" type="number" domain={[0, 95]} ticks={[0, 15, 30, 45, 60, 75, 90]} tickFormatter={v => `${v}'`} tick={axisTick} tickLine={false} axisLine={false} />
                      <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                      <Tooltip {...chartTooltip} cursor={{ stroke: 'hsl(var(--border))' }} labelFormatter={v => `Minute ${v}`} formatter={(v: number) => `${v} m/min`} />
                      {history.map((m, i) => (
                        <Line key={m.game} type="monotone" dataKey={`mpm${m.game}`} name={m.label} stroke={gameColors[i % 2]} strokeWidth={2.5} dot={false} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel>
                <SectionTitle title="High-speed running" hint="Metres per minute above 19.8 km/h, in 5-minute blocks" />
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeline} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="minute" tickFormatter={v => `${v}'`} tick={axisTick} tickLine={false} axisLine={false} />
                      <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                      <Tooltip {...chartTooltip} labelFormatter={v => `Minute ${v}`} formatter={(v: number) => `${v} m/min`} />
                      {history.map((m, i) => (
                        <Bar key={m.game} dataKey={`hsr${m.game}`} name={m.label} fill={gameColors[i % 2]} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
              </>
            )}

            <Panel>
              <SectionTitle title="Physical baseline" hint="His own normal levels. Live readings are compared against these, not a fixed scale." />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: 'Top speed (measured)', value: baseline.topSpeed, unit: 'km/h', Icon: Zap },
                  { label: 'Resting heart rate (est.)', value: baseline.restingHeartRate, unit: 'bpm', Icon: HeartPulse },
                  { label: 'Max heart rate (est.)', value: baseline.maxHeartRate, unit: 'bpm', Icon: HeartPulse },
                  { label: 'Recovery rate (est.)', value: baseline.recoveryRate, unit: 'bpm/min', Icon: Activity },
                ].map(({ label, value, unit, Icon }) => (
                  <div key={label} className="rounded-xl bg-muted/40 p-4">
                    <Icon className="mb-2 h-5 w-5 text-status-fit" />
                    <div className="text-2xl font-black tabular-nums">
                      {value}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <p className="text-xs text-muted-foreground">
              Match data:{' '}
              <a href={REAL_DATA_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                {REAL_DATA_SOURCE}
              </a>
            </p>
          </TabsContent>

          {/* Matches */}
          <TabsContent value="matches" className="mt-5">
            <Panel>
              <SectionTitle title="Match history" hint="Real matches, most recent first. Risk spells = 5-minute blocks with readiness below 40." />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2.5 pr-3 font-semibold">Match</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Minutes</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Lowest PSI</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Avg PSI</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Distance</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Sprints</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Top speed</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">High-speed</th>
                      <th className="py-2.5 text-right font-semibold">Risk spells</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map(m => (
                      <tr key={m.game} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.side === 'Home' ? 'Home team' : 'Away team'}</div>
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">
                          {m.minutes}'
                          {m.subbedOff && <div className="text-xs text-muted-foreground">subbed off</div>}
                          {m.subbedOn && <div className="text-xs text-muted-foreground">on at {Math.round(m.startMinute)}'</div>}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <span
                            className="inline-block min-w-[3.25rem] rounded-lg px-2 py-1 text-center font-black tabular-nums"
                            style={{ color: psiColor(m.lowestPsi), backgroundColor: `hsl(var(${psiToken(m.lowestPsi)}) / 0.14)` }}
                          >
                            {m.lowestPsi}%
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-bold tabular-nums" style={{ color: psiColor(m.avgPsi) }}>{m.avgPsi}%</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{m.distanceKm} km</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{m.sprints}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{m.topSpeed} km/h</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{m.hsrMeters} m</td>
                        <td className="py-3 text-right">
                          {m.alerts > 0 ? (
                            <span className="rounded-full bg-status-risk/15 px-2 py-0.5 font-bold text-status-risk">{m.alerts}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>

          {/* Medical */}
          <TabsContent value="medical" className="mt-5">
            <Panel>
              <SectionTitle
                title="Injury log"
                hint="Past and current injuries, entered by the medical staff"
                action={
                  <Button onClick={() => setInjuryOpen(true)} className="gap-2 bg-status-fit text-black hover:bg-status-fit/90">
                    <Plus className="h-4 w-4" /> Add injury
                  </Button>
                }
              />
              {info.injuries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <Stethoscope className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-semibold">No injuries recorded</p>
                  <p className="text-sm text-muted-foreground">Add one when the medical staff reports it.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {info.injuries.map((inj, i) => {
                    const recovered = inj.status === 'recovered';
                    return (
                      <li key={i} className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/40 p-4">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                            recovered ? 'bg-status-fit/15 text-status-fit' : 'bg-status-risk/15 text-status-risk'
                          )}
                        >
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">{inj.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {longDate(inj.date)}
                            {inj.daysOut && ` · ${inj.daysOut} days out`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setInfo(prev => ({
                              ...prev,
                              injuries: prev.injuries.map((x, j) =>
                                j === i ? { ...x, status: recovered ? 'recovering' : 'recovered' } : x
                              ),
                            }))
                          }
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold',
                            recovered ? 'bg-status-fit/15 text-status-fit' : 'bg-status-risk/15 text-status-risk'
                          )}
                          title="Click to change status"
                        >
                          {recovered ? 'Recovered' : 'Recovering'}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove injury"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setInfo(prev => ({ ...prev, injuries: prev.injuries.filter((_, j) => j !== i) }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="mt-5">
            <Panel>
              <SectionTitle title="Coach notes" hint="Strengths, things to watch, training focus. Each note is dated." />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea
                  rows={2}
                  value={noteText}
                  placeholder="Write a note… (Ctrl/⌘ + Enter to add)"
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote();
                  }}
                  className="flex-1"
                />
                <Button onClick={addNote} disabled={!noteText.trim()} className="gap-2 bg-status-fit text-black hover:bg-status-fit/90 sm:self-stretch">
                  <Plus className="h-4 w-4" /> Add note
                </Button>
              </div>
              {info.notesLog.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {info.notesLog.map((note, i) => (
                    <li key={i} className="group flex gap-3 rounded-xl bg-muted/40 p-4">
                      <div className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">{longDate(note.date)}</div>
                      <p className="flex-1 whitespace-pre-wrap text-sm">{note.text}</p>
                      <button
                        type="button"
                        aria-label="Delete note"
                        onClick={() => setInfo(prev => ({ ...prev, notesLog: prev.notesLog.filter((_, j) => j !== i) }))}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit info */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {name}</DialogTitle>
            <DialogDescription>Fill in what you know. Everything is optional.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {facts
              .filter(f => f.key !== 'foot')
              .map(f => (
                <div key={f.key} className={cn('space-y-1.5', f.key === 'nationality' && 'col-span-2')}>
                  <Label htmlFor={`edit-${f.key}`}>
                    {f.label}
                    {f.unit && <span className="ml-1 text-muted-foreground">({f.unit})</span>}
                  </Label>
                  <Input
                    id={`edit-${f.key}`}
                    autoFocus={focusField === f.key}
                    inputMode={['number', 'age', 'height', 'weight'].includes(f.key) ? 'numeric' : undefined}
                    value={draft[f.key]}
                    placeholder={`e.g. ${f.placeholder}`}
                    onChange={e => setDraftField(f.key, e.target.value)}
                  />
                </div>
              ))}
            <div className="col-span-2 space-y-1.5">
              <Label>Preferred foot</Label>
              <div className="grid grid-cols-3 gap-2">
                {feet.map(foot => (
                  <button
                    key={foot}
                    type="button"
                    autoFocus={focusField === 'foot' && foot === (draft.foot || 'Right')}
                    onClick={() => setDraftField('foot', draft.foot === foot ? '' : foot)}
                    className={cn(
                      'rounded-lg border py-2 text-sm font-semibold transition-colors',
                      draft.foot === foot
                        ? 'border-status-fit bg-status-fit/15 text-status-fit'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {foot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div>
              <Label>More info</Label>
              <p className="text-xs text-muted-foreground">Add anything else, e.g. "Contract until", "Blood type", "Previous club".</p>
            </div>
            {draft.customFields.map((f, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={f.label}
                  autoFocus={focusField === `custom-${i}`}
                  placeholder="Field name"
                  onChange={e => setCustom(i, { label: e.target.value })}
                  className="w-2/5"
                />
                <Input value={f.value} placeholder="Value" onChange={e => setCustom(i, { value: e.target.value })} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove field"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDraft(prev => ({ ...prev, customFields: prev.customFields.filter((_, j) => j !== i) }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setDraft(prev => ({ ...prev, customFields: [...prev.customFields, { label: '', value: '' }] }))}
            >
              <Plus className="h-4 w-4" /> Add a field
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} className="gap-2 bg-status-fit text-black hover:bg-status-fit/90">
              <Check className="h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add injury */}
      <Dialog open={injuryOpen} onOpenChange={setInjuryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add injury</DialogTitle>
            <DialogDescription>Record an injury for {name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inj-desc">What happened</Label>
              <Input
                id="inj-desc"
                autoFocus
                value={injuryDraft.description}
                placeholder="e.g. Hamstring strain (left)"
                onChange={e => setInjuryDraft(d => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inj-date">Date</Label>
                <Input id="inj-date" type="date" value={injuryDraft.date} onChange={e => setInjuryDraft(d => ({ ...d, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inj-days">Days out</Label>
                <Input
                  id="inj-days"
                  inputMode="numeric"
                  value={injuryDraft.daysOut}
                  placeholder="e.g. 14"
                  onChange={e => setInjuryDraft(d => ({ ...d, daysOut: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['recovering', 'recovered'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInjuryDraft(d => ({ ...d, status: st }))}
                    className={cn(
                      'rounded-lg border py-2 text-sm font-semibold capitalize transition-colors',
                      injuryDraft.status === st
                        ? st === 'recovered'
                          ? 'border-status-fit bg-status-fit/15 text-status-fit'
                          : 'border-status-risk bg-status-risk/15 text-status-risk'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInjuryOpen(false)}>Cancel</Button>
            <Button onClick={addInjury} disabled={!injuryDraft.description.trim()} className="gap-2 bg-status-fit text-black hover:bg-status-fit/90">
              <Plus className="h-4 w-4" /> Add injury
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerProfile;
