import * as THREE from "three";
import { Armor, Health } from "../classes/Drops.js";

const timeToNewDrops = { armor: 0, health: 0 };
const dropIntervals = { armor: 70000, health: 60000 };

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

function spawnArmor(
  dropsArray,
  deltaTime,
  scene,
  loadingManager,
  position,
  listener
) {
  if (timeToNewDrops.armor >= dropIntervals.armor) {
    dropsArray.push(new Armor({ scene, loadingManager, listener, position }));
    timeToNewDrops.armor = 0;
  } else timeToNewDrops.armor += deltaTime;
}

function spawnHealth(
  dropsArray,
  deltaTime,
  scene,
  loadingManager,
  position,
  listener
) {
  if (timeToNewDrops.health >= dropIntervals.health) {
    dropsArray.push(new Health({ scene, loadingManager, listener, position }));
    timeToNewDrops.health = 0;
  } else timeToNewDrops.health += deltaTime;
}

export default function spawnDrops(
  dropsArray,
  deltaTime,
  scene,
  loadingManager,
  terrain,
  listener,
  player
) {
  const spawnRadius = 25;
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
      spawnArmor(dropsArray, deltaTime, scene, loadingManager, spawnPosition, listener);
      spawnHealth(dropsArray, deltaTime, scene, loadingManager, spawnPosition, listener);
    }
}