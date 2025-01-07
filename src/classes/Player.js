import * as THREE from "three";
import Hitbox from "./Hitbox.js";
import Projectile from "./Projectile.js";
import InputHandler from "./InputHandler.js";
import checkCollision from "../utils/checkCollision.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Player {
  constructor(scene, camera, ground, loadingManager, listener) {
    this.scene = scene;
    this.camera = camera;
    this.ground = ground;
    this.loadingManager = loadingManager;
    this.listener = listener;
    this.modelLoader = new GLTFLoader(this.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.audioLoader = new THREE.AudioLoader(this.loadingManager);
    this.sounds = this.createSounds();
    this.loadSounds();
    this.muzzleFlashTexture = this.textureLoader.load(
      "/Player/MuzzleFlash.png"
    );
    this.hands = null;
    this.createHands();
    this.input = new InputHandler();
    this.isIdle = false;
    this.isMoving = false;
    this.isScoping = false;
    this.isShooting = false;
    this.canShoot = true;
    this.isReloading = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.hideCrosshair = false;
    this.hitbox = new Hitbox({
      scene: this.scene,
      width: 6,
      height: 2.5,
      depth: 6,
      position: this.position,
    });
    this.position = new THREE.Vector3(0, 0.65, 25);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Quaternion();
    this.gunRotation = { x: 0, y: 0, z: 0.1 };
    this.gunOffset = { x: 0.25, y: -0.4, z: -0.25 };
    this.normalGunOffset = { x: 0.25, y: -0.4, z: -0.25 };
    this.scopedGunOffset = { x: 0, y: -0.2125, z: -0.2 };
    this.weight = 0.025;
    this.moveSpeed = 0.2;
    this.jumpForce = 0.5;
    this.tiltSpeed = 0.015;
    this.lastJumpTime = 0;
    this.jumpCooldown = 1.25;
    this.standardCameraHeight = 2;
    this.crouchCameraHeight = 0.75;
    this.crouchTransitionSpeed = 0.1;
    this.currentCameraHeight = this.standardCameraHeight;
    this.bobCycle = 0;
    this.bobSpeed = 1;
    this.bobAmount = 0.75;
    this.targetBobAmount = 0;
    this.currentBobAmount = 0;
    this.bobTransitionSpeed = 0.03;
    this.sprintRotation = 0;
    this.targetSprintRotation = 0;
    this.sprintGunYRotation = 1.25;
    this.sprintTransitionSpeed = 0.125;
    this.projectiles = [];
    this.timeToNewProjectile = 0;
    this.projectileInterval = 75;
    this.muzzleFlashes = [];
    this.spreadAmount = 0.1;
    this.recoil = {
      shotCount: 0,
      verticalAngle: 0,
      horizontalAngle: 0,
      kickbackAmount: 0.025,
      maxVerticalAngle: 0.15,
      maxHorizontalAngle: 0.03,
      verticalRecoilAmount: 0.05,
      positionRecoverySpeed: 0.15,
      verticalRecoverySpeed: 0.08,
      horizontalRecoilAmount: 0.02,
      horizontalRecoverySpeed: 0.06,
      position: { x: 0, y: 0, z: 0 },
    };
    this.health = {
      current: 100,
      max: 100,
      elements: {
        display: document.getElementById("health"),
      },
      damage: {
        new: 0,
        interval: 150,
        amount: () => Math.floor(Math.random() * 6 + 5),
      },
      painSound: {
        lastPlayed: 0,
        minInterval: 1000,
        isPlaying: false,
      },
    };
    this.armor = {
      current: 25,
      max: 100,
      elements: {
        parent: document.getElementById("armor-hud"),
        display: document.getElementById("armor"),
        warning: document.getElementById("warning-text"),
      },
      damage: {
        new: 0,
        interval: 150,
        amount: () => Math.floor(Math.random() * 6 + 5),
      },
      hasPlayedBreakSound: false,
    };
    this.ammo = {
      current: 30,
      max: 30,
      elements: {
        current: document.getElementById("ammo-current"),
        max: document.getElementById("ammo-max"),
      },
    };
    this.effects = {
      damage: {
        element: document.getElementById("damage"),
        setSrc(src) {
          this.element.src = src;
        },
      },
      vignette: document.getElementById("vignette"),
    };
    this.elements = {
      ammo: {
        displayer: document.getElementById("ammo-displayer"),
        chambered: {
          element: document.getElementById("chambered-bullet"),
          state: false,
        },
        bullets: {},
      },
      controls: document.getElementById("controls"),
    };
    this.animations = null;
    this.mixer = null;
    this.reloadAnimation = null;
    this.reloadAction = null;
    this.setupUI();
  }
  getPainSounds() {
    const soundAmount = 10;
    const sounds = {};
    for (let i = 0; i < soundAmount; i++) {
      sounds[`pain${i + 1}`] = {
        path: `Audio/pain${i + 1}.wav`,
        sound: new THREE.Audio(this.listener),
        volume: 0.75,
        loaded: false,
        shouldLoop: false,
      };
    }
    return sounds;
  }
  createSounds() {
    const painSounds = this.getPainSounds();
    return {
      footsteps: {
        path: "Audio/footsteps.wav",
        sound: new THREE.Audio(this.listener),
        volume: 0.15,
        loaded: false,
        shouldLoop: true,
      },
      scope: {
        path: "Audio/scope.wav",
        sound: new THREE.Audio(this.listener),
        volume: 0.75,
        loaded: false,
        shouldLoop: false,
      },
      unscope: {
        path: "Audio/unscope.wav",
        sound: new THREE.Audio(this.listener),
        volume: 0.5,
        loaded: false,
        shouldLoop: false,
      },
      reload: {
        path: "Audio/reload.wav",
        sound: new THREE.Audio(this.listener),
        volume: 0.5,
        loaded: false,
        shouldLoop: false,
      },
      shoot: {
        path: "Audio/shoot.wav",
        buffer: null,
        volume: 0.5,
        loaded: false,
        shouldLoop: false,
      },
      bulletCasings: {
        path: "Audio/bulletcasings.mp3",
        buffer: null,
        volume: 0.5,
        loaded: false,
        shouldLoop: false,
      },
      jump1: {
        path: "Audio/jump1.ogg",
        sound: new THREE.Audio(this.listener),
        volume: 1.5,
        loaded: false,
        shouldLoop: false,
      },
      jump2: {
        path: "Audio/jump2.ogg",
        sound: new THREE.Audio(this.listener),
        volume: 1.5,
        loaded: false,
        shouldLoop: false,
      },
      armor: {
        path: "Audio/armor.mp3",
        sound: new THREE.Audio(this.listener),
        volume: 0.75,
        loaded: false,
        shouldLoop: false,
      },
      ...painSounds,
    };
  }
  loadSounds() {
    Object.values(this.sounds).forEach((soundData) => {
      this.audioLoader.load(soundData.path, (buffer) => {
        if (
          soundData === this.sounds.shoot ||
          soundData === this.sounds.bulletCasings
        )
          soundData.buffer = buffer;
        else {
          soundData.sound = new THREE.Audio(this.listener);
          soundData.sound.setBuffer(buffer);
          soundData.sound.setVolume(soundData.volume);
          soundData.sound.setLoop(soundData.shouldLoop);
        }
        soundData.loaded = true;
      });
    });
  }
  playSound(soundName) {
    const soundData = this.sounds[soundName];
    if (soundData && soundData.loaded && !soundData.sound.isPlaying)
      soundData.sound.play();
  }
  setSoundSpeed(soundName, rate) {
    const soundData = this.sounds[soundName];
    soundData.sound.setPlaybackRate(rate);
  }
  setSoundVolume(soundName, volume) {
    const soundData = this.sounds[soundName];
    soundData.sound.setVolume(volume);
  }
  pauseSound(soundName) {
    const soundData = this.sounds[soundName];
    if (soundData && soundData.sound.isPlaying) soundData.sound.stop();
  }
  handleFootsteps() {
    const soundType = "footsteps";
    if (this.isSprinting) {
      this.setSoundSpeed(soundType, 2);
      this.setSoundVolume(soundType, 0.25);
    } else if (this.isCrouching || this.isScoping) {
      this.setSoundSpeed(soundType, 1);
      this.setSoundVolume(soundType, 0.075);
    } else {
      this.setSoundSpeed(soundType, 1.25);
      this.setSoundVolume(soundType, 0.15);
    }
    if (this.isMoving && this.onGround()) this.playSound(soundType);
    else this.pauseSound(soundType);
  }
  handleSounds() {
    this.handleFootsteps();
  }
  createHands() {
    this.modelLoader.load("/Player/Gun/rifle.glb", (gltf) => {
      const model = gltf.scene;
      model.position.set(
        this.position.x + this.gunOffset.x,
        this.position.y + this.gunOffset.y,
        this.position.z + this.gunOffset.z
      );
      model.rotation.set(
        this.gunRotation.x,
        this.gunRotation.y,
        this.gunRotation.z
      );
      model.scale.set(1.575, 1.575, 1.575);
      this.scene.add(model);
      this.hands = model;
      if (gltf.animations && gltf.animations.length > 0) {
        this.animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(model);
        this.reloadAnimation = this.animations[0];
        if (this.reloadAnimation) {
          this.reloadAction = this.mixer.clipAction(this.reloadAnimation);
          this.reloadAction.setEffectiveTimeScale(0.001);
        }
      }
    });
  }
  setupUI() {
    const bullet = document.createElement("img");
    bullet.src = "Other/bullet.png";
    bullet.alt = "Bullet.";
    bullet.className = "bullet unused";
    const bulletParent = document.createElement("div");
    bulletParent.appendChild(bullet);
    for (let i = 0; i < this.ammo.max; i++) {
      this.elements.ammo.displayer.appendChild(bulletParent.cloneNode(true));
      this.elements.ammo.bullets[i] = this.elements.ammo.displayer.children[i];
    }
  }
  handleAmmoUI() {
    this.ammo.elements.current.innerHTML = this.ammo.current;
    if (this.ammo.current > this.ammo.max)
      this.elements.ammo.chambered.state = true;
    else this.elements.ammo.chambered.state = false;
    this.elements.ammo.chambered.element.className = this.elements.ammo
      .chambered.state
      ? "active"
      : "inactive";
    for (let i = 0; i < this.ammo.max; i++) {
      if (i < this.ammo.current)
        this.elements.ammo.bullets[i].firstChild.className = "bullet unused";
      else this.elements.ammo.bullets[i].firstChild.className = "bullet used";
    }
  }
  handleInput(deltaTime) {
    const keys = this.input.keys;
    if (keys.includes("KeyP")) this.elements.controls.style.opacity = 0.75;
    else this.elements.controls.style.opacity = 0;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    forward.setFromMatrixColumn(this.camera.matrix, 0);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(new THREE.Vector3(0, 1, 0), forward);
    this.velocity.x = 0;
    this.velocity.z = 0;
    this.isMoving = false;
    this.isIdle = true;
    if (this.onGround()) this.spreadAmount = 0.075;
    else this.spreadAmount = 0.25;
    let targetGunRotationZ = 0.1;
    if (keys.includes("KeyW")) {
      if (this.onGround()) this.spreadAmount = 0.15;
      else this.spreadAmount = 0.25;
      this.velocity.x += right.x * this.moveSpeed;
      this.velocity.z += right.z * this.moveSpeed;
      this.isMoving = true;
    } else if (keys.includes("KeyS")) {
      if (this.onGround()) this.spreadAmount = 0.15;
      else this.spreadAmount = 0.25;
      this.velocity.x += -right.x * this.moveSpeed;
      this.velocity.z += -right.z * this.moveSpeed;
      this.isMoving = true;
    }
    if (keys.includes("KeyA")) {
      if (this.onGround()) this.spreadAmount = 0.15;
      else this.spreadAmount = 0.25;
      this.velocity.x += -forward.x * this.moveSpeed;
      this.velocity.z += -forward.z * this.moveSpeed;
      targetGunRotationZ = 1;
      this.isMoving = true;
    } else if (keys.includes("KeyD")) {
      if (this.onGround()) this.spreadAmount = 0.15;
      else this.spreadAmount = 0.25;
      this.velocity.x += forward.x * this.moveSpeed;
      this.velocity.z += forward.z * this.moveSpeed;
      targetGunRotationZ = -1;
      this.isMoving = true;
    }
    if (!this.isScoping) {
      this.gunRotation.z = THREE.MathUtils.lerp(
        this.gunRotation.z,
        targetGunRotationZ,
        this.tiltSpeed
      );
    }
    if (
      keys.includes("ShiftLeft") &&
      this.isMoving &&
      !this.isCrouching &&
      !this.isScoping &&
      !this.isShooting &&
      !this.isReloading
    ) {
      this.isSprinting = true;
      this.bobSpeed = 9;
      this.moveSpeed = 0.3;
      if (this.onGround()) this.targetSprintRotation = this.sprintGunYRotation;
      else this.targetSprintRotation = 0;
    } else {
      this.isSprinting = false;
      this.bobSpeed = 6;
      this.moveSpeed = 0.125;
      this.targetSprintRotation = 0;
    }
    this.sprintRotation = THREE.MathUtils.lerp(
      this.sprintRotation,
      this.targetSprintRotation,
      this.sprintTransitionSpeed
    );
    if (keys.includes("KeyC") && this.onGround()) {
      this.bobSpeed = 3;
      this.moveSpeed = 0.05;
      if (this.isMoving) this.spreadAmount = 0.05;
      else this.spreadAmount = 0.03;
      this.isCrouching = true;
      if (!this.isScoping)
        this.gunRotation.z = THREE.MathUtils.lerp(this.gunRotation.z, 0.5, 0.1);
    } else {
      this.isCrouching = false;
      if (!this.isScoping)
        this.gunRotation.z = THREE.MathUtils.lerp(
          this.gunRotation.z,
          0.1,
          0.05
        );
    }
    const currentTime = performance.now() / 1000;
    if (keys.includes("Space") && this.onGround() && !this.isCrouching) {
      if (currentTime - this.lastJumpTime >= this.jumpCooldown) {
        this.velocity.y = this.jumpForce;
        this.lastJumpTime = currentTime;
        this.playSound(`jump${Math.floor(Math.random() * 2 + 1)}`);
      }
    }
    if (keys.includes("KeyR") && this.ammo.current < 31) this.reload();
    if (this.input.mouse.right && this.onGround() && !this.isReloading) {
      if (!this.isScoping) {
        this.isScoping = true;
        this.playSound("scope");
      }
      if (this.isCrouching) this.spreadAmount = 0.02;
      else this.spreadAmount = 0.05;
      if (this.isMoving) this.spreadAmount += 0.01;
    } else if (this.isScoping) {
      this.isScoping = false;
      this.playSound("unscope");
    }
    if (this.input.mouse.left && this.canShoot) {
      this.isShooting = true;
      this.shoot(deltaTime);
    } else this.isShooting = false;
    if (!this.onGround() && this.isSprinting) this.spreadAmount = 0.5;
    else if (!this.onGround() && this.isMoving) this.spreadAmount = 0.4;
    if (!this.onGround()) this.isIdle = false;
    if (
      keys.includes("KeyW") ||
      keys.includes("KeyS") ||
      keys.includes("KeyA") ||
      keys.includes("KeyD")
    ) {
      this.isIdle = false;
    }
    if (this.isShooting) this.isIdle = false;
    if (this.isScoping) {
      if (this.isMoving) {
        this.isIdle = false;
      }
    }
    if (
      this.isScoping ||
      this.isReloading ||
      (this.isSprinting && this.onGround())
    )
      this.hideCrosshair = true;
    else this.hideCrosshair = false;
  }
  adjustGunOffset(targetOffset) {
    this.gunOffset.x = THREE.MathUtils.lerp(
      this.gunOffset.x,
      targetOffset.x,
      0.1
    );
    this.gunOffset.y = THREE.MathUtils.lerp(
      this.gunOffset.y,
      targetOffset.y,
      0.1
    );
    this.gunOffset.z = THREE.MathUtils.lerp(
      this.gunOffset.z,
      targetOffset.z,
      0.1
    );
  }
  handleScoping() {
    if (this.isScoping) {
      this.effects.vignette.style.opacity = 1;
      this.bobSpeed = 2;
      this.moveSpeed = 0.075;
      this.targetSprintRotation = 0;
      if (!this.isReloading) {
        this.gunRotation.z = THREE.MathUtils.lerp(this.gunRotation.z, 0, 0.1);
        this.adjustGunOffset(this.scopedGunOffset);
      }
    } else {
      this.effects.vignette.style.opacity = 0;
      this.adjustGunOffset(this.normalGunOffset);
    }
  }
  move() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;
  }
  applyGravity() {
    if (!this.onGround()) {
      this.velocity.y -= this.weight;
      if (this.gunOffset.y < 1.125)
        this.gunOffset.y += THREE.MathUtils.lerp(0, 1.125, 0.0075);
    } else {
      this.velocity.y = 0;
      if (this.gunOffset.y > -0.4) this.gunOffset.y -= 0.015;
    }
  }
  updateHitbox() {
    this.hitbox.update({ position: this.position });
  }
  shoot(deltaTime) {
    if (this.timeToNewProjectile >= this.projectileInterval) {
      this.applyRecoil();
      const forward = new THREE.Vector3(0, 0, -1);
      forward.unproject(this.camera);
      const cameraPos = new THREE.Vector3();
      this.camera.getWorldPosition(cameraPos);
      forward.sub(cameraPos);
      forward.normalize();
      const spreadX = (Math.random() - 0.5) * this.spreadAmount;
      const spreadY = (Math.random() - 0.5) * this.spreadAmount;
      forward.x += spreadX;
      forward.y += spreadY;
      forward.normalize();
      const bulletStartPos = new THREE.Vector3(
        this.hands.position.x,
        this.hands.position.y,
        this.hands.position.z
      );
      const bulletSpeed = 2;
      const bulletVelocity = new THREE.Vector3(
        forward.x * bulletSpeed,
        forward.y * bulletSpeed,
        forward.z * bulletSpeed
      );
      const projectile = new Projectile({
        scene: this.scene,
        position: bulletStartPos,
        velocity: bulletVelocity,
      });
      this.projectiles.push(projectile);
      this.ammo.current--;
      if (this.sounds.shoot.loaded) {
        const shootSound = new THREE.Audio(this.listener);
        shootSound.setBuffer(this.sounds.shoot.buffer);
        shootSound.setVolume(this.sounds.shoot.volume);
        shootSound.play();
      }
      if (this.sounds.bulletCasings.loaded) {
        const casingSound = new THREE.Audio(this.listener);
        casingSound.setBuffer(this.sounds.bulletCasings.buffer);
        casingSound.setVolume(this.sounds.bulletCasings.volume);
        casingSound.play();
      }
      const flash = this.createMuzzleFlash();
      this.muzzleFlashes.push(flash);
      this.scene.add(flash);
      window.setTimeout(() => {
        flash.opacity = 0;
      }, 50);
      window.setTimeout(() => {
        this.scene.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
      }, 100);
      this.timeToNewProjectile = 0;
    } else this.timeToNewProjectile += deltaTime;
  }
  createMuzzleFlash() {
    const flashGeometry = new THREE.PlaneGeometry(5, 5);
    const flashMaterial = new THREE.MeshBasicMaterial({
      map: this.muzzleFlashTexture,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
    const gunWorldPos = new THREE.Vector3();
    const gunWorldDir = new THREE.Vector3();
    this.hands.getWorldPosition(gunWorldPos);
    this.hands.getWorldDirection(gunWorldDir);
    const muzzleOffset = gunWorldDir.clone().multiplyScalar(-1.2);
    flashMesh.position.copy(gunWorldPos).add(muzzleOffset);
    flashMesh.position.y += 0.25;
    flashMesh.position.x -= Math.random() * 0.1;
    flashMesh.lookAt(gunWorldPos.clone().add(gunWorldDir));
    flashMesh.rotation.copy(this.hands.rotation);
    flashMesh.rotation.z = Math.random() * Math.PI * 2;
    flashMesh.scale.set(
      0.2 + Math.random() * 0.2,
      0.2 + Math.random() * 0.2,
      0.2
    );
    const muzzleLight = new THREE.PointLight(0xffaa00, 3);
    muzzleLight.position.set(
      flashMesh.position.x,
      flashMesh.position.y,
      flashMesh.position.z
    );
    this.scene.add(muzzleLight);
    window.setTimeout(() => {
      let fadeOut = () => {
        if (muzzleLight.intensity > 0.1) {
          muzzleLight.intensity -= 0.25;
          requestAnimationFrame(fadeOut);
        } else {
          this.scene.remove(muzzleLight);
        }
      };
      fadeOut();
    }, 0);
    return flashMesh;
  }
  updateMuzzleFlashes() {
    this.muzzleFlashes.forEach((muzzleFlash, muzzleFlashIndex) => {
      if (muzzleFlash.opacity <= 0) {
        this.muzzleFlashes.splice(muzzleFlashIndex, 1);
      } else {
        const gunWorldPos = new THREE.Vector3();
        const gunWorldDir = new THREE.Vector3();
        this.hands.getWorldPosition(gunWorldPos);
        this.hands.getWorldDirection(gunWorldDir);
        const muzzleOffset = gunWorldDir.clone().multiplyScalar(-1.2);
        muzzleFlash.position.copy(gunWorldPos).add(muzzleOffset);
        muzzleFlash.position.y += 0.25;
        muzzleFlash.lookAt(gunWorldPos.clone().add(gunWorldDir));
        muzzleFlash.rotation.copy(this.hands.rotation);
        muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      }
    });
  }
  applyRecoil() {
    this.recoil.verticalAngle +=
      this.recoil.verticalRecoilAmount *
      (0.025 + this.recoil.shotCount * 0.025);
    this.recoil.horizontalAngle +=
      this.recoil.horizontalRecoilAmount * (Math.random() - 0.5);
    this.recoil.verticalAngle = Math.min(
      this.recoil.verticalAngle,
      this.recoil.maxVerticalAngle
    );
    this.recoil.horizontalAngle = THREE.MathUtils.clamp(
      this.recoil.horizontalAngle,
      -this.recoil.maxHorizontalAngle,
      this.recoil.maxHorizontalAngle
    );
    this.recoil.position.z += this.recoil.kickbackAmount;
  }
  updateRecoil() {
    this.recoil.verticalAngle = THREE.MathUtils.lerp(
      this.recoil.verticalAngle,
      0,
      this.recoil.verticalRecoverySpeed
    );
    this.recoil.horizontalAngle = THREE.MathUtils.lerp(
      this.recoil.horizontalAngle,
      0,
      this.recoil.horizontalRecoverySpeed
    );
    this.recoil.position.z = THREE.MathUtils.lerp(
      this.recoil.position.z,
      0,
      this.recoil.positionRecoverySpeed
    );
  }
  updateProjectiles() {
    this.projectiles.forEach((projectile, projectileIndex) => {
      if (
        projectile.model.position.z >= 1000 ||
        projectile.model.position.z <= -1000
      ) {
        projectile.remove();
        this.projectiles.splice(projectileIndex, 1);
      } else projectile.update();
    });
  }
  updateHeadBob(deltaTime) {
    if (!this.isMoving) {
      this.bobSpeed = 1;
      this.bobAmount = 0.1;
    } else this.bobAmount = 0.25;
    if (this.onGround()) {
      this.bobCycle += deltaTime * this.bobSpeed;
      this.targetBobAmount = this.bobAmount;
    } else this.targetBobAmount = 0;
    this.currentBobAmount = THREE.MathUtils.lerp(
      this.currentBobAmount,
      this.targetBobAmount,
      this.bobTransitionSpeed
    );
    const bobOffsetX = Math.cos(this.bobCycle) * this.currentBobAmount;
    const bobOffsetY = Math.sin(this.bobCycle) * this.currentBobAmount;
    if (!this.isMoving && Math.abs(this.currentBobAmount) < 0.001) {
      this.bobCycle = 0;
      return 0;
    }
    return { x: bobOffsetX, y: bobOffsetY };
  }
  adjustCamera() {
    const bobOffset = this.updateHeadBob(0.016);
    const targetCameraHeight = this.isCrouching
      ? this.crouchCameraHeight
      : this.standardCameraHeight;
    this.currentCameraHeight = THREE.MathUtils.lerp(
      this.currentCameraHeight,
      targetCameraHeight,
      this.crouchTransitionSpeed
    );
    this.camera.position.set(
      this.position.x,
      this.position.y + this.currentCameraHeight,
      this.position.z
    );
    this.camera.position.y += bobOffset.y;
  }
  adjustHands() {
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    const matrix = new THREE.Matrix4();
    matrix.extractRotation(this.camera.matrix);
    const gunPosition = new THREE.Vector3(
      this.gunOffset.x,
      this.gunOffset.y,
      this.gunOffset.z
    );
    const bobOffset = this.updateHeadBob(0.016);
    gunPosition.applyMatrix4(matrix);
    this.hands.position.set(
      this.camera.position.x + gunPosition.x + bobOffset.x * 0.025,
      this.camera.position.y + gunPosition.y + bobOffset.y * 0.025,
      this.camera.position.z + gunPosition.z
    );
    const cameraQuaternion = new THREE.Quaternion();
    this.camera.getWorldQuaternion(cameraQuaternion);
    const sprintQuaternion = new THREE.Quaternion();
    sprintQuaternion.setFromEuler(new THREE.Euler(0, this.sprintRotation, 0));
    const finalQuaternion = new THREE.Quaternion();
    finalQuaternion.multiplyQuaternions(cameraQuaternion, sprintQuaternion);
    this.hands.setRotationFromQuaternion(finalQuaternion);
    this.hands.rotation.x += this.gunRotation.x;
    this.hands.rotation.z += this.gunRotation.z;
    this.hands.position.z += this.recoil.position.z;
    const recoilShake = Math.abs(this.recoil.verticalAngle) * 2;
    this.hands.position.x += (Math.random() - 0.5) * recoilShake;
    this.hands.position.y += (Math.random() - 0.5) * recoilShake;
  }
  reload() {
    if (this.isReloading) return;
    this.canShoot = false;
    this.isReloading = true;
    this.sounds.reload.sound.play();
    if (this.reloadAction) this.reloadAction.reset().play();
    window.setTimeout(() => {
      if (this.health.current <= 0) return;
      if (this.ammo.current === this.ammo.max)
        this.ammo.current = this.ammo.max + 1;
      else this.ammo.current = this.ammo.max;
      if (this.reloadAction) this.reloadAction.stop();
      this.canShoot = true;
      this.isReloading = false;
      this.sounds.reload.sound.stop();
    }, 2325);
  }
  updateAmmo() {
    if (this.ammo.current <= 0) {
      this.ammo.current = 0;
      this.reload();
    }
  }
  updateArmor(deltaTime) {
    if (this.armor.damage.new >= this.armor.damage.interval) {
      this.armor.current -= this.armor.damage.amount();
      this.armor.damage.new = 0;
    } else this.armor.damage.new += deltaTime;
    if (this.armor.current <= 0 && !this.armor.hasPlayedBreakSound) {
      this.playSound("armor");
      this.armor.hasPlayedBreakSound = true;
      this.armor.elements.warning.style.display = "block";
      window.setTimeout(() => {
        this.armor.elements.warning.style.display = "none";
      }, 3500);
    }
    if (this.armor.current > 0) this.armor.hasPlayedBreakSound = false;
  }
  playPainSound() {
    const currentTime = performance.now();
    if (
      currentTime - this.health.painSound.lastPlayed >=
      this.health.painSound.minInterval
    ) {
      const soundNumber = Math.floor(Math.random() * 10 + 1);
      const soundName = `pain${soundNumber}`;
      this.playSound(soundName);
      this.health.painSound.lastPlayed = currentTime;
    }
  }
  updateHealth(deltaTime) {
    if (this.health.current <= 0) return;
    if (this.armor.current <= 0) this.armor.current = 0;
    if (this.armor.current) {
      this.updateArmor(deltaTime);
      this.playPainSound();
      return;
    }
    if (this.health.damage.new >= this.health.damage.interval) {
      this.health.current -= this.health.damage.amount();
      this.health.damage.new = 0;
      this.playPainSound();
    } else this.health.damage.new += deltaTime;
  }
  handleHealthUI() {
    this.health.elements.display.innerHTML = this.health.current;
    const healthPercentage = (this.health.current / this.health.max) * 100;
    let color = { r: 87, g: 169, b: 74 };
    if (healthPercentage > 75) color = { r: 87, g: 169, b: 74 };
    else if (healthPercentage > 40) color = { r: 250, g: 204, b: 21 };
    else color = { r: 248, g: 113, b: 113 };
    this.health.elements.display.style.background = `linear-gradient(to right, rgba(${color.r}, ${color.g}, ${color.b}, 1), rgba(${color.r}, ${color.g}, ${color.b}, 0.5))`;
  }
  handleArmorUI() {
    this.armor.elements.display.innerHTML = this.armor.current;
    const armorPercentage = (this.armor.current / this.armor.max) * 100;
    let color = { r: 96, g: 149, b: 186 };
    if (armorPercentage > 75) color = { r: 56, g: 109, b: 146 };
    else if (armorPercentage > 40) color = { r: 76, g: 129, b: 166 };
    this.armor.elements.display.style.background = `linear-gradient(to left, rgba(${color.r}, ${color.g}, ${color.b}, 1), rgba(${color.r}, ${color.g}, ${color.b}, 0.5))`;
    if (this.armor.current <= 0)
      this.armor.elements.parent.style.display = "none";
    else this.armor.elements.parent.style.display = "block";
  }
  updateUI() {
    this.handleAmmoUI();
    this.handleHealthUI();
    this.handleArmorUI();
  }
  handleBoundaries() {
    if (this.position.x >= this.ground.boundaries.right)
      this.position.x = this.ground.boundaries.right;
    else if (this.position.x <= this.ground.boundaries.left)
      this.position.x = this.ground.boundaries.left;
    if (this.position.z >= this.ground.boundaries.front)
      this.position.z = this.ground.boundaries.front;
    else if (this.position.z <= this.ground.boundaries.back)
      this.position.z = this.ground.boundaries.back;
  }
  update(deltaTime) {
    if (this.mixer) this.mixer.update(deltaTime);
    this.handleInput(deltaTime);
    this.handleScoping();
    this.move();
    this.updateProjectiles();
    this.updateMuzzleFlashes();
    this.updateRecoil();
    this.updateHitbox();
    this.applyGravity();
    this.adjustCamera();
    this.adjustHands();
    this.updateAmmo();
    this.updateUI();
    this.handleBoundaries();
    this.handleSounds();
  }
  onGround() {
    const collision = checkCollision(
      this.hitbox.faces,
      this.ground.hitbox.faces
    );
    return collision.y;
  }
  restart() {
    this.isIdle = false;
    this.isMoving = false;
    this.isScoping = false;
    this.isShooting = false;
    this.canShoot = true;
    this.isReloading = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.hideCrosshair = false;
    this.position = new THREE.Vector3(0, 0.65, 25);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Quaternion();
    this.camera.quaternion.copy(this.rotation);
    this.gunRotation = { x: 0, y: 0, z: 0.1 };
    this.gunOffset = { x: 0.25, y: -0.4, z: -0.25 };
    this.normalGunOffset = { x: 0.25, y: -0.4, z: -0.25 };
    this.scopedGunOffset = { x: 0, y: -0.2125, z: -0.2 };
    this.moveSpeed = 0.2;
    this.lastJumpTime = 0;
    this.bobCycle = 0;
    this.targetBobAmount = 0;
    this.currentBobAmount = 0;
    this.sprintRotation = 0;
    this.targetSprintRotation = 0;
    this.projectiles.forEach((projectile) => {
      projectile.remove();
    });
    this.projectiles = [];
    this.timeToNewProjectile = 0;
    this.muzzleFlashes = [];
    this.spreadAmount = 0.1;
    this.health.current = this.health.max;
    this.health.damage.new = 0;
    this.armor.current = 25;
    this.armor.damage.new = 0;
    this.ammo.current = this.ammo.max;
    this.elements.ammo.chambered.state = false;
    this.input.keys = [];
    this.input.mouse.left = false;
    this.input.mouse.right = false;
    this.mixer.stopAllAction();
  }
}