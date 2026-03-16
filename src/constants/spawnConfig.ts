import * as THREE from "three";
import { gsap } from "gsap";
import { ObjectType } from "./types";

export interface SpawnSettings {
  animation: (wrapper: THREE.Group) => void;
  scale?: number;
}

export const SpawnConfig: Record<string, SpawnSettings> = {
  [ObjectType.CHICKEN]: {
    scale: 1,
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    }
  },
  [ObjectType.FENCE]: {
    scale: 10,
    animation: (wrapper) => {
      const targetY = wrapper.position.y;
      wrapper.position.y += 15;
      gsap.to(wrapper.position, { y: targetY, duration: 0.8, ease: "bounce.out" });
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    }
  },
  [ObjectType.COW]: {
    scale: 2.5,
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out" });
    }
  },
  [ObjectType.PIG]: {
    scale: 1.2,
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    }
  },
  [ObjectType.SHEEP]: {
    scale: 1.2,
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    }
  }
};

export const DefaultConfig: SpawnSettings = {
  animation: (wrapper) => {
    wrapper.scale.set(0, 0, 0);
    gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
  }
};