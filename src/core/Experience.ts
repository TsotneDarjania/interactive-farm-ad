import * as THREE from "three";
import { EventEmitter } from "pixi.js";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { ASSET_PATHS } from "../constants/assets"; // <--- დარწმუნდი რომ დაიმპორტდა
import { PenManager } from "../world/PenManager";
import { DefaultConfig, SpawnConfig } from "../constants/spawnConfig";
import { FarmAnimal } from "../world/FarmAnimal";
import { globalEvents } from "./EventBus";
import { Farmer } from "../world/Farmer";
import { Wheat } from "../world/Wheat";
import { TutorialPositions } from "../constants/tutorialPositions";

// მენეჯერები
import { ModelLoader } from "./ModelLoader";
import { CameraManager } from "./CameraManager";
import { Environment } from "../world/Environemnt";
import { ParticleSystem } from "../world/ParticalSystem";
import { Waypoint } from "../world/WayPoint";

type FarmItem = FarmAnimal | Wheat;

export class Experience {
  public events = new EventEmitter();

  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;

  // მენეჯერები
  private modelLoader!: ModelLoader;
  private cameraManager!: CameraManager;
  private environment!: Environment;
  private particleSystem!: ParticleSystem;
  private penManager = new PenManager();

  private clock = new THREE.Clock();
  private farmItems: FarmItem[] = [];
  private farmer: Farmer | null = null;
  private waypoint: Waypoint | null = null;

  constructor(threeCanvas: HTMLCanvasElement, pixiCanvas: HTMLCanvasElement) {
    this.init(threeCanvas, pixiCanvas);
  }

  public moveFarmerToAnotherPoint(objectName: string) {
    const config = SpawnConfig[objectName] || DefaultConfig;
    this.farmer!.moveTo(config.farmerStandPoint!);
  }

  private async init(
    threeCanvas: HTMLCanvasElement,
    pixiCanvas: HTMLCanvasElement,
  ) {
    this.scene = new THREE.Scene();

    // მენეჯერების ინიციალიზაცია
    this.modelLoader = new ModelLoader();
    this.cameraManager = new CameraManager(pixiCanvas);
    this.environment = new Environment(this.scene, this.modelLoader);
    this.particleSystem = new ParticleSystem(this.scene);

    // Renderer-ის კონფიგურაცია
    this.renderer = new THREE.WebGLRenderer({
      canvas: threeCanvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // საწყისი ობიექტების შექმნა
    this.spawnWheat();
    this.spawnWaypoint();

    try {
      await this.environment.loadGround();
      await this.loadFarmer();
      this.startCinematicIntro();
    } catch (e) {
      console.error(e);
    }

    this.animate();
    window.addEventListener("resize", () => this.onResize());
  }

  private async loadFarmer() {
    // ვიყენებთ ASSET_PATHS-ს
    const { scene, animations } = await this.modelLoader.loadModel(
      ASSET_PATHS.farmer,
    );
    this.farmer = new Farmer(scene, animations, 1.2);
    this.farmer.mesh.position.set(-1, 4.2, 15);
    this.farmer.mesh.rotation.y = Math.PI;

    this.farmer.mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    this.scene.add(this.farmer.mesh);
  }

  private startCinematicIntro() {
    if (!this.environment.ground) return;

    const box = new THREE.Box3().setFromObject(this.environment.ground);
    const center = box.getCenter(new THREE.Vector3());

    this.cameraManager.startCinematicIntro(center, () => {
      globalEvents.emit("intro-complete");
      if (this.farmer) {
        this.farmer.waveHello();
      }
    });
  }

  private async spawnWaypoint() {
    const config = SpawnConfig["waypoint"] || DefaultConfig;
    const pos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    // ვიყენებთ ASSET_PATHS-ს
    const { scene } = await this.modelLoader.loadModel(ASSET_PATHS.waypoint);
    this.waypoint = new Waypoint(this.scene, pos);
    this.waypoint.spawn(scene, config.scale || 1);
    if (config.animation) config.animation(this.waypoint.mesh);
  }

  public async spawnWheat() {
    const config = SpawnConfig["wheat"] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    if (this.farmer && config.farmerStandPoint) {
      this.farmer.moveTo(config.farmerStandPoint);
    }

    // ვიყენებთ ASSET_PATHS-ს
    const { scene: model } = await this.modelLoader.loadModel(
      ASSET_PATHS.wheat,
    );

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const finalScale =
      (config.scale || 1) / (Math.max(size.x, size.y, size.z) || 1);

    model.scale.setScalar(finalScale);
    model.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;

    const wheatObj = new Wheat(this.scene, targetPos, 25);
    wheatObj.spawn(model);

    if (config.animation) config.animation(wheatObj.mesh);

    setTimeout(() => this.particleSystem.createDustParticles(targetPos), 400);

    this.farmItems.push(wheatObj);
  }

  public async spawnFromObjects(objectName: string) {
    const config = SpawnConfig[objectName] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    // ვიყენებთ ASSET_PATHS-ს დინამიურად
    const modelPath = ASSET_PATHS[objectName];
    if (!modelPath) {
      console.error(`Asset path not found for: ${objectName}`);
      return;
    }

    const wrapper = new THREE.Group();
    wrapper.position.copy(targetPos);
    this.scene.add(wrapper);

    const { scene: model } = await this.modelLoader.loadModel(modelPath);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const finalScale =
      (config.scale || 1) / (Math.max(size.x, size.y, size.z) || 1);

    model.scale.setScalar(finalScale);
    model.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;
    wrapper.add(model);

    wrapper.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    if (config.animation) config.animation(wrapper);

    setTimeout(() => this.particleSystem.createDustParticles(targetPos), 400);

    if (objectName !== ObjectType.FENCE) {
      const itemData = UI_ITEMS.find((i) => i.id === objectName);
      const newItem = new FarmAnimal(
        `anim_${Date.now()}`,
        objectName,
        wrapper,
        itemData?.price || 25,
      );
      this.farmItems.push(newItem);
    }
  }

  public movePlayerToViewpoint(pointKey: string, onCompleteEvent: string) {
    console.log("movePlayerToViewpoint");
    const config = TutorialPositions[pointKey];
    if (!config || !this.farmer) return;

    this.farmer.moveToViewpoint(
      config.playerPos,
      config.playerRotation,
      onCompleteEvent,
    );
    this.cameraManager.moveToViewpoint(config.cameraPos, config.cameraTarget);
  }

  public triggerWheatScythe() {
    const wheatItem = this.farmItems.find(
      (item) => item instanceof Wheat,
    ) as Wheat;
    if (wheatItem && typeof wheatItem.showScythe === "function") {
      wheatItem.showScythe();
    }
  }

  public stopWheatScythe() {
    const wheatItem = this.farmItems.find(
      (item) => item instanceof Wheat,
    ) as Wheat;
    if (wheatItem && typeof wheatItem.hideScythe === "function") {
      wheatItem.hideScythe();
    }
  }

  public resetItemProgress(id: string) {
    const item = this.farmItems.find((i) => i.id === id);
    if (item && item.progressFill) item.progressFill.startProgress();
  }

  public hasSpaceFor(objectName: string): boolean {
    return this.penManager.hasSpace(objectName);
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.cameraManager.resize(width, height);
    this.renderer.setSize(width, height);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    if (this.farmer) this.farmer.update(delta);
    this.cameraManager.update();

    this.farmItems.forEach((item) => {
      if ("update" in item && typeof (item as any).update === "function") {
        (item as any).update(this.cameraManager.camera);
      }
    });

    const uiData = this.farmItems
      .map((item) =>
        item.getUIData(
          this.cameraManager.camera,
          window.innerWidth,
          window.innerHeight,
        ),
      )
      .filter((d) => d !== null);

    globalEvents.emit("sync-world-ui", uiData);
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  public resetWheatHarvest() {
    const wheatItem = this.farmItems.find(
      (item) => item instanceof Wheat,
    ) as Wheat;

    if (wheatItem) {
      wheatItem.resetHarvest();
    }
  }
}
