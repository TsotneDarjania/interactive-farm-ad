import * as THREE from "three";
import { gsap } from "gsap";
import { globalEvents } from "../core/EventBus";

export class AnimaProgressFill {
  public id: string;
  public wrapper: THREE.Group;
  private fillDuration: number;

  public progress = 0;
  public isReady = false;
  public isCoinReady = false;
  private tween: gsap.core.Tween | null = null;

  private barContainer: THREE.Group;
  private backgroundBar: THREE.Mesh;
  private fillBar: THREE.Mesh;
  private borderBar: THREE.Mesh;

  private coinMesh: THREE.Mesh;
  private coinTween: gsap.core.Tween | null = null;

  private offsetY: number = 2.5;
  private goldReward: number = 0;
  private savedCallback?: () => void;

  constructor(
    id: string,
    wrapper: THREE.Group,
    fillDuration: number = 5,
    goldReward: number,
  ) {
    this.id = id;
    this.wrapper = wrapper;
    this.fillDuration = fillDuration;
    this.goldReward = goldReward;

    // 1. პროგრეს ბარის კონტეინერი
    this.barContainer = new THREE.Group();
    this.barContainer.position.set(0, this.offsetY, 0);
    this.barContainer.visible = false;

    // ფონი
    const bgGeometry = new THREE.BoxGeometry(1.6, 0.35, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.8,
    });
    this.backgroundBar = new THREE.Mesh(bgGeometry, bgMaterial);

    // შევსება
    const fillGeometry = new THREE.BoxGeometry(1.5, 0.25, 0.12);
    fillGeometry.translate(0.75, 0, 0); // შევსება დაიწყოს მარცხნიდან
    const fillMaterial = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.fillBar = new THREE.Mesh(fillGeometry, fillMaterial);

    this.fillBar.scale.x = 0.001;
    this.fillBar.position.x = -0.75;
    this.fillBar.position.z = 0.02;

    // ჩარჩო
    const borderGeo = new THREE.BoxGeometry(1.65, 0.4, 0.05);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.borderBar = new THREE.Mesh(borderGeo, borderMat);

    this.barContainer.add(this.backgroundBar, this.fillBar, this.borderBar);
    this.wrapper.add(this.barContainer);

    // 2. მონეტის შექმნა
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 20);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    this.coinMesh = new THREE.Mesh(coinGeo, coinMat);

    // მნიშვნელოვანია Raycaster-ისთვის
    this.coinMesh.userData = { isCoin: true, parentFill: this };
    
    this.coinMesh.position.set(0, this.offsetY, 0);
    this.coinMesh.scale.set(0, 0, 0);
    this.coinMesh.visible = false;

    this.wrapper.add(this.coinMesh);
  }

  /**
   * აბრუნებს მონეტის 2D კოორდინატებს ეკრანზე PIXI-სთვის
   */
  public get2DScreenPosition(camera: THREE.Camera): { x: number; y: number } | null {
    if (!this.wrapper) return null;
    const vector = new THREE.Vector3();
    this.wrapper.getWorldPosition(vector);
    vector.y += this.offsetY;
    vector.project(camera);

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (vector.y * -0.5 + 0.5) * window.innerHeight,
    };
  }

  /**
   * პროგრესის დაწყება
   */
  public startProgress(onCompleteCb?: () => void) {
    if (onCompleteCb) this.savedCallback = onCompleteCb;
    
    this.progress = 0;
    this.isReady = false;
    this.isCoinReady = false;

    // მონეტის გასუფთავება
    if (this.coinTween) this.coinTween.kill();
    this.coinMesh.visible = false;
    this.coinMesh.scale.set(0, 0, 0);

    // ბარის გამოჩენა
    this.barContainer.visible = true;
    this.barContainer.scale.set(1, 1, 1);
    this.fillBar.scale.x = 0.001;
    (this.fillBar.material as THREE.MeshBasicMaterial).color.setHex(0x00e5ff);

    if (this.tween) this.tween.kill();
    this.tween = gsap.to(this, {
      progress: 1,
      duration: this.fillDuration,
      ease: "none",
      onUpdate: () => {
        this.fillBar.scale.x = Math.max(0.001, this.progress);
        if (this.progress > 0.9) {
          (this.fillBar.material as THREE.MeshBasicMaterial).color.setHex(0x39ff14);
        }
      },
      onComplete: () => {
        this.isReady = true;
        this.playTransitionEffect(this.savedCallback);
      },
    });
  }

  public pause() {
    this.tween?.pause();
  }

  public resume() {
    if (this.tween && !this.isReady) {
      this.tween.resume();
    }
  }

  /**
   * ბარიდან მონეტაზე გადასვლის ეფექტი
   */
  private playTransitionEffect(onCompleteCb?: () => void) {
    const tl = gsap.timeline();
    
    tl.to(this.barContainer.scale, { 
      x: 1.3, y: 1.3, duration: 0.15, ease: "power2.out" 
    })
    .to(this.barContainer.scale, { 
      x: 0, y: 0, duration: 0.25, ease: "back.in(2)", 
      onComplete: () => { this.barContainer.visible = false; } 
    });

    tl.call(() => {
      this.coinMesh.visible = true;
      this.isCoinReady = true;
    });

    // მონეტის ანიმაცია (ამოხტომა, ტრიალი, ტივტივი)
    this.coinTween = gsap.to(this.coinMesh.scale, { 
      x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)", delay: 0.2 
    });
    
    gsap.to(this.coinMesh.rotation, { 
      y: Math.PI * 2, duration: 2, repeat: -1, ease: "none" 
    });
    
    gsap.to(this.coinMesh.position, { 
      y: this.offsetY + 0.4, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" 
    });

    if (onCompleteCb) setTimeout(() => onCompleteCb(), 400);
  }

  /**
   * მონეტის აღება (იძახებს Experience.ts)
   */
  public collectCoin(camera: THREE.Camera) {
    if (!this.isCoinReady) return;
    this.isCoinReady = false;

    const screenPos = this.get2DScreenPosition(camera);

    // ანიმაციების გაჩერება
    if (this.coinTween) this.coinTween.kill();
    gsap.killTweensOf(this.coinMesh.position);
    gsap.killTweensOf(this.coinMesh.scale);
    this.coinMesh.visible = false;

    // ნაწილაკების ეფექტი (Burst)
    this.createParticleBurst();

    // ივენთის გაგზავნა PIXI-სთვის
    globalEvents.emit("animal-coin-collected", { 
        reward: this.goldReward, 
        x: screenPos?.x || 0, 
        y: screenPos?.y || 0,
        id: this.id 
    });

    // პროცესის თავიდან დაწყება
    setTimeout(() => this.startProgress(this.savedCallback), 600);
  }

  private createParticleBurst() {
    const particleCount = 12;
    const particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(this.coinMesh.position);
      this.wrapper.add(particle);

      const angle = ((Math.PI * 2) / particleCount) * i;
      const radius = 0.6 + Math.random() * 0.6;

      gsap.to(particle.position, {
        x: particle.position.x + Math.cos(angle) * radius,
        y: particle.position.y + Math.random() * 2,
        z: particle.position.z + Math.sin(angle) * radius,
        duration: 0.5, 
        ease: "power2.out"
      });

      gsap.to(particle.scale, { 
        x: 0, y: 0, z: 0, duration: 0.4, delay: 0.15, 
        onComplete: () => { this.wrapper.remove(particle); } 
      });
    }
  }

  /**
   * ბილბორდ ეფექტი (ბარი და მონეტა ყოველთვის უყურებდეს კამერას)
   */
  public updateLookAt(camera: THREE.Camera) {
    const applyLookAt = (obj: THREE.Object3D) => {
      if (!obj.visible) return;
      obj.quaternion.copy(camera.quaternion);
      if (obj.parent) {
        const parentQuat = new THREE.Quaternion();
        obj.parent.getWorldQuaternion(parentQuat);
        obj.quaternion.premultiply(parentQuat.invert());
      }
    };

    applyLookAt(this.barContainer);
    
    if (this.coinMesh.visible) {
      applyLookAt(this.coinMesh);
      // მონეტას სჭირდება დამატებითი როტაცია საკუთარი ღერძის გარშემო ტრიალისთვის
      this.coinMesh.rotateY(this.coinMesh.rotation.y);
    }
  }
}