import * as THREE from "three";
import { Waypoint } from "./WayPoint";
import { assetCache } from "../core/ModelLoader";
import { SpawnConfig, DefaultConfig } from "../constants/spawnConfig";
import { ObjectType } from "../constants/types";
import { globalEvents } from "../core/EventBus";

export class Fence {
  public id: string;
  public mesh: THREE.Group;
  private scene: THREE.Scene;
  private position: THREE.Vector3;
  private waypoint: Waypoint;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.position = position;
    this.id = ObjectType.FENCE; // "fence"

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // 1. ვეიპოინტი ღობისთვის (მაგალითად, ოდნავ წინ დავსვათ)
    const waypointOffset = new THREE.Vector3(6, -0.7, 1);
    const waypointPos = this.position.clone().add(waypointOffset);
    this.waypoint = new Waypoint(this.scene, waypointPos);

    // !!! შეცვლილია: ვაკავშირებთ Waypoint-ის კლიკს ღობის კლიკთან !!!
    this.waypoint.onClick = () => {
      this.handleInteraction();
    };

    // 2. მოდელის აწყობა
    this.setupModel();

    // ვაჩენთ ისარს
    // this.showWaypoint();
  }

  private setupModel() {
    const config = SpawnConfig[ObjectType.FENCE] || DefaultConfig;
    const { scene: model } = assetCache.getModel("fence");

    // ავტომატური სკეილინგი
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const finalScale = (config.scale || 1) / (Math.max(size.x, size.y, size.z) || 1);

    model.scale.setScalar(finalScale);
    model.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;

    this.mesh.add(model);

    // ჩრდილები და Raycaster-ისთვის parentEntity-ის მიბმა
    model.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        
        // !!! დამატებულია: ღობეზე პირდაპირ დაჭერამაც რომ იმუშაოს !!!
        c.userData.parentEntity = this; 
      }
    });

    // სპავნ ანიმაცია კონფიგიდან
    if (config.animation) {
      config.animation(this.mesh);
    }
  }

  public handleInteraction() {
    console.log("🪵 ღობეზე კლიკი - ვყიდულობთ!");
    globalEvents.emit("fance-clicked", { id: this.id });
  }

  public showWaypoint() { this.waypoint.show(); }
  public hideWaypoint() { this.waypoint.hide(); }

  public destroy() {
    this.waypoint.destroy();
    this.scene.remove(this.mesh);
  }
}