import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { ObjectType, UI_ITEMS } from "../constants/types";

export class UIButton extends PIXI.Container {
  private readonly size: number;
  private readonly content: PIXI.Container;
  private bg!: PIXI.Graphics;

  constructor(id: ObjectType, size: number = 80) {
    super();
    this.size = size;
    this.name = id;

    this.content = new PIXI.Container();
    this.addChild(this.content);

    const itemData = UI_ITEMS.find((item) => item.id === id);

    this.createBackground();
    this.createIcon(itemData?.icon || "📦");
    if (itemData) this.createPrice(itemData.price);

    this.content.pivot.set(this.size / 2, this.size / 2);
    this.setupInteractions();
  }

  public setDisabled(isDisabled: boolean) {
    if (isDisabled) {
      this.eventMode = "none";
      this.alpha = 0.5;
      
      gsap.killTweensOf(this.content.scale);
      gsap.killTweensOf(this.bg);
      this.content.scale.set(1);
      this.bg.tint = 0xffffff;
    } else {
      this.eventMode = "static";
      this.alpha = 1;
    }
  }

  private createBackground() {
    const shadow = new PIXI.Graphics()
      .roundRect(0, 4, this.size, this.size, 15)
      .fill(0x000000, 0.2);
    this.bg = new PIXI.Graphics()
      .roundRect(0, 0, this.size, this.size, 15)
      .fill({ color: 0xffffff, alpha: 0.95 })
      .stroke({ width: 3, color: 0xe0e0e0 });
    this.content.addChild(shadow, this.bg);
  }

  private createIcon(symbol: string) {
    const icon = new PIXI.Text({
      text: symbol,
      style: { fontSize: this.size * 0.5 },
    });
    icon.anchor.set(0.5);
    icon.position.set(this.size / 2, this.size / 2);
    this.content.addChild(icon);
  }

  private createPrice(price: number) {
    const priceTag = new PIXI.Text({
      text: `$${price}`,
      style: {
        fontSize: 16,
        fill: "#27ae60",
        fontWeight: "bold",
        stroke: { color: "#ffffff", width: 3 },
      },
    });
    priceTag.anchor.set(0.5);
    priceTag.position.set(this.size / 2, -15);
    this.content.addChild(priceTag);
  }

  private setupInteractions() {
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerover", () =>
      gsap.to(this.content.scale, { x: 1.1, y: 1.1, duration: 0.2 }),
    );
    this.on("pointerout", () =>
      gsap.to(this.content.scale, { x: 1, y: 1, duration: 0.2 }),
    );
    this.on("pointerdown", () => {
      gsap.to(this.content.scale, { x: 0.9, y: 0.9, duration: 0.1 });
      gsap.to(this.bg, { tint: 0xeeeeee, duration: 0.1 });
    });

    const resetState = () => {
      gsap.to(this.content.scale, { x: 1, y: 1, duration: 0.1 }); 
      gsap.to(this.bg, { tint: 0xffffff, duration: 0.1 });
    };

    this.on("pointerup", resetState);
    this.on("pointerupoutside", resetState);
  }
}