# AILIVEGUARD

itle:
AI Player Status & Substitution Assistant (Prototype)

Goal:
Build a simple, live-updating dashboard that helps a coach decide when a football player should rest or be substituted. The dashboard shows each player’s energy level, fatigue, and risk, calculated from simulated sensor data.

🔧 What to Build

1. Data simulator

Write a small Python script that generates fake data every few seconds for 11 players.

Each player record should include:
player_id, heart_rate, speed, fatigue, and a computed readiness score (0–100 %).

Send this data to the web dashboard through WebSocket or Firebase.

2. Backend (simple server)

Receive the simulated data.

Calculate:

PSI (Player Status Index): starts at 100, decreases as HR ↑ or fatigue ↑.

Risk: “Low / Medium / High” depending on PSI.

Push updated values to the frontend every 3 s.
(FastAPI or Node + Socket.IO are fine.)

3. Frontend (coach view)

Make a web app (React, Vite, or plain HTML/JS).

Display a mini football pitch with 11 colored dots:

Green = fit, Yellow = getting tired, Red = risk/high fatigue.

Right side panel: player name + heart-rate + PSI bar.

When a player’s PSI < 40 %, show a popup:
“⚠ Player 7 fatigued – substitute within 2 minutes.”

Add a “Bench” area with fresh substitute players (static).

Include a button “Substitute” that resets the color (simulating a new player).

4. Optional polish

Add an Arabic/English language toggle.

Include a simple line chart (PSI vs time) for one player.

Add short voice alert (“Player 5 needs rest”).

🧱 Tech stack suggestion

Backend: Python FastAPI + Socket.IO or Node Express.

Frontend: React / Vite or HTML + p5.js canvas for the pitch.

Data: Simulated JSON stream.

Realtime: WebSocket or Firebase Realtime DB.

🗓 Suggested timeline
Day	Task
1–2	Simulator + backend API ready (“/live”)
3–4	Frontend pitch UI + WebSocket connection
5–6	PSI/risk formula + alert logic
7	Polish UI + demo script (“Watch Player 8 turn red → AI recommends substitution”)
✅ Deliverables

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ai-sideline-pro-53951.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb3add4b-0b0b-4aae-8b38-a74a9d92f60e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
