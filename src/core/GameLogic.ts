import { Experience } from "./Experience";
import { UI } from "./UI";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";

export class GameLogic {
  private experience: Experience;
  private ui: UI;
  private gold = 25;
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
      preload: true
    });

    this.init();
  }

  private init() {
    this.ui.setGameState(this.gold);

    this.experience.events.on("intro-complete", () => {
      this.ui.showStartHint();
    });

    this.experience.events.on("sync-world-ui", (uiData) => {
      this.ui.syncWorldItems(uiData);
    });

    this.ui.events.on("tutorial-start", () => {
      this.tutorialPhase = 1;
      this.ui.showMenu();
      this.ui.setTutorialTarget({ type: "menu", id: ObjectType.CHICKEN });
    });

    this.ui.events.on("try-purchase", (id: string) => {
      this.handlePurchase(id);
    });

    this.ui.events.on("collect-coin", (data: { id: string, amount: number }) => {
      if (this.processingIds.has(data.id)) return;

      this.processingIds.add(data.id);
      this.coinSound.play(); 
      
      this.gold += data.amount;
      this.ui.setGameState(this.gold);
      this.experience.resetItemProgress(data.id);

      setTimeout(() => this.processingIds.delete(data.id), 500);

      if (this.tutorialPhase === 2) {
        this.tutorialPhase = 3; 
        this.ui.setTutorialTarget(null); 
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

    if (this.tutorialPhase === 1 && id === ObjectType.CHICKEN) {
      this.tutorialPhase = 2;
      this.ui.setTutorialTarget({ type: "world" }); 
      this.experience.moveCameraToPlayPosition(); 
    } else if (this.tutorialPhase !== 3) {
      return; 
    }

    this.gold -= itemData.price;
    this.ui.setGameState(this.gold);
    this.experience.spawnFromObjects(id);

    if (id === ObjectType.FENCE) {
      this.hasBoughtFence = true;
    } 
    else if (this.hasBoughtFence && id !== ObjectType.FENCE && !this.isGameOver) {
      this.isGameOver = true; 
      
      setTimeout(() => {
        this.ui.showEndScreen("https://github.com/TsotneDarjania");
      }, 3000);
    }
  }
}