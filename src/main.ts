import "./style.css";
import { Experience } from "./core/Experience";
import { GameLogic } from "./core/GameLogic";
import { UI } from "./core/UI";
import { Howl, Howler } from "howler";

const threeCanvas = document.getElementById(
  "three-canvas",
) as HTMLCanvasElement;
const pixiCanvas = document.getElementById("pixi-canvas") as HTMLCanvasElement;

const experience = new Experience(threeCanvas, pixiCanvas);
const ui = new UI(pixiCanvas);

new GameLogic(experience, ui);

const bgMusic = new Howl({
  src: ["sounds/bg-music.mp3"],
  html5: true,
  loop: true,
  volume: 0.6,
  autoplay: true,
});

const unlockAudio = () => {
  if (Howler.ctx && Howler.ctx.state === "suspended") {
    Howler.ctx.resume().then(() => {
      if (!bgMusic.playing()) bgMusic.play();
    });
  }
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
};

window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);
