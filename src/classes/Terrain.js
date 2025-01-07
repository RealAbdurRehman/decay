import * as THREE from "three";
import Hitbox from "./Hitbox.js";
import Wall from "./Wall.js";
import seedrandom from "seedrandom";
import {
  Tree1,
  Tree2,
  Tree3,
  Bush1,
  Bush2,
  Bush3,
  Bush4,
  Bush5,
  Rock1,
  Trunk1,
  Trunk2,
} from "./Props.js";

export default class Terrain {
  constructor({
    scene,
    loadingManager,
    width = 2000,
    depth = 2000,
    detail = { width: 282, height: 282 },
    propsPerChunk = 4,
    chunkSize = 25,
    renderDistance = 50,
  }) {
    this.scene = scene;
    this.width = width;
    this.depth = depth;
    this.detail = detail;
    this.loadingManager = loadingManager;
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.ground = this.createGround();
    this.modifyVertices();
    this.hitbox = this.createHitbox();
    this.walls = this.createWalls();
    this.props = [];
    this.propsPerChunk = propsPerChunk;
    this.chunkSize = chunkSize;
    this.renderDistance = renderDistance;
    this.activeChunks = new Map();
    this.chunkSeeds = new Map();
    this.boundaries = {
      front: this.depth * 0.5 - 2,
      back: -this.depth * 0.5 + 2,
      left: -this.width * 0.5 + 2,
      right: this.width * 0.5 - 2,
    };
    this.init();
  }
  init() {
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -1;
    this.scene.add(this.ground);
  }
  spawnProps(count) {
    const propTypes = [
      Tree1,
      Tree2,
      Tree3,
      Bush1,
      Bush2,
      Bush3,
      Bush4,
      Bush5,
      Rock1,
      Trunk1,
      Trunk2,
    ];
    const buffer = 5;
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.randFloat(
        this.boundaries.left + buffer,
        this.boundaries.right - buffer
      );
      const z = THREE.MathUtils.randFloat(
        this.boundaries.back + buffer,
        this.boundaries.front - buffer
      );
      const groundHeight = this.getGroundHeightAtPosition(x, z);
      const PropType = propTypes[Math.floor(Math.random() * propTypes.length)];
      const prop = new PropType({
        scene: this.scene,
        loadingManager: this.loadingManager,
        position: new THREE.Vector3(x, groundHeight, z),
      });
      this.props.push(prop);
    }
  }
  getGroundHeightAtPosition(x, z) {
    const geometry = this.ground.geometry;
    const position = geometry.attributes.position;
    const xLocal = ((x + this.width / 2) / this.width) * this.detail.width;
    const zLocal = ((z + this.depth / 2) / this.depth) * this.detail.height;
    const xIndex = Math.round(xLocal);
    const zIndex = Math.round(zLocal);
    const vertexIndex = (zIndex * (this.detail.width + 1) + xIndex) * 3 + 1;
    return position.array[vertexIndex] - 1;
  }
  getChunkKey(x, z) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    return `${chunkX},${chunkZ}`;
  }
  updateProps(playerPosition) {
    const playerChunkKey = this.getChunkKey(playerPosition.x, playerPosition.z);
    const [playerChunkX, playerChunkZ] = playerChunkKey.split(",").map(Number);
    const renderChunks = Math.ceil(this.renderDistance / this.chunkSize);
    const neededChunks = new Set();
    for (let x = -renderChunks; x <= renderChunks; x++) {
      for (let z = -renderChunks; z <= renderChunks; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = `${chunkX},${chunkZ}`;
        const chunkCenter = new THREE.Vector3(
          chunkX * this.chunkSize + this.chunkSize / 2,
          0,
          chunkZ * this.chunkSize + this.chunkSize / 2
        );
        if (chunkCenter.distanceTo(playerPosition) <= this.renderDistance) {
          neededChunks.add(key);
          if (!this.activeChunks.has(key)) this.loadChunk(chunkX, chunkZ, key);
        }
      }
    }
    for (const [key, props] of this.activeChunks) {
      if (!neededChunks.has(key)) {
        this.unloadChunk(key);
        props.forEach((prop) => {
          const propIndex = this.props.indexOf(prop);
          if (propIndex !== -1) {
            this.props.splice(propIndex, 1);
          }
        });
      }
    }
  }
  loadChunk(chunkX, chunkZ, key) {
    if (!this.chunkSeeds.has(key)) this.chunkSeeds.set(key, Math.random());
    const props = [];
    const seed = this.chunkSeeds.get(key);
    const rng = seedrandom(seed.toString());
    const chunkStartX = chunkX * this.chunkSize;
    const chunkStartZ = chunkZ * this.chunkSize;
    const propTypes = [
      Tree1,
      Tree2,
      Tree3,
      Bush1,
      Bush2,
      Bush3,
      Bush4,
      Bush5,
      Rock1,
      Trunk1,
      Trunk2,
    ];
    for (let i = 0; i < this.propsPerChunk; i++) {
      const x = chunkStartX + rng() * this.chunkSize;
      const z = chunkStartZ + rng() * this.chunkSize;
      if (
        x < this.boundaries.left ||
        x > this.boundaries.right ||
        z < this.boundaries.back ||
        z > this.boundaries.front
      ) {
        continue;
      }
      const PropType = propTypes[Math.floor(rng() * propTypes.length)];
      const prop = new PropType({
        scene: this.scene,
        loadingManager: this.loadingManager,
        position: new THREE.Vector3(x, this.getGroundHeightAtPosition(x, z), z),
      });
      props.push(prop);
      this.props.push(prop);
    }
    this.activeChunks.set(key, props);
  }
  unloadChunk(key) {
    const props = this.activeChunks.get(key);
    if (!props) return;
    props.forEach((prop) => {
      if (prop) prop.remove();
    });
    this.activeChunks.delete(key);
  }
  loadTexture(url) {
    return this.textureLoader.load(url, (texture) => {
      texture.repeat.set(this.width / 8, this.depth / 8);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
  }
  createGround() {
    const textures = {
      ao: this.loadTexture("/Textures/Ground/ao.jpg"),
      diff: this.loadTexture("/Textures/Ground/diff.jpg"),
      disp: this.loadTexture("/Textures/Ground/disp.jpg"),
      rough: this.loadTexture("/Textures/Ground/rough.jpg"),
      normal: this.loadTexture("/Textures/Ground/normal.jpg"),
    };
    const groundComponents = {
      geometry: new THREE.PlaneGeometry(
        this.width,
        this.depth,
        this.detail.width,
        this.detail.height
      ),
      material: new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        map: textures.diff,
        aoMap: textures.ao,
        roughnessMap: textures.rough,
        normalMap: textures.normal,
        displacementMap: textures.disp,
        displacementScale: 0.1,
        metalness: 0,
      }),
    };
    const ground = new THREE.Mesh(
      groundComponents.geometry,
      groundComponents.material
    );
    return ground;
  }
  modifyVertices() {
    const vertices = this.ground.geometry.attributes.position.array;
    vertices.forEach((vertex, index) => {
      vertices[index] += (Math.random() - 0.5) * (Math.random() * 0.75 + 0.25);
    });
  }
  createHitbox() {
    return new Hitbox({
      scene: this.scene,
      width: this.width,
      depth: this.depth,
      height: 0.05,
      position: new THREE.Vector3(
        this.ground.position.x,
        this.ground.position.y - 0.25,
        this.ground.position.z
      ),
    });
  }
  createWalls() {
    const dimensions = {
      height: 16,
      frontBehind: {
        width: this.width + 1,
        depth: 1,
      },
      leftRight: {
        width: 1,
        depth: this.depth + 1,
      },
    };
    const positionY = dimensions.height * 0.5 - 2;
    const positions = {
      front: new THREE.Vector3(0, positionY, this.depth * 0.5),
      back: new THREE.Vector3(0, positionY, -this.depth * 0.5),
      left: new THREE.Vector3(-this.width * 0.5, positionY, 0),
      right: new THREE.Vector3(this.width * 0.5, positionY, 0),
    };
    return {
      front: new Wall({
        scene: this.scene,
        loadingManager: this.loadingManager,
        width: dimensions.frontBehind.width,
        height: dimensions.height,
        depth: dimensions.frontBehind.depth,
        position: positions.front,
      }),
      back: new Wall({
        scene: this.scene,
        loadingManager: this.loadingManager,
        width: dimensions.frontBehind.width,
        height: dimensions.height,
        depth: dimensions.frontBehind.depth,
        position: positions.back,
      }),
      left: new Wall({
        scene: this.scene,
        loadingManager: this.loadingManager,
        width: dimensions.leftRight.width,
        height: dimensions.height,
        depth: dimensions.leftRight.depth,
        position: positions.left,
      }),
      right: new Wall({
        scene: this.scene,
        loadingManager: this.loadingManager,
        width: dimensions.leftRight.width,
        height: dimensions.height,
        depth: dimensions.leftRight.depth,
        position: positions.right,
      }),
    };
  }
}