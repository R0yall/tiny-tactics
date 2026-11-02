import { UnitMeshParts } from './UnitFactory.js';

export type AnimationState = 'idle' | 'walk' | 'attack' | 'cast' | 'hit' | 'death' | 'upgrade';

export class UnitAnimator {
  private currentState: AnimationState = 'idle';
  private stateTime = 0;
  private duration = 0;
  private onComplete?: () => void;

  constructor(private parts: UnitMeshParts) {}

  play(state: AnimationState, durationSec: number = 0, onComplete?: () => void): void {
    if (this.currentState === 'death') return; // Cannot override death

    this.currentState = state;
    this.stateTime = 0;
    this.duration = durationSec;
    this.onComplete = onComplete;
  }

  update(deltaSec: number): void {
    this.stateTime += deltaSec;

    switch (this.currentState) {
      case 'idle':
        this.animateIdle();
        break;
      case 'walk':
        this.animateWalk();
        break;
      case 'attack':
        this.animateAttack();
        break;
      case 'cast':
        this.animateCast();
        break;
      case 'hit':
        this.animateHit();
        break;
      case 'upgrade':
        this.animateUpgrade();
        break;
      case 'death':
        this.animateDeath();
        break;
    }

    if (this.duration > 0 && this.stateTime >= this.duration) {
      const cb = this.onComplete;
      this.currentState = 'idle';
      this.duration = 0;
      this.onComplete = undefined;
      if (cb) cb();
    }
  }

  private animateIdle(): void {
    const t = this.stateTime * 3;
    // Breathing bob
    this.parts.bodyPivot.position.y = 0.55 + Math.sin(t) * 0.03;
    // Gentle arm sway
    this.parts.leftArmPivot.rotation.x = Math.sin(t) * 0.08;
    this.parts.rightArmPivot.rotation.x = -Math.sin(t) * 0.08;
    this.parts.headPivot.rotation.x = Math.sin(t) * 0.04;
    // Reset legs
    this.parts.leftLegPivot.rotation.x = 0;
    this.parts.rightLegPivot.rotation.x = 0;
  }

  private animateWalk(): void {
    const t = this.stateTime * 10;
    // Opposing arm/leg swings
    this.parts.bodyPivot.position.y = 0.55 + Math.abs(Math.sin(t)) * 0.08;
    this.parts.leftLegPivot.rotation.x = Math.sin(t) * 0.5;
    this.parts.rightLegPivot.rotation.x = -Math.sin(t) * 0.5;
    this.parts.leftArmPivot.rotation.x = -Math.sin(t) * 0.4;
    this.parts.rightArmPivot.rotation.x = Math.sin(t) * 0.4;
  }

  private animateAttack(): void {
    // 0..0.4: wind-up; 0.4..0.6: strike; 0.6..1.0: recover
    const progress = Math.min(1, this.stateTime / (this.duration || 0.4));
    if (progress < 0.4) {
      // Wind-up: pull right arm back
      const p = progress / 0.4;
      this.parts.rightArmPivot.rotation.x = -p * 1.2;
      this.parts.bodyPivot.rotation.y = -p * 0.3;
    } else if (progress < 0.7) {
      // Strike forward
      const p = (progress - 0.4) / 0.3;
      this.parts.rightArmPivot.rotation.x = -1.2 + p * 2.2;
      this.parts.bodyPivot.rotation.y = -0.3 + p * 0.6;
    } else {
      // Return
      const p = (progress - 0.7) / 0.3;
      this.parts.rightArmPivot.rotation.x = 1.0 - p * 1.0;
      this.parts.bodyPivot.rotation.y = 0.3 - p * 0.3;
    }
  }

  private animateCast(): void {
    const progress = Math.min(1, this.stateTime / (this.duration || 0.6));
    // Arms raise upward
    const lift = Math.sin(progress * Math.PI);
    this.parts.rightArmPivot.rotation.x = -lift * 2.0;
    this.parts.leftArmPivot.rotation.x = -lift * 2.0;
    this.parts.bodyPivot.position.y = 0.55 + lift * 0.25;
  }

  private animateHit(): void {
    const progress = Math.min(1, this.stateTime / (this.duration || 0.2));
    const recoil = Math.sin(progress * Math.PI);
    this.parts.bodyPivot.position.z = -recoil * 0.15;
    this.parts.headPivot.rotation.x = -recoil * 0.3;
  }

  private animateUpgrade(): void {
    const progress = Math.min(1, this.stateTime / (this.duration || 0.8));
    // 360 spin + scale pop
    this.parts.root.rotation.y += 0.2;
    const scalePop = 1.0 + Math.sin(progress * Math.PI) * 0.3;
    this.parts.root.scale.set(scalePop, scalePop, scalePop);
  }

  private animateDeath(): void {
    const progress = Math.min(1, this.stateTime / 0.8);
    // Tip over backwards and sink into ground
    this.parts.root.rotation.x = -progress * (Math.PI / 2);
    this.parts.root.position.y = -progress * 0.4;
    const scale = Math.max(0.01, 1 - progress * 0.8);
    this.parts.root.scale.set(scale, scale, scale);
  }
}
