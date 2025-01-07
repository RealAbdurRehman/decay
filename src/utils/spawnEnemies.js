import { Zombie, Zombie2, Skinny, Runner } from "../classes/Enemies.js";
import * as THREE from "three";

let timeToNewEnemy = 0;
let enemyInterval = 7500;
const enemyTypes = ["zombie", "zombie2", "skinny", "runner"];

function getRandomPointOnCircle(center, radius) {
  const angle = Math.random() * Math.PI * 2;
  const x = center.x + radius * Math.cos(angle);
  const z = center.z + radius * Math.sin(angle);
  return new THREE.Vector3(x, -0.9, z);
}

function isWithinBoundaries(position, boundaries) {
  return (
    position.x >= boundaries.left &&
    position.x <= boundaries.right &&
    position.z >= boundaries.back &&
    position.z <= boundaries.front
  );
}

export default function spawnEnemies(
  enemiesArray,
  deltaTime,
  scene,
  loadingManager,
  player,
  terrain,
  listener
) {
  if (timeToNewEnemy >= enemyInterval) {
    const spawnRadius = 50;
    let spawnPosition = getRandomPointOnCircle(player.position, spawnRadius);
    const boundaries = {
      front: terrain.boundaries.front,
      back: terrain.boundaries.back,
      left: terrain.boundaries.left,
      right: terrain.boundaries.right,
    };
    let attempts = 0;
    while (!isWithinBoundaries(spawnPosition, boundaries) && attempts < 8) {
      spawnPosition = getRandomPointOnCircle(player.position, spawnRadius);
      attempts++;
    }
    if (isWithinBoundaries(spawnPosition, boundaries)) {
      const randomEnemy =
        enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      let enemy;
      switch (randomEnemy) {
        case "zombie":
          enemy = new Zombie({
            scene,
            loadingManager,
            player,
            position: spawnPosition,
            boundaries: terrain.boundaries,
            listener,
          });
          break;
        case "zombie2":
          enemy = new Zombie2({
            scene,
            loadingManager,
            player,
            position: spawnPosition,
            boundaries: terrain.boundaries,
            listener,
          });
          break;
        case "runner":
          enemy = new Runner({
            scene,
            loadingManager,
            player,
            position: spawnPosition,
            boundaries: terrain.boundaries,
            listener,
          });
          break;
        case "skinny":
          enemy = new Skinny({
            scene,
            loadingManager,
            player,
            position: spawnPosition,
            boundaries: terrain.boundaries,
            listener,
          });
          break;
      }
      enemiesArray.push(enemy);
    }
    timeToNewEnemy = 0;
  } else timeToNewEnemy += deltaTime;
}