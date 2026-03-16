import * as PIXI from "pixi.js";
import gsap from "gsap";

export class BlinkText extends PIXI.Container {
  private mainText: PIXI.Text;
  private subText: PIXI.Text;

  constructor(message: string) {
    super();

    this.mainText = new PIXI.Text({
      text: message,
      style: {
        fontFamily: "Arial Black, Gadget, sans-serif",
        fontSize: 36,
        fill: "#ffffff",
        stroke: { color: "#000000", width: 8 },
        align: "center",
      },
    });
    this.mainText.anchor.set(0.5);

    this.subText = new PIXI.Text({
      text: "START YOUR FARM ADVENTURE!",
      style: {
        fontFamily: "Arial",
        fontSize: 18,
        fill: "#FFD700",
        stroke: { color: "#000000", width: 4 },
        fontWeight: "bold",
      },
    });
    this.subText.anchor.set(0.5);
    this.subText.y = 50;

    this.addChild(this.mainText, this.subText);
    this.resize();
    this.startAnimations();
  }

  public resize() {
    const scale = window.innerWidth < 600 ? 0.7 : 1;
    this.scale.set(scale);
  }

  private startAnimations() {
    gsap.to(this.mainText.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }

  public hide() {
    gsap.killTweensOf(this.mainText.scale);
    gsap.to(this, {
      alpha: 0,
      y: "-=50",
      duration: 0.4,
      onComplete: () => this.destroy({ children: true, texture: true }),
    });
  }
}
