import * as THREE from "three";
import { Chunk, ChunkPosition, CHUNK_SIZE } from "./Chunk";
import { WorldGenerator } from "./WorldGenerator";
import { LightingManager } from "./LightingManager";

/**
 * Configuration for chunk management
 */
export interface ChunkManagerConfig {
  renderDistance: number; // In chunks
  unloadDistance: number; // In chunks (should be > renderDistance)
}

/**
 * Default chunk manager configuration
 */
const DEFAULT_CHUNK_MANAGER_CONFIG: ChunkManagerConfig = {
  renderDistance: 3,
  unloadDistance: 5,
};

/**
 * Manages loading, unloading, and rendering of chunks
 */
export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private loadingChunks: Set<string> = new Set();
  private scene: THREE.Scene;
  private worldGenerator: WorldGenerator;
  private config: ChunkManagerConfig;
  private lastPlayerChunkPosition: ChunkPosition | null = null;
  private lightingManager: LightingManager | null = null;

  constructor(
    scene: THREE.Scene,
    worldGenerator: WorldGenerator,
    config: Partial<ChunkManagerConfig> = {}
  ) {
    this.scene = scene;
    this.worldGenerator = worldGenerator;
    this.config = { ...DEFAULT_CHUNK_MANAGER_CONFIG, ...config };
  }

  /**
   * Set the lighting manager for dynamic lighting
   */
  setLightingManager(lightingManager: LightingManager): void {
    this.lightingManager = lightingManager;
  }

  /**
   * Update chunks based on player position
   */
  async updateChunks(playerPosition: THREE.Vector3): Promise<void> {
    const currentChunkPos = this.worldToChunkPosition(playerPosition);

    // Check if player moved to a different chunk
    if (
      this.lastPlayerChunkPosition &&
      this.lastPlayerChunkPosition.x === currentChunkPos.x &&
      this.lastPlayerChunkPosition.y === currentChunkPos.y &&
      this.lastPlayerChunkPosition.z === currentChunkPos.z
    ) {
      // Player in same chunk, no update needed
      return;
    }

    this.lastPlayerChunkPosition = currentChunkPos;

    // Load chunks within render distance
    await this.loadChunksAroundPlayer(currentChunkPos);

    // Unload chunks beyond unload distance
    this.unloadDistantChunks(currentChunkPos);
  }

  /**
   * Load chunks around the player position
   */
  private async loadChunksAroundPlayer(centerChunk: ChunkPosition): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    // Iterate through chunks in render distance
    for (let dx = -this.config.renderDistance; dx <= this.config.renderDistance; dx++) {
      for (let dy = -this.config.renderDistance; dy <= this.config.renderDistance; dy++) {
        for (let dz = -this.config.renderDistance; dz <= this.config.renderDistance; dz++) {
          const chunkPos: ChunkPosition = {
            x: centerChunk.x + dx,
            y: centerChunk.y + dy,
            z: centerChunk.z + dz,
          };

          // Skip chunks that are too far (sphere check)
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance > this.config.renderDistance) {
            continue;
          }

          const key = Chunk.getKey(chunkPos);

          // Load chunk if not already loaded or loading
          if (!this.chunks.has(key) && !this.loadingChunks.has(key)) {
            loadPromises.push(this.loadChunk(chunkPos));
          }
        }
      }
    }

    // Wait for all chunks to load
    await Promise.all(loadPromises);
  }

  /**
   * Load a single chunk asynchronously
   */
  private async loadChunk(position: ChunkPosition): Promise<void> {
    const key = Chunk.getKey(position);
    this.loadingChunks.add(key);

    try {
      // Generate chunk data asynchronously
      const chunk = await this.worldGenerator.generateChunk(position);

      // Generate mesh for the chunk with lighting
      const mesh = chunk.generateMesh(this.lightingManager || undefined);
      this.scene.add(mesh);

      // Store chunk
      this.chunks.set(key, chunk);
    } catch (error) {
      console.error(`Failed to load chunk at ${key}:`, error);
    } finally {
      this.loadingChunks.delete(key);
    }
  }

  /**
   * Unload chunks that are too far from the player
   */
  private unloadDistantChunks(centerChunk: ChunkPosition): void {
    const chunksToUnload: string[] = [];

    // Check each loaded chunk
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.position.x - centerChunk.x;
      const dy = chunk.position.y - centerChunk.y;
      const dz = chunk.position.z - centerChunk.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Mark for unload if beyond unload distance
      if (distance > this.config.unloadDistance) {
        chunksToUnload.push(key);
      }
    }

    // Unload marked chunks
    for (const key of chunksToUnload) {
      this.unloadChunk(key);
    }
  }

  /**
   * Unload a single chunk
   */
  private unloadChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    // Remove mesh from scene
    const mesh = chunk.getMesh();
    if (mesh) {
      this.scene.remove(mesh);
    }

    // Dispose of chunk resources
    chunk.dispose();

    // Remove from storage
    this.chunks.delete(key);
  }

  /**
   * Convert world position to chunk position
   */
  private worldToChunkPosition(worldPos: THREE.Vector3): ChunkPosition {
    return {
      x: Math.floor(worldPos.x / CHUNK_SIZE),
      y: Math.floor(worldPos.y / CHUNK_SIZE),
      z: Math.floor(worldPos.z / CHUNK_SIZE),
    };
  }

  /**
   * Get chunk at specific position (if loaded)
   */
  getChunk(position: ChunkPosition): Chunk | undefined {
    return this.chunks.get(Chunk.getKey(position));
  }

  /**
   * Get all loaded chunks
   */
  getLoadedChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Get number of loaded chunks
   */
  getLoadedChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * Force load a specific chunk
   */
  async forceLoadChunk(position: ChunkPosition): Promise<Chunk | undefined> {
    await this.loadChunk(position);
    return this.getChunk(position);
  }

  /**
   * Clear all chunks
   */
  clearAll(): void {
    for (const key of Array.from(this.chunks.keys())) {
      this.unloadChunk(key);
    }
  }

  /**
   * Get world generator (for external access to seed, etc.)
   */
  getWorldGenerator(): WorldGenerator {
    return this.worldGenerator;
  }

  /**
   * Regenerate all chunk meshes (useful after lighting changes)
   */
  regenerateAllChunkMeshes(): void {
    for (const chunk of this.chunks.values()) {
      // Remove old mesh
      const oldMesh = chunk.getMesh();
      if (oldMesh) {
        this.scene.remove(oldMesh);
      }

      // Dispose old resources
      chunk.dispose();

      // Generate new mesh with updated lighting
      const newMesh = chunk.generateMesh(this.lightingManager || undefined);
      this.scene.add(newMesh);
    }
  }
}
