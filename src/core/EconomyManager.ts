import type { UI } from "./UI";

export class EconomyManager {
  private gold = 0;
  private ui: UI;

  constructor(ui: UI) {
    this.ui = ui;
    this.updateUI();
  }

  public addGold(amount: number) {
    this.gold += amount;
    this.updateUI();
  }

  public spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.updateUI();
      return true;
    }
    return false;
  }

  public getGold(): number {
    return this.gold;
  }

  private updateUI() {
    this.ui.setGameState(this.gold);
  }
}
