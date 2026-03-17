import { Experience } from "./Experience";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";
import { globalEvents } from "./EventBus";
import type { UI } from "./UI";
import { EconomyManager } from "./EconomyManager";
import { TutorialManager } from "./TutorialManager";
import { TUTORIAL_STEP } from "../constants/tutorialSteps";

export class GameLogic {
  private experience: Experience;
  private ui: UI;
  private economyManager: EconomyManager;
  private tutorialManager: TutorialManager;

  private hasBoughtFence = false;
  private isGameOver = false;
  private coinSound: Howl;
  private processingIds = new Set<string>();

  constructor(experience: Experience, ui: UI) {
    this.experience = experience;
    this.ui = ui;

    // მენეჯერების ინიციალიზაცია
    this.economyManager = new EconomyManager(this.ui);
    this.tutorialManager = new TutorialManager(this.ui);

    this.coinSound = new Howl({
      src: ["sounds/coin.wav", "sounds/coin.mp3"],
      volume: 0.4,
      preload: true,
    });

    this.init();
  }

  private init() {
    globalEvents.on("intro-complete", () => {
      this.ui.showStartHint();
    });

    globalEvents.on("sync-world-ui", (uiData) => {
      uiData.forEach((item: any) => {
        // თუ ბარი შეივსო და ჯერ არ დაგვიმუშავებია
        if (item.progress >= 1 && !this.processingIds.has(item.id)) {
          this.processingIds.add(item.id);

          // 1. ვაფრენთ კოინებს
          this.ui.spawnFlyingCoins(item.x, item.y, item.reward || 25, item.id);

          // 2. ეგრევე ვაჩერებთ თიბვას და ვარესეტებთ პროგრესს, რომ ციკლი არ გაიჭედოს
          this.experience.resetWheatHarvest();

          if (this.tutorialManager.getPhase() === 2) {
            this.ui.setTutorialTarget(null);
          }

          // if (this.tutorialManager.getPhase() === 2) {
          //    this.ui.setTutorialTarget(null);
          // }
        }
      });
      this.ui.syncWorldItems(uiData);
    });

    // === Tutorial Manager-ის ივენთები ===
    globalEvents.on("player-move-to-wheat", () => {
      this.experience.movePlayerToViewpoint(
        TUTORIAL_STEP.HARVEST_WHEAT,
        "waypoint-reached",
      );
    });

    globalEvents.on("start-harvesting", () => {
      this.experience.triggerWheatScythe();
    });

    // როცა კოინები მიფრინდება ადგილზე
    globalEvents.on("add-gold", (data: { id: string; amount: number }) => {
      this.economyManager.addGold(data.amount);
      this.coinSound.play();

      // ვასუფთავებთ ID-ს, რომ მომავალში ისევ შეძლოს მოთიბვა
      setTimeout(() => this.processingIds.delete(data.id), 500);

      // ვატყობინებთ ტუტორიალს, რომ მოსავალი აღებულია
      globalEvents.emit("harvest-complete");
    });

    globalEvents.on("try-purchase", (id: string) => {
      this.handlePurchase(id);
    });
  }

  private handlePurchase(id: string) {
    if (this.isGameOver) return;

    const itemData = UI_ITEMS.find((i) => i.id === id);
    if (!itemData) return;

    const currentPhase = this.tutorialManager.getPhase();

    if (!this.experience.hasSpaceFor(id)) {
      this.ui.showWarning("No space left! Buy a new fence first.");
      return;
    }

    if (this.economyManager.spendGold(itemData.price)) {
      this.experience.spawnFromObjects(id);

      if (currentPhase === 3) {
        this.experience.moveFarmerToAnotherPoint(ObjectType.FENCE);
      }

      if (id === ObjectType.FENCE) {
        this.hasBoughtFence = true;

        if (currentPhase === 3) {
          //  this.tutorialManager.completeTutorial();
        }
      } else if (this.hasBoughtFence && !this.isGameOver) {
        this.isGameOver = true;
        setTimeout(() => {
          this.ui.showEndScreen("https://github.com/TsotneDarjania");
        }, 3000);
      }
    } else {
      this.ui.showWarning("Not enough money!");
    }
  }
}
