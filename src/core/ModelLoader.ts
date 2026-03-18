import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

export class AssetLoader {
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();

  private modelCache: Map<string, LoadedModel> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();

  public async preloadAllModels(paths: Record<string, string>): Promise<void> {
    const keys = Object.keys(paths);
    const promises = keys.map(async (key) => {
      const gltf = await this.loadModelAsync(paths[key]);
      this.modelCache.set(key, {
        scene: gltf.scene,
        animations: gltf.animations,
      });
    });
    await Promise.all(promises);
    console.log("All models preloaded successfully!");
  }

  public async preloadAllTextures(
    paths: Record<string, string>,
  ): Promise<void> {
    const keys = Object.keys(paths);
    const promises = keys.map(async (key) => {
      const texture = await this.loadTextureAsync(paths[key]);
      this.textureCache.set(key, texture);
    });
    await Promise.all(promises);
    console.log("All textures preloaded successfully!");
  }

  private loadModelAsync(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(path, resolve, undefined, reject);
    });
  }

  private loadTextureAsync(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(path, resolve, undefined, reject);
    });
  }

  public getModel(key: string): LoadedModel {
    const cached = this.modelCache.get(key);
    if (!cached) throw new Error(`Model [${key}] is not preloaded!`);

    return {
      scene: SkeletonUtils.clone(cached.scene) as THREE.Group,
      animations: cached.animations,
    };
  }

  public getTexture(key: string): THREE.Texture {
    const cached = this.textureCache.get(key);
    if (!cached) throw new Error(`Texture [${key}] is not preloaded!`);

    return cached;
  }
}

export const assetCache = new AssetLoader();
