# Tiny Tactics — Agent & Architecture Guidelines

## Core Invariants
- **Multiplayer-First:** All game rules, combat simulation, economy, shop, rolls, and outcomes are strictly server-authoritative. The client/renderer is purely a display and input layer.
- **Pure Core Logic:** `packages/core` has ZERO dependencies on React, Three.js, Colyseus, or browser APIs (DOM, window, WebSockets). It must remain completely testable in headless Node and browser environments.
- **Deterministic Combat:** Combat simulation is fixed-step (20 ticks/sec), integer-tick based, and driven entirely by a seeded PRNG (`packages/core/src/combat/prng.ts`). No `Math.random()` in combat. Same starting board snapshots and seed must yield byte-identical timelines and battle outcomes.
- **Strictly Procedural 3D Assets:** No imported 3D assets (GLB, FBX, OBJ), no image textures, no downloaded models. All geometry is procedurally assembled from Three.js primitives (`BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `ConeGeometry`). Materials use procedural vertical gradients or vertex colors.
- **Monorepo Architecture:**
  - `packages/shared`: Data schemas, network messages, protocol constants, validation.
  - `packages/data`: 16 unit definitions, 6 alliances, abilities, and balance configs.
  - `packages/core`: Pure board representation, combat simulation engine, economy, shop inventory, alliances computation, and match lifecycle.
  - `apps/server`: Colyseus room management, lobby matching, command validation, reconnection tokens, and authoritative tick loop.
  - `apps/web`: React UI (shop, bench, HUD, lobby), Three.js procedural renderer, unit animators, and Colyseus client network manager.

## Code Conventions
- TypeScript strict mode throughout.
- camelCase variables/properties, PascalCase classes, interfaces, and methods.
- K&R brace style.
- English comments and descriptive identifiers.
- Reconnect tokens remain strictly private between server and the resuming client; never broadcast in public room state.
