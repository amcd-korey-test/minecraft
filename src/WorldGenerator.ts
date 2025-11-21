import { BlockType } from "./blocks";
import { Chunk, CHUNK_SIZE, ChunkPosition } from "./Chunk";
import { createNoise2D } from "simplex-noise";
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
  private noise2D: (x: number, y: number) => number;
  private random: SeededRandom;

  constructor(config: Partial<WorldGenerationConfig> = {}) {
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };
    this.random = new SeededRandom(this.config.seed);
    this.noise2D = createNoise2D(this.random.next.bind(this.random));
  }

  /**
   * Generate blocks for a chunk at the given position
   */
  generateChunk(position: ChunkPosition): Chunk {
    const chunk = new Chunk(position);
    this.fillChunkWithTerrain(chunk);
    return chunk;
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
}
