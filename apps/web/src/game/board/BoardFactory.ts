import * as THREE from 'three';
import { MaterialFactory } from '../materials/MaterialFactory.js';
import { PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';

export interface BoardMeshMetadata {
  tileType: 'board' | 'bench';
  x?: number;
  y?: number;
  benchIndex?: number;
}

export class BoardFactory {
  static readonly TILE_SIZE = 1.6;
  static readonly BOARD_OFFSET_X = -(8 * 1.6) / 2 + 1.6 / 2;
  static readonly BOARD_OFFSET_Z = -(8 * 1.6) / 2 + 1.6 / 2;
  static readonly BENCH_Z = 6.4;

  static createBoard(): {
    boardGroup: THREE.Group;
    tileMeshes: Map<string, THREE.Mesh>;
    benchMeshes: THREE.Mesh[];
  } {
    const boardGroup = new THREE.Group();
    const tileMeshes = new Map<string, THREE.Mesh>();
    const benchMeshes: THREE.Mesh[] = [];

    const tileSize = this.TILE_SIZE;
    const boardWidth = PROTOCOL_CONSTANTS.BOARD_WIDTH;
    const boardHeight = PROTOCOL_CONSTANTS.BOARD_HEIGHT;

    // 1. Elevated Rim / Base extending to cover the bench terrace
    const baseGeo = new THREE.BoxGeometry(
      boardWidth * tileSize + 0.8,
      0.6,
      boardHeight * tileSize + 2.0
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -0.35, 0.6);
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // Decorative gold rim edge
    const rimGeo = new THREE.BoxGeometry(
      boardWidth * tileSize + 0.9,
      0.1,
      boardHeight * tileSize + 2.1
    );
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.5,
      flatShading: true
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.05, 0.6);
    boardGroup.add(rimMesh);

    // 2. 8x8 Board Tiles
    const tileGeo = new THREE.BoxGeometry(tileSize * 0.95, 0.15, tileSize * 0.95);

    for (let x = 0; x < boardWidth; x++) {
      for (let y = 0; y < boardHeight; y++) {
        const isAlternate = (x + y) % 2 === 1;
        const isNearSide = y < PROTOCOL_CONSTANTS.PLAYER_ROWS;
        const mat = MaterialFactory.getTileMaterial(isAlternate, isNearSide);

        const mesh = new THREE.Mesh(tileGeo, mat);
        const posX = this.BOARD_OFFSET_X + x * tileSize;
        const posZ = this.BOARD_OFFSET_Z + (7 - y) * tileSize; // Y:0 is closest to player camera

        mesh.position.set(posX, 0, posZ);
        mesh.receiveShadow = true;

        mesh.userData = {
          tileType: 'board',
          x,
          y
        } as BoardMeshMetadata;

        boardGroup.add(mesh);
        tileMeshes.set(`${x}_${y}`, mesh);
      }
    }

    // 3. Bench Slots (8 platforms in front of the board)
    const benchGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.18, 12);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      roughness: 0.5,
      metalness: 0.4,
      flatShading: true
    });
    const benchRingGeo = new THREE.RingGeometry(0.55, 0.70, 16);
    const benchRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });

    const benchStartX = -(8 * 1.6) / 2 + 1.6 / 2;
    for (let i = 0; i < PROTOCOL_CONSTANTS.BENCH_SIZE; i++) {
      const mesh = new THREE.Mesh(benchGeo, benchMat.clone());
      const posX = benchStartX + i * 1.6;
      mesh.position.set(posX, 0.08, this.BENCH_Z);
      mesh.receiveShadow = true;

      // Subtle cyan glow ring on bench surface
      const ring = new THREE.Mesh(benchRingGeo, benchRingMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.10;
      mesh.add(ring);

      mesh.userData = {
        tileType: 'bench',
        benchIndex: i
      } as BoardMeshMetadata;

      boardGroup.add(mesh);
      benchMeshes.push(mesh);
    }

    // 4. Perimeter Environment (low-poly trees, rocks, flags)
    this.addPerimeterDecorations(boardGroup);

    return { boardGroup, tileMeshes, benchMeshes };
  }

  private static addPerimeterDecorations(group: THREE.Group): void {
    // 4 Low-poly Trees
    const treePositions = [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: -8.5, z: 2 },
      { x: 8.5, z: 2 }
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, flatShading: true });
    const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8, flatShading: true });
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8, flatShading: true });

    for (const pos of treePositions) {
      const tree = new THREE.Group();
      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 6), trunkMat);
      trunk.position.y = 0.9;
      tree.add(trunk);

      // Conical foliage layers
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 6), leavesMat1);
      cone1.position.y = 2.2;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.5, 6), leavesMat2);
      cone2.position.y = 3.1;
      tree.add(cone2);

      tree.position.set(pos.x, -0.6, pos.z);
      group.add(tree);
    }

    // 3 Rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const rockPositions = [
      { x: -7.5, z: -3, scale: 0.9 },
      { x: 7.8, z: -3.5, scale: 1.1 },
      { x: -6.5, z: 6, scale: 0.7 }
    ];

    for (const rp of rockPositions) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rp.scale, 0), rockMat);
      rock.position.set(rp.x, -0.3, rp.z);
      rock.rotation.set(0.3, rp.scale, 0.4);
      group.add(rock);
    }

    // 2 Flags on the back rim
    const flagPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, flatShading: true });
    const flagBannerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide, flatShading: true });

    for (const flagX of [-4.5, 4.5]) {
      const flagGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 6), flagPoleMat);
      pole.position.y = 1.75;
      flagGroup.add(pole);

      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), flagBannerMat);
      banner.position.set(0.6, 3.0, 0);
      banner.rotation.y = Math.PI / 2;
      flagGroup.add(banner);

      flagGroup.position.set(flagX, 0, -6.8);
      group.add(flagGroup);
    }
  }

  static getTileWorldPosition(x: number, y: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.BOARD_OFFSET_X + x * this.TILE_SIZE,
      0.1,
      this.BOARD_OFFSET_Z + (7 - y) * this.TILE_SIZE
    );
  }

  static getBenchWorldPosition(benchIndex: number): THREE.Vector3 {
    const benchStartX = -(8 * 1.6) / 2 + 1.6 / 2;
    return new THREE.Vector3(
      benchStartX + benchIndex * 1.6,
      0.18,
      this.BENCH_Z
    );
  }
}
