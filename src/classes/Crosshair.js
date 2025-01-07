import * as THREE from "three";

export default class Crosshair {
  constructor({ camera }) {
    this.camera = camera;
    this.hidden = false;
    this.spread = 0;
    this.crosshair = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, -1);
    this.crosshair.position.copy(this.position);
    this.baseSize = 0.05;
    this.minSize = 0.02;
    this.maxSize = 0.15;
    this.currentSize = this.baseSize;
    this.targetSize = this.baseSize;
    this.currentZ = -1;
    this.targetZ = -1;
    this.transitionSpeed = 0.25;
    this.currentOpacity = 1;
    this.targetOpacity = 1;
    this.opacityTransitionSpeed = 0.125;
    this.recoilMultiplier = 15.0;
    this.recoilRecoverySpeed = 0.1;
    this.maxRecoilSize = 0.3;
    this.recoilSize = 0;
    this.createCrosshair();
    this.init();
  }
  init() {
    this.camera.add(this.crosshair);
  }
  createCrosshair() {
    this.lineGeometries = [];
    this.crosshairLines = [];
    const crosshairsMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    for (let i = 0; i < 4; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineVerticies = [0, this.baseSize, 0, 0, this.minSize, 0];
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lineVerticies, 3)
      );
      const line = new THREE.Line(lineGeometry, crosshairsMaterial.clone());
      line.rotation.z = Math.PI * i * 0.5;
      this.crosshair.add(line);
      this.lineGeometries.push(lineGeometry);
      this.crosshairLines.push(line);
    }
  }
  updateLineSize(size) {
    this.lineGeometries.forEach((geometry) => {
      const positions = geometry.attributes.position.array;
      positions[1] = size;
      positions[4] = size * 0.4;
      geometry.attributes.position.needsUpdate = true;
    });
  }
  handleRecoil(recoilAmount) {
    const newRecoilSize = Math.min(
      recoilAmount * this.recoilMultiplier,
      this.maxRecoilSize
    );
    this.recoilSize = Math.max(this.recoilSize, newRecoilSize);
  }
  update(newSpread, hidden, recoilVerticalAngle = 0) {
    this.hidden = hidden;
    this.targetOpacity = this.hidden ? 0 : 1;
    this.handleRecoil(recoilVerticalAngle);
    this.recoilSize = THREE.MathUtils.lerp(
      this.recoilSize,
      0,
      this.recoilRecoverySpeed
    );
    if (this.spread !== newSpread) {
      this.spread = newSpread;
      this.targetZ = -1 - newSpread * 5;
      const spreadFactor = (newSpread - 0.015) / (0.2 - 0.015);
      this.targetSize =
        THREE.MathUtils.lerp(this.minSize, this.maxSize, spreadFactor) +
        this.recoilSize;
    }
    this.currentZ = THREE.MathUtils.lerp(
      this.currentZ,
      this.targetZ,
      this.transitionSpeed
    );
    this.position.z = this.currentZ;
    this.crosshair.position.copy(this.position);
    this.currentSize = THREE.MathUtils.lerp(
      this.currentSize,
      this.targetSize + this.recoilSize,
      this.transitionSpeed
    );
    this.updateLineSize(this.currentSize);
    this.currentOpacity = THREE.MathUtils.lerp(
      this.currentOpacity,
      this.targetOpacity,
      this.opacityTransitionSpeed
    );
    this.crosshairLines.forEach((line) => {
      line.material.opacity = this.currentOpacity;
    });
    this.crosshair.visible = true;
  }
  restart() {
    this.hidden = false;
    this.spread = 0;
    this.position = new THREE.Vector3(0, 0, -1);
    this.crosshair.position.copy(this.position);
    this.currentSize = this.baseSize;
    this.targetSize = this.baseSize;
    this.currentZ = -1;
    this.targetZ = -1;
    this.currentOpacity = 1;
    this.targetOpacity = 1;
    this.recoilSize = 0;
  }
}