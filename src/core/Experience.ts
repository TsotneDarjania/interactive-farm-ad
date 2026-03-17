import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { EventEmitter } from "pixi.js";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { PenManager } from "../world/PenManager";
import { DefaultConfig, SpawnConfig } from "../constants/spawnConfig";
import { FarmAnimal } from "../world/FarmAnimal";
import { globalEvents } from "./EventBus";
import { Farmer } from "../world/Farmer";
import { Wheat } from "../world/Wheat";
import { Waypoint } from "../world/WayPoint";
import { TutorialPositions } from "../constants/tutorialPositions";

// საერთო ტიპი, რომ მასივმა ორივე კლასი მიიღოს და პროგრესბარები არ აირიოს
type FarmItem = FarmAnimal | Wheat;

export class Experience {
  public events = new EventEmitter();

  private fogStart = 45;
  private fogEnd = 120;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private loader: GLTFLoader = new GLTFLoader();
  public controls!: OrbitControls;

  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ground: THREE.Group | null = null;
  private readonly targetFOV = 45;

  private mixers: THREE.AnimationMixer[] = [];
  private clock = new THREE.Clock();

  private penManager = new PenManager();

  // მასივი, რომელიც ინახავს როგორც ცხოველებს, ისე მცენარეებს
  private farmItems: FarmItem[] = [];

  private farmer: Farmer | null = null;

  private waypoint: Waypoint | null = null;

  constructor(threeCanvas: HTMLCanvasElement, pixiCanvas: HTMLCanvasElement) {
    this.init(threeCanvas, pixiCanvas);
  }

  private async init(
    threeCanvas: HTMLCanvasElement,
    pixiCanvas: HTMLCanvasElement,
  ) {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, this.fogStart, this.fogEnd);

    this.camera = new THREE.PerspectiveCamera(
      this.targetFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(60, 50, 60);

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

    this.controls = new OrbitControls(this.camera, pixiCanvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enabled = false;
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.initLights();
    this.updateCameraFOV();
    this.spawnWheat(); 
    this.spawnWaypoint();

    try {
      await this.loadGround("/gltf/ground.glb");
      await this.loadFarmer();
      this.startCinematicIntro();
    } catch (e) {
      console.error(e);
    }

    this.animate();
    window.addEventListener("resize", () => this.onResize());
  }

  private spawnWaypoint() {
    const config = SpawnConfig["waypoint"] || DefaultConfig;
    const pos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    this.loader.load("/gltf/waypoint.glb", (gltf) => {
      this.waypoint = new Waypoint(this.scene, pos);
      this.waypoint.spawn(gltf.scene, config.scale || 1);

      if (config.animation) config.animation(this.waypoint.mesh);
    });
  }

  // === ახალი: ფერმერის და კამერის გადაადგილება ===
  public movePlayerToViewpoint(pointKey: string, onCompleteEvent: string) {
    const config = TutorialPositions[pointKey];
    if (!config || !this.farmer) return;

    // ფერმერი მირბის და ასრულებისას ისვრის ივენთს
    this.farmer.moveToViewpoint(
      config.playerPos,
      config.playerRotation,
      onCompleteEvent,
    );

    // კამერის მოძრაობა სინქრონულად
    gsap.to(this.camera.position, {
      x: config.cameraPos.x,
      y: config.cameraPos.y,
      z: config.cameraPos.z,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.controls.update();
      },
    });

    gsap.to(this.controls.target, {
      x: config.cameraTarget.x,
      y: config.cameraTarget.y,
      z: config.cameraTarget.z,
      duration: 2.5,
      ease: "power2.inOut",
    });
  }
  // ============================================

  private async loadFarmer(): Promise<void> {
    return new Promise((resolve) => {
      this.loader.load(
        "gltf/humans/farmer.glb",
        (gltf) => {
          const model = gltf.scene;
          const scale = 1.2;

          this.farmer = new Farmer(model, gltf.animations, scale);
          this.farmer.mesh.position.set(-1, 4.2, 15);
          this.farmer.mesh.rotation.y = Math.PI;

          this.farmer.mesh.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });

          this.scene.add(this.farmer.mesh);
          resolve();
        },
        undefined,
        (err) => {
          console.error("ვერ ჩავტვირთე ფერმერი:", err);
          resolve();
        },
      );
    });
  }

  private initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sunLight.position.set(30, 50, 30);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);
  }

  private startCinematicIntro() {
    if (!this.ground) return;
    const box = new THREE.Box3().setFromObject(this.ground);
    const center = box.getCenter(new THREE.Vector3());
    this.controls.target.copy(center);

    const zoom = window.innerWidth < window.innerHeight ? 20 : 25;

    gsap.to(this.camera.position, {
      x: center.x,
      y: zoom * 0.6,
      z: center.z + zoom + 5,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(center);
        this.controls.update();
      },
      onComplete: () => {
        this.controls.enabled = true;
        globalEvents.emit("intro-complete");

        if (this.farmer) {
          this.farmer.waveHello();
        }
      },
    });
  }

  private createDustParticles(position: THREE.Vector3) {
    const particleCount = 12;
    const geometry = new THREE.SphereGeometry(0.12, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xddddaa,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Group();
    particles.position.set(position.x, position.y + 0.1, position.z);
    this.scene.add(particles);

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      particles.add(mesh);

      gsap.to(mesh.position, {
        x: (Math.random() - 0.5) * 2.5,
        y: Math.random() * 1.0 + 0.2,
        z: (Math.random() - 0.5) * 2.5,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.to(mesh.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: "power1.in",
      });
    }

    setTimeout(() => {
      this.scene.remove(particles);
      geometry.dispose();
      material.dispose();
    }, 800);
  }

  // === ხორბლის სპაუნი (Wheat Class + SpawnConfig) ===
  public spawnWheat() {
    const config = SpawnConfig["wheat"] || DefaultConfig;

    // პოზიციას ვიღებთ მხოლოდ კონფიგიდან!
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    if (this.farmer && config.farmerStandPoint) {
      this.farmer.moveTo(config.farmerStandPoint);
    }

    this.loader.load("/gltf/products/wheat.glb", (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const finalScale = (config.scale || 1) / (maxDim || 1);

      // ვასწორებთ მოდელის შიდა მასშტაბს
      model.scale.set(finalScale, finalScale, finalScale);
      model.position.y = -box.getCenter(new THREE.Vector3()).y * finalScale;

      const wheatObj = new Wheat(this.scene, targetPos, 25);
      const item = wheatObj.spawn(model);

      // ვიძახებთ ანიმაციას კონფიგიდან (wrapper-ზე)
      if (config.animation) {
        config.animation(wheatObj.mesh);
      }

      setTimeout(() => {
        this.createDustParticles(targetPos);
      }, 400);

      if (item) {
        this.farmItems.push(item);
      }
    });
  }

  // === სხვა ობიექტების სპაუნი (FarmAnimal + SpawnConfig) ===
  public async spawnFromObjects(objectName: string) {
    const config = SpawnConfig[objectName] || DefaultConfig;
    const targetPos = config.position?.clone() || new THREE.Vector3(0, 0, 0);

    if (this.farmer && config.farmerStandPoint) {
      this.farmer.moveTo(config.farmerStandPoint);
    }

    const path = `/gltf/${objectName}.glb`;
    const wrapper = new THREE.Group();
    wrapper.position.copy(targetPos);
    this.scene.add(wrapper);

    this.loader.load(path, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const finalScale = (config.scale || 1) / (maxDim || 1);

      model.scale.set(finalScale, finalScale, finalScale);
      model.position.y = -center.y * finalScale;
      wrapper.add(model);

      wrapper.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

      if (config.animation) {
        config.animation(wrapper);
      }

      setTimeout(() => {
        this.createDustParticles(targetPos);
      }, 400);

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
    });
  }

  public resetItemProgress(id: string) {
    const item = this.farmItems.find((i) => i.id === id);
    if (item) item.progressFill.startProgress();
  }

  private async loadGround(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          this.ground = gltf.scene;
          this.ground.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) c.receiveShadow = true;
          });
          this.scene.add(this.ground);
          resolve();
        },
        undefined,
        reject,
      );
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

    if (this.farmer) this.farmer.update(delta);
    this.mixers.forEach((m) => m.update(delta));
    if (this.controls?.enabled) this.controls.update();

    // === ახალი ლოგიკა: 3D ბარმა კამერას რომ უყუროს მუდმივად ===
    this.farmItems.forEach((item) => {
      if ('update' in item && typeof (item as any).update === 'function') {
        (item as any).update(this.camera);
      }
    });
    // ========================================================

    // ყველა ობიექტის UI-ს სინქრონიზაცია (ორივე ტიპისთვის)
    const uiData = this.farmItems
      .map((item) =>
        item.getUIData(this.camera, window.innerWidth, window.innerHeight),
      )
      .filter((d) => d !== null);

    globalEvents.emit("sync-world-ui", uiData);
    this.renderer.render(this.scene, this.camera);
  }

  public hasSpaceFor(objectName: string): boolean {
    return this.penManager.hasSpace(objectName);
  }

  public moveCameraToPlayPosition() {
    const isMobile = window.innerWidth < 768;
    const targetPos = isMobile
      ? { x: 20, y: 20, z: 0 }
      : { x: 30, y: 25, z: 0 };
    const targetLookAt = isMobile
      ? { x: 2, y: 4.7, z: -6.5 }
      : { x: 10.5, y: 4.7, z: -6.5 };

    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: () => {
        this.controls.update();
      },
    });

    gsap.to(this.controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 3,
      ease: "power2.inOut",
    });
  }

  public triggerWheatScythe() {
    // ვეძებთ ხორბალს ფერმის ობიექტების მასივში
    const wheatItem = this.farmItems.find(
      (item) => item instanceof Wheat,
    ) as Wheat;

    if (wheatItem && typeof wheatItem.showScythe === "function") {
      wheatItem.showScythe(); // ვრთავთ ცელის ანიმაციას და პროგრესბარს
    }
  }
}