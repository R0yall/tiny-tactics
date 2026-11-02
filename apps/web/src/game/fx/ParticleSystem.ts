import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private group: THREE.Group = new THREE.Group();
  private sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
  }

  spawnImpact(position: THREE.Vector3, color: number = 0xf59e0b, count: number = 8): void {
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 4
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.2
      });
    }
  }

  spawnUpgradePop(position: THREE.Vector3): void {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      mesh.position.y += 0.8;

      const angle = (i / 20) * Math.PI * 2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * 3,
        Math.random() * 5 + 2,
        Math.sin(angle) * 3
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.8
      });
    }
  }

  update(deltaSec: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaSec;
      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, deltaSec);
      p.velocity.y -= 9.8 * deltaSec; // gravity
      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }
  }
}
