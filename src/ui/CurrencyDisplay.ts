import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class CurrencyDisplay extends PIXI.Container {
  private text: PIXI.Text;
  private icon: PIXI.Text;

  constructor(initialAmount: number) {
    super();

    this.icon = new PIXI.Text({
      text: "💰",
      style: {
        fontSize: 32,
        dropShadow: {
          color: 0x000000,
          alpha: 0.5,
          blur: 2,
          distance: 2,
        },
      },
    });
    this.icon.position.set(0, 0);

    this.text = new PIXI.Text({
      text: initialAmount.toString(),
      style: {
        fill: "#ffffff",
        fontSize: 30,
        fontWeight: "900",
        fontFamily: "Arial",
        dropShadow: {
          color: 0x000000,
          alpha: 0.8,
          blur: 4,
          distance: 3,
        },
      },
    });
    this.text.position.set(40, 0);

    this.addChild(this.icon, this.text);
  }

  public updateAmount(newAmount: number) {
    const current = { val: parseInt(this.text.text) || 0 };

    gsap.to(current, {
      val: newAmount,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        this.text.text = Math.floor(current.val).toString();
      },
    });

    const screenWidth = window.innerWidth;
    const targetScale = screenWidth < 400 ? 0.7 : 1;

    const tl = gsap.timeline();
    tl.to(
      this.scale,
      {
        x: targetScale * 1.3,
        y: targetScale * 1.3,
        duration: 0.15,
        ease: "back.out(2)",
      },
      0,
    );
    tl.to(this.text.style, { fill: "#ffd700", duration: 0.15 }, 0);

    tl.to(
      this.scale,
      { x: targetScale, y: targetScale, duration: 0.3, ease: "bounce.out" },
      0.15,
    );
    tl.to(this.text.style, { fill: "#ffffff", duration: 0.3 }, 0.15);
  }
}
