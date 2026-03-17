import { globalEvents } from "./EventBus";
import { ObjectType } from "../constants/types";
import type { UI } from "./UI";

export class TutorialManager {
  private ui: UI;
  private phase = 0;
  private clickHandler: ((e: Event) => void) | null = null;

  constructor(ui: UI) {
    this.ui = ui;
    this.setupEvents();
  }

  private setupEvents() {
    globalEvents.on("tutorial-start", () => this.startPhase1());
    globalEvents.on("waypoint-reached", () => this.startPhase2());
    // როგორც კი ფული აიღო, ეგრევე გადავდივართ ყიდვის ფაზაზე (არანაირი ლოდინი!)
    globalEvents.on("harvest-complete", () => this.startPhase3()); 
  }

  // ფაზა 1: ინტრო დასრულდა, ველოდებით პირველ კლიკს რომ ფერმერი გავაქციოთ
  private startPhase1() {
    this.phase = 1;
    this.ui.showMenu();
    
    // ვბლოკავთ შოპში ყველაფერს, ღობის გარდა
    if ((this.ui as any).shopMenu && (this.ui as any).shopMenu.enableOnly) {
      (this.ui as any).shopMenu.enableOnly(ObjectType.FENCE);
    }

    this.waitForClick(() => {
      if (this.phase === 1) {
        globalEvents.emit("player-move-to-wheat");
      }
    });
  }

  // ფაზა 2: ფერმერი მივიდა, ვიწყებთ თიბვას 
  private startPhase2() {
    this.phase = 2;
    this.ui.setTutorialTarget({ type: "world-spot", id: "wheat_harvest" });
    globalEvents.emit("start-harvesting");
  }

  // ფაზა 3: ფული გაფრინდა, ეგრევე ვანთებთ თითს შოპზე!
  private startPhase3() {
    if (this.phase !== 2) return;
    this.phase = 3;
        // === აქ ვეუბნებით, რომ თითი ზუსტად ღობეს დაადოს! ===
    this.ui.setTutorialTarget({ type: "menu", id: ObjectType.FENCE }); 
  }

  // ფაზა 4: ტუტორიალი დასრულდა
  public completeTutorial() {
    this.phase = 4;
    this.ui.setTutorialTarget(null);
    // ვხსნით ბლოკს შოპზე (სხვა ცხოველებიც გამოჩნდება)
    if ((this.ui as any).shopMenu && (this.ui as any).shopMenu.enableOnly) {
      (this.ui as any).shopMenu.enableOnly(null);
    }
  }

  public getPhase(): number {
    return this.phase;
  }

  // ვიყენებთ მხოლოდ თამაშის დაწყებისას ერთხელ დასაკლიკად
  private waitForClick(callback: () => void) {
    if (this.clickHandler) {
      window.removeEventListener("pointerdown", this.clickHandler);
    }
    
    this.clickHandler = (e: Event) => {
      window.removeEventListener("pointerdown", this.clickHandler!);
      this.clickHandler = null;
      callback();
    };
    
    window.addEventListener("pointerdown", this.clickHandler);
  }
}