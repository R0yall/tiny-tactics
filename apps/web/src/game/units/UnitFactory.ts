import * as THREE from 'three';
import { UnitDefinition, UnitStar } from '@tiny-tactics/shared';
import { MaterialFactory } from '../materials/MaterialFactory.js';

export interface UnitMeshParts {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  star2Extras: THREE.Object3D[];
  star3Extras: THREE.Object3D[];
  hpBar: THREE.Mesh;
  manaBar: THREE.Mesh;
}

export class UnitFactory {
  static createUnitMesh(unitDef: UnitDefinition, star: UnitStar = 1): UnitMeshParts {
    const root = new THREE.Group();

    const priMat = MaterialFactory.getUnitMaterial(
      unitDef.colorPalette.primary,
      unitDef.colorPalette.secondary,
      unitDef.colorPalette.accent
    );
    const secMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(unitDef.colorPalette.secondary),
      roughness: 0.5,
      metalness: 0.2,
      flatShading: true
    });
    const accMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(unitDef.colorPalette.accent),
      roughness: 0.3,
      metalness: 0.6,
      flatShading: true
    });
    const goldMat = MaterialFactory.getGoldGlowMaterial();

    const star2Extras: THREE.Object3D[] = [];
    const star3Extras: THREE.Object3D[] = [];

    // --- SKELETON HIERARCHY ---
    const bodyPivot = new THREE.Group();
    bodyPivot.position.y = 0.55;
    root.add(bodyPivot);

    // Torso (archetype specific shape)
    let torsoMesh: THREE.Mesh;
    if (unitDef.shapeArchetype === 'golem') {
      torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.5), priMat);
    } else if (unitDef.shapeArchetype === 'caster') {
      torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 0.7, 6), priMat);
    } else if (unitDef.shapeArchetype === 'beast') {
      torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.5), priMat);
    } else {
      torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), priMat);
    }
    torsoMesh.castShadow = true;
    bodyPivot.add(torsoMesh);

    // Head Pivot
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.45;
    bodyPivot.add(headPivot);

    const headGeo = new THREE.SphereGeometry(0.25, 6, 5);
    const headMesh = new THREE.Mesh(headGeo, secMat);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Archetype head accessories
    if (unitDef.shapeArchetype === 'caster') {
      // Wizard Hat / Cowl
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 6), priMat);
      hat.position.y = 0.32;
      headPivot.add(hat);
    } else if (unitDef.shapeArchetype === 'knight') {
      // Knight Plume / Crest
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.3), accMat);
      crest.position.y = 0.28;
      headPivot.add(crest);
    }

    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.35, 0.15, 0);
    bodyPivot.add(leftArmPivot);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 5), secMat);
    leftArm.position.y = -0.2;
    leftArmPivot.add(leftArm);

    // Right Arm Pivot
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.35, 0.15, 0);
    bodyPivot.add(rightArmPivot);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 5), secMat);
    rightArm.position.y = -0.2;
    rightArmPivot.add(rightArm);

    // Legs
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.16, -0.3, 0);
    bodyPivot.add(leftLegPivot);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 5), secMat);
    leftLeg.position.y = -0.2;
    leftLegPivot.add(leftLeg);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.16, -0.3, 0);
    bodyPivot.add(rightLegPivot);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 5), secMat);
    rightLeg.position.y = -0.2;
    rightLegPivot.add(rightLeg);

    // --- WEAPONS (Right Hand) ---
    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0, -0.35, 0.15);
    rightArmPivot.add(weaponGroup);

    if (unitDef.shapeArchetype === 'archer') {
      // Bow
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 4, 8, Math.PI), accMat);
      bow.rotation.y = Math.PI / 2;
      weaponGroup.add(bow);
    } else if (unitDef.shapeArchetype === 'caster') {
      // Magic Staff
      const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5), accMat);
      const staffOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), goldMat);
      staffOrb.position.y = 0.55;
      weaponGroup.add(staffPole);
      weaponGroup.add(staffOrb);
    } else if (unitDef.shapeArchetype === 'rogue') {
      // Daggers in both hands
      const dagger1 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 4), accMat);
      dagger1.rotation.x = Math.PI;
      weaponGroup.add(dagger1);

      const dagger2 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 4), accMat);
      dagger2.position.set(0, -0.35, 0.15);
      dagger2.rotation.x = Math.PI;
      leftArmPivot.add(dagger2);
    } else {
      // Sword / Axe / Mace
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.04), accMat);
      blade.position.y = 0.25;
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.05), goldMat);
      weaponGroup.add(blade);
      weaponGroup.add(hilt);
    }

    // Left hand: shield for knights/guardians
    if (unitDef.alliances.includes('guardian') || unitDef.shapeArchetype === 'knight') {
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.06), accMat);
      shield.position.set(-0.1, -0.2, 0.15);
      leftArmPivot.add(shield);
    }

    // --- STAR 2 EXTRAS (Shoulder pads + upgraded weapon trim) ---
    const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.22), accMat);
    leftPad.position.set(-0.35, 0.35, 0);
    bodyPivot.add(leftPad);
    star2Extras.push(leftPad);

    const rightPad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.22), accMat);
    rightPad.position.set(0.35, 0.35, 0);
    bodyPivot.add(rightPad);
    star2Extras.push(rightPad);

    // --- STAR 3 EXTRAS (Gold horns/halo/banner + bigger glow) ---
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 4, 12), goldMat);
    halo.position.set(0, 0.55, 0);
    halo.rotation.x = Math.PI / 2;
    headPivot.add(halo);
    star3Extras.push(halo);

    const hornLeft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 4), goldMat);
    hornLeft.position.set(-0.25, 0.35, 0);
    hornLeft.rotation.z = -0.5;
    headPivot.add(hornLeft);
    star3Extras.push(hornLeft);

    const hornRight = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 4), goldMat);
    hornRight.position.set(0.25, 0.35, 0);
    hornRight.rotation.z = 0.5;
    headPivot.add(hornRight);
    star3Extras.push(hornRight);

    // Apply initial star visibility
    for (const obj of star2Extras) obj.visible = star >= 2;
    for (const obj of star3Extras) obj.visible = star >= 3;

    // --- HP & MANA BARS (Overhead floating billboard) ---
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x334155 })
    );
    hpBarBg.position.set(0, 1.45, 0);
    root.add(hpBarBg);

    const hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    hpBar.position.set(0, 1.45, 0.01);
    root.add(hpBar);

    const manaBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    manaBar.position.set(0, 1.38, 0.01);
    root.add(manaBar);

    root.userData = {
      unitDef,
      star,
      parts: {
        root,
        bodyPivot,
        headPivot,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        star2Extras,
        star3Extras,
        hpBar,
        manaBar
      }
    };

    return {
      root,
      bodyPivot,
      headPivot,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      star2Extras,
      star3Extras,
      hpBar,
      manaBar
    };
  }

  static setStarLevel(parts: UnitMeshParts, star: UnitStar): void {
    for (const obj of parts.star2Extras) obj.visible = star >= 2;
    for (const obj of parts.star3Extras) obj.visible = star >= 3;

    if (star === 2) {
      parts.root.scale.set(1.15, 1.15, 1.15);
    } else if (star === 3) {
      parts.root.scale.set(1.3, 1.3, 1.3);
    } else {
      parts.root.scale.set(1.0, 1.0, 1.0);
    }
  }

  static updateOverheadBars(
    parts: UnitMeshParts,
    currentHp: number,
    maxHp: number,
    currentMana: number,
    maxMana: number
  ): void {
    const hpRatio = Math.max(0, Math.min(1, maxHp > 0 ? currentHp / maxHp : 0));
    parts.hpBar.scale.x = Math.max(0.001, hpRatio);
    parts.hpBar.position.x = -(0.78 * (1 - hpRatio)) / 2;

    const manaRatio = Math.max(0, Math.min(1, maxMana > 0 ? currentMana / maxMana : 0));
    parts.manaBar.scale.x = Math.max(0.001, manaRatio);
    parts.manaBar.position.x = -(0.78 * (1 - manaRatio)) / 2;
  }
}
