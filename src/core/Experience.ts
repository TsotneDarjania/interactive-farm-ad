import * as THREE from "three";
import { EventEmitter } from "pixi.js";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { ASSET_PATHS, TEXTURE_PATHS } from "../constants/assets";
import { PenManager } from "../world/PenManager";
import { DefaultConfig, SpawnConfig } from "../constants/spawnConfig";
import { FarmAnimal } from "../world/FarmAnimal";
import { globalEvents } from "./EventBus";
import { Farmer } from "../world/Farmer";
import { Wheat } from "../world/Wheat";
import { AnimaProgressFill } from "../world/animalProgressFill";

// მენეჯერები
import { assetCache } from "./ModelLoader"; 
import { CameraManager } from "./CameraManager";
import { Environment } from "../world/Environemnt";
import { ParticleSystem } from "../world/ParticalSystem";
import { Fence } from "../world/Fance";

export class Experience {
  public events = new EventEmitter();

  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;

  private cameraManager!: CameraManager;
  private environment!: Environment;
  private particleSystem!: ParticleSystem;
  private penManager = new PenManager();

  private clock = new THREE.Clock();
  public farmItems: FarmAnimal[] = [];
  private farmer: Farmer | null = null;
  private raycaster = new THREE.Raycaster();

  public fence!: Fence;
  public wheat!: Wheat;

  public camera!: THREE.Camera;

  constructor(threeCanvas: HTMLCanvasElement, pixiCanvas: HTMLCanvasElement) {
    this.init(threeCanvas, pixiCanvas);
  }

  private async init(
    threeCanvas: HTMLCanvasElement,
    pixiCanvas: HTMLCanvasElement,
  ) {
    this.scene = new THREE.Scene();

    this.cameraManager = new CameraManager(pixiCanvas);
    this.camera = this.cameraManager.camera;
    this.environment = new Environment(this.scene); 
    this.particleSystem = new ParticleSystem(this.scene);

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

    try {
      await assetCache.preloadAllModels(ASSET_PATHS);
      await assetCache.preloadAllTextures(TEXTURE_PATHS);

      this.environment.loadGround();
      this.loadFarmer();
      this.spawnWheat();
      this.spawnFence();

      this.startCinematicIntro();
    } catch (e) {
      console.error(e);
    }

    this.animate();
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    window.addEventListener("pointermove", (e) => this.onPointerMove(e));
  }

  public spawnFence() {
    const config = SpawnConfig[ObjectType.FENCE] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    this.fence = new Fence(this.scene, targetPos);
  }

  private loadFarmer() {
    this.farmer = new Farmer(this.scene);
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

  public spawnWheat() {
    const config = SpawnConfig["wheat"] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    this.wheat = new Wheat(this.scene, targetPos, 25);
  }

  public spawnAnimal(objectName: string) {
    const config = SpawnConfig[objectName] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    const { scene: model, animations } = assetCache.getModel(objectName); 

    this.particleSystem.createDustParticles(targetPos)

    if (objectName !== ObjectType.FENCE) {
      const itemData = UI_ITEMS.find((i) => i.id === objectName);
      const newItem = new FarmAnimal(
        `anim_${Date.now()}`,
        objectName,
        model,
        targetPos,
        config,
        animations, 
        itemData?.price || 25,
      );
      this.scene.add(newItem.wrapper);
      this.farmItems.push(newItem);
    }
  }

  public async focusOnObject(objectId: string) {
    const config = SpawnConfig[objectId];
    if (!config) return;

    if (config.cameraPos && config.cameraTarget) {
      this.cameraManager.moveToViewpoint(config.cameraPos, config.cameraTarget);
    }

    if (config.farmerStandPoint && this.farmer) {
      await this.farmer.moveToViewpoint(
        config.farmerStandPoint,
        config.farmerRotation || 0,
      );
    }
  }

  public startWheatWorking() {
    this.wheat.startWorkingProcess();
  }

  public stopWheatScytheWorking() {
    this.wheat.stopWorking();
  }

  public resetItemProgress(id: string) {
    const item = this.farmItems.find((i) => i.id === id);
    if (item && item instanceof FarmAnimal) {
       item.startProducing(); 
    }
  }

  public hasSpaceFor(objectName: string): boolean {
    return this.penManager.hasSpace(objectName);
  }

  public moveCameraToPlayPosition() {
    this.cameraManager.moveCameraToPlayPosition();
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
      if (item instanceof FarmAnimal) {
        item.update(delta, this.cameraManager.camera); 
      }

      if ("update" in item && typeof (item as any).update === "function" && !(item instanceof FarmAnimal)) {
        (item as any).update(this.cameraManager.camera);
      }
    });

    this.wheat.update(this.cameraManager.camera);
    
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.cameraManager || !this.scene) return;

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );

    this.raycaster.setFromCamera(mouse, this.cameraManager.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    if (intersects.length > 0) {
      const firstHit = intersects[0].object;

      if (firstHit.userData && firstHit.userData.isCoin) {
        const progressFillClass = firstHit.userData.parentFill as AnimaProgressFill;
        
        if (progressFillClass && progressFillClass.isCoinReady) {
            progressFillClass.collectCoin(this.cameraManager.camera);
        }
      }
    }
  }

  private onPointerDown(event: PointerEvent) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );

    this.raycaster.setFromCamera(mouse, this.cameraManager.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;

      while (current) {
        if (current.userData.parentEntity) {
          current.userData.parentEntity.handleInteraction();
          return;
        }
        current = current.parent;
      }
    }
  }
}