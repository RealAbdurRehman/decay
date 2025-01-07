import * as THREE from "three";
import Hitbox from "./Hitbox.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

class Drop {
  constructor({
    scene,
    position,
    listener,
    dimensions = { width: 1, height: 1, depth: 1 },
  }) {
    this.scene = scene;
    this.position = position;
    this.listener = listener;
    this.dimensions = dimensions;
    this.model = new THREE.Object3D();
    this.hitbox = new THREE.Object3D();
    this.light = new THREE.Object3D();
    this.time = 0;
    this.isInitialized = false;
    this.isMarkedForDeletion = false;
    this.sound = null;
    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.createModel();
  }
  init(color = "red") {
    this.model.position.copy(this.position);
    this.scene.add(this.model);
    this.hitbox = this.createHitbox();
    this.createLight(color);
    setTimeout(() => {
      this.isMarkedForDeletion = true;
      this.remove();
    }, this.duration);
  }
  createHitbox() {
    const position = this.position.clone().add(this.hitboxOffset);
    return new Hitbox({
      scene: this.scene,
      width: this.dimensions.width,
      height: this.dimensions.height,
      depth: this.dimensions.depth,
      position,
    });
  }
  createLight(color) {
    this.light = new THREE.PointLight(color, 10, 5);
    this.light.position.copy(this.position);
    this.light.position.y -= 0.5;
    this.scene.add(this.light);
  }
  update() {
    this.model.rotation.y += 0.025;
    const frequency = 1;
    const amplitude = 0.8;
    this.position.y = Math.sin(frequency * this.time) * amplitude + 1.5;
    this.model.position.copy(this.position);
    this.hitbox.update({ position: this.position });
    this.updateLight();
    this.time += 0.025;
  }
  updateLight() {
    this.light.position.copy(this.position);
    this.light.position.y -= 0.5;
  }
  remove() {
    this.hitbox.remove();
    this.scene.remove(this.model);
    this.disposeRecursively(this.model);
    this.scene.remove(this.light);
    this.light.dispose();
  }
  disposeRecursively(object) {
    if (!object) return;
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material))
        object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
    if (object.children)
      object.children.forEach((child) => this.disposeRecursively(child));
  }
  createSound(url, volume) {
    this.sound = new THREE.Audio(this.listener);
    this.audioLoader.load(url, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setVolume(volume);
    });
  }
  playSound() {
    this.sound.play();
  }
}

export class Health extends Drop {
  constructor({
    scene,
    loadingManager,
    listener,
    position = new THREE.Vector3(),
  }) {
    const dimensions = { width: 1.5, height: 1, depth: 0.5 };
    super({ scene, dimensions, listener, position });
    this.loadingManger = loadingManager;
    this.hitboxOffset = new THREE.Vector3();
    this.healthAmount = Math.floor(Math.random() * 25 + 25);
    this.duration = 20000;
    this.createSound("Audio/healthpickup.flac", 1);
  }
  createModel() {
    const scale = 5;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Drops/Health/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.init();
      this.isInitialized = true;
    });
  }
  onCollision(player) {
    player.health.current += this.healthAmount;
    if (player.health.current >= 100) player.health.current = 100;
    this.playSound();
  }
}

export class Armor extends Drop {
  constructor({
    scene,
    loadingManager,
    listener,
    position = new THREE.Vector3(),
  }) {
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, dimensions, listener, position });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3();
    this.armorAmount = Math.floor(Math.random() * 35 + 15);
    this.duration = 30000;
    this.createSound("Audio/armorpickup.flac", 1);
  }
  createModel() {
    const scale = 2;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Drops/Armor/armor.glb", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.init("blue");
      this.isInitialized = true;
    });
  }
  onCollision(player) {
    player.armor.current += this.armorAmount;
    if (player.armor.current >= 100) player.armor.current = 100;
    this.playSound();
  }
}