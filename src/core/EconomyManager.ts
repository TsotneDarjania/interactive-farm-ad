import { globalEvents } from "./EventBus";
import type { UI } from "./UI";

export class EconomyManager {
  private gold = 0;
  private ui: UI;

  constructor(ui: UI) {
    this.ui = ui;
    this.ui.setGameState(this.gold);

    globalEvents.on("add-gold", (data: { id: string; amount: number }) => {
      this.addGold(data.amount);
      // როცა ფული დაგვემატება, ვეუბნებით სისტემას, რომ თიბვის ფაზა დასრულდა
      globalEvents.emit("harvest-complete", data.id); 
    });
  }

  public addGold(amount: number) {
    this.gold += amount;
    this.ui.setGameState(this.gold);
  }

  public spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.ui.setGameState(this.gold);
      return true;
    }
    return false;
  }

  public getGold(): number {
    return this.gold;
  }
}