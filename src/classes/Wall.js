import * as THREE from "three";

export default class Wall {
  constructor({ scene, loadingManager, width, height, depth, position }) {
    this.scene = scene;
    this.loadingManager = loadingManager;
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.position = position;
    this.offset = new THREE.Vector3();
    this.model = this.createModel();
    this.init();
  }
  init() {
    this.model.position.copy(this.position);
    this.model.position.add(this.offset);
    this.scene.add(this.model);
  }
  loadTexture(url) {
    return this.textureLoader.load(url, (texture) => {
      if (this.width === 1) texture.repeat.set(6, this.height / 15);
      else texture.repeat.set(this.width / 15, this.height / 15);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
  }
  createModel() {
    const textures = {
      ao: this.loadTexture("/Textures/Wall/ao.jpg"),
      diff: this.loadTexture("/Textures/Wall/diff.jpg"),
      disp: this.loadTexture("/Textures/Wall/disp.jpg"),
      rough: this.loadTexture("/Textures/Wall/rough.jpg"),
      normal: this.loadTexture("/Textures/Wall/normal.jpg"),
    };
    const wallComponents = {
      geometry: new THREE.BoxGeometry(this.width, this.height, this.depth),
      material: new THREE.MeshPhysicalMaterial({
        map: textures.diff,
        aoMap: textures.ao,
        roughnessMap: textures.rough,
        normalMap: textures.normal,
        displacementMap: textures.disp,
        displacementScale: 0.1,
        metalness: 0,
      }),
    };
    const wall = new THREE.Mesh(
      wallComponents.geometry,
      wallComponents.material
    );
    return wall;
  }
}