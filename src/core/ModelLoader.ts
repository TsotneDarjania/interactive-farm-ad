import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ModelLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  // ტვირთავს GLTF/GLB მოდელს და აბრუნებს სცენას და ანიმაციებს
  public async loadModel(path: string): Promise<{ scene: THREE.Group, animations: THREE.AnimationClip[] }> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          resolve({ scene: gltf.scene, animations: gltf.animations });
        },
        undefined,
        (error) => {
          console.error(`Failed to load model from ${path}:`, error);
          reject(error);
        }
      );
    });
  }
}