import * as THREE from "three";
import { gsap } from "gsap";

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
  private isMoving: boolean = false;

  constructor(model: THREE.Group, animations: THREE.AnimationClip[], scale: number = 0.5) {
    this.mesh = model;
    
    // თავიდანვე ჩანს
    this.mesh.visible = true;
    this.mesh.scale.set(scale, scale, scale);
    
    // საწყისი მობრუნება
    this.mesh.rotation.y = Math.PI;

    this.mixer = new THREE.AnimationMixer(this.mesh);

    animations.forEach((anim) => {
      this.actions.set(anim.name, this.mixer.clipAction(anim));
    });

    // ეგრევე რთავს Idle ანიმაციას
    this.playAnimation("Idle", 0);
  }

  // ინტროს მერე უბრალოდ ხელს დაგვიქნევს
  public waveHello() {
    this.playAnimation("Wave");
    setTimeout(() => {
      if (!this.isMoving) this.playAnimation("Idle");
    }, 1500); 
  }

  // ანიმაციის რბილი გადართვა (Crossfade)
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

  // დანიშნულების ადგილზე მისვლა
  public moveTo(targetPos: THREE.Vector3) {
    this.isMoving = true;

    // 1. მიტრიალდეს სამიზნისკენ 
    const lookPos = new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z);
    this.mesh.lookAt(lookPos);

    // 2. ჩაირთოს სირბილი
    this.playAnimation("Run");

    // 3. გამოვთვალოთ დრო (რაც უფრო შორსაა, მით მეტი დრო უნდა)
    const distance = this.mesh.position.distanceTo(lookPos);
    const speed = 12; // სიჩქარე
    const duration = distance / speed;

    // 4. გავუშვათ მოძრაობა
    gsap.to(this.mesh.position, {
      x: targetPos.x,
      z: targetPos.z,
      duration: duration,
      ease: "none",
      onComplete: () => {
        this.isMoving = false;
        // როცა მივა, "კი"-ს ნიშნად თავი დაუქნიოს
        this.playAnimation("Yes");
        
        // 1 წამის მერე ისევ შეჩერდეს (Idle)
        setTimeout(() => {
          if (!this.isMoving) this.playAnimation("Idle");
        }, 1000);
      }
    });
  }

  public update(delta: number) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}