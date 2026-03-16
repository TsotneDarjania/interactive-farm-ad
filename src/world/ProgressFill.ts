import * as THREE from "three";
import { gsap } from "gsap";

export class ProgressFill {
  public id: string;
  public wrapper: THREE.Group;
  private fillDuration: number;

  public progress = 0;
  public isReady = false;
  private tween: gsap.core.Tween | null = null;

  constructor(id: string, wrapper: THREE.Group, fillDuration: number = 3) {
    this.id = id;
    this.wrapper = wrapper;
    this.fillDuration = fillDuration;
    
    this.startProgress();
  }

  public startProgress() {
    this.progress = 0;
    this.isReady = false;

    if (this.tween) {
      this.tween.kill();
    }

    this.tween = gsap.to(this, {
      progress: 1,
      duration: this.fillDuration,
      ease: "none", 
      onComplete: () => {
        this.isReady = true;
      },
    });
  }

  public get2DPosition(camera: THREE.Camera, width: number, height: number) {
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.wrapper.matrixWorld);
    vector.y += 2; 
    vector.project(camera);

    if (vector.z < 1) {
      return {
        x: (vector.x * 0.5 + 0.5) * width,
        y: (vector.y * -0.5 + 0.5) * height,
      };
    }
    return null;
  }
}