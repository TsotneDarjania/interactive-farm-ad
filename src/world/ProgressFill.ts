import * as THREE from "three";
import { gsap } from "gsap";

export class ProgressFill {
  public id: string;
  public wrapper: THREE.Group;
  private fillDuration: number;

  public progress = 0;
  public isReady = false;
  private tween: gsap.core.Tween | null = null;

  // 3D ვიზუალის ცვლადები
  private barContainer: THREE.Group;
  private backgroundBar: THREE.Mesh;
  private fillBar: THREE.Mesh;
  private borderBar: THREE.Mesh;

  constructor(id: string, wrapper: THREE.Group, fillDuration: number = 3) {
    this.id = id;
    this.wrapper = wrapper;
    this.fillDuration = fillDuration;
    
    this.barContainer = new THREE.Group();
    this.barContainer.position.set(0, 4.5, 0); 
    this.barContainer.visible = false; 
    
    // 1. თეთრი ჩარჩო (Border) ოდნავ დიდი ზომის
    const borderGeo = new THREE.PlaneGeometry(2.1, 0.4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.borderBar = new THREE.Mesh(borderGeo, borderMat);
    this.borderBar.position.z = -0.02;

    // 2. ფონი (მუქი)
    const bgGeometry = new THREE.PlaneGeometry(2, 0.3); 
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    this.backgroundBar = new THREE.Mesh(bgGeometry, bgMaterial);
    this.backgroundBar.position.z = -0.01;
    
    // 3. შესავსები ნაწილი (მკვეთრი მწვანე)
    const fillGeometry = new THREE.PlaneGeometry(2, 0.3);
    fillGeometry.translate(1, 0, 0); 
    const fillMaterial = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    this.fillBar = new THREE.Mesh(fillGeometry, fillMaterial);
    
    this.fillBar.scale.x = 0; 
    this.fillBar.position.x = -1; 
    
    this.barContainer.add(this.borderBar);
    this.barContainer.add(this.backgroundBar);
    this.barContainer.add(this.fillBar);
    
    this.wrapper.add(this.barContainer);
  }

  public startProgress() {
    this.progress = 0;
    this.isReady = false;
    
    this.barContainer.visible = true;
    this.barContainer.scale.set(1, 1, 1);
    this.fillBar.scale.x = 0;

    if (this.tween) {
      this.tween.kill();
    }

    this.tween = gsap.to(this, {
      progress: 1,
      duration: this.fillDuration,
      ease: "power1.inOut", 
      onUpdate: () => {
        this.fillBar.scale.x = this.progress;
        
        // მსუბუქი პულსაციის ეფექტი შევსებისას
        const pulse = 1 + Math.sin(this.progress * Math.PI * 10) * 0.03;
        this.barContainer.scale.set(pulse, pulse, 1);
      },
      onComplete: () => {
        this.isReady = true;
        this.playCompleteEffect(); // ვიძახებთ სპეცეფექტებს!
      },
    });
  }

  // === ახალი: გაქრობა და მონეტების ამოფრქვევა ===
  private playCompleteEffect() {
    // 1. ბარის ლამაზად გაქრობა (გადიდდება და ჩაქრება)
    gsap.to(this.barContainer.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.3,
      ease: "back.in(2)"
    });
    
    gsap.to(this.barContainer.position, {
      y: "+=1", // ოდნავ ზემოთ აიწევს
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        this.barContainer.visible = false;
        this.barContainer.position.y -= 1; // ვარესეტებთ პოზიციას
      }
    });

    // 2. 3D კოინების გაჩენა
    this.spawnCoins();
  }

  private spawnCoins() {
    // ვქმნით პატარა 3D ცილინდრებს, რომლებიც მონეტებს ჰგვანან
    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    coinGeo.rotateX(Math.PI / 2); // ვაყენებთ ფასადით კამერისკენ
    const coinMat = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // ოქროსფერი

    // ვაფრქვევთ 5 ცალ მონეტას
    for (let i = 0; i < 5; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.copy(this.barContainer.position); // იწყება ბარის პოზიციიდან
      coin.position.x += (Math.random() - 0.5); // ოდნავ მიმოფანტულად
      this.wrapper.add(coin);

      const tl = gsap.timeline({
        onComplete: () => {
          this.wrapper.remove(coin);
          coin.geometry.dispose();
          coin.material.dispose();
        }
      });

      // კოინი ხტება ზემოთ, ცოტა გვერდზე და ტრიალებს
      tl.to(coin.position, {
        x: "+=" + (Math.random() - 0.5) * 2,
        y: "+=" + (1.5 + Math.random()),
        z: "+=" + (Math.random() - 0.5) * 2,
        duration: 0.6,
        ease: "power2.out"
      }, 0);

      tl.to(coin.rotation, {
        y: Math.PI * 4, // სწრაფი ბრუნვა
        duration: 0.6,
        ease: "none"
      }, 0);

      // ბოლოსკენ ქრება (Scale = 0)
      tl.to(coin.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.3,
        delay: 0.3
      }, 0);
    }
  }
  // ===========================================
  
  public hide() {
      this.barContainer.visible = false;
      if (this.tween) this.tween.kill();
  }

  public updateLookAt(camera: THREE.Camera) {
      if (this.barContainer.visible) {
          this.barContainer.quaternion.copy(camera.quaternion);
      }
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