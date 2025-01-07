import * as THREE from "three";
import Hitbox from "./Hitbox.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class Enemy {
  constructor({
    scene,
    player,
    health = 100,
    speed = 0.05,
    stopDistance = 3,
    position = new THREE.Vector3(),
    velocity = new THREE.Vector3(),
    dimensions = { width: 1, height: 1, depth: 1 },
    boundaries,
    listener,
  }) {
    this.scene = scene;
    this.player = player;
    this.health = health;
    this.speed = speed;
    this.stopDistance = stopDistance;
    this.position = position;
    this.velocity = velocity;
    this.dimensions = dimensions;
    this.boundaries = boundaries;
    this.listener = listener;
    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.preferredDirection = Math.random() < 0.5 ? 1 : -1;
    this.hitbox = null;
    this.model = null;
    this.mixer = null;
    this.animations = {
      run: null,
      attack: null,
      death: null,
      current: null,
      isTransitioning: false,
    };
    this.states = { loaded: false, dead: false, deathAnimationStarted: false };
    this.opacity = 1;
    this.fadeSpeed = 0.00005;
    this.preferredDirection = Math.random() < 0.5 ? 1 : -1;
    this.directionChangeTimer = 0;
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.bloodSplatter = this.textureLoader.load("/Enemies/BloodSplatter.png");
    this.createModel();
    this.sounds = this.createSounds();
    this.soundInterval = Math.random() * 5000 + 5000;
    this.timeToNewSound = 0;
  }
  updateSound(deltaTime) {
    if (this.timeToNewSound >= this.soundInterval) {
      this.playSound();
      this.soundInterval = Math.random() * 5000 + 5000;
      this.timeToNewSound = 0;
    } else this.timeToNewSound += deltaTime;
  }
  playSound() {
    if (this.sounds.length) {
      const soundToPlay =
        this.sounds[Math.floor(Math.random() * this.sounds.length)];
      if (!soundToPlay.isPlaying) soundToPlay.play();
    }
  }
  createSounds() {
    const sounds = [];
    for (let i = 1; i < 25; i++) {
      const sound = new THREE.Audio(this.listener);
      this.audioLoader.load(`Audio/Zombies/${i}.wav`, (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(Math.random() * 0.25 + 0.25);
        sounds.push(sound);
      });
    }
    return sounds;
  }
  setupAnimations(
    animations,
    { runIndex, attackIndex, deathIndex, multiplier = 0.01 }
  ) {
    this.mixer = new THREE.AnimationMixer(this.model);
    const runAnimation = animations[runIndex];
    const attackAnimation = animations[attackIndex];
    const deathAnimation = animations[deathIndex];
    this.animations.run = this.mixer.clipAction(runAnimation);
    this.animations.run.setEffectiveTimeScale(multiplier * this.speed);
    this.animations.attack = this.mixer.clipAction(attackAnimation);
    this.animations.attack.setEffectiveTimeScale(multiplier * this.speed);
    this.animations.death = this.mixer.clipAction(deathAnimation);
    this.animations.death.setEffectiveTimeScale(multiplier * this.speed);
    this.animations.death.setLoop(THREE.LoopOnce, 1);
    this.animations.death.clampWhenFinished = true;
  }
  playAnimation(animation = "run") {
    if (this.states.dead && animation !== "death") return;
    if (this.animations.isTransitioning) return;
    if (animation === "death") {
      if (this.animations.current) {
        this.animations[this.animations.current].stop();
      }
      this.animations.death.setLoop(THREE.LoopOnce);
      this.animations.death.clampWhenFinished = true;
      this.animations.death.reset();
      this.animations.death.play();
      this.animations.current = "death";
      return;
    }
    if (this.animations.current && this.animations.current !== animation) {
      this.animations.isTransitioning = true;
      const currentAnim = this.animations[this.animations.current];
      const onComplete = () => {
        this.mixer.removeEventListener("finished", onComplete);
        currentAnim.stop();
        this.animations.isTransitioning = false;
        if (!this.states.dead) {
          this.animations[animation].setLoop(THREE.LoopRepeat);
          this.animations[animation].clampWhenFinished = false;
          this.animations[animation].reset();
          this.animations[animation].play();
          this.animations.current = animation;
        }
      };
      if (currentAnim.time < currentAnim._clip.duration) {
        currentAnim.setLoop(THREE.LoopOnce);
        currentAnim.clampWhenFinished = true;
        this.mixer.addEventListener("finished", onComplete);
      } else onComplete();
    } else if (!this.animations.current && !this.states.dead) {
      this.animations[animation].reset();
      this.animations[animation].play();
      this.animations.current = animation;
    }
  }
  init() {
    this.model.position.copy(this.position);
    this.scene.add(this.model);
    this.hitbox = this.createHitbox();
    this.playAnimation();
  }
  createHitbox(offset = new THREE.Vector3()) {
    return new Hitbox({
      scene: this.scene,
      width: this.dimensions.width,
      height: this.dimensions.height,
      depth: this.dimensions.depth,
      position: new THREE.Vector3(
        this.position.x + offset.x,
        this.position.y + offset.y,
        this.position.z + offset.z
      ),
      color: 0xffff00,
    });
  }
  startDeathSequence() {
    if (!this.states.deathAnimationStarted) {
      this.states.deathAnimationStarted = true;
      this.states.dead = true;
      if (this.animations.current)
        this.animations[this.animations.current].stop();
      this.animations.death.setLoop(THREE.LoopOnce);
      this.animations.death.clampWhenFinished = true;
      this.animations.death.reset();
      this.animations.death.play();
      this.animations.current = "death";
    }
  }
  updateOpacity(deltaTime) {
    if (this.states.dead) {
      if (!this.animations.death) return;
      if (
        this.animations.death.time >=
        this.animations.death._clip.duration * 0.8
      ) {
        this.opacity = Math.max(0, this.opacity - this.fadeSpeed * deltaTime);
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = this.opacity;
          }
        });
      }
    }
  }
  move(enemies) {
    const toPlayer = new THREE.Vector3(
      this.player.position.x - this.position.x,
      0,
      this.player.position.z - this.position.z
    );
    const distanceToPlayer = toPlayer.length();
    if (distanceToPlayer > this.stopDistance) {
      const moveDirection = toPlayer.normalize();
      const avoidanceForce = new THREE.Vector3();
      const avoidanceDistance =
        (this.dimensions.width + this.dimensions.depth) * 1.5;
      let isBlocked = false;
      for (const enemy of enemies) {
        if (enemy === this) continue;
        const toEnemy = new THREE.Vector3().subVectors(
          this.position,
          enemy.position
        );
        const distance = toEnemy.length();
        if (distance < avoidanceDistance) {
          const angleToPlayer = Math.atan2(toPlayer.x, toPlayer.z);
          const angleToEnemy = Math.atan2(toEnemy.x, toEnemy.z);
          const angleDiff = Math.abs(angleToPlayer - angleToEnemy);
          if (angleDiff < 0.3) {
            isBlocked = true;
            const sidewaysForce = new THREE.Vector3(
              -Math.sin(angleToEnemy + (Math.PI / 2) * this.preferredDirection),
              0,
              -Math.cos(angleToEnemy + (Math.PI / 2) * this.preferredDirection)
            ).multiplyScalar(this.speed * 2);
            avoidanceForce.add(sidewaysForce);
          } else {
            const perpendicular = new THREE.Vector3(
              -toEnemy.z * this.preferredDirection,
              0,
              toEnemy.x * this.preferredDirection
            )
              .normalize()
              .multiplyScalar(1.2 - distance / avoidanceDistance);
            const pushAway = toEnemy
              .normalize()
              .multiplyScalar(1 - distance / avoidanceDistance);
            avoidanceForce.add(perpendicular);
            avoidanceForce.add(pushAway);
          }
        }
      }
      this.directionChangeTimer += 1;
      if (isBlocked && this.directionChangeTimer > 60) {
        this.preferredDirection *= -1;
        this.directionChangeTimer = 0;
      }
      if (isBlocked) {
        moveDirection.multiplyScalar(0.3);
        avoidanceForce.multiplyScalar(1.5);
      }
      moveDirection.add(avoidanceForce);
      moveDirection.normalize();
      moveDirection.multiplyScalar(this.speed);
      this.velocity.copy(moveDirection);
      const newPosition = this.position.clone().add(this.velocity);
      if (
        newPosition.x >= this.boundaries.left &&
        newPosition.x <= this.boundaries.right &&
        newPosition.z >= this.boundaries.back &&
        newPosition.z <= this.boundaries.front
      ) {
        this.position.copy(newPosition);
        this.model.position.copy(this.position);
      } else this.velocity.set(0, 0, 0);
    } else this.velocity.set(0, 0, 0);
    this.model.lookAt(
      this.player.position.x,
      this.position.y,
      this.player.position.z
    );
  }
  updateHitbox(offset = new THREE.Vector3()) {
    this.hitbox.update({
      position: new THREE.Vector3(
        this.position.x + offset.x,
        this.position.y + offset.y,
        this.position.z + offset.z
      ),
    });
  }
  updateAnimationType(isColliding) {
    if (this.states.dead) return;
    if (isColliding && this.animations.current !== "attack")
      this.playAnimation("attack");
    else if (!isColliding && this.animations.current !== "run")
      this.playAnimation("run");
  }
  createBloodSplatter(position = new THREE.Vector3()) {
    const splatterSize = Math.random() * 1.25 + 0.75;
    const splatterGeometry = new THREE.PlaneGeometry(
      splatterSize,
      splatterSize
    );
    const splatterMaterial = new THREE.MeshBasicMaterial({
      map: this.bloodSplatter,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const splatter = new THREE.Mesh(splatterGeometry, splatterMaterial);
    splatter.position.copy(position);
    const updateSplatterRotation = () => {
      const direction = new THREE.Vector3();
      direction.subVectors(this.player.camera.position, splatter.position);
      splatter.lookAt(this.player.camera.position);
      splatter.rotateZ(Math.random() * Math.PI * 2);
    };
    updateSplatterRotation();
    this.scene.add(splatter);
    const fadeDuration = 50;
    const fadeInterval = window.setInterval(() => {
      updateSplatterRotation();
      splatter.material.opacity -= 0.1;
      if (splatter.material.opacity <= 0) {
        window.clearInterval(fadeInterval);
        this.scene.remove(splatter);
        splatter.material.dispose();
        splatter.geometry.dispose();
      }
    }, fadeDuration);
  }
  update(offset, deltaTime, isColliding, enemies) {
    if (!this.states.loaded) return;
    this.mixer.update(deltaTime);
    if (this.states.dead) {
      this.updateOpacity(deltaTime);
      return;
    }
    this.move(enemies);
    this.updateHitbox(offset);
    this.updateSound(deltaTime);
    this.updateAnimationType(isColliding);
  }
  remove() {
    this.scene.remove(this.model);
    this.scene.remove(this.hitbox.model);
    this.disposeRecursively(this.model);
    this.hitbox.remove();
  }
  disposeRecursively(object) {
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

export class Zombie extends Enemy {
  constructor({
    scene,
    loadingManager,
    player,
    position,
    boundaries,
    listener,
  }) {
    const health = Math.random() * 250 + 250;
    const dimensions = { width: 1, height: 4.5, depth: 1 };
    const speed = Math.random() * 0.065 + 0.085;
    super({
      scene,
      player,
      health,
      speed,
      position,
      dimensions,
      boundaries,
      listener,
    });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2.25, 0);
  }
  createModel() {
    const scale = Math.random() * 0.75 + 1.75;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("/Enemies/Zombie Normal/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.setupAnimations(gltf.animations, {
        runIndex: 3,
        attackIndex: 4,
        deathIndex: 5,
        multiplier: 0.01325,
      });
      this.init();
      this.states.loaded = true;
      this.model.traverse(function (child) {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = 1;
        }
      });
    });
  }
  update(deltaTime, playerCollision, enemies) {
    const isColliding = playerCollision.x && playerCollision.z;
    super.update(this.hitboxOffset, deltaTime, isColliding, enemies);
  }
}

export class Zombie2 extends Enemy {
  constructor({
    scene,
    loadingManager,
    player,
    position,
    boundaries,
    listener,
  }) {
    const health = Math.random() * 300 + 300;
    const dimensions = { width: 1.5, height: 3.5, depth: 1.5 };
    const speed = Math.random() * 0.025 + 0.075;
    super({
      scene,
      player,
      health,
      speed,
      position,
      dimensions,
      boundaries,
      listener,
    });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 1.75, 0);
  }
  createModel() {
    const scale = Math.random() * 0.1 + 0.4;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("/Enemies/Zombie Normal 2/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.setupAnimations(gltf.animations, {
        runIndex: 2,
        attackIndex: Math.random() > 0.5 ? 14 : 15,
        deathIndex: Math.random() > 0.5 ? 4 : Math.random() > 0.5 ? 5 : 6,
        multiplier: 0.01425,
      });
      this.init();
      this.states.loaded = true;
      this.model.traverse(function (child) {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = 1;
        }
      });
    });
  }
  update(deltaTime, playerCollision, enemies) {
    const isColliding = playerCollision.x && playerCollision.z;
    super.update(this.hitboxOffset, deltaTime, isColliding, enemies);
  }
}

export class Skinny extends Enemy {
  constructor({
    scene,
    loadingManager,
    player,
    position,
    boundaries,
    listener,
  }) {
    const health = Math.random() * 200 + 200;
    const dimensions = { width: 1, height: 3.85, depth: 1 };
    const speed = Math.random() * 0.075 + 0.125;
    super({
      scene,
      player,
      health,
      speed,
      position,
      dimensions,
      boundaries,
      listener,
    });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 2.1, 0);
  }
  createModel() {
    const scale = Math.random() * 0.25 + 1.5;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("/Enemies/Zombie Skinny/skinny.glb", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.setupAnimations(gltf.animations, {
        runIndex:
          Math.random() > 0.5
            ? 6
            : Math.random() > 0.5
            ? 7
            : Math.random() > 0.5
            ? 8
            : 11,
        attackIndex: 1,
        deathIndex: Math.random() > 0.5 ? 3 : 4,
        multiplier: 0.0065,
      });
      this.init();
      this.states.loaded = true;
      this.model.traverse(function (child) {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = 1;
        }
      });
    });
  }
  update(deltaTime, playerCollision, enemies) {
    const isColliding = playerCollision.x && playerCollision.z;
    super.update(this.hitboxOffset, deltaTime, isColliding, enemies);
  }
}

export class Runner extends Enemy {
  constructor({
    scene,
    loadingManager,
    player,
    position,
    boundaries,
    listener,
  }) {
    const health = Math.random() * 275 + 275;
    const dimensions = { width: 2.25, height: 2.5, depth: 2.25 };
    const speed = Math.random() * 0.0125 + 0.2;
    const stopDistance = 4;
    super({
      scene,
      player,
      health,
      speed,
      stopDistance,
      position,
      dimensions,
      boundaries,
      listener,
    });
    this.loadingManager = loadingManager;
    this.hitboxOffset = new THREE.Vector3(0, 1, 0);
  }
  createModel() {
    const scale = Math.random() * 0.125 + 0.175;
    const loader = new GLTFLoader(this.loadingManager);
    loader.load("/Enemies/Zombie Runner/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(scale, scale, scale);
      this.setupAnimations(gltf.animations, {
        runIndex: 8,
        attackIndex: 15,
        deathIndex: 14,
        multiplier: 0.0075,
      });
      this.init();
      this.states.loaded = true;
      this.model.traverse(function (child) {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = 1;
        }
      });
    });
  }
  update(deltaTime, playerCollision, enemies) {
    const isColliding = playerCollision.x && playerCollision.z;
    super.update(this.hitboxOffset, deltaTime, isColliding, enemies);
  }
}