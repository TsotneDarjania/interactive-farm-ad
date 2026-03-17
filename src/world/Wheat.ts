import * as THREE from "three";
import { gsap } from "gsap";
import { ProgressFill } from "./ProgressFill";

export class Wheat {
  public id: string;
  public mesh: THREE.Group;
  public progressFill: ProgressFill;
  public reward: number;

  private scene: THREE.Scene;
  private position: THREE.Vector3;
  private scytheSprite: THREE.Sprite | null = null;
  private scytheTween: gsap.core.Tween | null = null;
  
  // ახალი ფლაგი, რომ პროცესი არ გაიჭედოს
  private isHarvesting = false;

  constructor(scene: THREE.Scene, position: THREE.Vector3, rewardAmount: number = 25) {
    this.scene = scene;
    this.position = position;
    this.reward = rewardAmount;
    this.id = "wheat_harvest";
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
    this.progressFill = new ProgressFill(this.id, this.mesh);
  }

  public spawn(originalModel: THREE.Group) {
    const rows = 5; 
    const cols = 7; 
    const spacing = 0.7; 
    const jitter = 0.2; 
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stalk = originalModel.clone();
        const x = (c * spacing - offsetX) + (Math.random() - 0.5) * jitter;
        const z = (r * spacing - offsetZ) + (Math.random() - 0.5) * jitter;
        stalk.position.set(x, 0, z);
        stalk.rotation.y = Math.random() * Math.PI;
        stalk.scale.multiplyScalar(0.8 + Math.random() * 0.4);
        this.mesh.add(stalk);
        this.applySwayAnimation(stalk);
      }
    }
    return this;
  }

  private applySwayAnimation(stalk: THREE.Object3D) {
    gsap.to(stalk.rotation, {
      z: 0.1 + Math.random() * 0.05,
      x: 0.05 + Math.random() * 0.05,
      duration: 1.5 * (0.8 + Math.random() * 0.5),
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: Math.random() * 2,
    });
  }

  public showScythe() {
    if (this.isHarvesting) return;
    this.isHarvesting = true;

    if (!this.scytheSprite) {
      const map = new THREE.TextureLoader().load("/icons/scythe.png"); 
      this.scytheSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true }));
      this.scytheSprite.scale.set(1.5, 1.5, 1);
      this.scytheSprite.position.set(0, 3, 0); 
      this.mesh.add(this.scytheSprite);
    }

    this.scytheSprite.visible = true;
    if (!this.scytheTween) {
      this.scytheTween = gsap.to(this.scytheSprite.material, {
        rotation: -0.6, duration: 0.3, yoyo: true, repeat: -1, ease: "power1.inOut"
      });
    } else {
      this.scytheTween.restart();
    }

    if (this.progressFill) this.progressFill.startProgress();
  }

  // === მეთოდი, რომელიც ყველაფერს აჩერებს და ასუფთავებს ===
  public resetHarvest() {
    this.isHarvesting = false;
    this.hideScythe();
    if (this.progressFill) {
      this.progressFill.progress = 0;
      this.progressFill.isReady = false;
    }
  }

  public hideScythe() {
    this.isHarvesting = false;
    if (this.scytheSprite) this.scytheSprite.visible = false;
    if (this.scytheTween) this.scytheTween.pause();
    if (this.progressFill) this.progressFill.hide();
  }
  
  public update(camera: THREE.Camera) {
    if (this.progressFill) this.progressFill.updateLookAt(camera);
  }

  public getUIData(camera: THREE.Camera, width: number, height: number) {
    const pos2D = this.progressFill.get2DPosition(camera, width, height);
    if (pos2D) {
      return { id: this.id, x: pos2D.x, y: pos2D.y, progress: this.progressFill.progress, isReady: this.progressFill.isReady, reward: this.reward };
    }
    return null;
  }
}