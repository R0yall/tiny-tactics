import * as THREE from 'three';

export class MaterialFactory {
  private static cache: Map<string, THREE.Material> = new Map();

  static getUnitMaterial(primaryHex: string, secondaryHex: string, accentHex: string): THREE.MeshStandardMaterial {
    const key = `mat_${primaryHex}_${secondaryHex}_${accentHex}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryHex),
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true
    });

    this.cache.set(key, mat);
    return mat;
  }

  static getTileMaterial(isAlternate: boolean, isNearSide: boolean): THREE.MeshStandardMaterial {
    const key = `tile_${isAlternate}_${isNearSide}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshStandardMaterial;

    let baseColor: string;
    if (isNearSide) {
      baseColor = isAlternate ? '#2e4933' : '#37573d'; // Forest tactical green
    } else {
      baseColor = isAlternate ? '#3e3b4a' : '#474354'; // Enemy dark stone
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });

    this.cache.set(key, mat);
    return mat;
  }

  static getHighlightMaterial(color: string = '#38bdf8', opacity: number = 0.5): THREE.MeshBasicMaterial {
    const key = `hl_${color}_${opacity}`;
    if (this.cache.has(key)) return this.cache.get(key) as THREE.MeshBasicMaterial;

    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });

    this.cache.set(key, mat);
    return mat;
  }

  static getGoldGlowMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.8
    });
  }
}
