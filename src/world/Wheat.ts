import * as THREE from "three";
import { gsap } from "gsap";
import { ProgressFill } from "./ProgressFill";
import { ObjectType } from "../constants/types";

export class Wheat {
  public id: string;
  public mesh: THREE.Group;
  public progressFill: ProgressFill;
  public reward: number;

  private scene: THREE.Scene;
  private position: THREE.Vector3;

  constructor(scene: THREE.Scene, position: THREE.Vector3, rewardAmount: number = 25) {
    this.scene = scene;
    this.position = position;
    this.reward = rewardAmount;

    this.id = `wheat_${Date.now()}_${Math.random()}`;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    this.progressFill = new ProgressFill(this.id, this.mesh);
  }

  public spawn(model: THREE.Group) {
    this.mesh.add(model);

    model.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    // === 🌬️ ბუნებრივი ქარის ანიმაცია (Swaying) ===
    
    // რანდომიზაცია თითოეული ხორბლისთვის
    const randomSpeed = 0.8 + Math.random() * 0.4;
    const randomAngleX = 0.05 + Math.random() * 0.05;
    const randomAngleZ = 0.1 + Math.random() * 0.1;

    // 1. რხევა გვერდებზე (Z ღერძი)
    gsap.to(model.rotation, {
      z: randomAngleZ,
      duration: 2 * randomSpeed,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: Math.random()
    });

    // 2. რხევა წინ და უკან (X ღერძი)
    // დრო (duration) ოდნავ განსხვავებულია, რომ წრეზე იტრიალოს და არა ხაზზე
    gsap.to(model.rotation, {
      x: randomAngleX,
      duration: 1.3 * randomSpeed,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: Math.random()
    });

    // 3. პატარა "სუნთქვის" ეფექტი (Scale)
    // ქარი როცა აწვება, მცენარე ოდნავ იკუმშება
    gsap.to(model.scale, {
      y: model.scale.y * 0.98,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    return this;
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