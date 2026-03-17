import * as THREE from "three";
import { gsap } from "gsap";
import { globalEvents } from "../core/EventBus"; // დაგვჭირდება ივენთის გასასროლად

export type FarmerAnimation = 
  | "Death" | "Duck" | "HitReact" | "Idle" 
  | "Idle_Attack" | "Idle_Hold" | "Jump" | "Jump_Idle" 
  | "Jump_Land" | "No" | "Punch" | "Run" 
  | "Run_Attack" | "Run_Hold" | "Walk" 
  | "Walk_Hold" | "Wave" | "Yes";

export class Farmer {
  public mesh: THREE.Group;
  private mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  public isMoving: boolean = false; // public გავხადე, რომ გარედან წავიკითხოთ

  constructor(model: THREE.Group, animations: THREE.AnimationClip[], scale: number = 0.5) {
    this.mesh = model;
    this.mesh.visible = true;
    this.mesh.scale.set(scale, scale, scale);
    this.mesh.rotation.y = 0

    this.mixer = new THREE.AnimationMixer(this.mesh);

    animations.forEach((anim) => {
      this.actions.set(anim.name, this.mixer.clipAction(anim));
    });

    

    this.playAnimation("Idle", 0);
  }

  public waveHello() {
    this.playAnimation("Wave");
    setTimeout(() => {
      if (!this.isMoving) this.playAnimation("Idle");
    }, 1500); 
  }

  public playAnimation(animName: FarmerAnimation, fadeDuration: number = 0.2) {
    const newAction = this.actions.get(animName);
    if (newAction && newAction !== this.currentAction) {
      if (this.currentAction) {
        this.currentAction.fadeOut(fadeDuration);
      }
      newAction.reset().fadeIn(fadeDuration).play();
      this.currentAction = newAction;
    }
  }

  public moveTo(targetPos: THREE.Vector3) {
    this.isMoving = true;
    const lookPos = new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z);
    this.mesh.lookAt(lookPos);
    this.playAnimation("Run");

    const distance = this.mesh.position.distanceTo(lookPos);
    const speed = 12;
    const duration = distance / speed;

    gsap.to(this.mesh.position, {
      x: targetPos.x,
      z: targetPos.z,
      duration: duration,
      ease: "none",
      onComplete: () => {
        this.isMoving = false;
        this.playAnimation("Yes");
        setTimeout(() => {
          if (!this.isMoving) this.playAnimation("Idle");
        }, 1000);
      }
    });
  }

  // === ახალი: გაქცევა ვეიპოინტთან და ივენთის გასროლა ===
  public moveToViewpoint(targetPos: THREE.Vector3, targetRotation: number, eventName: string) {
    this.isMoving = true;
    const lookPos = new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z);
    this.mesh.lookAt(lookPos);
    this.playAnimation("Run"); // სირბილი

    const distance = this.mesh.position.distanceTo(lookPos);
    const speed = 12;
    const duration = distance / speed;

    gsap.to(this.mesh.position, {
      x: targetPos.x,
      z: targetPos.z,
      duration: duration,
      ease: "none",
      onComplete: () => {
        this.isMoving = false;
        this.playAnimation("Idle");
        
        // 1. მირბენის მერე ვტრიალდებით სასურველ მხარეს
        gsap.to(this.mesh.rotation, {
          y: targetRotation,
          duration: 0.5,
          onComplete: () => {
            // 2. ვისვრით ივენთს, რომ მივედით!
            globalEvents.emit(eventName);
          }
        });
      }
    });
  }

  public update(delta: number) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}