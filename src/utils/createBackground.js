import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export default function createBackground(scene, renderer, loadingManager) {
  const loader = new RGBELoader(loadingManager);
  loader.load("/Background/background.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
  });
}