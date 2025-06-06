import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let sword;
let pullCount = 0;
let luckyPullCount = 0;
let crates = [];
let barrels = [];
let successShown = false;
let runeLight, glowBall;

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.shadowMap.enabled = true;

  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 5, 10);

  const scene = new THREE.Scene();

  const loader = new THREE.CubeTextureLoader();
  const skybox = loader.setPath('resources/skybox/').load([
    'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png',
  ]);
  scene.background = skybox;

  const gltfLoader = new GLTFLoader();
  gltfLoader.load('resources/models/sword.glb', (gltf) => {
    sword = gltf.scene;
    sword.scale.set(1.5, 1.5, 1.5);
    sword.position.set(0, 0, 0);
    sword.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    scene.add(sword);

    runeLight = new THREE.PointLight(0x00ccff, 40, 80);
    runeLight.position.set(0, 3, 0);
    sword.add(runeLight);

    glowBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ccff })
    );
    glowBall.position.set(0, 3, 0);
    sword.add(glowBall);
  });

  const rockLoader = new GLTFLoader();
  rockLoader.load('resources/models/rock.glb', (gltf) => {
    const rock = gltf.scene;
    rock.traverse((child) => {
      if (child.isMesh) child.receiveShadow = true;
    });
    rock.scale.set(8, 8, 8);
    rock.position.set(0, 0, 0);
    scene.add(rock);
  });

  const textureLoader = new THREE.TextureLoader();
  const crateTexture = textureLoader.load('resources/textures/crate.jpg');

  const numCrates = 12;
  const radiusCrates = 10;
  for (let i = 0; i < numCrates; i++) {
    const angle = (i / numCrates) * Math.PI * 2;
    const x = radiusCrates * Math.cos(angle);
    const z = radiusCrates * Math.sin(angle);

    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshStandardMaterial({ map: crateTexture })
    );
    crate.position.set(x, 2, z);
    crate.userData = { fallen: true, angle };
    crate.castShadow = true;
    crates.push(crate);
    scene.add(crate);
  }

  const numBarrels = 12;
  const radiusBarrels = 16;
  for (let i = 0; i < numBarrels; i++) {
    const angle = (i / numBarrels) * Math.PI * 2;
    const x = radiusBarrels * Math.cos(angle);
    const z = radiusBarrels * Math.sin(angle);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 3, 32),
      new THREE.MeshStandardMaterial({ map: crateTexture })
    );
    barrel.position.set(x, 2, z);
    barrel.userData = { fallen: true, angle };
    barrel.castShadow = true;
    barrels.push(barrel);
    scene.add(barrel);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ambient = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambient);

  const moonLight = new THREE.DirectionalLight(0xff4444, 5);
  moonLight.position.set(-10, 20, 10);
  moonLight.castShadow = true;
  scene.add(moonLight);

  const sunLight = new THREE.DirectionalLight(0xffdd88, 6);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffcc66 })
  );
  scene.add(sunSphere);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.update();

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    crates.forEach(crate => {
      if (!crate.userData.fallen) {
        crate.rotation.z += 0.05;
        crate.position.x += 0.2 * Math.cos(crate.userData.angle);
        crate.position.z += 0.2 * Math.sin(crate.userData.angle);

        if (crate.rotation.z >= Math.PI / 2) {
          crate.rotation.z = Math.PI / 2;
          crate.userData.fallen = true;
        }
      }
    });

    barrels.forEach(barrel => {
      if (!barrel.userData.fallen) {
        barrel.rotation.z -= 0.05;
        barrel.position.x += 0.2 * Math.cos(barrel.userData.angle);
        barrel.position.z += 0.2 * Math.sin(barrel.userData.angle);

        if (barrel.rotation.z <= -Math.PI / 2) {
          barrel.rotation.z = -Math.PI / 2;
          barrel.userData.fallen = true;
        }
      }
    });

    const radius = 20;
    const angle = time;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    sunLight.position.set(x, 15, z);
    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();
    sunSphere.position.copy(sunLight.position);

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);

    if (sword && sword.position.y >= 3.6 && !successShown) {
      successShown = true;
      alert('You pulled the sword out!');
    }
  }

  requestAnimationFrame(render);

  window.addEventListener('click', () => {
    crates.forEach(crate => crate.userData.fallen = false);
    barrels.forEach(barrel => barrel.userData.fallen = false);

    if (sword) {
		const isBigPull = Math.random() < 0.1;
		const boost = isBigPull ? 0.5 : 0.1;
		sword.position.y += boost;
		pullCount++;
		document.getElementById('counter').textContent = `Pull Attempts: ${pullCount}`;

		if (isBigPull) {
			luckyPullCount++;
			document.getElementById('luckyCounter').textContent = `Big Pulls: ${luckyPullCount}`;
		}

      if (runeLight && glowBall) {
        const glowColor = isBigPull ? 0xffcc00 : 0x00ccff;
        runeLight.color.setHex(glowColor);
        glowBall.material.color.setHex(glowColor);
      }
    }
  });
}

main();