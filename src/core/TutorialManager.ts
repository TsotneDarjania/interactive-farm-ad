// import { ObjectType } from "../constants/types";
// import { TutorialState, TUTORIAL_STEP } from "../constants/tutorialSteps";
// import type { UI } from "./UI";
// import type { Experience } from "./Experience";

// export class TutorialManager {
//   private ui: UI;
//   private experience: Experience;
//   private state: TutorialState = TutorialState.INIT;

//   constructor(ui: UI, experience: Experience) {
//     this.ui = ui;
//     this.experience = experience;
//   }

//   public async handleEvent(eventName: string, payload?: any) {
//     switch (this.state) {
        
//       case TutorialState.INIT:
//         if (eventName === "START") {
//         //   this.state = TutorialState.WAITING_FOR_MOVE;
//           this.ui.showMenu();
//         }
//         break;

//       case TutorialState.WAITING_FOR_MOVE:
//         if (eventName === "CLICKED_SCREEN") {
//           this.state = TutorialState.HARVESTING;
//           this.ui.setTutorialTarget(null); // ვმალავთ საწყის თითს
          
//           // ფერმერი მიდის
//           await this.experience.focusOnObject("wheat");
          
//           // იწყება თიბვა
//           this.ui.setTutorialTarget({ type: "world-spot", id: "wheat_harvest" });
//           this.experience.triggerWheatScythe();
//         }
//         break;

//       case TutorialState.HARVESTING:
//         if (eventName === "GOLD_COLLECTED") {
//           this.state = TutorialState.BUYING_FENCE;
          
//           // კამერა ბრუნდება, ვანთებთ შოპს
//           this.experience.moveCameraToPlayPosition();
//           this.ui.setTutorialTarget({ type: "menu", id: ObjectType.FENCE });
//         }
//         break;

//       case TutorialState.BUYING_FENCE:
//         if (eventName === "ITEM_BOUGHT" && payload === ObjectType.FENCE) {
//           this.state = TutorialState.COMPLETED;
          
//           this.ui.setTutorialTarget(null);
//           if ((this.ui as any).shopMenu) {
//             (this.ui as any).shopMenu.enableOnly(null); // ყველაფერი იხსნება
//           }

//           // ფერმერი მიდის ღობესთან
//           await this.experience.focusOnObject(ObjectType.FENCE);
//         }
//         break;

//       case TutorialState.COMPLETED:
//         // ტუტორიალი მორჩა, აქ აღარაფერს ვაკეთებთ
//         break;
//     }
//   }

//   public getState(): TutorialState {
//     return this.state;
//   }