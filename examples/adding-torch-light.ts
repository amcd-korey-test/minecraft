/**
 * Example: Adding a Torch Light Source
 * 
 * This example demonstrates how to add a point light source (like a torch)
 * to the Minecraft world using the dynamic lighting system.
 */

import * as THREE from "three";
import { LightingManager } from "../src/LightingManager";
import { ChunkManager } from "../src/ChunkManager";

/**
 * Example function to add a torch at a specific world position
 */
export function addTorch(
  lightingManager: LightingManager,
  chunkManager: ChunkManager,
  position: THREE.Vector3,
  torchId: string
): void {
  // Add the torch as a point light source
  lightingManager.addLightSource(torchId, {
    position: position.clone(),
    intensity: 0.8, // Brightness (0-1)
    range: 10, // Light reaches 10 blocks
    color: new THREE.Color(1.0, 0.6, 0.2), // Warm orange glow
    type: "point",
  });

  // Regenerate chunks to show the new lighting
  chunkManager.regenerateAllChunkMeshes();

  console.log(`Torch "${torchId}" placed at position:`, position);
}

/**
 * Example: Moving a torch (e.g., player holding it)
 */
export function moveTorch(
  lightingManager: LightingManager,
  chunkManager: ChunkManager,
  torchId: string,
  newPosition: THREE.Vector3
): void {
  // Update the torch position
  lightingManager.updateLightSource(torchId, {
    position: newPosition.clone(),
  });

  // Regenerate chunks to update lighting
  chunkManager.regenerateAllChunkMeshes();
}

/**
 * Example: Remove a torch
 */
export function removeTorch(
  lightingManager: LightingManager,
  chunkManager: ChunkManager,
  torchId: string
): void {
  // Remove the light source
  lightingManager.removeLightSource(torchId);

  // Regenerate chunks to update lighting
  chunkManager.regenerateAllChunkMeshes();

  console.log(`Torch "${torchId}" removed`);
}

/**
 * Example: Add multiple colored lights
 */
export function addColoredLights(
  lightingManager: LightingManager,
  chunkManager: ChunkManager
): void {
  // Red light (lava)
  lightingManager.addLightSource("lava-pool", {
    position: new THREE.Vector3(10, 5, 10),
    intensity: 0.9,
    range: 8,
    color: new THREE.Color(1.0, 0.3, 0.0), // Red-orange
    type: "point",
  });

  // Blue light (magical crystal)
  lightingManager.addLightSource("crystal-1", {
    position: new THREE.Vector3(-10, 5, -10),
    intensity: 0.7,
    range: 12,
    color: new THREE.Color(0.2, 0.5, 1.0), // Blue
    type: "point",
  });

  // Green light (glowstone)
  lightingManager.addLightSource("glowstone-1", {
    position: new THREE.Vector3(0, 10, 0),
    intensity: 1.0,
    range: 15,
    color: new THREE.Color(0.9, 1.0, 0.6), // Yellow-green
    type: "point",
  });

  // Update all chunks to show the new lights
  chunkManager.regenerateAllChunkMeshes();

  console.log("Multiple colored lights added to the world");
}

/**
 * Example: Flickering torch effect
 * Call this in your animation loop for a realistic torch effect
 */
export function updateFlickeringTorch(
  lightingManager: LightingManager,
  torchId: string,
  time: number
): void {
  // Create a subtle flicker using sine waves
  const flicker = 0.8 + Math.sin(time * 5) * 0.1 + Math.sin(time * 11) * 0.05;

  lightingManager.updateLightSource(torchId, {
    intensity: Math.max(0.6, Math.min(1.0, flicker)),
  });
}

/**
 * Example: Player holding torch (updates with player position)
 */
export class PlayerTorch {
  private torchId: string = "player-torch";
  private lightingManager: LightingManager;
  private chunkManager: ChunkManager;

  constructor(lightingManager: LightingManager, chunkManager: ChunkManager) {
    this.lightingManager = lightingManager;
    this.chunkManager = chunkManager;

    // Add the torch initially
    this.lightingManager.addLightSource(this.torchId, {
      position: new THREE.Vector3(0, 0, 0),
      intensity: 0.8,
      range: 12,
      color: new THREE.Color(1.0, 0.6, 0.2),
      type: "point",
    });
  }

  // Call this every frame to update torch position with player
  updatePosition(playerPosition: THREE.Vector3): void {
    // Offset the torch slightly in front of the player
    const torchOffset = new THREE.Vector3(0, 0.5, -1);
    const torchPosition = playerPosition.clone().add(torchOffset);

    this.lightingManager.updateLightSource(this.torchId, {
      position: torchPosition,
    });
  }

  remove(): void {
    this.lightingManager.removeLightSource(this.torchId);
    this.chunkManager.regenerateAllChunkMeshes();
  }
}

/**
 * Example usage in main.ts:
 * 
 * // After creating lightingManager and chunkManager:
 * 
 * // Add a static torch
 * addTorch(lightingManager, chunkManager, new THREE.Vector3(10, 5, 10), "torch-1");
 * 
 * // Add colored lights
 * addColoredLights(lightingManager, chunkManager);
 * 
 * // Create player torch
 * const playerTorch = new PlayerTorch(lightingManager, chunkManager);
 * 
 * // In animation loop:
 * playerTorch.updatePosition(camera.position);
 * updateFlickeringTorch(lightingManager, "torch-1", currentTime / 1000);
 */
