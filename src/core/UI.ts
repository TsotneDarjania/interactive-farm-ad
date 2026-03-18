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
  public currencyDisplay: CurrencyDisplay;
  private endScreen: EndScreenUI;
  private warningText: PIXI.Text;

  private worldItems = new Map<string, FarmItemUI>();
  private visualGold = 0;
  private tutorialTarget: {
    type: "menu" | "world" | "world-spot";
    id?: string;
  } | null = null;

  private worldSpotPos: { x: number; y: number } | null = null;

  constructor(pixiCanvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    this.shopMenu = new ShopMenuUI();
    this.tutorial = new TutorialUI();
    this.currencyDisplay = new CurrencyDisplay(0);
    this.endScreen = new EndScreenUI(); // <--- ეს უკვე გაქვს

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
    this.app.stage.addChild(this.endScreen); // <--- ენდ სქრინი ემატება

    this.currencyDisplay.visible = false;

    this.setupEvents();

    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === "suspended") {
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
    } else if (this.tutorialTarget.type === "world-spot" && this.worldSpotPos) {
      this.tutorial.pointFingerAt(this.worldSpotPos.x, this.worldSpotPos.y, responsiveScale);
    } else if (this.tutorialTarget.type === "world") {
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

  public spawnFlyingCoins(startX: number, startY: number, amountToGive: number, id: string) {
    const coinCount = Math.min(Math.max(Math.floor(amountToGive / 5), 4), 12); 
    const targetPos = { x: this.currencyDisplay.x + 20, y: this.currencyDisplay.y + 15 };

    for (let i = 0; i < coinCount; i++) {
      const coin = new PIXI.Text({ text: "💰", style: { fontSize: 24 } });
      coin.position.set(startX, startY);
      coin.anchor.set(0.5);
      coin.scale.set(0); 

      this.app.stage.addChild(coin);

      const popX = startX + (Math.random() - 0.5) * 120;
      const popY = startY - 70 - Math.random() * 60;
      const delay = i * 0.04; 

      let frameCount = 0;
      const spawnSparkle = () => {
        frameCount++;
        if (frameCount % 3 !== 0) return; 

        const sparkle = new PIXI.Graphics();
        sparkle.beginFill(0xffdd00, 0.8); 
        sparkle.drawCircle(0, 0, 2); 
        sparkle.endFill();
        sparkle.position.set(coin.x, coin.y); 
        
        this.app.stage.addChild(sparkle);

        gsap.to(sparkle, {
          y: sparkle.y + 15,
          alpha: 0,
          duration: 0.2, 
          onComplete: () => { if (!sparkle.destroyed) sparkle.destroy(); }
        });
      };

      const tl = gsap.timeline({
        delay: delay,
        onComplete: () => {
          if (!coin.destroyed) coin.destroy();

          if (i === coinCount - 1) {
            globalEvents.emit("add-gold", { id, amount: amountToGive });
            
            gsap.fromTo(this.currencyDisplay.scale, 
              { x: 1.2, y: 1.2 }, 
              { x: 1, y: 1, duration: 0.3, ease: "back.out(2)" }
            );
          }
        }
      });

      tl.to(coin.scale, { x: 1, y: 1, duration: 0.2, ease: "back.out(2)" }, 0);
      tl.to(coin.position, { x: popX, y: popY, duration: 0.3, ease: "power2.out" }, 0);
      tl.to(coin.position, { 
        x: targetPos.x, y: targetPos.y, duration: 0.45, ease: "power2.in", onUpdate: spawnSparkle 
      }, 0.3);
      tl.to(coin, { rotation: Math.PI * 4, duration: 0.75, ease: "none" }, 0);
      tl.set(coin, { alpha: 0, visible: false, renderable: false }, 0.74); 
    }
  }

  public showWarning(message: string) { /* ... */ }

  // === აქ ეკრანის გამოჩენის ლოგიკაა ===
  public showEndScreen(url?: string) {
    const { width, height } = this.app.renderer.screen;
    this.endScreen.show(width, height, url);
  }

  private onResize() {
    requestAnimationFrame(() => {
      const { width, height } = this.app.renderer.screen;

      if (this.tutorial) this.tutorial.resize(width, height);
      if (this.shopMenu) this.shopMenu.resize(width, height);
      if (this.endScreen) this.endScreen.resize(width, height); // <--- ააფდეითებს ზომას ენდ სქრინზეც

      if (this.currencyDisplay) {
        const scale = width < 400 ? 0.7 : 1;
        this.currencyDisplay.scale.set(scale);
        this.currencyDisplay.x = width - 120 * scale;
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