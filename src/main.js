import * as THREE from "three";
import Player from "./classes/Player.js";
import Terrain from "./classes/Terrain.js";
import MiniMap from "./classes/MiniMap.js";
import Crosshair from "./classes/Crosshair.js";
import createBackground from "./utils/createBackground.js";
import { updateGame, restartGame } from "./utils/gameManagement.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

let gameOver = false;
let gameInitialized = false;
let controls, terrain, player, crosshair, miniMap, listener, backgroundAudio;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.getElementById("loading-screen");
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  document.querySelector(".progress-fill").style.width = `${Math.floor(
    progress
  )}%`;
  document.querySelector(".progress-text").textContent = `${Math.floor(
    progress
  )}%`;
};
loadingManager.onLoad = function () {
  window.setTimeout(() => {
    gameInitialized = true;
    loadingScreen.style.display = "none";
    animate(0);
  }, 500);
};
loadingManager.onError = function (url) {
  console.error("Error loading:", url);
};

const tips = [
  "Crouch while shooting to increase accuracy",
  "You are faster than most enemies - use this to your advantage",
  "Jumping greatly decreases accuracy - avoid it while shooting",
  "Keep a close eye on your ammo count",
  "Reload your weapon when safe - not during combat",
  "Some actions like moving decrease accuracy",
  "Keep a close eye on the minimap to avoid threats",
  "Medkits and armor can be found around the map - keep an eye out",
  "Hip fire is way less accurate than aim down sights",
  "Some enemies are stronger than others - be prepared",
  "Keep moving to avoid being an easy target",
  "Enemies vary in speed - be prepared to run",
  "Don't let enemies group up - take them out whenever you can",
];

let currentTip = 0;
const tipElement = document.querySelector(".tip-text");

function updateTip() {
  tipElement.style.opacity = "0";
  window.setTimeout(() => {
    tipElement.textContent = tips[currentTip];
    tipElement.style.opacity = "1";
    currentTip = (currentTip + 1) % tips.length;
  }, 500);
}
updateTip();
setInterval(updateTip, 4000);

function playBackgroundAudio() {
  if (backgroundAudio.isPlaying) return;
  new THREE.AudioLoader(loadingManager).load(
    "Audio/background.mp3",
    (buffer) => {
      backgroundAudio.setBuffer(buffer);
      backgroundAudio.setVolume(0.075);
      backgroundAudio.setLoop(true);
      backgroundAudio.play();
    }
  );
}

function initGame() {
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  createBackground(scene, renderer, loadingManager);
  scene.fog = new THREE.FogExp2(0xb0c4de, 0.05);

  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.object);

  listener = new THREE.AudioListener();
  backgroundAudio = new THREE.Audio(listener);

  terrain = new Terrain({ scene, loadingManager });
  player = new Player(scene, camera, terrain, loadingManager, listener);
  crosshair = new Crosshair({ camera });
  miniMap = new MiniMap({
    scene,
    player,
    crosshair,
  });

  window.addEventListener("click", function () {
    if (gameInitialized) {
      controls.lock();
      camera.add(listener);
      playBackgroundAudio();
    }
  });

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const restartButton = document.getElementById("restart");
  restartButton.addEventListener("click", function () {
    const deathScreen = document.getElementById("death-screen");
    restartGame(player, crosshair, controls);
    gameOver = false;
    deathScreen.style.display = "none";
    animate(0);
  });
}

let lastTime = 0;
let timeToNewFrame = 0;
let deltaTime = 0;
const fps = 60;
const frameInterval = 1000 / fps;
function animate(timestamp) {
  if (gameOver) return;
  deltaTime = timestamp - lastTime;
  if (timeToNewFrame >= frameInterval) {
    lastTime = timestamp;
    gameOver = updateGame(
      gameInitialized,
      deltaTime,
      scene,
      loadingManager,
      player,
      terrain,
      controls,
      crosshair,
      gameOver,
      listener,
      miniMap,
    );
    renderer.render(scene, camera);
    timeToNewFrame = 0;
  } else timeToNewFrame += deltaTime;
  if (!gameOver) requestAnimationFrame(animate);
}

window.setTimeout(() => {
  initGame();
}, 1000);