import * as THREE from "three";
import Hitbox from "./Hitbox.js";

export default class Projectile {
  constructor({
    scene,
    velocity = new THREE.Vector3(),
    position = new THREE.Vector3(),
  }) {
    this.scene = scene;
    this.velocity = velocity;
    this.position = position;
    this.radius = 0.125;
    this.diameter = this.radius * 2;
    this.model = this.createModel();
    this.hitbox = this.createHitbox();
  }
  createModel() {
    const projectileComponents = {
      geometry: new THREE.SphereGeometry(this.radius),
      material: new THREE.MeshStandardMaterial({
        color: 0xd8b0b0,
        metalness: 0.75,
        roughness: 0,
      }),
    };
    const projectile = new THREE.Mesh(
      projectileComponents.geometry,
      projectileComponents.material
    );
    projectile.position.copy(this.position);
    projectile.rotation.y = -Math.PI;
    projectile.visible = false;
    this.scene.add(projectile);
    return projectile;
  }
  createHitbox() {
    const hitbox = new Hitbox({
      scene: this.scene,
      width: this.diameter,
      height: this.diameter,
      depth: this.diameter,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
    });
    return hitbox;
  }
  move() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;
    this.model.position.copy(this.position);
  }
  updateHitbox() {
    this.hitbox.update({
      position: this.position,
    });
  }
  update() {
    this.move();
    this.updateHitbox();
  }
  remove() {
    this.scene.remove(this.model);
    this.scene.remove(this.hitbox.model);
    this.model.geometry.dispose();
    this.model.material.dispose();
    this.hitbox.remove();
  }
}