import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class EndScreenUI extends PIXI.Container {
  private overlay: PIXI.Graphics;
  private popup: PIXI.Container;
  private url: string = "https://github.com/TsotneDarjania";
  
  private profileImage: PIXI.Sprite; 

  constructor() {
    super();
    this.visible = false;
    this.eventMode = "none"; 

    this.overlay = new PIXI.Graphics();
    this.addChild(this.overlay);

    this.popup = new PIXI.Container();
    this.addChild(this.popup);

    const bg = new PIXI.Graphics()
      .roundRect(-160, -80, 320, 160, 20)
      .fill({ color: 0xffffff })
      .stroke({ width: 6, color: 0xffd700 });

    this.profileImage = new PIXI.Sprite(); 
    this.profileImage.anchor.set(0.5);
    this.profileImage.y = -35;

    // ✅ პირდაპირ public ფოლდერიდან კითხულობს
    PIXI.Assets.load("tsotne.jpg").then((texture) => {
      this.profileImage.texture = texture;
      this.profileImage.width = 70;  
      this.profileImage.height = 70;
    }).catch(err => {
      console.warn("სურათის ჩატვირთვა ვერ მოხერხდა:", err);
    });

    const circleMask = new PIXI.Graphics()
      .circle(0, 0, 35) 
      .fill(0xffffff);
    circleMask.y = -35; 
    
    this.profileImage.mask = circleMask;

    const text = new PIXI.Text({
      text: "Download Full App",
      style: {
        fontSize: 26,
        fill: 0x333333,
        fontWeight: "bold",
        fontFamily: "Arial",
      },
    });
    text.anchor.set(0.5);
    text.y = 35; 

    this.popup.addChild(bg, this.profileImage, circleMask, text); 

    this.on("pointerdown", () => {
      window.open(this.url, "_blank");
    });
  }

  public show(width: number, height: number, url?: string) {
    if (url) this.url = url;

    this.drawOverlay(width, height);
    this.popup.position.set(width / 2, height / 2);

    this.visible = true;
    this.alpha = 0;
    this.popup.scale.set(0);
    
    this.eventMode = "none"; 
    this.cursor = "default";

    const targetScale = width < 500 ? 0.7 : 1;

    gsap.to(this, { alpha: 1, duration: 0.5 });

    gsap.to(this.popup.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.6,
      ease: "back.out(1.5)",
      delay: 0.2,
      onComplete: () => {
        this.eventMode = "static";
        this.cursor = "pointer";

        gsap.to(this.popup.scale, {
          x: targetScale * 1.05,
          y: targetScale * 1.05,
          duration: 0.8,
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
      .fill({ color: 0x000000, alpha: 0.8 });
    this.hitArea = new PIXI.Rectangle(0, 0, width, height); 
  }

  public resize(width: number, height: number) {
    if (!this.visible) return;
    this.drawOverlay(width, height);
    this.popup.position.set(width / 2, height / 2);
  }
}