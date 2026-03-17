import * as THREE from "three";
import type { ModelLoader } from "../core/ModelLoader";

export class Environment {
  private scene: THREE.Scene;
  private modelLoader: ModelLoader;
  public ground: THREE.Group | null = null;

  constructor(scene: THREE.Scene, modelLoader: ModelLoader) {
    this.scene = scene;
    this.modelLoader = modelLoader;
    
    this.initLights();
    this.initFog();
  }

  private initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0005;

    this.scene.add(sunLight);
  }

  private initFog() {
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 45, 120);
  }

  public async loadGround(): Promise<void> {
    try {
      const { scene: groundModel } = await this.modelLoader.loadModel("/gltf/ground.glb");
      this.ground = groundModel;
      
      this.ground.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.receiveShadow = true;
        }
      });
      
      this.scene.add(this.ground);
    } catch (error) {
      console.error("Error loading ground:", error);
    }
  }
}