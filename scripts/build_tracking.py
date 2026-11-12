"""Turn Metrica Sports open tracking data into a small per-player summary for FotGuard.

Source: https://github.com/metrica-sports/sample-data (Sample Games 1 and 2, anonymised).
Usage:  python3 -I scripts/build_tracking.py <folder with g1_Home.csv g1_Away.csv g2_Home.csv g2_Away.csv>
Writes: src/data/realTracking.json
"""
import csv
import json
import sys
from pathlib import Path

import numpy as np

FPS = 25
DT = 1 / FPS
PITCH_X, PITCH_Y = 105.0, 68.0
MAX_SPEED = 12.0          # m/s; anything faster is a tracking glitch
HSR = 19.8 / 3.6          # high-speed running threshold (m/s)
SPRINT = 25.2 / 3.6       # sprint threshold (m/s)
SPRINT_MIN_FRAMES = FPS   # a sprint must last at least 1 s
WINDOW_MIN = 5            # readiness is sampled every 5 match minutes


def read_team(path: Path):
    with path.open() as f:
        rows = csv.reader(f)
        next(rows)
        next(rows)
        header = next(rows)
        players = [h for h in header if h.startswith('Player')]
        cols = {p: header.index(p) for p in players}
        data = np.array(
            [[float(v) if v not in ('', 'NaN') else np.nan for v in r] for r in rows],
            dtype=float,
        )
    return players, cols, data


def smooth(v, n=7):
    out = np.copy(v)
    ok = ~np.isnan(v)
    if ok.sum() < n:
        return out
    k = np.ones(n) / n
    filled = np.where(ok, v, 0.0)
    num = np.convolve(filled, k, mode='same')
    den = np.convolve(ok.astype(float), k, mode='same')
    with np.errstate(invalid='ignore', divide='ignore'):
        out = np.where(ok & (den > 0), num / den, np.nan)
    return out


def player_stats(period, x, y):
    """x, y in metres (NaN when the player is not on the pitch)."""
    on = ~np.isnan(x)
    if on.sum() < FPS * 60 * 5:  # under 5 minutes: not worth a profile entry
        return None

    xs, ys = smooth(x), smooth(y)
    vx = np.diff(xs, prepend=np.nan) / DT
    vy = np.diff(ys, prepend=np.nan) / DT
    # No speed across the half-time break.
    vx[np.r_[False, np.diff(period) != 0]] = np.nan
    speed = np.hypot(vx, vy)
    speed[speed > MAX_SPEED] = np.nan
    speed = smooth(speed, 13)

    step = np.nan_to_num(speed) * DT
    minutes_played = on.sum() / FPS / 60

    fast = np.nan_to_num(speed) > SPRINT
    sprints, run = 0, 0
    for f in fast:
        run = run + 1 if f else 0
        if run == SPRINT_MIN_FRAMES:
            sprints += 1

    # Match clock in minutes: second half continues from 45'.
    frames_per_window = FPS * 60 * WINDOW_MIN
    series = []
    first_on = int(np.argmax(on))
    idx = np.arange(len(x))
    on_idx = idx[on]
    for start in range(0, len(on_idx), frames_per_window):
        w = on_idx[start:start + frames_per_window]
        if len(w) < frames_per_window * 0.6:
            continue
        s = speed[w]
        mins = len(w) / FPS / 60
        series.append({
            'minute': round(((w[0] - first_on) / FPS / 60) + (first_on / FPS / 60), 1),
            'metersPerMin': round(float(np.nansum(np.nan_to_num(s) * DT) / mins), 1),
            'hsrPerMin': round(float(np.nansum(np.where(s > HSR, s, 0) * DT) / mins), 1),
            'peakKmh': round(float(np.nanpercentile(s, 99.5) * 3.6), 1),
        })

    # Readiness: his rolling 15-minute work rate against his own best spell in the first half hour.
    # A single 5-minute window swings with the game (a stoppage, the other team keeping the ball),
    # so the comparison uses three windows together.
    def rolling(key):
        vals = [w[key] for w in series]
        return [float(np.mean(vals[max(0, i - 2):i + 1])) for i in range(len(vals))]

    mpm, hsr = rolling('metersPerMin'), rolling('hsrPerMin')
    early = [i for i, w in enumerate(series) if w['minute'] - series[0]['minute'] < 30] or [0]
    base_mpm = max(mpm[i] for i in early)
    base_hsr = max(1.0, max(hsr[i] for i in early))
    keeper = base_mpm < 60  # goalkeepers barely run; judge them on work rate only
    for i, w in enumerate(series):
        drop_mpm = max(0.0, 1 - mpm[i] / base_mpm)
        drop_hsr = max(0.0, 1 - hsr[i] / base_hsr)
        if keeper:
            fatigue = min(1.0, drop_mpm / 0.5)
        else:
            fatigue = min(1.0, 0.55 * drop_mpm / 0.3 + 0.45 * drop_hsr / 0.9)
        w['psi'] = int(round(100 - 72 * fatigue))

    psis = [w['psi'] for w in series]
    return {
        'minutes': int(round(minutes_played)),
        'distanceKm': round(float(step.sum()) / 1000, 2),
        'hsrMeters': int(round(float(np.sum(np.where(np.nan_to_num(speed) > HSR, step, 0))))),
        'sprints': sprints,
        'topSpeedKmh': round(float(np.nanpercentile(speed, 99.9) * 3.6), 1),
        'avgPsi': int(round(np.mean(psis))),
        'lowestPsi': int(min(psis)),
        'avgX': float(np.nanmean(x)),
        'avgY': float(np.nanmean(y)),
        'firstHalfX': float(np.nanmean(x[period == 1])) if np.any(on & (period == 1)) else None,
        'series': series,
    }


def main(folder: Path, out: Path):
    players = {}
    for game in (1, 2):
        for side in ('Home', 'Away'):
            names, cols, data = read_team(folder / f'g{game}_{side}.csv')
            period = data[:, 0]
            for name in names:
                c = cols[name]
                x = data[:, c] * PITCH_X
                y = data[:, c + 1] * PITCH_Y
                # Teams swap ends at half-time: mirror the second half so "forward" is one direction.
                second = period == 2
                x = np.where(second, PITCH_X - x, x)
                y = np.where(second, PITCH_Y - y, y)
                stats = player_stats(period, x, y)
                if stats is None:
                    continue
                pid = int(name.replace('Player', ''))
                entry = players.setdefault(pid, {'id': pid, 'team': side, 'games': []})
                entry['games'].append({'game': game, **stats})
                print(f'game {game} {side:4} P{pid:<2} {stats["minutes"]:3}\' '
                      f'{stats["distanceKm"]:5.2f} km  top {stats["topSpeedKmh"]:4.1f}  '
                      f'sprints {stats["sprints"]:2}  PSI avg {stats["avgPsi"]} low {stats["lowestPsi"]}')

    # Rough position from where each player stands, attacking direction normalised per team.
    for p in players.values():
        g = p['games'][0]
        p['avgX'], p['avgY'] = round(g['avgX'], 1), round(g['avgY'], 1)
        for gm in p['games']:
            for k in ('avgX', 'avgY', 'firstHalfX'):
                gm.pop(k, None)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        'source': 'Metrica Sports open tracking data (Sample Games 1 & 2), github.com/metrica-sports/sample-data',
        'players': sorted(players.values(), key=lambda p: p['id']),
    }, separators=(',', ':')))
    print(f'wrote {out} ({out.stat().st_size // 1024} KB, {len(players)} players)')


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    main(Path(sys.argv[1]), root / 'src' / 'data' / 'realTracking.json')
