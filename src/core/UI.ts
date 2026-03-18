import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { Howler } from "howler"; 

import { globalEvents } from "../core/EventBus"; 
import { ShopMenuUI } from "../ui/ShopMenuUI";
import { TutorialUI } from "../ui/TutorialUI";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import { EndScreenUI } from "../ui/EndScreenUI";
import type { FarmItemUI } from "../ui/FarmItemUI";

export class UI {
  private app: PIXI.Application;

  private worldUIContainer = new PIXI.Container();
  private shopMenu: ShopMenuUI;
  private tutorial: TutorialUI;
  public currencyDisplay: CurrencyDisplay; // ვისიბილობა შევცვალე public-ზე, რომ GameLogic-მა მიწვდეს
  private endScreen: EndScreenUI; 
  private warningText: PIXI.Text;

  private worldItems = new Map<string, FarmItemUI>();
  private visualGold = 0;
  private tutorialTarget: { type: "menu" | "world" | "world-spot"; id?: string } | null = null;
  
  private worldSpotPos: { x: number; y: number } | null = null;

  constructor(pixiCanvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    this.shopMenu = new ShopMenuUI();
    this.tutorial = new TutorialUI();
    this.currencyDisplay = new CurrencyDisplay(0);
    this.endScreen = new EndScreenUI(); 

    this.warningText = new PIXI.Text({
      text: "",
      style: {
        fontFamily: "Arial",
        fontSize: 32,
        fill: 0xff4444,
        fontWeight: "bold",
        dropShadow: { color: 0x000000, alpha: 0.8, blur: 4, distance: 2 },
      },
    });
    this.warningText.anchor.set(0.5);
    this.warningText.visible = false;

    this.init(pixiCanvas);
  }

  private async init(canvas: HTMLCanvasElement) {
    await this.app.init({
      canvas,
      backgroundAlpha: 0,
      resizeTo: window,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.stage.addChild(this.worldUIContainer);
    this.app.stage.addChild(this.shopMenu);
    this.app.stage.addChild(this.tutorial);
    this.app.stage.addChild(this.currencyDisplay);
    this.app.stage.addChild(this.warningText);
    this.app.stage.addChild(this.endScreen);

    this.currencyDisplay.visible = false;

    this.setupEvents();
    
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      window.removeEventListener("pointerdown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);

    this.app.renderer.on("resize", this.onResize, this);
    this.onResize();

    this.app.ticker.add(() => this.updateFingerPosition());
  }

  private setupEvents() {
    this.shopMenu.events.on("purchase", (id: string) => {
      globalEvents.emit("try-purchase", id);
    });

    globalEvents.on("sync-tutorial-spot", (pos: { x: number; y: number }) => {
      this.worldSpotPos = pos;
    });
  }


  public showMenu() {
    if (this.currencyDisplay) {
      this.currencyDisplay.visible = true;
      gsap.from(this.currencyDisplay, { y: -50, alpha: 0, duration: 0.5 });
    }
    this.shopMenu.showMenu(this.app.renderer.screen.height);
    this.shopMenu.updateAffordability(this.visualGold);
  }

  public setGameState(gold: number) {
    this.visualGold = gold;
    this.currencyDisplay.updateAmount(gold);
    this.shopMenu.updateAffordability(this.visualGold);
  }

  public setTutorialTarget(target: { type: "menu" | "world" | "world-spot"; id?: string } | null) {
    this.tutorialTarget = target;
    if (!target) {
      this.tutorial.hideFinger();
    }
  }

  private updateFingerPosition() {
    if (!this.tutorialTarget) return;
    const screenWidth = this.app.renderer.screen.width;
    const responsiveScale = screenWidth < 400 ? 0.6 : screenWidth < 700 ? 0.8 : 1;

    if (this.tutorialTarget.type === "menu" && this.tutorialTarget.id) {
      const pos = this.shopMenu.getButtonGlobalPos(this.tutorialTarget.id);
      if (pos) {
        this.tutorial.pointFingerAt(pos.x, pos.y + 35 * this.shopMenu.scale.y, responsiveScale);
      }
    } 
    else if (this.tutorialTarget.type === "world-spot" && this.worldSpotPos) {
      this.tutorial.pointFingerAt(this.worldSpotPos.x, this.worldSpotPos.y, responsiveScale);
    } 
    else if (this.tutorialTarget.type === "world") {
      let foundCoin = false;
      for (const itemUI of this.worldItems.values()) {
        if (itemUI.isReady) {
          const pos = itemUI.getGlobalPosition();
          this.tutorial.pointFingerAt(pos.x, pos.y - 50 * responsiveScale, responsiveScale);
          foundCoin = true;
          break;
        }
      }
      if (!foundCoin) {
        this.tutorial.hideFinger();
      }
    }
  }

  // === ახალი: კოინების გაფრენის ანიმაცია ===
  public spawnFlyingCoins(startX: number, startY: number, amountToGive: number, id: string) {
    console.log(amountToGive)
    const coinCount = Math.min(Math.max(Math.floor(amountToGive / 5), 3), 10); // 3-დან 10 კოინამდე
    const targetPos = { x: this.currencyDisplay.x + 20, y: this.currencyDisplay.y + 15 };

    for (let i = 0; i < coinCount; i++) {
      const coin = new PIXI.Text({ text: "💰", style: { fontSize: 24 } });
      coin.position.set(startX, startY);
      coin.anchor.set(0.5);
      
      // ვიზუალურად ვამატებთ ყველაზე მაღალ შრეზე
      this.app.stage.addChild(coin);

      const delay = i * 0.1; // რიგ-რიგობით მიფრინავენ
      const tl = gsap.timeline({
        delay: delay,
        onComplete: () => {
          this.app.stage.removeChild(coin);
          coin.destroy();
          // როცა ბოლო კოინი მივა, მაშინ ვისვრით ივენთს რომ ფული დაემატოს
          if (i === coinCount - 1) {
            globalEvents.emit("add-gold", { id, amount: amountToGive });
          }
        }
      });

      // კოინი ჯერ ცოტა ზემოთ და გვერდზე ხტება...
      tl.to(coin.position, {
        x: startX + (Math.random() - 0.5) * 100,
        y: startY - 100 - Math.random() * 50,
        duration: 0.4,
        ease: "power2.out"
      });

      // ...და მერე მიფრინავს მიზნისკენ
      tl.to(coin.position, {
        x: targetPos.x,
        y: targetPos.y,
        duration: 0.6,
        ease: "back.in(1.5)"
      });
      
      // ფრენის დროს ტრიალებს
      tl.to(coin, { rotation: Math.PI * 4, duration: 1 }, 0);
      tl.to(coin.scale, { x: 0.5, y: 0.5, duration: 0.6 }, 0.4);
    }
  }

  public showWarning(message: string) { /* ... იგივე კოდი ... */ }
  public showEndScreen(url?: string) { /* ... იგივე კოდი ... */ }
  public syncWorldItems(dataArray: any[]) { /* ... იგივე კოდი ... */ }

  private onResize() {
    requestAnimationFrame(() => {
      const { width, height } = this.app.renderer.screen;
      
      if (this.tutorial) this.tutorial.resize(width, height);
      if (this.shopMenu) this.shopMenu.resize(width, height);
      if (this.endScreen) this.endScreen.resize(width, height); 

      if (this.currencyDisplay) {
        const scale = width < 400 ? 0.7 : 1;
        this.currencyDisplay.scale.set(scale);
        this.currencyDisplay.x = width - 120 * scale; // შევამცირე margin, რადგან border აღარაა
        this.currencyDisplay.y = 20;
      }
      if (this.warningText && this.warningText.visible) {
        this.warningText.position.set(width / 2, height / 2 - 50);
      }
      if (this.shopMenu && this.shopMenu.visible) {
        this.shopMenu.updateAffordability(this.visualGold);
      }
    });
  }
}