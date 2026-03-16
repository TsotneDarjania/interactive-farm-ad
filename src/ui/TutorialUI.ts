import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { BlinkText } from "./BlinkText";
import { TutorialFinger } from "./TutorialFinger";

export class TutorialUI extends PIXI.Container {
  public events = new PIXI.EventEmitter();
  private overlay = new PIXI.Graphics();
  private startHint: BlinkText | null = null;
  public finger: TutorialFinger | null = null;
  private isActive = true;

  constructor() {
    super();
    this.addChild(this.overlay);
    this.overlay.visible = false;
  }

  public showStartHint(width: number, height: number) {
    this.drawOverlay(width, height);
    this.overlay.visible = true;
    this.overlay.alpha = 0;

    this.startHint = new BlinkText("GROW YOUR FARM");

    if (!this.finger) {
      this.finger = new TutorialFinger();
      this.addChild(this.finger);
    }

    this.addChild(this.startHint);

    this.eventMode = "static";
    this.hitArea = new PIXI.Rectangle(0, 0, width, height);
    this.resize(width, height);

    gsap.to(this.overlay, { alpha: 1, duration: 0.5 });

    this.once("pointerdown", () => {
      this.cleanupHint();
      this.events.emit("tutorial-start");
    });
  }

  public pointFingerAt(x: number, y: number, scale: number = 1) {
    if (!this.finger) {
      this.finger = new TutorialFinger();
      this.addChild(this.finger);
    }

    this.finger.visible = true;
    this.finger.position.set(x, y);
    this.finger.scale.set(scale); 
  }

  public hideFinger() {
    if (this.finger) {
      this.finger.visible = false;
    }
  }

  private drawOverlay(width: number, height: number) {
    this.overlay
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x000000, alpha: 0.6 });
  }

  public resize(width: number, height: number) {
    if (!this.isActive) return;
    this.drawOverlay(width, height);
    this.hitArea = new PIXI.Rectangle(0, 0, width, height);

    if (this.startHint && this.finger) {
      const textScale = width < 600 ? 0.8 : 1;
      this.startHint.scale.set(textScale);
      this.startHint.position.set(width / 2, height / 2);
      this.startHint.resize();

      if (this.eventMode === "static") {
        this.finger.position.set(width / 2, height / 2 + 100 * textScale);
        this.finger.scale.set(textScale);
      }
    }
  }

  private cleanupHint() {
    this.isActive = false;
    if (this.startHint) {
      this.startHint.hide();
      this.startHint = null;
    }
    this.eventMode = "none";
    gsap.to(this.overlay, {
      alpha: 0,
      duration: 0.5,
      onComplete: () => {
        this.overlay.visible = false;
      },
    });
  }
}
