import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { CHUNK_SIZE } from "./Chunk";
import { BlockType } from "./blocks";

/**
 * Represents a light source in the world
 */
export interface LightSource {
  position: THREE.Vector3;
  intensity: number;
  range: number; // Maximum distance the light reaches
  color: THREE.Color;
  type: "directional" | "point";
}

/**
 * Manages dynamic lighting and shadows for the Minecraft world
 */
export class LightingManager {
  private chunkManager: ChunkManager;
  private lightSources: Map<string, LightSource> = new Map();
  private sunLight: LightSource;
  private ambientLight: number = 0.3; // Minimum light level (0-1)

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager;

    // Initialize sun as the main directional light
    this.sunLight = {
      position: new THREE.Vector3(50, 100, 50).normalize(), // Direction for directional light
      intensity: 1.0,
      range: Infinity,
      color: new THREE.Color(1, 1, 1),
      type: "directional",
    };
  }

  /**
   * Calculate lighting value for a block face vertex
   * Returns a value between 0 and 1 representing brightness
   */
  calculateLightingAtPosition(
    position: THREE.Vector3,
    normal: THREE.Vector3
  ): number {
    let totalLight = this.ambientLight;

    // Calculate sunlight contribution
    totalLight += this.calculateDirectionalLight(position, normal, this.sunLight);

    // Calculate contribution from all point lights
    for (const lightSource of this.lightSources.values()) {
      if (lightSource.type === "point") {
        totalLight += this.calculatePointLight(position, normal, lightSource);
      }
    }

    // Clamp between 0 and 1
    return Math.min(1, Math.max(0, totalLight));
  }

  /**
   * Calculate directional light (sun) contribution with shadow casting
   */
  private calculateDirectionalLight(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    light: LightSource
  ): number {
    // Calculate dot product between normal and light direction
    const lightDir = light.position.clone().normalize();
    const dotProduct = normal.dot(lightDir);

    // If facing away from light, no contribution
    if (dotProduct <= 0) {
      return 0;
    }

    // Check for shadows by raycasting towards the sun
    const shadowFactor = this.calculateShadow(position, lightDir);

    // Final light contribution
    return dotProduct * light.intensity * shadowFactor;
  }

  /**
   * Calculate point light contribution with distance attenuation
   */
  private calculatePointLight(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    light: LightSource
  ): number {
    const lightVector = light.position.clone().sub(position);
    const distance = lightVector.length();

    // Check if position is within light range
    if (distance > light.range) {
      return 0;
    }

    // Normalize light direction
    const lightDir = lightVector.normalize();

    // Calculate dot product between normal and light direction
    const dotProduct = Math.max(0, normal.dot(lightDir));

    // Distance attenuation (quadratic falloff)
    const attenuation = Math.pow(1 - distance / light.range, 2);

    // Check for shadows
    const shadowFactor = this.calculateShadow(position, lightDir, distance);

    return dotProduct * light.intensity * attenuation * shadowFactor;
  }

  /**
   * Calculate shadow factor by raycasting from position towards light
   * Returns 0 if in shadow, 1 if in light
   */
  private calculateShadow(
    position: THREE.Vector3,
    lightDir: THREE.Vector3,
    maxDistance: number = 100
  ): number {
    // Start raycast slightly offset from the surface to avoid self-intersection
    const rayStart = position.clone().add(lightDir.clone().multiplyScalar(0.1));

    // Sample multiple points along the ray for Minecraft-style stepped shadows
    const steps = Math.min(10, Math.floor(maxDistance));
    const stepSize = maxDistance / steps;

    for (let i = 0; i < steps; i++) {
      const samplePoint = rayStart
        .clone()
        .add(lightDir.clone().multiplyScalar(i * stepSize));

      // Check if there's a solid block at this position
      if (this.isBlockSolidAt(samplePoint)) {
        // Calculate shadow intensity based on distance
        // Closer blocks create darker shadows
        const shadowStrength = 1 - i / steps;
        return shadowStrength * 0.3; // Return partial shadow (30% light gets through)
      }
    }

    // No obstruction found
    return 1.0;
  }

  /**
   * Check if there's a solid (non-transparent) block at the given world position
   */
  private isBlockSolidAt(worldPos: THREE.Vector3): boolean {
    // Convert world position to chunk coordinates
    const chunkX = Math.floor(worldPos.x / CHUNK_SIZE);
    const chunkY = Math.floor(worldPos.y / CHUNK_SIZE);
    const chunkZ = Math.floor(worldPos.z / CHUNK_SIZE);

    // Get the chunk
    const chunk = this.chunkManager.getChunk({ x: chunkX, y: chunkY, z: chunkZ });
    if (!chunk) {
      return false; // Unloaded chunks don't block light
    }

    // Convert to local chunk coordinates
    const localX = Math.floor(worldPos.x) - chunkX * CHUNK_SIZE;
    const localY = Math.floor(worldPos.y) - chunkY * CHUNK_SIZE;
    const localZ = Math.floor(worldPos.z) - chunkZ * CHUNK_SIZE;

    // Check if position is within chunk bounds
    if (
      localX < 0 ||
      localX >= CHUNK_SIZE ||
      localY < 0 ||
      localY >= CHUNK_SIZE ||
      localZ < 0 ||
      localZ >= CHUNK_SIZE
    ) {
      return false;
    }

    // Get block type
    const blockType = chunk.getBlock(localX, localY, localZ);

    // Check if block is solid (not air or transparent)
    return blockType !== BlockType.AIR && blockType !== BlockType.WATER;
  }

  /**
   * Update sun position (for day/night cycle or moving sun)
   */
  updateSunPosition(direction: THREE.Vector3): void {
    this.sunLight.position.copy(direction).normalize();
  }

  /**
   * Add a point light source (for torches, lava, etc.)
   */
  addLightSource(id: string, lightSource: LightSource): void {
    this.lightSources.set(id, lightSource);
  }

  /**
   * Remove a light source
   */
  removeLightSource(id: string): void {
    this.lightSources.delete(id);
  }

  /**
   * Update existing light source position or properties
   */
  updateLightSource(id: string, updates: Partial<LightSource>): void {
    const light = this.lightSources.get(id);
    if (light) {
      Object.assign(light, updates);
    }
  }

  /**
   * Get sun light source
   */
  getSunLight(): LightSource {
    return this.sunLight;
  }

  /**
   * Set ambient light level
   */
  setAmbientLight(level: number): void {
    this.ambientLight = Math.max(0, Math.min(1, level));
  }

  /**
   * Get all light sources
   */
  getAllLightSources(): LightSource[] {
    return [this.sunLight, ...Array.from(this.lightSources.values())];
  }
}
