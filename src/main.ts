import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { WorldGenerator } from "./WorldGenerator";
import { PlayerController } from "./PlayerController";
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
  // Camera position will be set by PlayerController after spawn
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


function createUI(chunkManager: ChunkManager, playerController: PlayerController) {
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
    const velocity = playerController.getVelocity();
    const grounded = playerController.isPlayerGrounded();

    infoDiv.innerHTML = `
      <strong>Minecraft World Demo</strong><br>
      Click to lock mouse<br>
      WASD: Move | Space: Jump | Shift: Sprint<br><br>
      Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}<br>
      Velocity: ${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}<br>
      Grounded: ${grounded ? "Yes" : "No"}<br>
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

  // Find spawn location on land
  const spawnLocation = worldGenerator.findSpawnLocation();
  console.log(`Spawning player at: ${spawnLocation.x.toFixed(1)}, ${spawnLocation.y.toFixed(1)}, ${spawnLocation.z.toFixed(1)}`);

  // Set camera to spawn position
  camera.position.set(spawnLocation.x, spawnLocation.y, spawnLocation.z);

  // Load initial chunks around spawn location
  await chunkManager.updateChunks(camera.position);

  // Setup player controller
  const playerController = new PlayerController(camera, chunkManager);

  // Create UI
  const ui = createUI(chunkManager, playerController);

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

    // Update player controller
    playerController.update(deltaTime);

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
  console.log("Controls: WASD to move, Space to jump, Shift to sprint, Mouse to look around");
}

main();
