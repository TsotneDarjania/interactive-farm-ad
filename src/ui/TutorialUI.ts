import * as PIXI from "pixi.js";
import { TutorialFinger } from "./TutorialFinger";

export class TutorialUI extends PIXI.Container {
  public finger: TutorialFinger | null = null;

  constructor() {
    super();
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

  public resize(width: number, height: number) {
    // ოვერლეი აღარ გვაქვს, თითის პოზიცია კი UI.ts-დან ყოველ ფრეიმზე ახლდება
  }
}