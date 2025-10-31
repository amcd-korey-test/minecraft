import * as THREE from "three";
import { ChunkManager } from "./world/ChunkManager";
import { CHUNK_SIZE } from "./world/Chunk";

interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

function createRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function createScene() {
  const scene = new THREE.Scene();
  // Sky blue background
  scene.background = new THREE.Color(0x87ceeb);
  
  // Fog for distance
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  
  // Start player above terrain
  camera.position.set(0, 40, 0);
  scene.add(camera);

  // Sun light
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 100, 50);
  sun.castShadow = true;
  scene.add(sun);

  // Ambient light
  const ambient = new THREE.AmbientLight(0x404040, 0.8);
  scene.add(ambient);

  return { scene, camera };
}

function setupControls(): PlayerControls {
  const controls: PlayerControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };

  const keyMap: { [key: string]: keyof PlayerControls } = {
    w: "forward",
    s: "backward",
    a: "left",
    d: "right",
    " ": "up", // spacebar
    Shift: "down",
  };

  window.addEventListener("keydown", (e) => {
    const control = keyMap[e.key.toLowerCase()] || keyMap[e.key];
    if (control) {
      controls[control] = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    const control = keyMap[e.key.toLowerCase()] || keyMap[e.key];
    if (control) {
      controls[control] = false;
      e.preventDefault();
    }
  });

  return controls;
}

function setupMouseLook(camera: THREE.Camera): void {
  let isLocked = false;
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const PI_2 = Math.PI / 2;

  document.addEventListener("click", () => {
    if (!isLocked) {
      document.body.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    isLocked = document.pointerLockElement === document.body;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isLocked) return;

    const sensitivity = 0.002;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * sensitivity;
    euler.x -= e.movementY * sensitivity;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
  });
}

function updatePlayer(
  camera: THREE.Camera,
  controls: PlayerControls,
  deltaTime: number
): void {
  const speed = 20; // blocks per second
  const velocity = new THREE.Vector3();

  if (controls.forward) velocity.z -= 1;
  if (controls.backward) velocity.z += 1;
  if (controls.left) velocity.x -= 1;
  if (controls.right) velocity.x += 1;
  if (controls.up) velocity.y += 1;
  if (controls.down) velocity.y -= 1;

  if (velocity.length() > 0) {
    velocity.normalize();
    velocity.multiplyScalar(speed * deltaTime);

    // Apply rotation to velocity (move in camera direction)
    velocity.applyQuaternion(camera.quaternion);

    camera.position.add(velocity);
  }
}

function createInfoPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.top = "10px";
  panel.style.left = "10px";
  panel.style.color = "white";
  panel.style.fontFamily = "monospace";
  panel.style.fontSize = "14px";
  panel.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  panel.style.padding = "10px";
  panel.style.borderRadius = "5px";
  panel.style.pointerEvents = "none";
  panel.style.userSelect = "none";
  document.body.appendChild(panel);
  return panel;
}

async function main(): Promise<void> {
  const renderer = createRenderer();
  const { scene, camera } = createScene();
  const controls = setupControls();
  setupMouseLook(camera);

  // Create info panel
  const infoPanel = createInfoPanel();

  // Initialize chunk manager with world config
  const chunkManager = new ChunkManager(
    scene,
    {
      seed: 12345,
      waterLevel: 20,
      terrainScale: 0.02,
      terrainHeight: 30,
    },
    6 // render distance in chunks
  );

  // Load initial chunks
  await chunkManager.updateChunks(camera.position);

  // Resize handler
  function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener("resize", onResize);

  // Animation loop
  let lastTime = performance.now();
  let lastChunkUpdate = 0;
  const chunkUpdateInterval = 500; // Update chunks every 500ms

  function animate() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update player movement
    updatePlayer(camera, controls, deltaTime);

    // Update chunks periodically
    if (currentTime - lastChunkUpdate > chunkUpdateInterval) {
      chunkManager.updateChunks(camera.position);
      lastChunkUpdate = currentTime;
    }

    // Update info panel
    const chunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
    infoPanel.innerHTML = `
      <strong>Minecraft Block World</strong><br>
      Position: ${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}<br>
      Chunk: ${chunkX}, ${chunkZ}<br>
      Loaded Chunks: ${chunkManager.getLoadedChunkCount()}<br>
      Seed: ${chunkManager.getGenerator().getSeed()}<br>
      <br>
      <em>Click to capture mouse</em><br>
      WASD: Move | Space: Up | Shift: Down
    `;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

main();
