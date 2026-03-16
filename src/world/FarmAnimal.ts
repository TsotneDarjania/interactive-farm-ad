import * as THREE from "three";
import { gsap } from "gsap";
import { ProgressFill } from "./ProgressFill";
import { Howl } from "howler";

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
  private roamRadius: number = 1.0;

  private animalSound: Howl;

  constructor(id: string, type: string, wrapper: THREE.Group, reward: number) {
    this.id = id;
    this.type = type;
    this.wrapper = wrapper;
    this.reward = reward;

    this.progressFill = new ProgressFill(id, wrapper);
    this.anchorPoint = wrapper.position.clone();

    this.animalSound = new Howl({
      src: [`sounds/${this.type}.wav`, `sounds/${this.type}.mp3`],
      volume: 0.5,
      preload: true,
      onend: () => {
        setTimeout(() => this.playSound(), 1000);
      },
      onloaderror: (_id, error) => {
        console.warn(`ხმა ვერ ჩაიტვირთა (${this.type}):`, error);
      },
    });

    this.playSound();

    setTimeout(() => {
      this.startRoaming();
    }, Math.random() * 2000);
  }

  private playSound() {
    if (this.animalSound.state() === "loaded") {
      this.animalSound.play();
    } else {
      this.animalSound.once("load", () => this.animalSound.play());
    }
  }

  private startRoaming() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.roamRadius;

    const targetX = this.anchorPoint.x + Math.cos(angle) * dist;
    const targetZ = this.anchorPoint.z + Math.sin(angle) * dist;

    const dx = targetX - this.wrapper.position.x;
    const dz = targetZ - this.wrapper.position.z;

    const targetAngle = Math.atan2(dx, dz);

    if (this.rotateTween) this.rotateTween.kill();
    this.rotateTween = gsap.to(this.wrapper.rotation, {
      y: targetAngle,
      duration: 0.5,
      ease: "power2.out",
    });

    const targetPos = new THREE.Vector3(
      targetX,
      this.wrapper.position.y,
      targetZ,
    );
    const distance = this.wrapper.position.distanceTo(targetPos);
    const speed = 0.4;
    let duration = distance / speed;

    if (this.type === "chicken") {
      const hopDuration = 0.3;
      const hopCycle = hopDuration * 2;
      const numHops = Math.max(1, Math.round(duration / hopCycle));

      duration = numHops * hopCycle;
      this.startHopping(numHops, hopDuration);
    }

    if (this.walkTween) this.walkTween.kill();
    this.walkTween = gsap.to(this.wrapper.position, {
      x: targetX,
      z: targetZ,
      duration: duration,
      ease: "none",
      onComplete: () => {
        if (this.hopTween) this.hopTween.kill();
        this.wrapper.position.y = this.anchorPoint.y;

        const idleTime = 1500 + Math.random() * 3000;
        setTimeout(() => {
          this.startRoaming();
        }, idleTime);
      },
    });
  }

  private startHopping(numHops: number, hopDuration: number) {
    if (this.hopTween) this.hopTween.kill();

    this.hopTween = gsap.to(this.wrapper.position, {
      y: this.anchorPoint.y + 0.3,
      duration: hopDuration,
      yoyo: true,
      repeat: numHops * 2 - 1,
      ease: "sine.inOut",
    });
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
