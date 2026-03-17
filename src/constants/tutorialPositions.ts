import * as THREE from "three";

export interface ViewPoint {
  cameraPos: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  playerPos: THREE.Vector3;
  playerRotation: number;
}

export const TutorialPositions: Record<string, ViewPoint> = {
  harvest_wheat: {
    cameraPos: new THREE.Vector3(30, 20, -10),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    playerPos: new THREE.Vector3(10.6, 4.2, -2), 
    playerRotation: 0, 
  },
  buy_chicken: {
    cameraPos: new THREE.Vector3(20, 25, 10),
    cameraTarget: new THREE.Vector3(0, 5, 0),
    playerPos: new THREE.Vector3(0, 4.2, 5),
    playerRotation: Math.PI,
  },
};