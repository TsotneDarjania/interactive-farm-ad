import * as THREE from "three";
import { ObjectType } from "../constants/types";

type PenType = "empty" | "animals" | "plants";

export interface Pen {
  center: THREE.Vector3;
  type: PenType;
  count: number;
  maxCapacity: number;
}

export class PenManager {
  public pens: Pen[] = [];
  public spawnRadius = 2;

  constructor() {
    this.pens.push({
      center: new THREE.Vector3(10.5, 4.7, -6.5),
      type: "empty",
      count: 0,
      maxCapacity: 5,
    });
  }

  public hasSpace(itemType: string): boolean {
    if (itemType === ObjectType.FENCE) return true; 

    const targetPen = this.pens.find((pen) => {
      return (
        (pen.type === "empty" || pen.type === "animals") &&
        pen.count < pen.maxCapacity
      );
    });

    return !!targetPen;
  }

  public getSpawnPosition(itemType: string): THREE.Vector3 | null {
    if (itemType === ObjectType.FENCE) {
      const lastPen = this.pens[this.pens.length - 1];
      const newCenter = new THREE.Vector3(
        lastPen.center.x,
        4.7,
        lastPen.center.z + 8,
      );

      this.pens.push({
        center: newCenter,
        type: "empty",
        count: 0,
        maxCapacity: 5,
      });
      return newCenter;
    }

    const targetPen = this.pens.find((pen) => {
      if (
        (pen.type === "empty" || pen.type === "animals") &&
        pen.count < pen.maxCapacity
      ) {
        return true;
      }
      return false;
    });

    if (!targetPen) {
      return null;
    }

    targetPen.type = "animals";
    targetPen.count++;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.spawnRadius;

    return new THREE.Vector3(
      targetPen.center.x + Math.cos(angle) * dist,
      targetPen.center.y,
      targetPen.center.z + Math.sin(angle) * dist,
    );
  }
}
