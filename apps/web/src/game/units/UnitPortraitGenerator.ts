import * as THREE from 'three';
import { UnitDefinition } from '@tiny-tactics/shared';
import { UnitFactory } from './UnitFactory.js';
import { UnitAnimator } from './UnitAnimator.js';

class PortraitGenerator {
  private cache: Map<string, string[]> = new Map();
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  private init(): void {
    if (this.renderer || typeof window === 'undefined') return;

    const width = 120;
    const height = 100;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 20);
    this.camera.position.set(0, 0.95, 2.7);
    this.camera.lookAt(0, 0.45, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1.5);

    const ambient = new THREE.AmbientLight(0xffffff, 1.3);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(2, 3, 2);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    backLight.position.set(-2, 1, -2);
    this.scene.add(backLight);
  }

  getFrames(unitDef: UnitDefinition): string[] {
    if (this.cache.has(unitDef.id)) {
      return this.cache.get(unitDef.id)!;
    }

    if (typeof window === 'undefined') return [];

    this.init();
    if (!this.renderer || !this.scene || !this.camera) return [];

    const parts = UnitFactory.createUnitMesh(unitDef, 1);
    parts.hpBar.visible = false;
    parts.manaBar.visible = false;
    this.scene.add(parts.root);

    const animator = new UnitAnimator(parts);
    animator.play('idle');

    const frames: string[] = [];
    const totalFrames = 16;

    for (let f = 0; f < totalFrames; f++) {
      animator.update(0.08);
      parts.root.rotation.y = (f / totalFrames) * Math.PI * 2;
      this.renderer.render(this.scene, this.camera);
      frames.push(this.renderer.domElement.toDataURL('image/png'));
    }

    this.scene.remove(parts.root);
    this.cache.set(unitDef.id, frames);

    return frames;
  }

  preloadAll(units: Record<string, UnitDefinition>): void {
    if (typeof window === 'undefined') return;
    for (const unit of Object.values(units)) {
      this.getFrames(unit);
    }
    // Clean up temporary renderer and free WebGL context
    if (this.renderer) {
      this.renderer.forceContextLoss();
      this.renderer.dispose();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }
  }
}

export const UnitPortraitGenerator = new PortraitGenerator();
