import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class EndScreenUI extends PIXI.Container {
  private overlay: PIXI.Graphics;
  private popup: PIXI.Container;
  private url: string = "https://github.com/TsotneDarjania";
  
  private profileImage: PIXI.Sprite; 
  private downloadBtn: PIXI.Container;
  private pulseTween: gsap.core.Tween | null = null;

  constructor() {
    super();
    this.visible = false;
    this.eventMode = "none"; 

    // 1. მუქი ფონი (Overlay)
    this.overlay = new PIXI.Graphics();
    this.addChild(this.overlay);

    // 2. მთავარი პოპაპის კონტეინერი
    this.popup = new PIXI.Container();
    this.addChild(this.popup);

    // პოპაპის ფონი - თეთრი, მომრგვალებული კუთხეებით და ოქროსფერი ჩარჩოთი
    const bg = new PIXI.Graphics()
      .roundRect(-180, -120, 360, 240, 25)
      .fill({ color: 0xffffff })
      .stroke({ width: 6, color: 0xffd700 });
      
    // ჩრდილის იმიტაცია (სურვილისამებრ, თუ გაქვს BlurFilter ჩართული)
    // bg.filters = [new PIXI.BlurFilter({ strength: 4 })];

    // 3. პროფილის სურათი
    this.profileImage = new PIXI.Sprite(); 
    this.profileImage.anchor.set(0.5);
    this.profileImage.y = -60;

    PIXI.Assets.load("tsotne.jpg").then((texture) => {
      this.profileImage.texture = texture;
      this.profileImage.width = 90;  
      this.profileImage.height = 90;
    }).catch(err => {
      console.warn("სურათის ჩატვირთვა ვერ მოხერხდა:", err);
    });

    const circleMask = new PIXI.Graphics()
      .circle(0, 0, 45) 
      .fill(0xffffff);
    circleMask.y = -60; 
    
    this.profileImage.mask = circleMask;

    // 4. გამამხნევებელი ტექსტი
    const titleText = new PIXI.Text({
      text: "Awesome Job!",
      style: {
        fontSize: 28,
        fill: 0xff8c00,
        fontWeight: "900",
        fontFamily: "Arial",
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = 10; 

    // 5. Playable Ad "Download" ღილაკი
    this.downloadBtn = new PIXI.Container();
    this.downloadBtn.y = 70;
    this.downloadBtn.eventMode = "static";
    this.downloadBtn.cursor = "pointer";

    const btnBg = new PIXI.Graphics()
      .roundRect(-110, -25, 220, 50, 25)
      .fill({ color: 0x4caf50 }) // მწვანე ღილაკი
      .stroke({ width: 3, color: 0x2e7d32 });

    const btnText = new PIXI.Text({
      text: "Download Full App",
      style: {
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: "bold",
        fontFamily: "Arial",
      },
    });
    btnText.anchor.set(0.5);

    this.downloadBtn.addChild(btnBg, btnText);

    // ღილაკზე დაკლიკების ივენთი
    this.downloadBtn.on("pointerdown", () => {
      window.open(this.url, "_blank");
    });

    // ვაწყობთ პოპაპს
    this.popup.addChild(bg, this.profileImage, circleMask, titleText, this.downloadBtn); 
  }

  public show(width: number, height: number, url?: string) {
    if (url) this.url = url;

    this.drawOverlay(width, height);
    this.popup.position.set(width / 2, height / 2);

    this.visible = true;
    this.alpha = 0;
    this.popup.scale.set(0);
    
    // მთლიანი ეკრანი დაიჭერს კლიკს, რომ უკან ვერ ითამაშონ
    this.eventMode = "static"; 
    
    const targetScale = width < 500 ? 0.8 : 1;

    // 1. ფონის გლუვი შემოსვლა
    gsap.to(this, { alpha: 1, duration: 0.5 });

    // 2. პოპაპის ამოხტომა (Bounce ეფექტით)
    gsap.to(this.popup.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.6,
      ease: "back.out(1.5)",
      delay: 0.2,
      onComplete: () => {
        // 3. ღილაკის პულსაცია (Call To Action ანიმაცია)
        if (this.pulseTween) this.pulseTween.kill();
        this.pulseTween = gsap.to(this.downloadBtn.scale, {
          x: 1.1,
          y: 1.1,
          duration: 0.6,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      },
    });
  }

  private drawOverlay(width: number, height: number) {
    this.overlay
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.75 }); // მუქი ფონი

    // Overlay-ზე კლიკიც ლინკზე გადაიყვანს (ხშირია რეკლამებში)
    this.overlay.eventMode = "static";
    this.overlay.cursor = "pointer";
    this.overlay.on("pointerdown", () => {
       window.open(this.url, "_blank");
    });
  }

  public resize(width: number, height: number) {
    if (!this.visible) return;
    this.drawOverlay(width, height);
    this.popup.position.set(width / 2, height / 2);
    const targetScale = width < 500 ? 0.8 : 1;
    this.popup.scale.set(targetScale);
  }
}