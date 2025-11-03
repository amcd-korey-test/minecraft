import * as THREE from "three";
import { ChunkPosition, CHUNK_SIZE } from "./Chunk";
import { BlockType, BLOCK_CONFIG } from "./blocks";

/**
 * Types of light sources in the world
 */
export enum LightSourceType {
  SUN = "sun",
  TORCH = "torch",
  LAVA = "lava",
  // Extensible for future light sources
}

/**
 * Represents a light source in the world
 */
export interface LightSource {
  id: string;
  type: LightSourceType;
  position: THREE.Vector3;
  intensity: number; // 0-15, like Minecraft
  color?: THREE.Color;
}

/**
 * Configuration for lighting system
 */
export interface LightingConfig {
  enableSunlight: boolean;
  enableDynamicShadows: boolean;
  sunIntensity: number;
  timeOfDay: number; // 0-24000 like Minecraft
}

/**
 * Manages dynamic lighting and shadows for the world
 * Implements Minecraft-style lighting with 0-15 light levels
 */
export class LightingSystem {
  private lightSources: Map<string, LightSource> = new Map();
  private config: LightingConfig;
  private sunLight: THREE.DirectionalLight | null = null;
  private sunAngle: number = 0;

  constructor(config: Partial<LightingConfig> = {}) {
    this.config = {
      enableSunlight: true,
      enableDynamicShadows: true,
      sunIntensity: 15,
      timeOfDay: 6000, // Start at midday
      ...config,
    };
  }

  /**
   * Initialize the lighting system with a sun light reference
   */
  setSunLight(sunLight: THREE.DirectionalLight): void {
    this.sunLight = sunLight;
    this.updateSunPosition();
  }

  /**
   * Add a dynamic light source (torch, lava, etc.)
   */
  addLightSource(source: LightSource): void {
    this.lightSources.set(source.id, source);
  }

  /**
   * Remove a light source
   */
  removeLightSource(id: string): void {
    this.lightSources.delete(id);
  }

  /**
   * Get all active light sources
   */
  getLightSources(): LightSource[] {
    return Array.from(this.lightSources.values());
  }

  /**
   * Update time of day and sun position
   */
  setTimeOfDay(time: number): void {
    this.config.timeOfDay = time % 24000;
    this.updateSunPosition();
  }

  /**
   * Get current time of day
   */
  getTimeOfDay(): number {
    return this.config.timeOfDay;
  }

  /**
   * Advance time by delta (for day/night cycle)
   */
  advanceTime(delta: number): void {
    this.config.timeOfDay = (this.config.timeOfDay + delta) % 24000;
    this.updateSunPosition();
  }

  /**
   * Update sun position based on time of day
   */
  private updateSunPosition(): void {
    if (!this.sunLight) return;

    // Calculate sun angle (0-360 degrees based on time of day)
    // 0 = sunrise, 6000 = noon, 12000 = sunset, 18000 = midnight
    this.sunAngle = (this.config.timeOfDay / 24000) * Math.PI * 2;

    // Position sun in an arc across the sky
    const sunDistance = 100;
    const sunX = Math.cos(this.sunAngle) * sunDistance;
    const sunY = Math.sin(this.sunAngle) * sunDistance;
    const sunZ = 50;

    this.sunLight.position.set(sunX, sunY, sunZ);

    // Adjust sun intensity based on time of day (dimmer at dawn/dusk)
    const normalizedTime = this.config.timeOfDay / 24000;
    let intensityMultiplier = 1.0;

    if (normalizedTime < 0.25) {
      // Night to dawn (0-6000)
      intensityMultiplier = Math.max(0.2, normalizedTime * 4);
    } else if (normalizedTime > 0.75) {
      // Dusk to night (18000-24000)
      intensityMultiplier = Math.max(0.2, (1 - normalizedTime) * 4);
    } else if (normalizedTime > 0.5 && normalizedTime < 0.75) {
      // Afternoon to dusk (12000-18000)
      intensityMultiplier = 0.6 + (0.75 - normalizedTime) * 1.6;
    }

    this.sunLight.intensity = intensityMultiplier;

    // Adjust sun color based on time of day
    if (normalizedTime < 0.25 || normalizedTime > 0.75) {
      // Night - blue tint
      this.sunLight.color.setHex(0x6688bb);
    } else if (normalizedTime < 0.3 || normalizedTime > 0.7) {
      // Dawn/Dusk - orange tint
      this.sunLight.color.setHex(0xffaa66);
    } else {
      // Day - white light
      this.sunLight.color.setHex(0xffffff);
    }
  }

  /**
   * Calculate light level at a world position
   * Returns value from 0 (dark) to 15 (bright)
   */
  calculateLightLevel(
    worldX: number,
    worldY: number,
    worldZ: number,
    getBlockAt: (x: number, y: number, z: number) => BlockType
  ): number {
    let maxLight = 0;

    // Sunlight contribution
    if (this.config.enableSunlight) {
      const sunLight = this.calculateSunlight(worldX, worldY, worldZ, getBlockAt);
      maxLight = Math.max(maxLight, sunLight);
    }

    // Point light sources (torches, etc.)
    for (const source of this.lightSources.values()) {
      const distance = Math.sqrt(
        Math.pow(worldX - source.position.x, 2) +
          Math.pow(worldY - source.position.y, 2) +
          Math.pow(worldZ - source.position.z, 2)
      );

      // Light falloff with distance
      const lightLevel = Math.max(0, source.intensity - Math.floor(distance));
      
      // Check if path to light source is blocked
      if (lightLevel > 0 && !this.isPathBlocked(
        worldX, worldY, worldZ,
        source.position.x, source.position.y, source.position.z,
        getBlockAt
      )) {
        maxLight = Math.max(maxLight, lightLevel);
      }
    }

    return Math.min(15, maxLight);
  }

  /**
   * Calculate sunlight at a position (with shadow casting)
   */
  private calculateSunlight(
    worldX: number,
    worldY: number,
    worldZ: number,
    getBlockAt: (x: number, y: number, z: number) => BlockType
  ): number {
    if (!this.config.enableDynamicShadows) {
      return this.config.sunIntensity;
    }

    // Get sun direction from angle
    const sunDirX = Math.cos(this.sunAngle);
    const sunDirY = Math.sin(this.sunAngle);
    const sunDirZ = 0;

    // During night, sun provides no light
    const normalizedTime = this.config.timeOfDay / 24000;
    if (normalizedTime < 0.25 || normalizedTime > 0.75) {
      return 2; // Minimum ambient light at night
    }

    // Raycast towards the sun to check for shadows
    const maxDistance = 50; // Maximum shadow casting distance
    const steps = 20;

    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * maxDistance;
      const checkX = Math.round(worldX + sunDirX * t);
      const checkY = Math.round(worldY + sunDirY * t);
      const checkZ = Math.round(worldZ + sunDirZ * t);

      const block = getBlockAt(checkX, checkY, checkZ);
      
      // If we hit a solid block, we're in shadow
      if (block !== BlockType.AIR && !BLOCK_CONFIG[block].transparent) {
        // Calculate shadow intensity based on distance to blocker
        const shadowDepth = Math.max(3, 15 - Math.floor(t / 5));
        return shadowDepth;
      }
    }

    // Full sunlight
    return this.config.sunIntensity;
  }

  /**
   * Check if path between two points is blocked by solid blocks
   */
  private isPathBlocked(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    getBlockAt: (x: number, y: number, z: number) => BlockType
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < 1) return false;

    const steps = Math.ceil(distance * 2);
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = Math.round(x1 + dx * t);
      const checkY = Math.round(y1 + dy * t);
      const checkZ = Math.round(z1 + dz * t);

      const block = getBlockAt(checkX, checkY, checkZ);
      if (block !== BlockType.AIR && !BLOCK_CONFIG[block].transparent) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert light level (0-15) to brightness multiplier (0-1)
   */
  static lightLevelToBrightness(lightLevel: number): number {
    // Use exponential curve for more natural lighting
    // Minecraft formula: 0.05^((15-lightLevel)/15)
    return Math.pow(0.8, (15 - lightLevel) / 15);
  }

  /**
   * Get ambient light level for current time of day
   */
  getAmbientLightLevel(): number {
    const normalizedTime = this.config.timeOfDay / 24000;
    
    if (normalizedTime < 0.25) {
      // Night
      return 2;
    } else if (normalizedTime > 0.75) {
      // Night
      return 2;
    } else if (normalizedTime < 0.3) {
      // Dawn
      return 2 + (normalizedTime - 0.25) * 20;
    } else if (normalizedTime > 0.7) {
      // Dusk
      return 2 + (0.75 - normalizedTime) * 20;
    } else {
      // Day
      return 8;
    }
  }
}
