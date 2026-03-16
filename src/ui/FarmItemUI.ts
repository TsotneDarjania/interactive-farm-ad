import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class FarmItemUI extends PIXI.Container {
  public id: string;
  private events: PIXI.EventEmitter;

  private bg: PIXI.Graphics;
  private fill: PIXI.Graphics;
  private coin: PIXI.Text;
  public isReady = false; 

  private rewardAmount: number = 20;
  private baseScale: number = 1;
  private coinStartY: number = -90; 

  constructor(id: string, events: PIXI.EventEmitter) {
    super();

    this.id = id;
    this.events = events;

    this.bg = new PIXI.Graphics()
      .roundRect(-25, -5, 50, 10, 5)
      .fill({ color: 0x000000, alpha: 0.5 });
    this.fill = new PIXI.Graphics();

    this.coin = new PIXI.Text({ text: "💰", style: { fontSize: 36 } });
    this.coin.anchor.set(0.5);
    this.coin.y = this.coinStartY; 
    this.coin.visible = false;
    this.coin.eventMode = "static";
    this.coin.cursor = "pointer";

    const collectAction = (e: any) => {
      e?.stopPropagation();
      if (this.isReady) {
        this.events.emit("collect-coin", { id: this.id, amount: this.rewardAmount });
        gsap.fromTo(
          this.scale,
          { x: this.baseScale * 1.3, y: this.baseScale * 1.3 },
          { x: this.baseScale, y: this.baseScale, duration: 0.3 },
        );
      }
    };

    this.coin.on("pointerdown", collectAction);
    this.coin.on("pointerover", collectAction);

    this.addChild(this.bg, this.fill, this.coin);
  }

  public updateData(data: any) {
    this.position.set(data.x, data.y);

    const screenWidth = window.innerWidth;
    this.baseScale = screenWidth < 400 ? 0.6 : screenWidth < 700 ? 0.8 : 1;
    this.scale.set(this.baseScale); 

    if (data.reward !== undefined) {
      this.rewardAmount = data.reward;
    }

    if (data.isReady && !this.isReady) {
      this.isReady = true;
      this.bg.visible = false;
      this.fill.visible = false;
      this.coin.visible = true;
      
      this.coin.y = this.coinStartY;

      gsap.fromTo(
        this.coin.scale,
        { x: 0, y: 0 },
        { x: 1, y: 1, duration: 0.5, ease: "back.out(2)" },
      );
      
      gsap.to(this.coin, {
        y: this.coinStartY - 15, 
        yoyo: true,
        repeat: -1,
        duration: 0.8,
        ease: "sine.inOut",
      });
    } else if (!data.isReady && this.isReady) {
      this.isReady = false;
      this.bg.visible = true;
      this.fill.visible = true;
      this.coin.visible = false;

      gsap.killTweensOf(this.coin);
      this.coin.y = this.coinStartY; 
    }

    if (!this.isReady) {
      this.fill
        .clear()
        .roundRect(-25, -5, 50 * data.progress, 10, 5)
        .fill(0x00ff00);
    }
  }
}