import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { UnitDefinition } from '@tiny-tactics/shared';
import { UnitFactory } from '../game/units/UnitFactory.js';
import { UnitAnimator } from '../game/units/UnitAnimator.js';

interface ShopUnitPreviewProps {
  unitDef: UnitDefinition;
}

export const ShopUnitPreview: React.FC<ShopUnitPreviewProps> = ({ unitDef }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 110;
    const height = 90;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
    camera.position.set(0, 0.9, 2.6);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Soft studio lighting for the unit portrait
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    backLight.position.set(-2, 1, -2);
    scene.add(backLight);

    // Create procedural unit mesh
    const parts = UnitFactory.createUnitMesh(unitDef, 1);
    // Hide overhead HP/Mana bars in shop preview
    parts.hpBar.visible = false;
    parts.manaBar.visible = false;
    scene.add(parts.root);

    const animator = new UnitAnimator(parts);
    animator.play('idle');

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      animator.update(delta);
      // Gentle slow turntable rotation
      parts.root.rotation.y += delta * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [unitDef]);

  return (
    <div
      ref={mountRef}
      className="w-[110px] h-[90px] flex items-center justify-center overflow-hidden pointer-events-none"
    />
  );
};
