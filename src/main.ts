import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { WorldGenerator } from "./WorldGenerator";
import { CHUNK_SIZE } from "./Chunk";
import { randInt } from "three/src/math/MathUtils.js";
import { Player } from "./Player";
import { DayNightCycle } from "./DayNightCycle";

function createRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue (will be updated by day/night cycle)
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

  // Directional light (sun) - position will be updated by day/night cycle
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Ambient light - intensity will be updated by day/night cycle
  const ambient = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambient);

  // Hemisphere light for better outdoor lighting - will be updated by day/night cycle
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.5);
  scene.add(hemiLight);

  return { scene, camera, sunLight, ambient, hemiLight };
}

function setupControls(camera: THREE.Camera, player: Player) {
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
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
    }
  });

  // Update camera rotation and player physics
  function update(deltaTime: number) {
    // Apply rotation to camera
    camera.rotation.order = "YXZ";
    camera.rotation.z = 0;
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Update player with physics
    player.update(deltaTime, keys);
  }

  return { update };
}

function createUI(chunkManager: ChunkManager, dayNightCycle: DayNightCycle) {
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

  function update(camera: THREE.Camera, player: Player) {
    const pos = camera.position;
    const chunkPos = {
      x: Math.floor(pos.x / CHUNK_SIZE),
      y: Math.floor(pos.y / CHUNK_SIZE),
      z: Math.floor(pos.z / CHUNK_SIZE),
    };

    const phase = dayNightCycle.getPhase();
    const timeStr = dayNightCycle.getTimeString();
    const phaseEmoji = phase === "day" ? "☀️" : phase === "night" ? "🌙" : phase === "sunrise" ? "🌅" : "🌆";

    infoDiv.innerHTML = `
      <strong>Minecraft World Demo</strong><br>
      Click to lock mouse<br>
      WASD: Move | Space: Jump | Mouse: Look<br><br>
      Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}<br>
      Chunk: ${chunkPos.x}, ${chunkPos.y}, ${chunkPos.z}<br>
      Loaded Chunks: ${chunkManager.getLoadedChunkCount()}<br>
      On Ground: ${player.isOnGround() ? "Yes" : "No"}<br>
      Seed: ${chunkManager.getWorldGenerator().getSeed()}<br><br>
      Time: ${timeStr} ${phaseEmoji}<br>
      Phase: ${phase.charAt(0).toUpperCase() + phase.slice(1)}
    `;
  }

  return { update };
}

async function main(): Promise<void> {
  const seed = randInt(0, 1000000);
  const renderer = createRenderer();
  const { scene, camera, sunLight, ambient, hemiLight } = createScene();

  // Initialize day/night cycle
  const dayNightCycle = new DayNightCycle(scene, sunLight, ambient, hemiLight, {
    dayLength: 600, // 10 minutes
    dayRatio: 2 / 3,
    nightRatio: 1 / 3,
    startTime: 0.25, // Start at mid-morning
  });

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

  console.log("Finding spawn position...");
  // Load initial chunks around origin first
  await chunkManager.updateChunks(new THREE.Vector3(0, CHUNK_SIZE, 0));

  // Find a valid spawn position on land
  const spawnPosition = await Player.findSpawnPosition(chunkManager);
  console.log(`Spawn position found at: ${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)}`);

  // Create player at spawn position
  const player = new Player(camera, chunkManager, spawnPosition);

  // Load chunks around player spawn position
  await chunkManager.updateChunks(player.getPosition());

  // Setup controls with player
  const controls = setupControls(camera, player);

  // Create UI
  const ui = createUI(chunkManager, dayNightCycle);

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

    // Update day/night cycle
    dayNightCycle.update(deltaTime);

    // Update controls
    controls.update(deltaTime);

    // Update chunks based on player position
    chunkManager.updateChunks(player.getPosition());

    // Update UI
    ui.update(camera, player);

    // Render scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  console.log("Minecraft world initialized!");
  console.log(`World seed: ${worldGenerator.getSeed()}`);
  console.log("Controls: WASD to move, Space to jump, Mouse to look around");
}

main();
