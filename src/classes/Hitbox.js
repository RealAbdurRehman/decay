import * as THREE from "three";

export default class Hitbox {
  constructor({
    scene,
    width = 1,
    height = 1,
    depth = 1,
    color = "red",
    position = { x: 0, y: 0, z: 0 },
  }) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.color = color;
    this.position = position;
    this.hitbox = this.createHitbox();
    this.faces = {
      top: this.position.y + this.height * 0.5,
      bottom: this.position.y - this.height * 0.5,
      left: this.position.x + this.width * 0.5,
      right: this.position.x - this.width * 0.5,
      front: this.position.z - this.depth * 0.5,
      back: this.position.z + this.depth * 0.5,
    };
  }
  createHitbox() {
    const hitboxComponents = {
      geometry: new THREE.BoxGeometry(this.width, this.height, this.depth),
      material: new THREE.MeshBasicMaterial({ color: this.color }),
    };
    const hitbox = new THREE.Mesh(
      hitboxComponents.geometry,
      hitboxComponents.material
    );
    hitbox.position.set(this.position.x, this.position.y, this.position.z);
    hitbox.visible = false;
    this.scene.add(hitbox);
    return hitbox;
  }
  update({ position = { x: 0, y: 0, z: 0 } }) {
    this.position = position;
    this.hitbox.position.set(this.position.x, this.position.y, this.position.z);
    this.faces = {
      top: this.position.y + this.height * 0.5,
      bottom: this.position.y - this.height * 0.5,
      left: this.position.x + this.width * 0.5,
      right: this.position.x - this.width * 0.5,
      front: this.position.z - this.depth * 0.5,
      back: this.position.z + this.depth * 0.5,
    };
  }
  remove() {
    this.scene.remove(this.hitbox);
    this.hitbox.geometry.dispose();
    this.hitbox.material.dispose();
  }
}