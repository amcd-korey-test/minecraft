import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { WorldGenerator } from "./WorldGenerator";
import { CHUNK_SIZE } from "./Chunk";
import { randInt } from "three/src/math/MathUtils.js";

function createRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  scene.fog = new THREE.Fog(0x87ceeb, 50, 120);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Position camera to view the world
  camera.position.set(CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5, CHUNK_SIZE * 2);
  camera.lookAt(0, CHUNK_SIZE / 2, 0);
  scene.add(camera);

  // Directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Ambient light
  const ambient = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambient);

  // Hemisphere light for better outdoor lighting
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5);
  scene.add(hemiLight);

  return { scene, camera };
}

function setupControls(camera: THREE.Camera) {
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  };

  // Rotation state
  let yaw = 0;
  let pitch = 0;
  let isPointerLocked = false;

  // Request pointer lock on click
  document.addEventListener("click", () => {
    if (!isPointerLocked) {
      document.body.requestPointerLock();
    }
  });

  // Track pointer lock state
  document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === document.body;
  });

  // Mouse movement for camera rotation
  document.addEventListener("mousemove", (event) => {
    if (!isPointerLocked) return;

    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    // Clamp pitch to avoid flipping
    pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
  });

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
      case "w":
        keys.w = true;
        break;
      case "a":
        keys.a = true;
        break;
      case "s":
        keys.s = true;
        break;
      case "d":
        keys.d = true;
        break;
      case " ":
        keys.space = true;
        break;
      case "shift":
        keys.shift = true;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.key.toLowerCase()) {
      case "w":
        keys.w = false;
        break;
      case "a":
        keys.a = false;
        break;
      case "s":
        keys.s = false;
        break;
      case "d":
        keys.d = false;
        break;
      case " ":
        keys.space = false;
        break;
      case "shift":
        keys.shift = false;
        break;
    }
  });

  // Update camera position and rotation
  function update(deltaTime: number) {
    // Apply rotation
    camera.rotation.order = "YXZ";
    camera.rotation.z = 0;
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Calculate movement direction
    const moveSpeed = 10 * deltaTime;
    const direction = new THREE.Vector3();

    if (keys.w) direction.z -= 1;
    if (keys.s) direction.z += 1;
    if (keys.a) direction.x -= 1;
    if (keys.d) direction.x += 1;

    // Normalize to prevent faster diagonal movement
    if (direction.length() > 0) {
      direction.normalize();
    }

    // Apply rotation to direction
    direction.applyEuler(new THREE.Euler(0, yaw, 0, "YXZ"));

    // Vertical movement
    if (keys.space) direction.y += 1;
    if (keys.shift) direction.y -= 1;

    // Move camera
    camera.position.add(direction.multiplyScalar(moveSpeed));
  }

  return { update };
}

function createUI(chunkManager: ChunkManager) {
  const infoDiv = document.createElement("div");
  infoDiv.style.position = "absolute";
  infoDiv.style.top = "10px";
  infoDiv.style.left = "10px";
  infoDiv.style.color = "white";
  infoDiv.style.fontFamily = "monospace";
  infoDiv.style.fontSize = "14px";
  infoDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  infoDiv.style.padding = "10px";
  infoDiv.style.borderRadius = "5px";
  infoDiv.style.pointerEvents = "none";
  document.body.appendChild(infoDiv);

  function update(camera: THREE.Camera) {
    const pos = camera.position;
    const chunkPos = {
      x: Math.floor(pos.x / CHUNK_SIZE),
      y: Math.floor(pos.y / CHUNK_SIZE),
      z: Math.floor(pos.z / CHUNK_SIZE),
    };

    infoDiv.innerHTML = `
      <strong>Minecraft World Demo</strong><br>
      Click to lock mouse<br>
      WASD: Move | Space/Shift: Up/Down<br><br>
      Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}<br>
      Chunk: ${chunkPos.x}, ${chunkPos.y}, ${chunkPos.z}<br>
      Loaded Chunks: ${chunkManager.getLoadedChunkCount()}<br>
      Seed: ${chunkManager.getWorldGenerator().getSeed()}
    `;
  }

  return { update };
}

async function main(): Promise<void> {
  const seed = randInt(0, 1000000);
  const renderer = createRenderer();
  const { scene, camera } = createScene();

  // Initialize world generator with a seed
  const worldGenerator = new WorldGenerator({
    seed,
    seaLevel: 5,
    terrainScale: 0.02,
    terrainHeight: 20,
  });

  // Initialize chunk manager
  const chunkManager = new ChunkManager(scene, worldGenerator, {
    renderDistance: 8,
    unloadDistance: 10,
  });

  // Load initial chunks around the player
  await chunkManager.updateChunks(camera.position);

  // Setup controls
  const controls = setupControls(camera);

  // Create UI
  const ui = createUI(chunkManager);

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

  function animate() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update controls
    controls.update(deltaTime);

    // Update chunks based on camera position
    chunkManager.updateChunks(camera.position);

    // Update UI
    ui.update(camera);

    // Render scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  console.log("Minecraft world initialized!");
  console.log(`World seed: ${worldGenerator.getSeed()}`);
  console.log("Controls: WASD to move, Space/Shift for up/down, Mouse to look around");
}

main();
