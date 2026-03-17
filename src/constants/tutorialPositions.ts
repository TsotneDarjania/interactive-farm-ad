import * as THREE from "three";
import { TUTORIAL_STEP } from "./tutorialSteps";

export interface ViewPoint {
  cameraPos: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  playerPos: THREE.Vector3;
  playerRotation: number;
}

export const TutorialPositions: Record<string, ViewPoint> = {
  [TUTORIAL_STEP.HARVEST_WHEAT]: {
    cameraPos: new THREE.Vector3(30, 20, -10),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    playerPos: new THREE.Vector3(10.6, 4.2, -2),
    playerRotation: 0,
  },
  [TUTORIAL_STEP.BUY_FENCE]: {
    cameraPos: new THREE.Vector3(0, 25, 10),
    cameraTarget: new THREE.Vector3(0, 5, 0),
    playerPos: new THREE.Vector3(-10, 4.2, 5),
    playerRotation: Math.PI,
  },
  [TUTORIAL_STEP.BUY_CHICKEN]: {
    cameraPos: new THREE.Vector3(20, 25, 10),
    cameraTarget: new THREE.Vector3(0, 5, 0),
    playerPos: new THREE.Vector3(0, 4.2, 5),
    playerRotation: Math.PI,
  },
};
