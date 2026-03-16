import * as PIXI from "pixi.js";
import gsap from "gsap";

export class TutorialFinger extends PIXI.Container {
  private icon: PIXI.Text;

  constructor() {
    super();
    this.icon = new PIXI.Text({
      text: "👆",
      style: { fontSize: 50 },
    });
    this.icon.anchor.set(0.5);
    this.addChild(this.icon);

    this.startAnimation();
    this.eventMode = "none";
  }

  private startAnimation() {
    gsap.to(this.icon, {
      y: 20,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  public hide() {
    gsap.killTweensOf(this.icon);
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => this.destroy(),
    });
  }
}
