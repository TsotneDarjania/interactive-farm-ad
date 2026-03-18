import { Experience } from "./Experience";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";
import { globalEvents } from "./EventBus";
import type { UI } from "./UI";
import { EconomyManager } from "./EconomyManager";
// import { TutorialManager } from "./TutorialManager";
import { TutorialState } from "../constants/tutorialSteps";

export class GameLogic {
  private experience: Experience;
  private ui: UI;
  private economyManager: EconomyManager;
  // private tutorialManager: TutorialManager;

  private isGameOver = false;
  private coinSound: Howl;
  private processingIds = new Set<string>();

  private playerIsOnPoint: "default" | "wheat" | "fence" = "default";

  constructor(experience: Experience, ui: UI) {
    this.experience = experience;
    this.ui = ui;
    this.economyManager = new EconomyManager(this.ui);
    // this.tutorialManager = new TutorialManager(this.ui, this.experience);

    this.coinSound = new Howl({
      src: ["sounds/coin.wav", "sounds/coin.mp3"],
      volume: 0.4,
      preload: true,
    });

    this.init();
  }

  private init() {
    // 1. თამაში დაიწყო
    globalEvents.on("intro-complete", () => {
      // this.tutorialManager.handleEvent("START");
      this.ui.showMenu();
    });

    globalEvents.on("wheat-clicked", async () => {
      await this.experience.focusOnObject(ObjectType.WHEAT);
      this.playerIsOnPoint = "wheat";
      this.experience.startWheatWorking();
    });

    globalEvents.on("fance-clicked", async () => {
      await this.experience.focusOnObject(ObjectType.FENCE);
      this.playerIsOnPoint = "fence";
      this.experience.stopWheatScytheWorking();
    });

    // === ცხოველის კოინის აღების ივენთი (აღდგენილი და გამართული) ===
    globalEvents.on("animal-coin-collected", (data: { reward: number; x: number; y: number; id: string }) => {
      // ვაფრენთ კოინებს PIXI-ში იმ წერტილიდან, სადაც 3D-ში კოინი იყო
      this.ui.spawnFlyingCoins(
        data.x,
        data.y,
        data.reward,
        data.id
      );
    });

    globalEvents.on("wheat-step-completed", (data: any) => {
      // ვიღებთ კამერას და ეკრანის ზომებს 2D პოზიციის გამოსათვლელად
      const camera = this.experience.camera;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // ვიძახებთ ProgressFill-ის get2DPosition ფუნქციას
      const screenPos = data.sourceEntity.progressFill.get2DPosition(
        camera,
        width,
        height
      );

      if (screenPos) {
        // ვაფრენთ კოინებს PIXI.js-ში
        this.ui.spawnFlyingCoins(
          screenPos.x,
          screenPos.y,
          data.reward,
          data.id
        );
      } else {
        // თუ კადრში არაა, პირდაპირ ვრიცხავთ
        globalEvents.emit("add-gold", { id: data.id, amount: data.reward });
      }
    });

    globalEvents.on("sync-world-ui", (uiData) => {
      uiData.forEach((item: any) => {
        if (item.progress >= 1 && !this.processingIds.has(item.id)) {
          this.processingIds.add(item.id);
          this.ui.setTutorialTarget(null);
        }
      });
      this.ui.syncWorldItems(uiData);
    });



    globalEvents.on("try-purchase", async (id: string) => {
      await this.handlePurchase(id);
    });
  }

  private async handlePurchase(id: string) {
    if (this.isGameOver) return;

    const itemData = UI_ITEMS.find((i) => i.id === id);
    if (!itemData) return;

    if (!this.economyManager.spendGold(itemData.price)) {
      this.ui.showWarning("Not enough money!");
      return;
    }

    this.experience.spawnFromObjects(id);
    this.experience.fence.showWaypoint();

    // 3. ნივთი იყიდა (ვატყობინებთ ტუტორიალს)
    // await this.tutorialManager.handleEvent("ITEM_BOUGHT", id);

    // თამაშის დასრულების ლოგიკა
    // if (this.tutorialManager.getState() === TutorialState.COMPLETED && id !== ObjectType.FENCE) {
    //   this.isGameOver = true;
    //   setTimeout(() => {
    //     this.ui.showEndScreen("https://github.com/TsotneDarjania");
    //   }, 3000);
    // }
  }
}