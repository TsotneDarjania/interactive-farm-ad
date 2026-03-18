import { Experience } from "./Experience";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";
import { globalEvents } from "./EventBus";
import type { UI } from "./UI";
import { EconomyManager } from "./EconomyManager";
import { TutorialState } from "../constants/tutorialSteps";

// ინტერფეისი ობიექტებისთვის, რომლებსაც აქვთ მუშაობის ციკლი
interface WorkableItem {
  pauseWork?: () => void;
  resumeWork?: () => void;
}

type PlayerPosition = "default" | "wheat" | "fence";

export class GameLogic {
  private experience: Experience;
  private ui: UI;
  private economyManager: EconomyManager;

  private isGameOver = false;
  private isInitialized = false;
  private coinSound: Howl;
  private processingIds = new Set<string>();
  private playerIsOnPoint: PlayerPosition = "default";

  // === ახალი ცვლადი ცხოველების დასათვლელად ===
  private purchasedAnimalsCount = 0;

  constructor(experience: Experience, ui: UI) {
    this.experience = experience;
    this.ui = ui;
    this.economyManager = new EconomyManager(this.ui);

    this.coinSound = new Howl({
      src: ["sounds/coin.wav", "sounds/coin.mp3"],
      volume: 0.4,
      preload: true,
    });

    this.init();
  }

  private init() {
    globalEvents.on("intro-complete", () => {
      this.isInitialized = true;
      this.ui.showMenu();
    });

    globalEvents.on("wheat-clicked", async () => {
      if (!this.isInitialized || this.isGameOver) return;
      this.experience.hideArrow();

      await this.experience.focusOnObject(ObjectType.WHEAT);
      this.playerIsOnPoint = "wheat";
      this.experience.startWheatWorking();
      this.toggleAllAnimalsWork(false);
    });

    globalEvents.on("fance-clicked", async () => {
      if (!this.isInitialized || this.isGameOver) return;

      await this.experience.focusOnObject(ObjectType.FENCE);
      this.playerIsOnPoint = "fence";
      this.experience.stopWheatScytheWorking();
      this.toggleAllAnimalsWork(true);
    });

    globalEvents.on(
      "animal-coin-collected",
      (data: { reward: number; x: number; y: number; id: string }) => {
        if (!this.isInitialized || this.isGameOver) return;
          this.coinSound.play();
        this.ui.spawnFlyingCoins(data.x, data.y, data.reward, data.id);
      },
    );

    globalEvents.on("wheat-step-completed", (data: any) => {
      if (!this.isInitialized || this.isGameOver) return;
      this.handleWheatReward(data);
    });

    globalEvents.on("add-gold", (data: { id: string; amount: number }) => {
      if (!this.isInitialized || this.isGameOver) return;
      this.processGoldGain(data.id, data.amount);
    });

    globalEvents.on("try-purchase", (id: string) => {
      if (!this.isInitialized || this.isGameOver) return;
      this.handlePurchase(id);
    });
  }

  private handleWheatReward(data: any) {
    const { camera } = this.experience;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const screenPos = data.sourceEntity?.progressFill?.get2DPosition(
      camera,
      width,
      height,
    );

    if (screenPos) {
      this.coinSound.play();
      this.ui.spawnFlyingCoins(screenPos.x, screenPos.y, data.reward, data.id);
    } else {
      globalEvents.emit("add-gold", { id: data.id, amount: data.reward });
    }
  }

  private processGoldGain(id: string, amount: number) {
    if (this.processingIds.has(id)) return;

    this.processingIds.add(id);
    this.economyManager.addGold(amount);

    setTimeout(() => this.processingIds.delete(id), 500);
  }

  private toggleAllAnimalsWork(shouldWork: boolean) {
    this.experience.farmItems.forEach((item: WorkableItem) => {
      if (shouldWork) {
        item.resumeWork?.();
      } else {
        item.pauseWork?.();
      }
    });
  }

  private async handlePurchase(id: string) {
    if (this.isGameOver) return;

    const itemData = UI_ITEMS.find((i) => i.id === id);
    if (!itemData || !this.economyManager.spendGold(itemData.price)) return;

    this.experience.spawnAnimal(id);
    this.experience.fence.showWaypoint();

    if (this.playerIsOnPoint !== "fence") {
      const lastIndex = this.experience.farmItems.length - 1;
      const newAnimal = this.experience.farmItems[lastIndex] as WorkableItem;
      newAnimal?.pauseWork?.();
    }

    // === ენდ სქრინის ტრიგერი მე-5 ყიდვისას ===
    this.purchasedAnimalsCount++;

    if (this.purchasedAnimalsCount >= 8) {
      this.isGameOver = true;

      // 1.5 წამით ვაყოვნებთ, რომ მოთამაშემ დაინახოს ნაყიდი ცხოველი სანამ რეკლამა ამოხტება
      setTimeout(() => {
        this.ui.showEndScreen("https://github.com/TsotneDarjania");
        this.toggleAllAnimalsWork(false); // თამაშის დასრულებისას ყველაფერი გავაჩეროთ
        this.experience.stopWheatScytheWorking();
      }, 1500);
    }
  }
}
