import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import { FarmItemUI } from "../ui/FarmItemUI";
import { TutorialUI } from "../ui/TutorialUI";
import { EndScreenUI } from "../ui/EndScreenUI"; 
import { ShopMenuUI } from "../ui/ShopMenuUI";

export class UI {
  public events = new PIXI.EventEmitter();
  private app: PIXI.Application;

  private worldUIContainer = new PIXI.Container();
  private shopMenu: ShopMenuUI;
  private tutorial: TutorialUI;
  private currencyDisplay: CurrencyDisplay;
  private endScreen: EndScreenUI; 
  private warningText: PIXI.Text;

  private worldItems = new Map<string, FarmItemUI>();
  private visualGold = 0;
  private tutorialTarget: { type: "menu" | "world"; id?: string } | null = null;

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
    this.app.renderer.on("resize", this.onResize, this);
    this.onResize();

    this.app.ticker.add(() => this.updateFingerPosition());
  }

  private setupEvents() {
    this.tutorial.events.on("tutorial-start", () => {
      this.events.emit("tutorial-start");
    });
    this.shopMenu.events.on("purchase", (id: string) => {
      this.events.emit("try-purchase", id);
    });
  }

  public showEndScreen(url?: string) {
    const { width, height } = this.app.renderer.screen;
    this.endScreen.show(width, height, url);
  }

  public showWarning(message: string) {
    this.warningText.text = message;
    this.warningText.visible = true;
    const { width, height } = this.app.renderer.screen;
    this.warningText.position.set(width / 2, height / 2 - 50);
    const responsiveScale = width < 600 ? 0.6 : 1;
    this.warningText.alpha = 1;
    gsap.killTweensOf(this.warningText);
    gsap.killTweensOf(this.warningText.scale);
    gsap.fromTo(
      this.warningText.scale,
      { x: 0, y: 0 },
      {
        x: responsiveScale,
        y: responsiveScale,
        duration: 0.5,
        ease: "back.out",
      },
    );
    gsap.to(this.warningText, {
      alpha: 0,
      duration: 0.5,
      delay: 2,
      onComplete: () => {
        this.warningText.visible = false;
      },
    });
  }

  public setGameState(gold: number) {
    this.visualGold = gold;
    this.currencyDisplay.updateAmount(gold);
    this.shopMenu.updateAffordability(this.visualGold);
  }

  public setTutorialTarget(
    target: { type: "menu" | "world"; id?: string } | null,
  ) {
    this.tutorialTarget = target;
    if (!target) {
      this.tutorial.hideFinger();
    }
  }

  private updateFingerPosition() {
    if (!this.tutorialTarget) return;
    const screenWidth = this.app.renderer.screen.width;
    const responsiveScale =
      screenWidth < 400 ? 0.6 : screenWidth < 700 ? 0.8 : 1;

    if (this.tutorialTarget.type === "menu" && this.tutorialTarget.id) {
      const pos = this.shopMenu.getButtonGlobalPos(this.tutorialTarget.id);
      if (pos) {
        this.tutorial.pointFingerAt(
          pos.x,
          pos.y + 35 * this.shopMenu.scale.y,
          responsiveScale,
        );
      }
    } else if (this.tutorialTarget.type === "world") {
      let foundCoin = false;
      for (const itemUI of this.worldItems.values()) {
        if (itemUI.isReady) {
          const pos = itemUI.getGlobalPosition();
          this.tutorial.pointFingerAt(
            pos.x,
            pos.y - 50 * responsiveScale,
            responsiveScale,
          );
          foundCoin = true;
          break;
        }
      }
      if (!foundCoin) {
        this.tutorial.hideFinger();
      }
    }
  }

  public showStartHint() {
    const { width, height } = this.app.renderer.screen;
    this.tutorial.showStartHint(width, height);
  }

  public showMenu() {
    if (this.currencyDisplay) {
      this.currencyDisplay.visible = true;
      gsap.from(this.currencyDisplay, { y: -50, alpha: 0, duration: 0.5 });
    }
    this.shopMenu.showMenu(this.app.renderer.screen.height);
    this.shopMenu.updateAffordability(this.visualGold);
  }

  public syncWorldItems(dataArray: any[]) {
    dataArray.forEach((data) => {
      let uiElement = this.worldItems.get(data.id);
      if (!uiElement) {
        uiElement = new FarmItemUI(data.id, this.events);
        this.worldUIContainer.addChild(uiElement);
        this.worldItems.set(data.id, uiElement);
      }
      uiElement.updateData(data);
    });
  }

  private onResize() {
    requestAnimationFrame(() => {
      const { width, height } = this.app.renderer.screen;
      this.tutorial.resize(width, height);
      this.shopMenu.resize(width, height);
      this.endScreen.resize(width, height); 

      if (this.currencyDisplay) {
        const scale = width < 400 ? 0.7 : 1;
        this.currencyDisplay.scale.set(scale);
        this.currencyDisplay.x = width - 160 * scale;
        this.currencyDisplay.y = 20;
      }
      if (this.warningText.visible) {
        this.warningText.position.set(width / 2, height / 2 - 50);
      }
      if (this.shopMenu.visible) {
        this.shopMenu.updateAffordability(this.visualGold);
      }
    });
  }
}
