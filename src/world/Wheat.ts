import * as THREE from "three";
import { gsap } from "gsap";
import { ProgressFill } from "./ProgressFill";
import { Waypoint } from "./WayPoint";
import { assetCache } from "../core/ModelLoader";
import { SpawnConfig, DefaultConfig } from "../constants/spawnConfig";
import { globalEvents } from "../core/EventBus";

export class Wheat {
  public id: string;
  public mesh: THREE.Group;
  public progressFill: ProgressFill;
  public reward: number;

  private scene: THREE.Scene;
  private position: THREE.Vector3;
  private scytheSprite: THREE.Sprite | null = null;
  private scytheTween: gsap.core.Tween | null = null;
  private waypoint: Waypoint;
  private isHarvesting = false;
  private loopTimeout: any = null;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    rewardAmount: number = 25,
  ) {
    this.scene = scene;
    this.position = position;
    this.reward = rewardAmount;
    this.id = "wheat_harvest";

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    this.progressFill = new ProgressFill(this.id, this.mesh);

    const waypointOffset = new THREE.Vector3(0, 0.3, 4);
    const waypointPos = this.position.clone().add(waypointOffset);
    this.waypoint = new Waypoint(this.scene, waypointPos);

    // !!! მთავარი კავშირი - ვასწავლით Waypoint-ს რა ქნას დაჭერისას !!!
    this.waypoint.onClick = () => {
      this.handleInteraction();
    };

    // ხორბალზე დაჭერაც რომ მუშაობდეს
    this.mesh.userData.parentEntity = this;

    this.setupModel();
    this.showWaypoint();
  }

  private setupModel() {
    const config = SpawnConfig["wheat"] || DefaultConfig;
    const { scene: wheatModel } = assetCache.getModel("wheat");

    const box = new THREE.Box3().setFromObject(wheatModel);
    const size = box.getSize(new THREE.Vector3());
    const finalScale = (config.scale || 1) / (Math.max(size.x, size.y, size.z) || 1);

    wheatModel.scale.setScalar(finalScale);
    wheatModel.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;

    this.generatePatch(wheatModel);

    if (config.animation) {
      config.animation(this.mesh);
    }
  }

  private generatePatch(originalModel: THREE.Group) {
    const rows = 5;
    const cols = 7;
    const spacing = 0.7;
    const jitter = 0.2;
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stalk = originalModel.clone();
        const x = c * spacing - offsetX + (Math.random() - 0.5) * jitter;
        const z = r * spacing - offsetZ + (Math.random() - 0.5) * jitter;

        stalk.position.set(x, 0, z);
        stalk.rotation.y = Math.random() * Math.PI;
        stalk.scale.multiplyScalar(0.8 + Math.random() * 0.4);

        // თითოეულ ღეროსაც ვაბამთ, რომ მასზე დაჭერამაც იმუშაოს
        stalk.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
             child.userData.parentEntity = this;
          }
        });

        this.mesh.add(stalk);
        this.applySwayAnimation(stalk);
      }
    }
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

  public handleInteraction() {
    globalEvents.emit("wheat-clicked", { id: this.id });
  }

  public showWaypoint() {
    this.waypoint.show();
  }

  public hideWaypoint() {
    this.waypoint.hide();
  }

  public startWorkingProcess() {
    if (this.isHarvesting) return;
    this.isHarvesting = true;

    if (!this.scytheSprite) {
      const map = assetCache.getTexture("scythe");
      this.scytheSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map, transparent: true }),
      );
      this.scytheSprite.scale.set(1.5, 1.5, 1);
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
        ease: "power1.inOut",
      });
    } else {
      this.scytheTween.restart();
    }

    if (this.progressFill) {
      this.progressFill.startProgress(() => {
        globalEvents.emit("wheat-step-completed", {
          id: this.id,
          reward: this.reward,
          status: "step_done",
          sourceEntity: this 
        });

        this.isHarvesting = false;

        this.loopTimeout = setTimeout(() => {
          this.startWorkingProcess();
        }, 350);
      });
    }
  }

  public stopWorking() {
    this.isHarvesting = false;
    
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    this.hideScythe();
    if (this.progressFill) {
      this.progressFill.progress = 0;
      this.progressFill.isReady = false;
    }
  }

  public hideScythe() {
    this.isHarvesting = false;
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

  public update(camera: THREE.Camera) {
    if (this.progressFill) {
      this.progressFill.updateLookAt(camera);
    }
  }
}