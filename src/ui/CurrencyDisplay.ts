import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class CurrencyDisplay extends PIXI.Container {
  private text: PIXI.Text;
  private icon: PIXI.Text;
  private bg: PIXI.Graphics;

  constructor(initialAmount: number) {
    super();

    this.bg = new PIXI.Graphics()
      .roundRect(0, 0, 140, 45, 25)
      .fill({ color: 0x000000, alpha: 0.5 })
      .stroke({ width: 2, color: 0xffd700 });

    this.icon = new PIXI.Text({ text: "💰", style: { fontSize: 24 } });
    this.icon.position.set(10, 8);

    this.text = new PIXI.Text({
      text: initialAmount.toString(),
      style: {
        fill: "#ffffff",
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Arial",
      },
    });
    this.text.position.set(45, 10);

    this.addChild(this.bg, this.icon, this.text);
  }

  public updateAmount(newAmount: number) {
    const current = { val: parseInt(this.text.text) };
    gsap.to(current, {
      val: newAmount,
      duration: 0.5,
      onUpdate: () => {
        this.text.text = Math.floor(current.val).toString();
      },
    });

    const screenWidth = window.innerWidth;
    const targetScale = screenWidth < 400 ? 0.7 : 1;

    gsap.fromTo(
      this.scale,
      { x: targetScale * 1.2, y: targetScale * 1.2 },
      { x: targetScale, y: targetScale, duration: 0.3 }
    );
  }
}