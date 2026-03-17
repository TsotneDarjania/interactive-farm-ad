import { Experience } from "./Experience";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";
import { globalEvents } from "./EventBus";
import type { UI } from "./UI";
import { TutorialPositions } from "../constants/tutorialPositions";

export class GameLogic {
  private experience: Experience;
  private ui: UI;
  private gold = 0;
  private tutorialPhase = 0;
  private hasBoughtFence = false;
  private isGameOver = false;

  private coinSound: Howl;
  private processingIds = new Set<string>();

  constructor(experience: Experience, ui: UI) {
    this.experience = experience;
    this.ui = ui;

    this.coinSound = new Howl({
      src: ["sounds/coin.wav", "sounds/coin.mp3"],
      volume: 0.4,
      preload: true,
    });

    this.init();
  }

  private init() {
    this.ui.setGameState(this.gold);

    globalEvents.on("intro-complete", () => {
      this.ui.showStartHint();
    });

    globalEvents.on("sync-world-ui", (uiData) => {
      // ვამოწმებთ, რომელიმე ხორბალი ხომ არ შეივსო (100%-ზე ავიდა)
      uiData.forEach((item: any) => {
        if (item.progress >= 1 && !this.processingIds.has(item.id)) {
          this.processingIds.add(item.id);
          
          // ვეუბნებით UI-ს რომ გააფრინოს კოინები ამ ობიექტის ეკრანული პოზიციიდან
          this.ui.spawnFlyingCoins(item.x, item.y, item.reward || 25, item.id);
          
          // თუ ტუტორიალის ფაზა იყო, ვმალავთ სათიბს
          if (this.tutorialPhase === 2) {
             this.ui.setTutorialTarget(null);
          }
        }
      });
      
      this.ui.syncWorldItems(uiData);
    });

    globalEvents.on("tutorial-start", () => {
      this.tutorialPhase = 1;
      this.ui.showMenu();
      
      const harvestWheatPoint = TutorialPositions["harvest_wheat"];

      const onStartClick = () => {
        if (this.tutorialPhase === 1) {
          this.experience.movePlayerToViewpoint("harvest_wheat", "waypoint-reached");
          window.removeEventListener("pointerdown", onStartClick);
        }
      };
      
      setTimeout(() => {
        window.addEventListener("pointerdown", onStartClick);
      }, 500);
    });

    globalEvents.on("waypoint-reached", () => {
      if (this.tutorialPhase === 1) {
        this.tutorialPhase = 2;
        this.experience.triggerWheatScythe();
        this.ui.setTutorialTarget({ type: "world-spot", id: "wheat_harvest" });
      }
    });

    globalEvents.on("try-purchase", (id: string) => {
      this.handlePurchase(id);
    });

    // ძველი "collect-coin"-ის მაგივრად ახლა ვიჭერთ "add-gold"-ს (რასაც UI აგზავნის ანიმაციის მერე)
    globalEvents.on("add-gold", (data: { id: string; amount: number }) => {
      this.coinSound.play();

      this.gold += data.amount;
      this.ui.setGameState(this.gold); // ეს ანიმაციით განაახლებს რიცხვს UI-ში
      this.experience.resetItemProgress(data.id);

      setTimeout(() => this.processingIds.delete(data.id), 500);

      // თუ პირველი მოსავალი ავიღეთ და ფული დაგვიგროვდა, ვასწავლით ქათმის ყიდვას
      if (this.tutorialPhase === 2 && this.gold >= 25) {
        this.tutorialPhase = 3;
        this.ui.setTutorialTarget({ type: "menu", id: ObjectType.CHICKEN });
      }
    });
  }

  private handlePurchase(id: string) {
    if (this.isGameOver) return;

    const itemData = UI_ITEMS.find((i) => i.id === id);
    if (!itemData || this.gold < itemData.price) return;

    if (!this.experience.hasSpaceFor(id)) {
      this.ui.showWarning("No space left! Buy a new fence first.");
      return;
    }

    if (this.tutorialPhase === 3 && id === ObjectType.CHICKEN) {
      this.tutorialPhase = 4;
      this.ui.setTutorialTarget({ type: "world" }); 
      this.experience.moveCameraToPlayPosition();
    } else if (this.tutorialPhase < 3) {
      return;
    }

    this.gold -= itemData.price;
    this.ui.setGameState(this.gold);
    this.experience.spawnFromObjects(id);

    if (id === ObjectType.FENCE) {
      this.hasBoughtFence = true;
    } else if (
      this.hasBoughtFence &&
      id !== ObjectType.FENCE &&
      !this.isGameOver
    ) {
      this.isGameOver = true;

      setTimeout(() => {
        this.ui.showEndScreen("https://github.com/TsotneDarjania");
      }, 3000);
    }
  }
}