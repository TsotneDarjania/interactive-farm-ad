import * as THREE from "three";
import { gsap } from "gsap";
import { assetCache } from "../core/ModelLoader"; // <--- შემოვიტანეთ გლობალური ქეში

export class Waypoint {
  public mesh: THREE.Group;
  private scene: THREE.Scene;
  private glowGroup: THREE.Group;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
    
    this.glowGroup = new THREE.Group();
    this.mesh.add(this.glowGroup);

    // 1. ვქმნით ნეონის წრეებს
    this.createNeonEffect();
    
    // 2. ვტვირთავთ 3D მოდელს ლოუდერიდან
    this.attach3DModel();

    // 3. საწყისად ვმალავთ
    this.hide(); 
  }

 private attach3DModel() {
    try {
      const { scene: model } = assetCache.getModel("waypoint");
      
      // 1. ზომა დავტოვოთ შესამჩნევი (მაგალითად 15)
      const scale = 4; 
      model.scale.set(scale, scale, scale);
      
      // ოდნავ ავწიოთ ზემოთ მოდელი ჯგუფის შიგნით, რომ წრეებს არ ეჯახებოდეს
      model.position.y = 0; 
      
      this.mesh.add(model);

      model.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const m = c as THREE.Mesh;
          m.castShadow = true;
          
          // 2. დავუბრუნოთ ორიგინალი მატერიალები, მაგრამ DepthTest გამოვურთოთ,
          // რომ მიწამ არ დაფაროს (Z-fighting-ის პრევენცია)
          const materials = Array.isArray(m.material) ? m.material : [m.material];
          materials.forEach(mat => {
            mat.depthTest = true; // დავუბრუნოთ სტანდარტულს
            if ('transparent' in mat) {
              mat.transparent = true;
              mat.opacity = 1; // ბოლომდე გამოვაჩინოთ
            }
          });
        }
      });

    } catch (e) {
      console.error("❌ შეცდომა Waypoint-ზე:", e);
    }
  }

  private createNeonEffect() {
    const color = 0x00ffff; 
    const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2; 
    this.glowGroup.add(ring);

    gsap.to(ring.scale, { x: 1.3, y: 1.3, duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut" });

    for (let i = 0; i < 3; i++) {
      const fogGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32, 1, true);
      const fogMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const fog = new THREE.Mesh(fogGeo, fogMat);
      this.glowGroup.add(fog);

      gsap.to(fog.position, { y: 2.5, duration: 2, delay: i * 0.6, repeat: -1, ease: "none", onRepeat: () => { fog.position.y = 0; } });
      const tl = gsap.timeline({ repeat: -1, delay: i * 0.6 });
      tl.to(fogMat, { opacity: 0.3, duration: 0.5 }).to(fogMat, { opacity: 0, duration: 1.5 });
      gsap.to(fog.scale, { x: 1.5, z: 1.5, duration: 2, delay: i * 0.6, repeat: -1, ease: "none" });
    }
  }

  public show() {
    this.mesh.visible = true;
    console.log("✅ Waypoint გამოიძახა show()!"); // ტესტისთვის დავამატე, რომ კონსოლში გამოჩნდეს
  }

  public hide() {
    this.mesh.visible = false;
  }

  public destroy() {
    this.scene.remove(this.mesh);
  }
}