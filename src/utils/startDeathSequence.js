const deathScreen = document.getElementById("death-screen");
const killDisplay = document.getElementById("kills-stat");

export default function startDeathSequence(enemiesKilled, controls) {
  deathScreen.style.display = "flex";
  killDisplay.innerHTML = enemiesKilled;
  controls.unlock();
}