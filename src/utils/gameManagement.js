import spawnDrops from "./spawnDrops.js";
import spawnEnemies from "./spawnEnemies.js";
import checkCollision from "./checkCollision.js";
import startDeathSequence from "./startDeathSequence.js";

let drops = [];

let enemies = [];
const maxEnemies = 15;
let enemiesKilled = 0;

function showDamageOverlay(player) {
  if (player.health.current < 67 && player.health.current > 34)
    player.effects.damage.setSrc("/Player/damage2.png");
  else if (player.health.current < 34)
    player.effects.damage.setSrc("/Player/damage3.png");
  player.effects.damage.element.style.opacity = 1;
  window.setTimeout(() => {
    if (player.health.current > 0)
      player.effects.damage.element.style.opacity = 0;
  }, 1000);
}

function updateEnemies(player, deltaTime) {
  enemies.forEach((enemy, enemyIndex) => {
    if (!enemy.states.loaded) return;
    player.projectiles.forEach((projectile, projectileIndex) => {
      const projectileCollision = checkCollision(
        projectile.hitbox.faces,
        enemy.hitbox.faces
      );
      if (
        projectileCollision.x &&
        projectileCollision.y &&
        projectileCollision.z
      ) {
        if (enemy.health > 0 && !enemy.states.dead) {
          enemy.createBloodSplatter(projectile.position);
          enemy.health -= 50;
          player.projectiles.splice(projectileIndex, 1);
          projectile.remove();
          if (enemy.health <= 0) {
            enemy.startDeathSequence();
            enemiesKilled++;
            const killIncrement = document.getElementById("kill-increment");
            killIncrement.style.display = "none";
            killIncrement.offsetHeight;
            killIncrement.style.display = "block";
            setTimeout(() => {
              killIncrement.style.display = "none";
            }, 1500);
          }
        }
      }
    });
    const playerCollision = checkCollision(
      player.hitbox.faces,
      enemy.hitbox.faces
    );
    if (!enemy.states.dead) {
      if (playerCollision.x && playerCollision.y && playerCollision.z) {
        showDamageOverlay(player);
        player.updateHealth(deltaTime);
      }
    } else {
      if (enemy.opacity <= 0) {
        enemies.splice(enemyIndex, 1);
        enemy.remove();
      }
    }
    enemy.update(deltaTime, playerCollision, enemies);
  });
}

function updateDrops(player) {
  drops = drops.filter((drop) => !drop.isMarkedForDeletion);
  drops.forEach((drop) => {
    if (!drop.isInitialized) return;
    const playerCollision = checkCollision(
      player.hitbox.faces,
      drop.hitbox.faces
    );
    if (playerCollision.x && playerCollision.y && playerCollision.z) {
      drop.onCollision(player);
      drop.isMarkedForDeletion = true;
      drop.remove();
    } else drop.update();
  });
}

function updateUI() {
  const kills = document.getElementById("kill-display");
  kills.innerHTML = enemiesKilled;
}

export function updateGame(
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
  miniMap
) {
  if (!gameInitialized) return;
  controls.update();
  player.update(deltaTime);
  crosshair.update(
    player.spreadAmount,
    player.hideCrosshair,
    player.recoil.verticalAngle
  );
  terrain.updateProps(player.position);
  updateEnemies(player, deltaTime);
  if (enemies.length < maxEnemies)
    spawnEnemies(
      enemies,
      deltaTime,
      scene,
      loadingManager,
      player,
      terrain,
      listener
    );
  updateDrops(player);
  spawnDrops(
    drops,
    deltaTime,
    scene,
    loadingManager,
    terrain,
    listener,
    player
  );
  miniMap.update();
  updateUI();
  if (player.health.current <= 0) {
    gameOver = true;
    player.health.elements.display.innerHTML = 0;
    player.sounds.footsteps.sound.stop();
    startDeathSequence(enemiesKilled, controls);
  }
  return gameOver;
}

export function restartGame() {
  window.location.reload();
}