import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { EventEmitter } from "pixi.js";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { PenManager } from "../world/PenManager";
import { DefaultConfig, SpawnConfig } from "../constants/spawnConfig";
import { FarmAnimal } from "../world/FarmAnimal";

export class Experience {
  public events = new EventEmitter();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private loader: GLTFLoader = new GLTFLoader();
  public controls!: OrbitControls;

  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private ground: THREE.Group | null = null;
  private readonly targetFOV = 45;

  private mixers: THREE.AnimationMixer[] = [];
  private clock = new THREE.Clock();

  private penManager = new PenManager();
  private farmItems: FarmAnimal[] = [];

  constructor(threeCanvas: HTMLCanvasElement, pixiCanvas: HTMLCanvasElement) {
    this.init(threeCanvas, pixiCanvas);
  }

  private async init(threeCanvas: HTMLCanvasElement, pixiCanvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 1, 250);

    this.camera = new THREE.PerspectiveCamera(this.targetFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(60, 50, 60);

    this.renderer = new THREE.WebGLRenderer({
      canvas: threeCanvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, pixiCanvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enabled = false;
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.initLights();
    this.updateCameraFOV();

    try {
      await this.loadGround("/gltf/ground.glb");
      this.startCinematicIntro();
    } catch (e) {
      console.error(e);
    }

    this.animate();
    window.addEventListener("resize", () => this.onResize());
  }

  private startCinematicIntro() {
    if (!this.ground) return;
    const box = new THREE.Box3().setFromObject(this.ground);
    const center = box.getCenter(new THREE.Vector3());
    this.controls.target.copy(center);

    const zoom = window.innerWidth < window.innerHeight ? 32 : 35;

    gsap.to(this.camera.position, {
      x: center.x,
      y: zoom * 0.8,
      z: center.z + zoom,
      duration: 4,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(center);
        this.controls.update();
      },
      onComplete: () => {
        this.controls.enabled = true;
        this.events.emit("intro-complete");
      },
    });
  }

  public async spawnFromObjects(objectName: string) {
    const targetPos = this.penManager.getSpawnPosition(objectName);
    if (!targetPos) return;

    const path = `/gltf/${objectName}.glb`;
    const config = SpawnConfig[objectName] || DefaultConfig;

    const wrapper = new THREE.Group();
    wrapper.position.copy(targetPos);
    this.scene.add(wrapper);

    this.loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
          this.mixers.push(mixer);
        }

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = (config.scale || 1) / (maxDim || 1);
        model.scale.multiplyScalar(scaleFactor);

        model.position.sub(center.multiplyScalar(scaleFactor));
        
        wrapper.add(model);

        wrapper.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });

        config.animation(wrapper);

        if (objectName !== ObjectType.FENCE) {
          const id = `animal_${Date.now()}_${Math.random()}`;
          const itemData = UI_ITEMS.find((i) => i.id === objectName);
          
          const rewardAmount = itemData ? itemData.price : 20;

          const newItem = new FarmAnimal(id, objectName, wrapper, rewardAmount);
          this.farmItems.push(newItem);
        }
      },
      undefined,
      (err) => console.error(err),
    );
  }

  public resetItemProgress(id: string) {
    const item = this.farmItems.find((i) => i.id === id);
    if (item) {
      item.progressFill.startProgress();
    }
  }

  private initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(30, 50, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.sunLight);
  }

  private async loadGround(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(path, (gltf) => {
          this.ground = gltf.scene;
          this.ground.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) c.receiveShadow = true;
          });
          this.scene.add(this.ground);
          resolve();
        }, undefined, reject);
    });
  }

  private updateCameraFOV() {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.77) {
      const vFOV = this.targetFOV * (Math.PI / 180);
      const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * 1.77);
      const newVFOV = 2 * Math.atan(Math.tan(hFOV / 2) / aspect);
      this.camera.fov = newVFOV * (180 / Math.PI);
    } else {
      this.camera.fov = this.targetFOV;
    }
    this.camera.updateProjectionMatrix();
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.updateCameraFOV();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.mixers.forEach((m) => m.update(delta));
    if (this.controls?.enabled) this.controls.update();

    const uiData: any[] = [];
    this.farmItems.forEach((item) => {
      const data = item.getUIData(this.camera, window.innerWidth, window.innerHeight);
      if (data) uiData.push(data);
    });

    this.events.emit("sync-world-ui", uiData);
    this.renderer.render(this.scene, this.camera);
  }

  public hasSpaceFor(objectName: string): boolean {
    return this.penManager.hasSpace(objectName);
  }

  public moveCameraToPlayPosition() {
    const isMobile = window.innerWidth < 768;
    const targetPos = isMobile ? { x: 20, y: 20, z: 0 } : { x: 30, y: 25, z: 0 }; 
    const targetLookAt = isMobile ? { x: 2, y: 4.7, z: -6.5 } : { x: 10.5, y: 4.7, z: -6.5 }; 

    gsap.to(this.camera.position, {
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      duration: 3, ease: "power2.inOut",
      onUpdate: () => { this.controls.update(); },
    });

    gsap.to(this.controls.target, {
      x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z,
      duration: 3, ease: "power2.inOut",
    });
  }
}