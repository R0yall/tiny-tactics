import * as THREE from 'three';

export class MaterialFactory {
  static getUnitMaterial(primaryHex: string, _secondaryHex: string, _accentHex: string): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryHex),
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true
    });
  }

  static getTileMaterial(isAlternate: boolean, isNearSide: boolean): THREE.MeshStandardMaterial {
    let baseColor: string;
    if (isNearSide) {
      baseColor = isAlternate ? '#2e4933' : '#37573d'; // Forest tactical green
    } else {
      baseColor = isAlternate ? '#3e3b4a' : '#474354'; // Enemy dark stone
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
  }

  static getHighlightMaterial(color: string = '#38bdf8', opacity: number = 0.5): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide
    });
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
