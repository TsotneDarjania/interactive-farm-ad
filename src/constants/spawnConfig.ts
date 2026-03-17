import * as THREE from "three";
import { gsap } from "gsap";
import { ObjectType } from "./types";

export interface SpawnSettings {
  animation: (wrapper: THREE.Group) => void;
  scale?: number;
  position?: THREE.Vector3; // ობიექტის/ცხოველის გაჩენის ადგილი
  farmerStandPoint?: THREE.Vector3; // ფერმერი სად უნდა მივიდეს და დადგეს
}

export const SpawnConfig: Record<string, SpawnSettings> = {
  [ObjectType.CHICKEN]: {
    scale: 1,
    position: new THREE.Vector3(-1.5, 0, -4.5), // <--- შეცვალე ზუსტი კოორდინატით
    farmerStandPoint: new THREE.Vector3(-1.5, 0, -2.5),
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "back.out(2)",
      });
    },
  },
  [ObjectType.FENCE]: {
    scale: 10,
    position: new THREE.Vector3(0, 0, 0), // <--- შეცვალე
    farmerStandPoint: new THREE.Vector3(0, 0, 0),
    animation: (wrapper) => {
      const targetY = wrapper.position.y;
      wrapper.position.y += 15;
      gsap.to(wrapper.position, {
        y: targetY,
        duration: 0.8,
        ease: "bounce.out",
      });
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    },
  },
  [ObjectType.COW]: {
    scale: 2.5,
    position: new THREE.Vector3(-5, 0, 3), // <--- შეცვალე
    farmerStandPoint: new THREE.Vector3(-5, 0, 5),
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.6,
        ease: "back.out",
      });
    },
  },
  [ObjectType.PIG]: {
    scale: 1.2,
    position: new THREE.Vector3(5, 0, -4), // <--- შეცვალე
    farmerStandPoint: new THREE.Vector3(5, 0, -2),
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    },
  },
  [ObjectType.SHEEP]: {
    scale: 1.2,
    position: new THREE.Vector3(5, 0, 3), // <--- შეცვალე
    farmerStandPoint: new THREE.Vector3(5, 0, 5),
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    },
  },
  // === ხორბლის სრული კონფიგურაცია ===
  ["wheat"]: {
    scale: 3,
    position: new THREE.Vector3(-8, 5, -2), // <--- y იყოს 0, რომ მიწაზე დადგეს!
    farmerStandPoint: new THREE.Vector3(-6, 0, -2),
    animation: (wrapper) => {
      const targetY = wrapper.position.y;

      wrapper.scale.set(0, 0, 0);
      wrapper.rotation.set(0, 0, 0); // საწყისი როტაცია სუფთაა
      wrapper.position.y = targetY + 20;

      const tl = gsap.timeline();

      // 1. ვარდნა და ზრდა
      tl.to(
        wrapper.position,
        { y: targetY, duration: 0.4, ease: "power2.in" },
        0,
      );
      tl.to(
        wrapper.scale,
        { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(1.5)" },
        0,
      );

      // 2. დაჯახების "Shake" - სრულდება 0-ზე!
      tl.to(
        wrapper.rotation,
        {
          z: 0.1,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          ease: "power1.inOut",
        },
        "-=0.1",
      );

      // 3. გარანტია, რომ როტაცია ზუსტად 0-ზე დადგება ბოლოს
      tl.to(wrapper.rotation, { z: 0, duration: 0.1 });
    },
  },
};

export const DefaultConfig: SpawnSettings = {
  position: new THREE.Vector3(0, 0, 0),
  farmerStandPoint: new THREE.Vector3(0, 0, 0),
  animation: (wrapper) => {
    wrapper.scale.set(0, 0, 0);
    gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
  },
};
