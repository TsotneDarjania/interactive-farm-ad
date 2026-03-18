import * as THREE from "three";
import { EventEmitter } from "pixi.js";
import { gsap } from "gsap";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { ASSET_PATHS, TEXTURE_PATHS } from "../constants/assets";
import { DefaultConfig, SpawnConfig } from "../constants/spawnConfig";
import { FarmAnimal } from "../world/FarmAnimal";
import { globalEvents } from "./EventBus";
import { Farmer } from "../world/Farmer";
import { Wheat } from "../world/Wheat";
import { AnimaProgressFill } from "../world/animalProgressFill";
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
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();

  public farmItems: FarmAnimal[] = [];
  private farmer: Farmer | null = null;
  public fence!: Fence;
  public wheat!: Wheat;
  public camera!: THREE.Camera;

  private arrow: THREE.Group | null = null;
  private arrowTween: gsap.core.Tween | null = null;

  constructor(threeCanvas: HTMLCanvasElement) {
    this.init(threeCanvas);
  }

  private async init(threeCanvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.cameraManager = new CameraManager(); 
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
      this.createArrow(new THREE.Vector3(10.4, 9, -3));
      this.startCinematicIntro();
    } catch (e) {
      console.error(e);
    }

    this.animate();
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    window.addEventListener("pointermove", (e) => this.onPointerMove(e));
  }

  public createArrow(position: THREE.Vector3) {
    if (!this.arrow) {
      const { scene: model } = assetCache.getModel("arrow");
      this.arrow = model;
      this.arrow.scale.set(12, 12, 12);
      this.arrow.rotateZ(-Math.PI / 2);
      this.scene.add(this.arrow);
    }

    this.arrow.position.copy(position);
    this.arrow.visible = true;

    if (this.arrowTween) this.arrowTween.kill();

    this.arrowTween = gsap.to(this.arrow.position, {
      y: position.y + 1.5,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  public hideArrow() {
    if (!this.arrow) return;
    this.arrow.visible = false;
    this.arrowTween?.kill();
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
      this.farmer?.waveHello();
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

    this.particleSystem.createDustParticles(targetPos);

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
      await this.farmer.moveToViewpoint(config.farmerStandPoint, config.farmerRotation || 0);
    }
  }

  public startWheatWorking() { this.wheat.startWorkingProcess(); }
  public stopWheatScytheWorking() { this.wheat.stopWorking(); }

  public resetItemProgress(id: string) {
    const item = this.farmItems.find((i) => i.id === id);
    if (item instanceof FarmAnimal) item.startProducing();
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

    this.farmer?.update(delta);
    this.cameraManager.update();

    this.farmItems.forEach((item) => {
      if (item instanceof FarmAnimal) {
        item.update(delta, this.cameraManager.camera);
      } else if (typeof (item as any).update === "function") {
        (item as any).update(this.cameraManager.camera);
      }
    });

    this.wheat.update(this.cameraManager.camera);
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  private getIntersects(event: PointerEvent): THREE.Intersection[] {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.cameraManager.camera);
    return this.raycaster.intersectObjects(this.scene.children, true);
  }

  private processCoinInteraction(intersects: THREE.Intersection[]): boolean {
    if (intersects.length === 0) return false;
    const obj = intersects[0].object;

    if (obj.userData?.isCoin) {
      const fill = obj.userData.parentFill as AnimaProgressFill;
      if (fill?.isCoinReady) {
        fill.collectCoin(this.cameraManager.camera);
        return true;
      }
    }
    return false;
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.cameraManager) return;
    const intersects = this.getIntersects(event);
    this.processCoinInteraction(intersects);
  }

  private onPointerDown(event: PointerEvent) {
    if (!this.cameraManager) return;
    const intersects = this.getIntersects(event);
    if (intersects.length === 0) return;

    if (this.processCoinInteraction(intersects)) return;

    let current: THREE.Object3D | null = intersects[0].object;
    while (current) {
      if (current.userData?.parentEntity) {
        current.userData.parentEntity.handleInteraction();
        return;
      }
      current = current.parent;
    }
  }
}