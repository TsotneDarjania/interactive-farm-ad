import * as THREE from "three";
import { gsap } from "gsap";

export class ParticleSystem {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createDustParticles(position: THREE.Vector3) {
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
}