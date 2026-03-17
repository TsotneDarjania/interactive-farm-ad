import { Experience } from "./Experience";
import { ObjectType, UI_ITEMS } from "../constants/types";
import { Howl } from "howler";
import { globalEvents } from "./EventBus"; 
import type { UI } from "./UI";

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
      preload: true
    });

    this.init();
  }

  private init() {
    this.ui.setGameState(this.gold);

    globalEvents.on("intro-complete", () => {
      this.ui.showStartHint();
    });

    globalEvents.on("sync-world-ui", (uiData) => {
      this.ui.syncWorldItems(uiData);
    });

    globalEvents.on("tutorial-start", () => {
      this.tutorialPhase = 1; 
      this.ui.showMenu(); 
      this.ui.setTutorialTarget({ type: "world-spot", id: "wheat" });

      setTimeout(() => {
        const handleWheatSpawn = () => {
          if (this.tutorialPhase === 1) {
            this.tutorialPhase = 2; 
            this.ui.setTutorialTarget(null); 
            
            this.experience.spawnWheat(); 

            window.removeEventListener("pointerdown", handleWheatSpawn);
          }
        };
        window.addEventListener("pointerdown", handleWheatSpawn);
      }, 500); 
    });

    globalEvents.on("try-purchase", (id: string) => {
      this.handlePurchase(id);
    });

    globalEvents.on("collect-coin", (data: { id: string, amount: number }) => {
      if (this.processingIds.has(data.id)) return;

      this.processingIds.add(data.id);
      this.coinSound.play(); 
      
      const earnedAmount = data.amount > 0 ? data.amount : 25; 
      this.gold += earnedAmount;
      this.ui.setGameState(this.gold);
      this.experience.resetItemProgress(data.id);

      setTimeout(() => this.processingIds.delete(data.id), 500);

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
    } 
    else if (this.hasBoughtFence && id !== ObjectType.FENCE && !this.isGameOver) {
      this.isGameOver = true; 
      
      setTimeout(() => {
        this.ui.showEndScreen("https://github.com/TsotneDarjania");
      }, 3000);
    }
  }
}