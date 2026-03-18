import * as THREE from "three";
import { gsap } from "gsap";
import { assetCache } from "../core/ModelLoader"; 

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
  public isMoving: boolean = false; 

  constructor(scene: THREE.Scene) {
    const { scene: model, animations } = assetCache.getModel("farmer");
    
    this.mesh = model;
    this.mesh.visible = true;
    
    this.mesh.scale.set(1.2, 1.2, 1.2);
    this.mesh.position.set(-1, 4.2, 15);
    this.mesh.rotation.y = 0

    this.mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    scene.add(this.mesh);

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

  public moveToViewpoint(targetPos: THREE.Vector3, targetRotation: number): Promise<void> {
    return new Promise((resolve) => {
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
          this.playAnimation("Idle");
          
          gsap.to(this.mesh.rotation, {
            y: targetRotation,
            duration: 0.5,
            onComplete: () => {
              resolve(); 
            }
          });
        }
      });
    });
  }

  public update(delta: number) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}