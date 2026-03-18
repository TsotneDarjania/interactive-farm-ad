import * as THREE from "three";
import { gsap } from "gsap";
// აღარ გვჭირდება: import { OrbitControls } ...

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  private targetFOV = 45;
  
  // კამერის სამიზნე წერტილი, რომელსაც ანიმაციით შევცვლით
  public lookAtTarget: THREE.Vector3;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      this.targetFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(60, 50, 60);

    // საწყისი სამიზნე წერტილი (ცენტრი)
    this.lookAtTarget = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(this.lookAtTarget);

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
    // ყოველ კადრში კამერა იყურება ჩვენს დინამიურ სამიზნეზე
    this.camera.lookAt(this.lookAtTarget);
  }

  public startCinematicIntro(
    groundBoxCenter: THREE.Vector3,
    onComplete: () => void
  ) {
    // ანიმაციის დაწყებამდე სამიზნე მივამაგროთ საწყის წერტილზე
    this.lookAtTarget.copy(groundBoxCenter);
    
    const zoom = window.innerWidth < window.innerHeight ? 20 : 25;

    gsap.to(this.camera.position, {
      x: groundBoxCenter.x,
      y: zoom * 0.6,
      z: groundBoxCenter.z + zoom + 5,
      duration: 2,
      ease: "power2.inOut",
      onComplete: () => {
        onComplete();
      },
    });
  }

  public moveToViewpoint(
    cameraPos: THREE.Vector3,
    cameraTarget: THREE.Vector3
  ) {
    // კამერის პოზიციის ანიმაცია
    gsap.to(this.camera.position, {
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
      duration: 2.5,
      ease: "power2.inOut",
    });

    // კამერის სამიზნის (სად იყურება) ანიმაცია
    gsap.to(this.lookAtTarget, {
      x: cameraTarget.x,
      y: cameraTarget.y,
      z: cameraTarget.z,
      duration: 2.5,
      ease: "power2.inOut",
    });
  }

  public moveCameraToPlayPosition() {
    const isMobile = window.innerWidth < 768;

    // საით უნდა იყურებოდეს კამერა თამაშის დროს
    const targetLookAt = isMobile ? { x: 0, y: 4, z: 0 } : { x: 5, y: 4, z: 0 };

    // სად უნდა იდგეს კამერა
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
    });

    // კამერის სამიზნის ანიმაცია
    gsap.to(this.lookAtTarget, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }
}