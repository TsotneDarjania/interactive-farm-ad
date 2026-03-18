import * as THREE from "three";
import { gsap } from "gsap";
import { ObjectType } from "./types";

export interface SpawnSettings {
  // 1. ობიექტის პარამეტრები
  scale?: number;
  position?: THREE.Vector3; 
  animation: (wrapper: THREE.Group) => void;
  
  // 2. ფერმერის პარამეტრები (სად მივიდეს და საით გაიხედოს)
  farmerStandPoint?: THREE.Vector3; 
  farmerRotation?: number; 

  // 3. კამერის პარამეტრები (საიდან უყუროს ამ ობიექტს)
  cameraPos?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
}

export const SpawnConfig: Record<string, SpawnSettings> = {
  ["wheat"]: {
    scale: 2.5,
    position: new THREE.Vector3(10.7, 4, -6.5),
    farmerStandPoint: new THREE.Vector3(10.3, 3, -2.5),
    farmerRotation: 0, 
    cameraPos: new THREE.Vector3(30, 20, -10), // შენი ორიგინალი
    cameraTarget: new THREE.Vector3(0, 0, 0),  // შენი ორიგინალი
    animation: (wrapper) => {
      const targetY = wrapper.position.y;
      wrapper.scale.set(0, 0, 0);
      wrapper.rotation.set(0, 0, 0); 
      wrapper.position.y = targetY;

      const tl = gsap.timeline();
      tl.to(wrapper.position, { y: targetY, duration: 0.4, ease: "power2.in" }, 0);
      tl.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(1.5)" }, 0);
      tl.to(wrapper.rotation, { z: 0.1, duration: 0.1, yoyo: true, repeat: 3, ease: "power1.inOut" }, "-=0.1");
      tl.to(wrapper.rotation, { z: 0, duration: 0.1 });
    },
  },
  [ObjectType.FENCE]: {
    scale: 15,
    position: new THREE.Vector3(-10, 5, 0), 
    farmerStandPoint: new THREE.Vector3(-4.2, 0, 1),
    farmerRotation: -Math.PI / 2, 
    cameraPos: new THREE.Vector3(-17, 19, -15), // შენი ორიგინალი
    cameraTarget: new THREE.Vector3(-7, 5, 0), // შენი ორიგინალი
    animation: (wrapper) => {
      const targetY = wrapper.position.y;
      wrapper.position.y += 5;
      gsap.to(wrapper.position, { y: targetY, duration: 0.8, ease: "bounce.out" });
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    },
  },
  [ObjectType.CHICKEN]: {
    scale: 1.2,
    position: new THREE.Vector3(-10, 4.8, 0), 
    farmerStandPoint: new THREE.Vector3(-1.5, 0, -2.5),
    farmerRotation: 0,
    cameraPos: new THREE.Vector3(20, 25, 10), // შენი ორიგინალი
    cameraTarget: new THREE.Vector3(0, 5, 0), // შენი ორიგინალი
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    },
  },
  [ObjectType.PIG]: {
    scale: 1.5,
    position: new THREE.Vector3(-10, 4.8, 0), 
    farmerStandPoint: new THREE.Vector3(-1.5, 0, -2.5),
    farmerRotation: 0,
    cameraPos: new THREE.Vector3(20, 25, 10), // შენი ორიგინალი
    cameraTarget: new THREE.Vector3(0, 5, 0), // შენი ორიგინალი
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    },
  },
  [ObjectType.SHEEP]: {
    scale: 1.5,
    position: new THREE.Vector3(-10, 4.8, 0), 
    farmerStandPoint: new THREE.Vector3(-1.5, 0, -2.5),
    farmerRotation: 0,
    cameraPos: new THREE.Vector3(20, 25, 10), // შენი ორიგინალი
    cameraTarget: new THREE.Vector3(0, 5, 0), // შენი ორიგინალი
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    },
  },
  [ObjectType.COW]: {
    scale: 4,
    position: new THREE.Vector3(-10, 5.2, 0), 
    animation: (wrapper) => {
      wrapper.scale.set(0, 0, 0);
      gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" });
    },
  },
};

export const DefaultConfig: SpawnSettings = {
  position: new THREE.Vector3(0, 0, 0),
  animation: (wrapper) => {
    wrapper.scale.set(0, 0, 0);
    gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
  },
};