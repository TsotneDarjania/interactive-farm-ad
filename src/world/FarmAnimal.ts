import * as THREE from "three";
import { gsap } from "gsap";
import { ProgressFill } from "./ProgressFill";
import { Howl } from "howler";
import type { SpawnSettings } from "../constants/spawnConfig";

// როუმინგის კონფიგი - აქ შეცვალე რაც გინდა
const ROAM_CONFIG = {
  radius: 3.0,          // არეალის რადიუსი
  speed: 2,           // სიარულის სიჩქარე
  minIdle: 1000,        // მინ. დასვენება (ms)
  maxIdle: 4000,        // მაქს. დასვენება (ms)
  hopHeight: 0.3,       // chicken-ის ხტომის სიმაღლე
  hopDuration: 0.3,     // ხტომის დრო
};

export class FarmAnimal {
  public id: string;
  public type: string;
  public wrapper: THREE.Group;
  public progressFill: ProgressFill;
  public reward: number;

  private anchorPoint: THREE.Vector3;
  private walkTween: gsap.core.Tween | null = null;
  private rotateTween: gsap.core.Tween | null = null;
  private hopTween: gsap.core.Tween | null = null;

  private animalSound: Howl;
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private animations: THREE.AnimationClip[] = [];

  // debug helpers
  private debugRing: THREE.Mesh | null = null;

  constructor(
    id: string,
    type: string,
    model: THREE.Group,
    position: THREE.Vector3,
    config: SpawnSettings,
    animations: THREE.AnimationClip[],
    reward: number,
  ) {
    this.id = id;
    this.type = type;
    this.reward = reward;

    this.wrapper = new THREE.Group();
    this.wrapper.position.copy(position);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const finalScale =
      (config.scale || 1) / (Math.max(size.x, size.y, size.z) || 1);

    model.scale.setScalar(finalScale);
    model.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;

    model.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    this.wrapper.add(model);

    if (config.animation) config.animation(this.wrapper);

    if (animations?.length) {
      this.animations = animations;
      this.mixer = new THREE.AnimationMixer(model);
      this.playAnim("Idle");
    }

    this.anchorPoint = this.wrapper.position.clone();
    this.progressFill = new ProgressFill(id, this.wrapper);

    this.animalSound = new Howl({
      src: [`sounds/${this.type}.wav`, `sounds/${this.type}.mp3`],
      volume: 0.5,
      preload: true,
      onend: () => setTimeout(() => this.playSound(), 1000),
      onloaderror: (_id, error) => {
        console.warn(`ხმა ვერ ჩაიტვირთა (${this.type}):`, error);
      },
    });

    this.playSound();

    setTimeout(() => this.startRoaming(), Math.random() * 2000);
  }

  private playAnim(name: string, crossfade: number = 0.3) {
    if (!this.mixer || !this.animations.length) return;

    const clip = THREE.AnimationClip.findByName(this.animations, name);
    if (!clip) return;

    const next = this.mixer.clipAction(clip);

    if (this.currentAction && this.currentAction !== next) {
      next.reset().play();
      this.currentAction.crossFadeTo(next, crossfade, true);
    } else {
      next.reset().play();
    }

    this.currentAction = next;
  }

  private playSound() {
    if (this.animalSound.state() === "loaded") {
      this.animalSound.play();
    } else {
      this.animalSound.once("load", () => this.animalSound.play());
    }
  }

  private getRandomPointInSquare(): { x: number; z: number } {
    // მართკუთხედში რანდომ წერტილი (წრე კი არა)
    const r = ROAM_CONFIG.radius;
    const x = this.anchorPoint.x + (Math.random() * 2 - 1) * r;
    const z = this.anchorPoint.z + (Math.random() * 2 - 1) * r;
    return { x, z };
  }

  private spawnDebugRing() {
    if (this.debugRing || !this.wrapper.parent) return;

    const r = ROAM_CONFIG.radius;
    // მართკუთხედის კონტური
    const points = [
      new THREE.Vector3(-r, 0, -r),
      new THREE.Vector3(r, 0, -r),
      new THREE.Vector3(r, 0, r),
      new THREE.Vector3(-r, 0, r),
      new THREE.Vector3(-r, 0, -r),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const box = new THREE.Line(geometry, material);
    box.position.copy(this.anchorPoint);
    box.position.y = 0.05;
    box.name = `roam_debug_${this.id}`;
    this.wrapper.parent.add(box);
    this.debugRing = box as unknown as THREE.Mesh;
  }

  private startRoaming() {
    this.spawnDebugRing();

    const { x: targetX, z: targetZ } = this.getRandomPointInSquare();

    const dx = targetX - this.wrapper.position.x;
    const dz = targetZ - this.wrapper.position.z;
    const targetAngle = Math.atan2(dx, dz);

    // DEBUG: სამიზნე წერტილი
    if (this.wrapper.parent) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.06),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      dot.position.set(targetX, 0.1, targetZ);
      this.wrapper.parent.add(dot);
      setTimeout(() => this.wrapper.parent?.remove(dot), 5000);
    }

    console.log(
      `[${this.type}] → (${targetX.toFixed(2)}, ${targetZ.toFixed(2)}) | anchor: (${this.anchorPoint.x.toFixed(2)}, ${this.anchorPoint.z.toFixed(2)})`,
    );

    if (this.rotateTween) this.rotateTween.kill();
    this.rotateTween = gsap.to(this.wrapper.rotation, {
      y: targetAngle,
      duration: 0.5,
      ease: "power2.out",
    });

    const targetPos = new THREE.Vector3(targetX, this.wrapper.position.y, targetZ);
    const distance = this.wrapper.position.distanceTo(targetPos);
    let duration = distance / ROAM_CONFIG.speed;

    if (this.type === "chicken") {
      const { hopDuration } = ROAM_CONFIG;
      const hopCycle = hopDuration * 2;
      const numHops = Math.max(1, Math.round(duration / hopCycle));
      duration = numHops * hopCycle;
      this.startHopping(numHops, hopDuration);
    }

    this.playAnim("Run");

    if (this.walkTween) this.walkTween.kill();
    this.walkTween = gsap.to(this.wrapper.position, {
      x: targetX,
      z: targetZ,
      duration,
      ease: "none",
      onComplete: () => {
        if (this.hopTween) this.hopTween.kill();
        this.wrapper.position.y = this.anchorPoint.y;
        this.playAnim("Idle");

        const idleTime =
          ROAM_CONFIG.minIdle +
          Math.random() * (ROAM_CONFIG.maxIdle - ROAM_CONFIG.minIdle);

        setTimeout(() => this.startRoaming(), idleTime);
      },
    });
  }

  private startHopping(numHops: number, hopDuration: number) {
    if (this.hopTween) this.hopTween.kill();

    this.hopTween = gsap.to(this.wrapper.position, {
      y: this.anchorPoint.y + ROAM_CONFIG.hopHeight,
      duration: hopDuration,
      yoyo: true,
      repeat: numHops * 2 - 1,
      ease: "sine.inOut",
    });
  }

  public updateMixer(delta: number) {
    this.mixer?.update(delta);
  }

  public getUIData(camera: THREE.Camera, width: number, height: number) {
    const pos2D = this.progressFill.get2DPosition(camera, width, height);

    if (pos2D) {
      return {
        id: this.id,
        x: pos2D.x,
        y: pos2D.y,
        progress: this.progressFill.progress,
        isReady: this.progressFill.isReady,
        reward: this.reward,
      };
    }
    return null;
  }
}