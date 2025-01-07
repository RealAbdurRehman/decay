import * as THREE from "three";
import Hitbox from "./Hitbox.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class Prop {
  constructor({
    scene,
    position,
    dimensions = { width: 1, height: 1, depth: 1 },
  }) {
    this.scene = scene;
    this.position = position;
    this.dimensions = dimensions;
    this.model = null;
    this.hitbox = null;
    this.createModel();
  }
  init() {
    this.model.position.copy(this.position);
    this.scene.add(this.model);
    this.hitbox = this.createHitbox();
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
  remove() {
    if (this.model) {
      this.scene.remove(this.model);
      this.disposeRecursively(this.model);
    }
    if (this.hitbox) this.hitbox.remove();
    this.model = null;
    this.hitbox = null;
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
}

export class Tree1 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 0.02 + 0.03;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Trees/Tree1/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Tree2 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 0.0075 + 0.0075;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Trees/Tree2/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Tree3 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 0.5 + 0.75;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Trees/Tree3/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Bush1 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 0.0225 + 0.0175;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Bushes/Bush1/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Bush2 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 0.0075 + 0.0075;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Bushes/Bush2/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Bush3 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 3 + 4;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Bushes/Bush3/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Bush4 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 1.5 + 0.5;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Bushes/Bush4/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Bush5 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 150 + 50;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Bushes/Bush5/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Rock1 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 4 + 1;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Rocks/Rock1/rock.glb", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Trunk1 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1.05);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 1.5 + 1.5;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Trunks/Trunk1/trunk.glb", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}

export class Trunk2 extends Prop {
  constructor({ scene, loadingManager, position = new THREE.Vector3() }) {
    position.setY(-1);
    const dimensions = { width: 1, height: 1, depth: 1 };
    super({ scene, position, dimensions });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2, 0);
  }
  createModel() {
    const scale = Math.random() * 1 + 1;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("Props/Trunks/Trunk2/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.rotation.y = Math.random() * Math.PI * 2;
      this.model.scale.set(scale, scale, scale);
      this.init();
    });
  }
}