import { BlockType } from "./blocks";
import { Chunk, CHUNK_SIZE, ChunkPosition } from "./Chunk";
import { SeededRandom } from "./SeededRandom";

/**
 * Configuration for world generation
 */
export interface WorldGenerationConfig {
  seed: number;
  seaLevel: number;
  terrainScale: number;
  terrainHeight: number;
}

/**
 * Default world generation configuration
 */
export const DEFAULT_WORLD_CONFIG: WorldGenerationConfig = {
  seed: 12345,
  seaLevel: 5, // In chunk coordinates
  terrainScale: 0.05, // Frequency of terrain variation
  terrainHeight: 10, // Maximum terrain height variation
};

/**
 * Generates terrain for chunks using seed-based procedural generation
 */
export class WorldGenerator {
  private config: WorldGenerationConfig;

  constructor(config: Partial<WorldGenerationConfig> = {}) {
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };
  }

  /**
   * Generate blocks for a chunk at the given position
   */
  async generateChunk(position: ChunkPosition): Promise<Chunk> {
    return new Promise((resolve) => {
      // Use setTimeout to make generation async (non-blocking)
      setTimeout(() => {
        const chunk = new Chunk(position);
        this.fillChunkWithTerrain(chunk);
        resolve(chunk);
      }, 0);
    });
  }

  /**
   * Fill a chunk with terrain based on procedural generation
   */
  private fillChunkWithTerrain(chunk: Chunk): void {
    const { position } = chunk;

    // Generate terrain for each block in the chunk
    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
      for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
        for (let localX = 0; localX < CHUNK_SIZE; localX++) {
          // Convert to world coordinates
          const worldX = position.x * CHUNK_SIZE + localX;
          const worldY = position.y * CHUNK_SIZE + localY;
          const worldZ = position.z * CHUNK_SIZE + localZ;

          // Determine block type based on height and noise
          const blockType = this.getBlockTypeAt(worldX, worldY, worldZ);
          chunk.setBlock(localX, localY, localZ, blockType);
        }
      }
    }
  }

  /**
   * Get block type at world coordinates using procedural generation
   */
  private getBlockTypeAt(worldX: number, worldY: number, worldZ: number): BlockType {
    // Bedrock layer at the bottom
    if (worldY === 0) {
      return BlockType.BEDROCK;
    }

    // Calculate terrain height using layered noise
    const terrainHeight = this.getTerrainHeight(worldX, worldZ);

    // Below terrain: stone or dirt
    if (worldY < terrainHeight - 3) {
      return BlockType.STONE;
    } else if (worldY < terrainHeight) {
      return BlockType.DIRT;
    } else if (worldY === terrainHeight) {
      // Surface block: grass or sand (sand near water)
      if (terrainHeight <= this.config.seaLevel) {
        return BlockType.SAND;
      } else {
        return BlockType.GRASS;
      }
    } else if (worldY <= this.config.seaLevel) {
      // Water fills up to sea level
      return BlockType.WATER;
    }

    // Above terrain: air
    return BlockType.AIR;
  }

  /**
   * Calculate terrain height at given X, Z coordinates using noise
   * Returns the Y coordinate of the surface
   */
  private getTerrainHeight(x: number, z: number): number {
    // Use multiple octaves of noise for more natural terrain
    const noise1 = this.noise2D(x * this.config.terrainScale, z * this.config.terrainScale);
    const noise2 = this.noise2D(x * this.config.terrainScale * 2, z * this.config.terrainScale * 2) * 0.5;
    const noise3 = this.noise2D(x * this.config.terrainScale * 4, z * this.config.terrainScale * 4) * 0.25;

    const combinedNoise = noise1 + noise2 + noise3;

    // Convert noise (-1 to 1) to height
    const baseHeight = this.config.seaLevel;
    const height = baseHeight + combinedNoise * this.config.terrainHeight;

    return Math.floor(height);
  }

  /**
   * Simple 2D noise function using seeded random
   * This is a simplified noise - in production, you'd use Perlin or Simplex noise
   */
  private noise2D(x: number, y: number): number {
    // Get integer coordinates
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);

    // Get fractional parts
    const fx = x - x0;
    const fy = y - y0;

    // Get random values at corners
    const v00 = this.getRandomValue(x0, y0);
    const v10 = this.getRandomValue(x0 + 1, y0);
    const v01 = this.getRandomValue(x0, y0 + 1);
    const v11 = this.getRandomValue(x0 + 1, y0 + 1);

    // Smooth interpolation (cosine interpolation)
    const sx = this.smoothstep(fx);
    const sy = this.smoothstep(fy);

    // Bilinear interpolation
    const v0 = this.lerp(v00, v10, sx);
    const v1 = this.lerp(v01, v11, sx);
    const value = this.lerp(v0, v1, sy);

    // Return value in range -1 to 1
    return value * 2 - 1;
  }

  /**
   * Get a seeded random value for given coordinates
   */
  private getRandomValue(x: number, y: number): number {
    const random = SeededRandom.fromCoordinates(this.config.seed, x, y, 0);
    return random.next();
  }

  /**
   * Smooth step function for interpolation
   */
  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Update the world seed (will affect future chunk generation)
   */
  setSeed(seed: number): void {
    this.config.seed = seed;
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.config.seed;
  }

  /**
   * Find a suitable spawn location on land (not in water, not underground)
   * Returns { x, y, z } coordinates for player spawn
   */
  findSpawnLocation(): { x: number; y: number; z: number } {
    // Search in a spiral pattern from origin to find suitable land
    const maxSearchRadius = 100;
    
    for (let radius = 0; radius < maxSearchRadius; radius += 5) {
      // Try multiple angles
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = Math.floor(radius * Math.cos(angle));
        const z = Math.floor(radius * Math.sin(angle));
        
        // Get terrain height at this position
        const terrainHeight = this.getTerrainHeight(x, z);
        
        // Check if above sea level (not in water)
        if (terrainHeight > this.config.seaLevel) {
          // Spawn player standing on the terrain
          // +1.8 to place player's feet on the ground (player height)
          return {
            x: x + 0.5, // Center of block
            y: terrainHeight + 1.8,
            z: z + 0.5,
          };
        }
      }
    }
    
    // Fallback: spawn at a safe height above sea level
    return {
      x: 0.5,
      y: this.config.seaLevel + 10,
      z: 0.5,
    };
  }

  /**
   * Get terrain height at given X, Z coordinates (made public for spawn finding)
   */
  getTerrainHeightAt(x: number, z: number): number {
    return this.getTerrainHeight(x, z);
  }
}
