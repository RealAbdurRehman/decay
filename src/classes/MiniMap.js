import * as THREE from "three";

export default class MiniMap {
  constructor({ scene, player, crosshair, width = 250, height = 200 }) {
    this.mainScene = scene;
    this.player = player;
    this.crosshair = crosshair;
    this.width = width;
    this.height = height;
    this.elements = {
      container: document.getElementById("mini-map"),
    };
    this.crosshairOpacity = 1;
    this.targetCrosshairOpacity = 1;
    this.opacityTransitionSpeed = 0.125;
    this.enemyMarkers = new Map();
    this.init();
    this.createPlayerMarker();
  }
  init() {
    this.camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 1, 1000);
    this.camera.up.set(0, 0, -1);
    this.updateCameraPosition();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.elements.container.appendChild(this.renderer.domElement);
  }
  createPlayerMarker() {
    this.playerMarker = new THREE.Group();
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 0.5);
    triangleShape.lineTo(0.3, -0.3);
    triangleShape.lineTo(-0.3, -0.3);
    triangleShape.lineTo(0, 0.5);
    const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
    const triangleMaterial = new THREE.MeshBasicMaterial({ color: 0x53fe8e });
    const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
    triangle.rotation.x = -Math.PI / 2;
    triangle.position.set(0, 0, 0);
    triangle.scale.set(5, 5, 5);
    this.playerMarker.add(triangle);
    this.playerMarker.position.y = 25;
    this.mainScene.add(this.playerMarker);
  }
  createEnemyMarker() {
    const marker = new THREE.Group();
    const circleGeometry = new THREE.CircleGeometry(0.4, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.scale.set(5, 5, 5);
    marker.add(circle);
    marker.position.y = 25;
    return marker;
  }
  updateEnemyMarkers(enemies) {
    for (const [enemy, marker] of this.enemyMarkers.entries()) {
      if (enemy.states.dead) {
        this.mainScene.remove(marker);
        this.enemyMarkers.delete(enemy);
      }
    }
    enemies.forEach(enemy => {
      if (!enemy.states.dead) {
        let marker = this.enemyMarkers.get(enemy);
        if (!marker) {
          marker = this.createEnemyMarker();
          this.mainScene.add(marker);
          this.enemyMarkers.set(enemy, marker);
        }
        marker.position.x = enemy.position.x;
        marker.position.z = enemy.position.z;
      }
    });
  }
  updateCameraPosition() {
    this.camera.position.set(
      this.player.position.x,
      100,
      this.player.position.z
    );
    this.camera.lookAt(this.player.position.x, 0, this.player.position.z);
  }
  updatePlayerMarker() {
    if (this.player) {
      this.playerMarker.position.x = this.player.position.x;
      this.playerMarker.position.z = this.player.position.z;
      if (this.player.camera) {
        const direction = new THREE.Vector3();
        this.player.camera.getWorldDirection(direction);
        this.playerMarker.rotation.y = Math.atan2(-direction.x, -direction.z);
      }
    }
  }
  displayCrosshair(isDisplayed) {
    this.targetCrosshairOpacity = isDisplayed
      ? this.crosshair.hidden
        ? 0
        : 1
      : 0;
    this.crosshairOpacity = THREE.MathUtils.lerp(
      this.crosshairOpacity,
      this.targetCrosshairOpacity,
      this.opacityTransitionSpeed
    );
    this.crosshair.crosshair.children.forEach((child) => {
      child.material.opacity = this.crosshairOpacity;
    });
  }
  update(enemies = []) {
    const light = new THREE.AmbientLight(0xffffff, 1);
    this.mainScene.add(light);
    const originalFog = this.mainScene.fog;
    this.mainScene.fog = null;
    const originalOpacities = this.crosshair.crosshair.children.map(
      (child) => child.material.opacity
    );
    this.displayCrosshair(false);
    this.updateCameraPosition();
    this.updatePlayerMarker();
    this.updateEnemyMarkers(enemies);   
    this.renderer.render(this.mainScene, this.camera);
    this.mainScene.remove(light);
    this.mainScene.fog = originalFog;
    this.displayCrosshair(true);
    this.crosshair.crosshair.children.forEach((child, index) => {
      child.material.opacity = originalOpacities[index];
    });
  }
}