import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { globalEvents } from "./EventBus";

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  private targetFOV = 45;

  constructor(pixiCanvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(
      this.targetFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(60, 50, 60);

    this.controls = new OrbitControls(this.camera, pixiCanvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enabled = false;
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.updateFOV();
  }

  public updateFOV() {
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

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.updateFOV();
  }

  public update() {
    if (this.controls.enabled) {
      this.controls.update();
    }
  }

  public startCinematicIntro(
    groundBoxCenter: THREE.Vector3,
    onComplete: () => void,
  ) {
    this.controls.target.copy(groundBoxCenter);
    const zoom = window.innerWidth < window.innerHeight ? 20 : 25;

    gsap.to(this.camera.position, {
      x: groundBoxCenter.x,
      y: zoom * 0.6,
      z: groundBoxCenter.z + zoom + 5,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(groundBoxCenter);
        this.controls.update();
      },
      onComplete: () => {
        this.controls.enabled = true;
        onComplete();
      },
    });
  }

  public moveToViewpoint(
    cameraPos: THREE.Vector3,
    cameraTarget: THREE.Vector3,
  ) {
    gsap.to(this.camera.position, {
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.controls.update();
      },
    });

    gsap.to(this.controls.target, {
      x: cameraTarget.x,
      y: cameraTarget.y,
      z: cameraTarget.z,
      duration: 2.5,
      ease: "power2.inOut",
    });
  }

  // === ეს არის ის ახალი მეთოდი, რომელიც გაკლდა ===
  public moveCameraToPlayPosition() {
    const isMobile = window.innerWidth < 768;

    // საით უნდა იყურებოდეს კამერა თამაშის დროს (შენი ფერმის ცენტრი)
    const targetLookAt = isMobile ? { x: 0, y: 4, z: 0 } : { x: 5, y: 4, z: 0 };

    // სად უნდა იდგეს კამერა (სიმაღლე და დაშორება)
    const targetPos = isMobile
      ? { x: 25, y: 25, z: 25 }
      : { x: 40, y: 35, z: 40 };

    // კამერის პოზიციის ანიმაცია
    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        this.controls.update();
      },
    });

    // კამერის სამიზნის (Target) ანიმაცია
    gsap.to(this.controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }
}
