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
  barsGroup: THREE.Group;
}

export class UnitFactory {
  static createUnitMesh(unitDef: UnitDefinition, star: UnitStar = 1): UnitMeshParts {
    const root = new THREE.Group();

    // --- PALETTE MATERIALS ---
    const priMat = MaterialFactory.getUnitMaterial(
      unitDef.colorPalette.primary,
      unitDef.colorPalette.secondary,
      unitDef.colorPalette.accent
    );
    const secMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(unitDef.colorPalette.secondary),
      roughness: 0.45,
      metalness: 0.35,
      flatShading: true
    });
    const accMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(unitDef.colorPalette.accent),
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xa0aec0,
      roughness: 0.25,
      metalness: 0.85,
      flatShading: true
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.35,
      metalness: 0.75,
      flatShading: true
    });
    const goldMat = MaterialFactory.getGoldGlowMaterial();
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.75,
      metalness: 0.1,
      flatShading: true
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(unitDef.colorPalette.accent),
      emissive: new THREE.Color(unitDef.colorPalette.accent),
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8
    });

    const star2Extras: THREE.Object3D[] = [];
    const star3Extras: THREE.Object3D[] = [];

    // --- SKELETON ROOT & BODY PIVOT ---
    const bodyPivot = new THREE.Group();
    bodyPivot.position.y = 0.55;
    root.add(bodyPivot);

    const archetype = unitDef.shapeArchetype;
    const isSpecialUnit = unitDef.id;

    // --- 1. TORSO & OUTFIT ---
    const torsoGroup = new THREE.Group();
    bodyPivot.add(torsoGroup);

    if (archetype === 'knight') {
      // Sculpted plate cuirass
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.36), steelMat);
      chest.castShadow = true;
      torsoGroup.add(chest);

      // Chestplate emblem/cross
      const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.38), priMat);
      torsoGroup.add(emblem);

      // Armored collar/gorget
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 6), steelMat);
      collar.position.y = 0.26;
      torsoGroup.add(collar);

      // War belt with gold buckle
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.38), leatherMat);
      belt.position.y = -0.22;
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.40), goldMat);
      buckle.position.y = -0.22;
      torsoGroup.add(belt);
      torsoGroup.add(buckle);

      // Groin & hip tassets
      const tassetL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.06), steelMat);
      tassetL.position.set(-0.18, -0.32, 0.16);
      tassetL.rotation.x = 0.15;
      const tassetR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.06), steelMat);
      tassetR.position.set(0.18, -0.32, 0.16);
      tassetR.rotation.x = 0.15;
      torsoGroup.add(tassetL);
      torsoGroup.add(tassetR);

      // Back cape
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.04), priMat);
      cape.position.set(0, -0.15, -0.20);
      cape.rotation.x = 0.1;
      torsoGroup.add(cape);

    } else if (archetype === 'caster') {
      // Wizard tunic & flowing robe
      const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.45, 6), priMat);
      tunic.castShadow = true;
      torsoGroup.add(tunic);

      // Lower flowing robe skirt
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.42, 6), secMat);
      skirt.position.y = -0.32;
      torsoGroup.add(skirt);

      // High arched mystic mantle collar
      const mantle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.08), accMat);
      mantle.position.set(0, 0.24, -0.12);
      mantle.rotation.x = -0.2;
      torsoGroup.add(mantle);

      // Mystic sash belt with spell-tome on hip
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.34), accMat);
      sash.position.y = -0.14;
      torsoGroup.add(sash);

      const book = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), leatherMat);
      book.position.set(0.24, -0.18, 0);
      book.rotation.y = Math.PI / 4;
      torsoGroup.add(book);

    } else if (archetype === 'archer') {
      // Fitted leather brigandine
      const tunic = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.32), priMat);
      tunic.castShadow = true;
      torsoGroup.add(tunic);

      // Crossing leather bandolier harness
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.10, 0.34), leatherMat);
      strap.rotation.z = 0.55;
      torsoGroup.add(strap);

      // Utility belt with side quiver pouch
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.08, 0.34), leatherMat);
      belt.position.y = -0.22;
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12), secMat);
      pouch.position.set(-0.24, -0.22, 0.08);
      torsoGroup.add(belt);
      torsoGroup.add(pouch);

      // Back quiver with visible arrows
      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.55, 6), leatherMat);
      quiver.position.set(-0.14, 0.1, -0.20);
      quiver.rotation.z = 0.35;
      quiver.rotation.x = -0.15;
      torsoGroup.add(quiver);

      for (let a = 0; a < 3; a++) {
        const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), goldMat);
        arrow.position.set(-0.16 + a * 0.04, 0.35, -0.20);
        arrow.rotation.z = 0.35;
        torsoGroup.add(arrow);
      }

    } else if (archetype === 'rogue') {
      // Sleek assassin vest
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.3), priMat);
      vest.castShadow = true;
      torsoGroup.add(vest);

      // Cross harnesses with chest throwing daggers
      const harness = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.32), darkSteelMat);
      harness.rotation.z = -0.5;
      torsoGroup.add(harness);

      const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.03), accMat);
      d1.position.set(0.08, 0.05, 0.17);
      d1.rotation.z = 0.6;
      torsoGroup.add(d1);

      // Dual streaming ninja scarf ribbons behind neck
      const scarfL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.03), accMat);
      scarfL.position.set(-0.12, -0.05, -0.18);
      scarfL.rotation.x = 0.35;
      scarfL.rotation.z = -0.2;
      const scarfR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.03), accMat);
      scarfR.position.set(0.12, -0.05, -0.18);
      scarfR.rotation.x = 0.35;
      scarfR.rotation.z = 0.2;
      torsoGroup.add(scarfL);
      torsoGroup.add(scarfR);

    } else if (archetype === 'beast') {
      // Muscular barbarian chest
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.48), priMat);
      chest.castShadow = true;
      torsoGroup.add(chest);

      // Iron strapped harness
      const harness1 = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.12, 0.50), darkSteelMat);
      harness1.rotation.z = 0.6;
      torsoGroup.add(harness1);

      // Heavy fur loincloth
      const loincloth = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.2), secMat);
      loincloth.position.set(0, -0.32, 0.16);
      torsoGroup.add(loincloth);

      // Dragon tail / wings if dragon
      if (isSpecialUnit === 'dragon') {
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), accMat);
        wingL.position.set(-0.55, 0.25, -0.25);
        wingL.rotation.y = 0.4;
        wingL.rotation.z = 0.3;
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), accMat);
        wingR.position.set(0.55, 0.25, -0.25);
        wingR.rotation.y = -0.4;
        wingR.rotation.z = -0.3;
        torsoGroup.add(wingL);
        torsoGroup.add(wingR);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 5), priMat);
        tail.position.set(0, -0.25, -0.45);
        tail.rotation.x = -Math.PI / 3;
        torsoGroup.add(tail);
      }

    } else {
      // Golem / Treant: Faceted stone/bark monolith
      const rockChest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), priMat);
      rockChest.scale.set(1.1, 0.95, 0.9);
      rockChest.castShadow = true;
      torsoGroup.add(rockChest);

      // Glowing pulsating core crystal in chest
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat);
      core.position.set(0, 0.05, 0.24);
      torsoGroup.add(core);

      // Ancient moss/vine shoulder plates
      const mossL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.35), secMat);
      mossL.position.set(-0.35, 0.25, 0);
      const mossR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.35), secMat);
      mossR.position.set(0.35, 0.25, 0);
      torsoGroup.add(mossL);
      torsoGroup.add(mossR);
    }

    // Special: Solar Archangel Wings
    if (isSpecialUnit === 'archangel') {
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.4
      });
      for (let w = 0; w < 4; w++) {
        const side = w < 2 ? -1 : 1;
        const tier = w % 2;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.55 + tier * 0.25, 0.18, 0.04), wingMat);
        wing.position.set(side * (0.45 + tier * 0.2), 0.25 - tier * 0.2, -0.25);
        wing.rotation.z = side * (0.45 + tier * 0.3);
        wing.rotation.y = side * 0.25;
        torsoGroup.add(wing);
      }
    }

    // --- 2. HEAD & HELMET ---
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.45;
    bodyPivot.add(headPivot);

    const headGroup = new THREE.Group();
    headPivot.add(headGroup);

    // Base head
    const baseHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), secMat);
    baseHead.castShadow = true;
    headGroup.add(baseHead);

    if (archetype === 'knight') {
      // Armored Great-helm
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), steelMat);
      helm.position.y = 0.05;
      helm.castShadow = true;
      headGroup.add(helm);

      // Horizontal & vertical glowing T-slit visor
      const visorH = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.04), glowMat);
      visorH.position.set(0, 0.06, 0.20);
      headGroup.add(visorH);

      const visorV = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.14), glowMat);
      visorV.position.set(0, 0.01, 0.20);
      headGroup.add(visorV);

      // Plume / Royal crest
      const plume = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.36), priMat);
      plume.position.set(0, 0.30, -0.05);
      headGroup.add(plume);

    } else if (archetype === 'caster') {
      if (isSpecialUnit === 'pyromancer') {
        // Flaming crown
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.16, 5), accMat);
        crown.position.y = 0.20;
        headGroup.add(crown);
        const flameHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), glowMat);
        flameHorn.position.set(0, 0.38, 0.1);
        headGroup.add(flameHorn);
      } else if (isSpecialUnit === 'sorceress') {
        // Frost tiara
        const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 4, 8, Math.PI), accMat);
        tiara.rotation.x = Math.PI / 2;
        tiara.position.y = 0.12;
        headGroup.add(tiara);
        const frostShard = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 4), glowMat);
        frostShard.position.set(0, 0.28, 0.18);
        headGroup.add(frostShard);
      } else {
        // Wizard Hat with buckled brim
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 8), priMat);
        brim.position.y = 0.12;
        headGroup.add(brim);

        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.52, 6), priMat);
        cone.position.set(0, 0.36, -0.04);
        cone.rotation.x = -0.15;
        headGroup.add(cone);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.32), goldMat);
        buckle.position.set(0, 0.15, 0.16);
        headGroup.add(buckle);
      }

      // Mystic glowing eyes in shadow
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.04), glowMat);
      eyeL.position.set(-0.08, 0.04, 0.20);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.04), glowMat);
      eyeR.position.set(0.08, 0.04, 0.20);
      headGroup.add(eyeL);
      headGroup.add(eyeR);

    } else if (archetype === 'archer') {
      // Ranger cowl with slanted brim
      const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.42, 6), priMat);
      cowl.position.set(0, 0.22, -0.05);
      cowl.rotation.x = -0.2;
      headGroup.add(cowl);

      // Feather quill tucked in side
      const feather = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.1), goldMat);
      feather.position.set(-0.22, 0.25, 0.05);
      feather.rotation.z = -0.3;
      headGroup.add(feather);

      // Hawk eyes
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), glowMat);
      eyeL.position.set(-0.08, 0.02, 0.21);
      const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), glowMat);
      eyeR.position.set(0.08, 0.02, 0.21);
      headGroup.add(eyeL);
      headGroup.add(eyeR);

    } else if (archetype === 'rogue') {
      // Assassin ninja cowl
      const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), darkSteelMat);
      headGroup.add(cowl);

      // Ninja face mask
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.14), priMat);
      mask.position.set(0, -0.05, 0.16);
      headGroup.add(mask);

      // Glowing narrow eye slits
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.04), glowMat);
      eyeL.position.set(-0.08, 0.06, 0.21);
      eyeL.rotation.z = 0.1;
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.04), glowMat);
      eyeR.position.set(0.08, 0.06, 0.21);
      eyeR.rotation.z = -0.1;
      headGroup.add(eyeL);
      headGroup.add(eyeR);

    } else if (archetype === 'beast') {
      // Skull-cap with curved bull horns
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.36), darkSteelMat);
      cap.position.y = 0.12;
      headGroup.add(cap);

      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), goldMat);
      hornL.position.set(-0.25, 0.22, 0);
      hornL.rotation.z = -0.7;
      hornL.rotation.x = -0.2;
      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), goldMat);
      hornR.position.set(0.25, 0.22, 0);
      hornR.rotation.z = 0.7;
      hornR.rotation.x = -0.2;
      headGroup.add(hornL);
      headGroup.add(hornR);

      // Fierce glowing eyes
      const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.04), glowMat);
      eyeL.position.set(-0.09, 0.02, 0.22);
      const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.04), glowMat);
      eyeR.position.set(0.09, 0.02, 0.22);
      headGroup.add(eyeL);
      headGroup.add(eyeR);

    } else {
      // Golem / Treant: Monolithic carved brow & glowing runic eye sockets
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.28), priMat);
      brow.position.set(0, 0.14, 0.08);
      headGroup.add(brow);

      const eyeCore = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), glowMat);
      eyeCore.position.set(0, 0.04, 0.20);
      headGroup.add(eyeCore);
    }

    // Floating Solar Halo for Archangel & Crusader
    if (isSpecialUnit === 'archangel' || isSpecialUnit === 'crusader') {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 4, 16), goldMat);
      halo.position.set(0, 0.42, -0.05);
      halo.rotation.x = Math.PI / 2;
      headGroup.add(halo);
    }

    // --- 3. LEFT ARM & OFFHAND (Shield / Dagger / Tome) ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.35, 0.15, 0);
    bodyPivot.add(leftArmPivot);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 6), secMat);
    leftArm.position.y = -0.18;
    leftArmPivot.add(leftArm);

    // Left shoulder pauldron
    const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.24), archetype === 'knight' ? steelMat : priMat);
    leftPad.position.set(-0.04, 0.04, 0);
    leftArmPivot.add(leftPad);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.36, 0.12);
    leftArmPivot.add(leftHand);

    if (archetype === 'knight' || unitDef.alliances.includes('guardian')) {
      // Heraldic Kite Shield
      const shieldGroup = new THREE.Group();
      const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.06), steelMat);
      const shieldRim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.66, 0.04), goldMat);
      const shieldEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.08), priMat);

      shieldGroup.add(shieldRim);
      shieldGroup.add(shieldPlate);
      shieldGroup.add(shieldEmblem);

      shieldGroup.position.set(-0.1, 0.05, 0.08);
      shieldGroup.rotation.y = 0.3;
      leftHand.add(shieldGroup);

    } else if (archetype === 'rogue') {
      // Off-hand curved shadow dagger
      const offDagger = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 4), glowMat);
      offDagger.rotation.x = Math.PI;
      leftHand.add(offDagger);
    }

    // --- 4. RIGHT ARM & MAIN WEAPON ---
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.35, 0.15, 0);
    bodyPivot.add(rightArmPivot);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 6), secMat);
    rightArm.position.y = -0.18;
    rightArmPivot.add(rightArm);

    // Right shoulder pauldron
    const rightPad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.24), archetype === 'knight' ? steelMat : priMat);
    rightPad.position.set(0.04, 0.04, 0);
    rightArmPivot.add(rightPad);

    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0, -0.36, 0.14);
    rightArmPivot.add(weaponGroup);

    if (archetype === 'knight') {
      // Royal Longsword
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.75, 0.04), steelMat);
      blade.position.y = 0.32;
      const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.60, 0.05), glowMat);
      fuller.position.y = 0.32;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), goldMat);
      guard.position.y = -0.02;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 5), leatherMat);
      grip.position.y = -0.12;
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 4), goldMat);
      pommel.position.y = -0.22;

      weaponGroup.add(blade);
      weaponGroup.add(fuller);
      weaponGroup.add(guard);
      weaponGroup.add(grip);
      weaponGroup.add(pommel);

    } else if (archetype === 'archer') {
      if (isSpecialUnit === 'sniper') {
        // Marksman Sniper Rifle
        const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.65), darkSteelMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.45;
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), goldMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.1, 0.1);

        weaponGroup.add(rifleBody);
        weaponGroup.add(barrel);
        weaponGroup.add(scope);
      } else {
        // Composite Recurve Longbow
        const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 4, 12, Math.PI), priMat);
        bowCurve.rotation.y = Math.PI / 2;
        const bowGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), goldMat);
        bowGrip.position.set(0, 0, 0.42);
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.84, 3), goldMat);
        string.position.set(0, 0, 0);

        weaponGroup.add(bowCurve);
        weaponGroup.add(bowGrip);
        weaponGroup.add(string);
      }

    } else if (archetype === 'caster') {
      // Arcane Wizard Staff with Glowing Orb
      const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.25, 6), woodMat);
      staffPole.position.y = 0.2;

      const staffHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.04, 0.25, 4), goldMat);
      staffHead.position.y = 0.8;

      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat);
      orb.position.y = 0.95;

      // Orbiting magic rune ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 12), glowMat);
      ring.position.y = 0.95;
      ring.rotation.x = Math.PI / 3;

      weaponGroup.add(staffPole);
      weaponGroup.add(staffHead);
      weaponGroup.add(orb);
      weaponGroup.add(ring);

    } else if (archetype === 'rogue') {
      // Curved Shadow Dagger
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.52, 4), glowMat);
      blade.position.y = 0.22;
      blade.rotation.z = -0.2;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), darkSteelMat);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 4), leatherMat);
      grip.position.y = -0.09;

      weaponGroup.add(blade);
      weaponGroup.add(guard);
      weaponGroup.add(grip);

    } else if (archetype === 'beast') {
      // Colossal Double-bitted Battleaxe
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5), darkSteelMat);
      shaft.position.y = 0.2;

      const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.05), steelMat);
      bladeL.position.set(-0.2, 0.6, 0);
      const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.05), steelMat);
      bladeR.position.set(0.2, 0.6, 0);

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), goldMat);
      spike.position.y = 0.85;

      weaponGroup.add(shaft);
      weaponGroup.add(bladeL);
      weaponGroup.add(bladeR);
      weaponGroup.add(spike);

    } else {
      // Golem Boulder Fist
      const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), priMat);
      fist.position.y = 0.05;
      const knuckleGlow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), glowMat);
      knuckleGlow.position.set(0, 0.08, 0.15);
      weaponGroup.add(fist);
      weaponGroup.add(knuckleGlow);
    }

    // --- 5. LEGS & BOOTS ---
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.16, -0.3, 0);
    bodyPivot.add(leftLegPivot);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), darkSteelMat);
    leftLeg.position.y = -0.21;
    leftLegPivot.add(leftLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), leatherMat);
    leftBoot.position.set(0, -0.38, 0.04);
    leftLegPivot.add(leftBoot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.16, -0.3, 0);
    bodyPivot.add(rightLegPivot);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), darkSteelMat);
    rightLeg.position.y = -0.21;
    rightLegPivot.add(rightLeg);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.26), leatherMat);
    rightBoot.position.set(0, -0.38, 0.04);
    rightLegPivot.add(rightBoot);

    // --- 6. STAR 2 EXTRAS (Spiked Heavy Pauldrons & Gold Accents) ---
    const star2L = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 4), goldMat);
    star2L.position.set(-0.38, 0.42, 0);
    star2L.rotation.z = 0.5;
    bodyPivot.add(star2L);
    star2Extras.push(star2L);

    const star2R = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 4), goldMat);
    star2R.position.set(0.38, 0.42, 0);
    star2R.rotation.z = -0.5;
    bodyPivot.add(star2R);
    star2Extras.push(star2R);

    // --- 7. STAR 3 EXTRAS (Grand Floating Celestial Crest / Energy Wings) ---
    const star3Crown = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 4, 16), goldMat);
    star3Crown.position.set(0, 0.55, 0);
    star3Crown.rotation.x = Math.PI / 2;
    headPivot.add(star3Crown);
    star3Extras.push(star3Crown);

    for (let i = 0; i < 4; i++) {
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), goldMat);
      const angle = (i / 4) * Math.PI * 2;
      ray.position.set(Math.cos(angle) * 0.42, 0.55, Math.sin(angle) * 0.42);
      ray.rotation.z = angle;
      headPivot.add(ray);
      star3Extras.push(ray);
    }

    // Apply initial star visibility
    for (const obj of star2Extras) obj.visible = star >= 2;
    for (const obj of star3Extras) obj.visible = star >= 3;

    // --- 8. FLOATING OVERHEAD HEALTH & MANA BARS ---
    const barsGroup = new THREE.Group();
    root.add(barsGroup);

    const barWidth = 0.84;
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(barWidth, 0.09),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    hpBarBg.position.set(0, 1.48, 0);
    barsGroup.add(hpBarBg);

    const hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(barWidth - 0.02, 0.07),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    hpBar.position.set(0, 1.48, 0.01);
    barsGroup.add(hpBar);

    const manaBar = new THREE.Mesh(
      new THREE.PlaneGeometry(barWidth - 0.02, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    manaBar.position.set(0, 1.40, 0.01);
    barsGroup.add(manaBar);

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
        manaBar,
        barsGroup
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
      manaBar,
      barsGroup
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
    const barWidth = 0.82;
    const hpRatio = Math.max(0, Math.min(1, maxHp > 0 ? currentHp / maxHp : 0));
    parts.hpBar.scale.x = Math.max(0.001, hpRatio);
    parts.hpBar.position.x = -(barWidth * (1 - hpRatio)) / 2;

    const manaRatio = Math.max(0, Math.min(1, maxMana > 0 ? currentMana / maxMana : 0));
    parts.manaBar.scale.x = Math.max(0.001, manaRatio);
    parts.manaBar.position.x = -(barWidth * (1 - manaRatio)) / 2;
  }
}
