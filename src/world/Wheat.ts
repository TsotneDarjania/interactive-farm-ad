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

  constructor(scene: THREE.Scene, position: THREE.Vector3, rewardAmount: number = 25) {
    this.scene = scene;
    this.position = position;
    this.reward = rewardAmount;

    // ფიქსირებული ID ტუტორიალისთვის! 
    this.id = "wheat_harvest";
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // 3D ბარი შეიქმნება, მაგრამ დამალული იქნება
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
        const randomScale = 0.8 + Math.random() * 0.4;
        stalk.scale.multiplyScalar(randomScale);

        this.mesh.add(stalk);
        this.applySwayAnimation(stalk);
      }
    }

    this.mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    return this;
  }

  private applySwayAnimation(stalk: THREE.Object3D) {
    const randomSpeed = 0.8 + Math.random() * 0.5;
    const randomDelay = Math.random() * 2;

    gsap.to(stalk.rotation, {
      z: 0.1 + Math.random() * 0.05,
      x: 0.05 + Math.random() * 0.05,
      duration: 1.5 * randomSpeed,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: randomDelay,
    });
  }

  public showScythe() {
    if (!this.scytheSprite) {
      const textureLoader = new THREE.TextureLoader();
      const map = textureLoader.load("/icons/scythe.png"); 
      
      const material = new THREE.SpriteMaterial({ 
        map: map, 
        transparent: true 
      });
      
      this.scytheSprite = new THREE.Sprite(material);
      this.scytheSprite.scale.set(1.5, 1.5, 1);
      this.scytheSprite.rotation.set(Math.PI, 0, 0);
      this.scytheSprite.position.set(0, 3, 0); 
      this.mesh.add(this.scytheSprite);
    }

    this.scytheSprite.visible = true;

    if (!this.scytheTween) {
      this.scytheTween = gsap.to(this.scytheSprite.material, {
        rotation: -0.6, 
        duration: 0.3,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut"
      });
    } else {
      this.scytheTween.restart();
    }

    // === ვიწყებთ 3D ბარის შევსებას ===
    if (this.progressFill) {
        this.progressFill.startProgress();
    }
  }

  public hideScythe() {
    if (this.scytheSprite) {
      this.scytheSprite.visible = false;
    }
    if (this.scytheTween) {
      this.scytheTween.pause();
    }
    if (this.progressFill) {
        this.progressFill.hide();
    }
  }
  
  // === კამერაზე მიბრუნება ===
  public update(camera: THREE.Camera) {
      if (this.progressFill) {
          this.progressFill.updateLookAt(camera);
      }
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