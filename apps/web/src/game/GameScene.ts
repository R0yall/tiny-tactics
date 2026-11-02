import * as THREE from 'three';
import { BoardFactory, BoardMeshMetadata } from './board/BoardFactory.js';
import { UnitFactory, UnitMeshParts } from './units/UnitFactory.js';
import { UnitAnimator } from './units/UnitAnimator.js';
import { ParticleSystem } from './fx/ParticleSystem.js';
import {
  PlacedUnit,
  UnitPlacement,
  CombatSimulationResult,
  CombatEvent,
  PROTOCOL_CONSTANTS
} from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';

export interface RenderedUnit {
  instanceId: string;
  parts: UnitMeshParts;
  animator: UnitAnimator;
  data: PlacedUnit;
  isEnemy: boolean;
  targetPosition: THREE.Vector3;
}

export class GameScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem;

  private tileMeshes: Map<string, THREE.Mesh> = new Map();
  private benchMeshes: THREE.Mesh[] = [];
  private units: Map<string, RenderedUnit> = new Map();

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private selectedUnitId: string | null = null;
  private hoveredTile: { area: 'board' | 'bench'; x?: number; y?: number; benchIndex?: number } | null = null;
  private highlightMesh: THREE.Mesh;
  private selectionMesh: THREE.Mesh;

  private lastTime = performance.now();
  private animationFrameId?: number;

  // Combat playback state
  private activeSim: CombatSimulationResult | null = null;
  private simTimeSec = 0;
  private currentEventIndex = 0;
  private isSimulating = false;

  // Callbacks to React UI
  public onUnitSelected?: (unit: PlacedUnit | null) => void;
  public onMoveRequested?: (instanceId: string, target: UnitPlacement) => void;
  public onSpawnDamageText?: (damage: number, screenPos: { x: number; y: number }, isCrit?: boolean) => void;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Perspective camera positioned so entire 8x8 board and all 8 bench slots are clearly visible above shop
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    this.camera.position.set(0, 16.0, 13.0);
    this.camera.lookAt(0, 0, 3.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();

    // Create Board & Environment
    const { boardGroup, tileMeshes, benchMeshes } = BoardFactory.createBoard();
    this.scene.add(boardGroup);
    this.tileMeshes = tileMeshes;
    this.benchMeshes = benchMeshes;

    this.particleSystem = new ParticleSystem(this.scene);

    // Interactive highlight tile
    const hlGeo = new THREE.PlaneGeometry(BoardFactory.TILE_SIZE * 0.95, BoardFactory.TILE_SIZE * 0.95);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.highlightMesh = new THREE.Mesh(hlGeo, hlMat);
    this.highlightMesh.rotation.x = -Math.PI / 2;
    this.highlightMesh.position.y = 0.08;
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    // Interactive unit selection ring
    const selGeo = new THREE.RingGeometry(0.55, 0.82, 24);
    const selMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.selectionMesh = new THREE.Mesh(selGeo, selMat);
    this.selectionMesh.rotation.x = -Math.PI / 2;
    this.selectionMesh.position.y = 0.12;
    this.selectionMesh.visible = false;
    this.scene.add(this.selectionMesh);

    this.setupEvents(container);
    this.animate();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(6, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.4);
    this.scene.add(hemiLight);
  }

  private setupEvents(container: HTMLElement): void {
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateHoverHighlight();
    };

    const onClick = (_e: MouseEvent) => {
      this.handlePointerClick();
    };

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
  }

  private updateHoverHighlight(): void {
    if (this.isSimulating) {
      this.highlightMesh.visible = false;
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactables: THREE.Mesh[] = [
      ...Array.from(this.tileMeshes.values()),
      ...this.benchMeshes
    ];

    const intersects = this.raycaster.intersectObjects(interactables);
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const meta = hit.userData as BoardMeshMetadata;

      if (meta.tileType === 'board' && meta.x !== undefined && meta.y !== undefined) {
        // Only player near half can be targeted for placement
        if (meta.y < PROTOCOL_CONSTANTS.PLAYER_ROWS) {
          this.hoveredTile = { area: 'board', x: meta.x, y: meta.y };
          this.highlightMesh.position.set(hit.position.x, 0.08, hit.position.z);
          this.highlightMesh.visible = true;
          return;
        }
      } else if (meta.tileType === 'bench' && meta.benchIndex !== undefined) {
        this.hoveredTile = { area: 'bench', benchIndex: meta.benchIndex };
        this.highlightMesh.position.set(hit.position.x, 0.18, hit.position.z);
        this.highlightMesh.visible = true;
        return;
      }
    }

    this.hoveredTile = null;
    this.highlightMesh.visible = false;
  }

  private handlePointerClick(): void {
    if (this.isSimulating) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check if clicked a unit
    const unitHitMeshes: THREE.Object3D[] = [];
    for (const rUnit of this.units.values()) {
      if (!rUnit.isEnemy) {
        unitHitMeshes.push(rUnit.parts.root);
      }
    }

    const unitHits = this.raycaster.intersectObjects(unitHitMeshes, true);
    if (unitHits.length > 0) {
      // Find parent unit root
      let current: THREE.Object3D | null = unitHits[0].object;
      while (current && !current.userData?.parts) {
        current = current.parent;
      }

      if (current) {
        const foundEntry = Array.from(this.units.entries()).find(
          ([_, u]) => u.parts.root === current
        );
        if (foundEntry) {
          const [clickedId, clickedUnit] = foundEntry;
          if (this.selectedUnitId === clickedId) {
            // Deselect
            this.selectedUnitId = null;
            if (this.onUnitSelected) this.onUnitSelected(null);
          } else {
            this.selectedUnitId = clickedId;
            if (this.onUnitSelected) this.onUnitSelected(clickedUnit.data);
          }
          this.updateSelectionMesh();
          return;
        }
      }
    }

    // 2. Check if clicked a tile with a selected unit
    if (this.selectedUnitId && this.hoveredTile) {
      if (this.onMoveRequested) {
        if (this.hoveredTile.area === 'board') {
          this.onMoveRequested(this.selectedUnitId, {
            area: 'board',
            x: this.hoveredTile.x!,
            y: this.hoveredTile.y!
          });
        } else {
          this.onMoveRequested(this.selectedUnitId, {
            area: 'bench',
            benchIndex: this.hoveredTile.benchIndex!
          });
        }
      }
      this.selectedUnitId = null;
      this.updateSelectionMesh();
      if (this.onUnitSelected) this.onUnitSelected(null);
    }
  }

  private updateSelectionMesh(): void {
    if (!this.selectedUnitId || this.isSimulating) {
      this.selectionMesh.visible = false;
      return;
    }
    const unit = this.units.get(this.selectedUnitId);
    if (!unit) {
      this.selectionMesh.visible = false;
      return;
    }
    this.selectionMesh.position.set(unit.parts.root.position.x, 0.12, unit.parts.root.position.z);
    this.selectionMesh.visible = true;
  }

  syncPreparationUnits(boardUnits: PlacedUnit[], benchUnits: PlacedUnit[]): void {
    this.isSimulating = false;
    this.activeSim = null;

    const allMyUnits = [...boardUnits, ...benchUnits];
    const currentIds = new Set(allMyUnits.map(u => u.instanceId));

    // Remove old or opponent units
    for (const [id, rUnit] of this.units.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(rUnit.parts.root);
        this.units.delete(id);
      }
    }

    // Update or add current units
    for (const u of allMyUnits) {
      const def = UNITS[u.unitId];
      if (!def) continue;

      let rUnit = this.units.get(u.instanceId);
      if (!rUnit) {
        const parts = UnitFactory.createUnitMesh(def, u.star);
        const animator = new UnitAnimator(parts);
        this.scene.add(parts.root);

        rUnit = {
          instanceId: u.instanceId,
          parts,
          animator,
          data: u,
          isEnemy: false,
          targetPosition: new THREE.Vector3()
        };
        this.units.set(u.instanceId, rUnit);
      } else {
        rUnit.data = u;
        UnitFactory.setStarLevel(rUnit.parts, u.star);
      }

      // Position unit on board or bench
      let worldPos: THREE.Vector3;
      if (u.placement.area === 'board') {
        worldPos = BoardFactory.getTileWorldPosition(u.placement.x, u.placement.y);
        rUnit.parts.root.rotation.y = 0; // facing forward/away towards opponent
      } else {
        worldPos = BoardFactory.getBenchWorldPosition(u.placement.benchIndex);
        rUnit.parts.root.rotation.y = 0;
      }

      rUnit.targetPosition.copy(worldPos);
      rUnit.parts.root.position.copy(worldPos);
      rUnit.animator.play('idle');

      UnitFactory.updateOverheadBars(
        rUnit.parts,
        u.currentHp,
        u.maxHp,
        u.currentMana,
        u.maxMana
      );
    }
  }

  startCombatPlayback(simulation: CombatSimulationResult): void {
    this.activeSim = simulation;
    this.simTimeSec = 0;
    this.currentEventIndex = 0;
    this.isSimulating = true;
    this.selectedUnitId = null;
    this.highlightMesh.visible = false;
    this.updateSelectionMesh();

    // Clear existing scene units and instantiate from simulation snapshots
    for (const rUnit of this.units.values()) {
      this.scene.remove(rUnit.parts.root);
    }
    this.units.clear();

    for (const snap of simulation.initialSnapshots) {
      const def = UNITS[snap.unitId];
      if (!def) continue;

      const parts = UnitFactory.createUnitMesh(def, snap.star);
      const animator = new UnitAnimator(parts);
      this.scene.add(parts.root);

      const worldPos = BoardFactory.getTileWorldPosition(snap.position.x, snap.position.y);
      parts.root.position.copy(worldPos);
      parts.root.rotation.y = snap.team === 1 ? 0 : Math.PI; // Enemies face towards camera

      const rUnit: RenderedUnit = {
        instanceId: snap.instanceId,
        parts,
        animator,
        data: {
          instanceId: snap.instanceId,
          unitId: snap.unitId,
          star: snap.star,
          placement: { area: 'board', x: snap.position.x, y: snap.position.y },
          currentHp: snap.maxHp,
          maxHp: snap.maxHp,
          currentMana: 0,
          maxMana: snap.manaCap
        },
        isEnemy: snap.team === 2,
        targetPosition: worldPos.clone()
      };

      this.units.set(snap.instanceId, rUnit);
    }
  }

  private processCombatEvents(currentTick: number): void {
    if (!this.activeSim) return;

    while (
      this.currentEventIndex < this.activeSim.events.length &&
      this.activeSim.events[this.currentEventIndex].tick <= currentTick
    ) {
      const ev = this.activeSim.events[this.currentEventIndex];
      this.executeCombatEvent(ev);
      this.currentEventIndex++;
    }
  }

  private executeCombatEvent(ev: CombatEvent): void {
    const sourceUnit = this.units.get(ev.sourceId);

    switch (ev.type) {
      case 'move': {
        if (sourceUnit && ev.position) {
          const newPos = BoardFactory.getTileWorldPosition(ev.position.x, ev.position.y);
          sourceUnit.targetPosition.copy(newPos);
          sourceUnit.animator.play('walk', 0.28);
        }
        break;
      }

      case 'attack': {
        if (sourceUnit) {
          sourceUnit.animator.play('attack', 0.35);
          if (ev.targetId) {
            const targetUnit = this.units.get(ev.targetId);
            if (targetUnit) {
              // Rotate to face target
              sourceUnit.parts.root.lookAt(targetUnit.parts.root.position);
              sourceUnit.parts.root.rotation.x = 0;
              sourceUnit.parts.root.rotation.z = 0;
            }
          }
        }
        break;
      }

      case 'damage': {
        if (ev.targetId) {
          const targetUnit = this.units.get(ev.targetId);
          if (targetUnit && ev.value !== undefined) {
            targetUnit.animator.play('hit', 0.2);
            targetUnit.data.currentHp = Math.max(0, targetUnit.data.currentHp - ev.value);

            UnitFactory.updateOverheadBars(
              targetUnit.parts,
              targetUnit.data.currentHp,
              targetUnit.data.maxHp,
              targetUnit.data.currentMana,
              targetUnit.data.maxMana
            );

            this.particleSystem.spawnImpact(targetUnit.parts.root.position, 0xef4444);

            // Floating 2D damage projection
            if (this.onSpawnDamageText) {
              const screenPos = this.worldToScreen(targetUnit.parts.root.position);
              this.onSpawnDamageText(ev.value, screenPos);
            }
          }
        }
        break;
      }

      case 'cast': {
        if (sourceUnit) {
          sourceUnit.animator.play('cast', 0.5);
          this.particleSystem.spawnImpact(sourceUnit.parts.root.position, 0x38bdf8, 12);
        }
        break;
      }

      case 'death': {
        if (sourceUnit) {
          sourceUnit.animator.play('death', 0.8);
        }
        break;
      }

      case 'teleport': {
        if (sourceUnit && ev.position) {
          const newPos = BoardFactory.getTileWorldPosition(ev.position.x, ev.position.y);
          this.particleSystem.spawnImpact(sourceUnit.parts.root.position, 0x8b5cf6, 10);
          sourceUnit.parts.root.position.copy(newPos);
          sourceUnit.targetPosition.copy(newPos);
          this.particleSystem.spawnImpact(newPos, 0x8b5cf6, 10);
        }
        break;
      }
    }
  }

  private worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const vector = worldPos.clone();
    vector.y += 1.6;
    vector.project(this.camera);

    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;

    return {
      x: vector.x * halfWidth + halfWidth,
      y: -(vector.y * halfHeight) + halfHeight
    };
  }

  playUpgradePop(instanceId: string): void {
    const unit = this.units.get(instanceId);
    if (unit) {
      unit.animator.play('upgrade', 0.8);
      this.particleSystem.spawnUpgradePop(unit.parts.root.position);
    }
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaSec = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Combat timeline playback
    if (this.isSimulating && this.activeSim) {
      this.simTimeSec += deltaSec;
      const currentTick = Math.floor(this.simTimeSec * PROTOCOL_CONSTANTS.TICK_RATE);
      this.processCombatEvents(currentTick);
    }

    // Interpolate unit movement & update animators
    for (const rUnit of this.units.values()) {
      rUnit.animator.update(deltaSec);

      // Smooth interpolation to target position
      rUnit.parts.root.position.lerp(rUnit.targetPosition, 0.15);
    }

    this.particleSystem.update(deltaSec);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
  }
}
