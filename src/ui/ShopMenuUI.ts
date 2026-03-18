import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { UIButton } from "./UIButton";
import { UI_ITEMS, ObjectType } from "../constants/types";

export class ShopMenuUI extends PIXI.Container {
  public events = new PIXI.EventEmitter();
  private menuButtons: UIButton[] = [];

  constructor() {
    super();
    this.alpha = 0;
    this.visible = false;
    this.createMenu();
  }

  private createMenu() {
    const gap = 20;
    const btnSize = 90;
    UI_ITEMS.forEach((item, i) => {
      const btn = new UIButton(item.id as ObjectType, btnSize);
      btn.x = i * (btnSize + gap) + btnSize / 2;
      btn.y = btnSize / 2;

      btn.on("pointerdown", (e) => {
        e.stopPropagation();
        this.events.emit("purchase", item.id);
      });

      this.addChild(btn);
      this.menuButtons.push(btn);
    });
  }

  public showMenu(screenHeight: number) {
    this.visible = true;
    const targetY = screenHeight - 120 * this.scale.y;

    this.menuButtons.forEach((btn, i) => {
      gsap.from(btn.scale, {
        x: 0,
        y: 0,
        duration: 0.5,
        delay: i * 0.1,
        ease: "back.out",
      });
    });

    gsap.fromTo(
      this,
      { y: screenHeight + 100, alpha: 0 },
      { y: targetY, alpha: 1, duration: 0.8, ease: "back.out(1.2)" },
    );
  }

  public updateAffordability(currentGold: number) {
    this.menuButtons.forEach((btn) => {
      const itemData = UI_ITEMS.find((i) => i.id === btn.name);
      if (!itemData) return;

      const canAfford = currentGold >= itemData.price;

      btn.setDisabled(!canAfford);
    });
  }

  public getButtonGlobalPos(id: string): PIXI.Point | null {
    const btn = this.menuButtons.find((b) => b.name === id);
    if (btn && btn.parent) {
      return btn.getGlobalPosition();
    }
    return null;
  }

  public resize(width: number, height: number) {
    let scale = 1;
    if (width < 400) scale = 0.45;
    else if (width < 600) scale = 0.55;
    else if (width < 800) scale = 0.75;

    this.scale.set(scale);
    this.x = (width - this.getLocalBounds().width * scale) / 2;
    this.y = height - 120 * scale;
  }
}
