import * as THREE from "three";
import { Armor, Health } from "../classes/Drops.js";

const timeToNewDrops = { armor: 0, health: 0 };
const dropIntervals = { armor: 40000, health: 30000 };

function getPosition({ terrain, buffer }) {
  return new THREE.Vector3(
    THREE.MathUtils.randFloat(
      terrain.boundaries.left + buffer,
      terrain.boundaries.right - buffer
    ),
    0,
    THREE.MathUtils.randFloat(
      terrain.boundaries.back + buffer,
      terrain.boundaries.front - buffer
    )
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
  listener
) {
  const position = getPosition({ terrain, buffer: 5 });
  spawnArmor(dropsArray, deltaTime, scene, loadingManager, position, listener);
  spawnHealth(dropsArray, deltaTime, scene, loadingManager, position, listener);
}