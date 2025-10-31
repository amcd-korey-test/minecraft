import { BlockType } from "./Block";
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from "./Chunk";
import { SimplexNoise } from "./SimplexNoise";

/**
 * World generation configuration
 */
export interface WorldConfig {
  seed: number;
  waterLevel: number;
  terrainScale: number;
  terrainHeight: number;
}

/**
 * Default world configuration
 */
export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  seed: 12345,
  waterLevel: 20,
  terrainScale: 0.02,
  terrainHeight: 30,
};

/**
 * Generates terrain for chunks using simplex noise
 */
export class WorldGenerator {
  private noise: SimplexNoise;
  private config: WorldConfig;

  constructor(config: Partial<WorldConfig> = {}) {
    this.config = { ...DEFAULT_WORLD_CONFIG, ...config };
    this.noise = new SimplexNoise(this.config.seed);
  }

  /**
   * Generate terrain for a chunk
   * This is the core generation algorithm - deterministic based on seed
   */
  async generateChunk(chunk: Chunk): Promise<void> {
    return new Promise((resolve) => {
      // Use setTimeout to make this async and not block the main thread
      setTimeout(() => {
        const { chunkX, chunkZ } = chunk;
        const worldOffsetX = chunkX * CHUNK_SIZE;
        const worldOffsetZ = chunkZ * CHUNK_SIZE;

        // Generate terrain
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = worldOffsetX + x;
            const worldZ = worldOffsetZ + z;

            // Generate height using multiple octaves of noise
            const height = this.getTerrainHeight(worldX, worldZ);

            // Fill blocks based on height
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
              let blockType: BlockType;

              if (y > height) {
                // Above terrain
                if (y <= this.config.waterLevel) {
                  blockType = BlockType.WATER;
                } else {
                  blockType = BlockType.AIR;
                }
              } else if (y === Math.floor(height)) {
                // Surface block
                if (y < this.config.waterLevel - 2) {
                  blockType = BlockType.SAND; // Underwater = sand
                } else if (y <= this.config.waterLevel) {
                  blockType = BlockType.SAND; // Beach
                } else {
                  blockType = BlockType.GRASS; // Grass
                }
              } else if (y > height - 4) {
                // Shallow subsurface
                blockType = BlockType.DIRT;
              } else {
                // Deep subsurface
                blockType = BlockType.STONE;
              }

              chunk.setBlock(x, y, z, blockType);
            }
          }
        }

        chunk.isGenerated = true;
        chunk.isDirty = true;
        resolve();
      }, 0);
    });
  }

  /**
   * Get terrain height at world coordinates using layered noise
   */
  private getTerrainHeight(x: number, z: number): number {
    const scale = this.config.terrainScale;
    
    // Multiple octaves for more interesting terrain
    const noise1 = this.noise.noise2D(x * scale, z * scale);
    const noise2 = this.noise.noise2D(x * scale * 2, z * scale * 2) * 0.5;
    const noise3 = this.noise.noise2D(x * scale * 4, z * scale * 4) * 0.25;
    
    const combined = (noise1 + noise2 + noise3) / 1.75;
    
    // Convert from [-1, 1] to height range
    const baseHeight = this.config.waterLevel;
    const height = baseHeight + combined * this.config.terrainHeight;
    
    return Math.max(0, Math.min(CHUNK_HEIGHT - 1, height));
  }

  /**
   * Get the seed for this world
   */
  getSeed(): number {
    return this.config.seed;
  }

  /**
   * Update world configuration (requires regenerating chunks)
   */
  setConfig(config: Partial<WorldConfig>): void {
    this.config = { ...this.config, ...config };
    this.noise = new SimplexNoise(this.config.seed);
  }
}
