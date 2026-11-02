# Tiny Tactics ⚔️

> **Playable browser-based 3D fantasy auto-battler** built with TypeScript, Three.js (strictly procedural graphics), React, and Colyseus server-authoritative multiplayer.

![Tiny Tactics](https://img.shields.io/badge/Multiplayer-2--8_Players-sky)
![Three.js](https://img.shields.io/badge/Three.js-Procedural_3D-emerald)
![Colyseus](https://img.shields.io/badge/Colyseus-0.15-purple)
![Vitest](https://img.shields.io/badge/Tests-100%25_Passing-green)

---

## 🎮 Key Features

- **Multiplayer-First Real-Time Rooms:** Connect with 2–8 players via Colyseus WebSockets.
- **Strictly Procedural 3D Art:** Zero downloaded models, GLB/FBX files, or bitmap textures. All units, weapons, animations, and environments are constructed dynamically in TypeScript using Three.js primitive geometries (`BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `ConeGeometry`).
- **16 Original Fantasy Units:** Footman, Grunt, Woodland Archer, Apprentice Mage, Shadow Scout, Sun Acolyte, Sentinel, Berserker, Shadowblade, Pyromancer, Templar Crusader, Huntmaster, Stonekeeper, Nightstalker, Stormcaller, and Royal Guard.
- **6 Strategic Alliances (2 & 4 Thresholds):** Warrior (armor), Mage (ability damage), Ranger (attack speed), Assassin (critical strikes), Guardian (max HP), Wild (attack damage).
- **3-Star Auto-Merging:** 3× 1★ units combine into 2★; 3× 2★ combine into 3★ (total of 9 copies). Units gain scaled stats, shoulder armor at 2★, and golden horns/halo glow at 3★.
- **Deterministic 20 Tick/s Combat Engine:** Seeded PRNG simulation with armor damage mitigation, mana gain, active ability casting, and full event replay.
- **Full Economy System:** Base income, savings interest (up to +5g), win bonus, win/loss streak bonuses, level progression (L2 to L8), XP buying (5g for 5 XP), and shared pool limits.
- **Reconnection Support:** 180-second disconnect grace period with private resume tokens.
- **Odd Player Pairing (Ghost Board):** Unmatched players fight a snapshot ghost board without deadlocks.

---

## 🏗️ Monorepo Architecture

```text
tiny-tactics/
├── apps/
│   ├── server/             # Node.js + Colyseus game server & lobby endpoints
│   └── web/                # React 19 + Three.js 3D client & HUD UI
├── packages/
│   ├── shared/             # Network protocol, schemas, constants & types
│   ├── data/               # 16 unit definitions, 6 alliances, abilities, and shop odds
│   └── core/               # Pure game logic: deterministic combat engine, board, economy, merging
├── tests/
│   ├── unit/               # Determinism, alliances, 3-star merges, economy, abilities
│   ├── stress/             # Headless 100-match simulation stress tests
│   └── e2e/                # Playwright two-browser multiplayer smoke test
├── render.yaml             # Render Free deployment configuration
├── AGENTS.md               # Architectural invariants and codex guidelines
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Requirements
- Node.js 18+ (tested on Node 22+)
- npm 9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Typecheck
```bash
npm run build
npm run typecheck
```

### 4. Run Automated Tests
```bash
# Run unit tests and stress simulation
npm test

# Run 100-match combat stress simulation
npm run test:stress
```

### 5. Launch Local Dev Server (Multiplayer Ready)
```bash
npm run dev
```
- **Web Client:** [http://localhost:3000](http://localhost:3000)
- **Colyseus WebSocket Server:** `ws://localhost:2567` (HTTP health check: `http://localhost:2567/health`)

---

## 👥 How to Test 2-Player Multiplayer

1. Open your browser to `http://localhost:3000`. Enter your name (e.g., `Alice`) and click **Create New Lobby**.
2. Note the generated 6-character room code (e.g. `K9W2B4`) or click the copy icon.
3. Open a second browser tab (or incognito window) to `http://localhost:3000`. Enter your name (e.g., `Bob`), type the room code into the box, and click **Join Code**.
4. In Bob's tab, click **Ready Up**.
5. In Alice's tab (Host), click **Start Match**.
6. Both tabs will enter Round 1:
   - Buy units from the shop.
   - Click a unit to view details or click a board tile (rows 0–3) to position units.
   - When the preparation timer hits 0 (or host clicks fast-forward), combat commences simultaneously on both screens.
   - Both players view identical battle results, damage numbers, and HP deductions.

---

## 🌐 Production Deployment

### Backend (Render Free Service)
A `render.yaml` specification is included.
1. Connect this GitHub repository to [Render](https://render.com).
2. Select **Web Service** or use **Blueprint** with `render.yaml`.
3. Set environment variables:
   - `PORT`: `10000`
   - `CLIENT_ORIGIN`: `*` (or your frontend domain)

### Frontend (Vercel / Netlify / Cloudflare Pages / Render Static)
1. Build command: `npm run build`
2. Publish directory: `apps/web/dist`
3. Environment variables:
   - `VITE_SERVER_URL`: `wss://your-render-service.onrender.com`

---

## 📜 License

MIT License. Designed and built with Google Antigravity.
