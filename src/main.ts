import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { WorldGenerator } from "./WorldGenerator";
import { CHUNK_SIZE } from "./Chunk";
import { randInt } from "three/src/math/MathUtils.js";
import { LightingManager } from "./LightingManager";

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
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

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

  // Note: We're using a custom lighting system now via LightingManager
  // Keep minimal Three.js lights for compatibility, but reduce their intensity
  // The dynamic lighting is handled by vertex colors

  // Minimal ambient light (most lighting is calculated dynamically)
  const ambient = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambient);

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

function createUI(chunkManager: ChunkManager, lightingManager: LightingManager) {
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

  function update(camera: THREE.Camera, sunAngle: number) {
    const pos = camera.position;
    const chunkPos = {
      x: Math.floor(pos.x / CHUNK_SIZE),
      y: Math.floor(pos.y / CHUNK_SIZE),
      z: Math.floor(pos.z / CHUNK_SIZE),
    };

    const sunPos = lightingManager.getSunLight().position;

    infoDiv.innerHTML = `
      <strong>Minecraft World Demo - Dynamic Lighting</strong><br>
      Click to lock mouse<br>
      WASD: Move | Space/Shift: Up/Down<br><br>
      Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}<br>
      Chunk: ${chunkPos.x}, ${chunkPos.y}, ${chunkPos.z}<br>
      Loaded Chunks: ${chunkManager.getLoadedChunkCount()}<br>
      Seed: ${chunkManager.getWorldGenerator().getSeed()}<br>
      Sun Angle: ${(sunAngle * 180 / Math.PI).toFixed(0)}°<br>
      Sun Dir: (${sunPos.x.toFixed(2)}, ${sunPos.y.toFixed(2)}, ${sunPos.z.toFixed(2)})
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
    terrainScale: 0.05,
    terrainHeight: 11,
  });

  // Initialize chunk manager
  const chunkManager = new ChunkManager(scene, worldGenerator, {
    renderDistance: 3,
    unloadDistance: 4,
  });

  // Initialize lighting manager with dynamic lighting support
  const lightingManager = new LightingManager(chunkManager);
  chunkManager.setLightingManager(lightingManager);

  // Load initial chunks around the player
  await chunkManager.updateChunks(camera.position);

  // Setup controls
  const controls = setupControls(camera);

  // Create UI
  const ui = createUI(chunkManager, lightingManager);

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
  let sunAngle = Math.PI / 3; // Start at 60 degrees
  let lastLightingUpdate = 0;
  const lightingUpdateInterval = 100; // Update lighting every 100ms

  function animate() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update controls
    controls.update(deltaTime);

    // Update chunks based on camera position
    chunkManager.updateChunks(camera.position);

    // Animate sun position (day/night cycle) - rotates around the world
    // Sun moves slowly to create dynamic shadows
    sunAngle += deltaTime * 0.1; // Rotate 0.1 radians per second
    const sunRadius = 1.0; // Unit sphere for directional light
    const sunX = Math.cos(sunAngle) * sunRadius;
    const sunY = Math.sin(sunAngle) * sunRadius;
    const sunZ = 0.5;

    const newSunDirection = new THREE.Vector3(sunX, sunY, sunZ).normalize();
    lightingManager.updateSunPosition(newSunDirection);

    // Periodically regenerate chunk meshes to show lighting updates
    // This demonstrates dynamic lighting - in a real game, you'd only update
    // chunks that are affected by lighting changes
    if (currentTime - lastLightingUpdate > lightingUpdateInterval) {
      chunkManager.regenerateAllChunkMeshes();
      lastLightingUpdate = currentTime;
    }

    // Update UI
    ui.update(camera, sunAngle);

    // Render scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  console.log("Minecraft world initialized with dynamic lighting!");
  console.log(`World seed: ${worldGenerator.getSeed()}`);
  console.log("Controls: WASD to move, Space/Shift for up/down, Mouse to look around");
  console.log("Watch the shadows move as the sun rotates!");
}

main();
