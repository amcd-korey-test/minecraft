import * as THREE from "three";
import { Chunk, CHUNK_SIZE } from "./Chunk";
import { WorldGenerator, WorldConfig } from "./WorldGenerator";

/**
 * Manages chunk loading, unloading, and rendering
 */
export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private generator: WorldGenerator;
  private scene: THREE.Scene;
  private loadingChunks: Set<string> = new Set();
  
  // Configuration
  private renderDistance: number;
  private maxConcurrentLoads: number = 4;

  constructor(
    scene: THREE.Scene,
    worldConfig: Partial<WorldConfig> = {},
    renderDistance: number = 4
  ) {
    this.scene = scene;
    this.generator = new WorldGenerator(worldConfig);
    this.renderDistance = renderDistance;
  }

  /**
   * Update chunks based on player position
   * This should be called every frame or when player moves significantly
   */
  async updateChunks(playerPosition: THREE.Vector3): Promise<void> {
    const playerChunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);

    const chunksToLoad: { x: number; z: number; distance: number }[] = [];
    const chunksToKeep = new Set<string>();

    // Determine which chunks should be loaded
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = Chunk.getKey(chunkX, chunkZ);
        
        chunksToKeep.add(key);

        // Check if chunk needs to be loaded
        if (!this.chunks.has(key) && !this.loadingChunks.has(key)) {
          const distance = Math.sqrt(x * x + z * z);
          chunksToLoad.push({ x: chunkX, z: chunkZ, distance });
        }
      }
    }

    // Sort chunks by distance (load closest first)
    chunksToLoad.sort((a, b) => a.distance - b.distance);

    // Load chunks (respecting concurrent load limit)
    const loadsInProgress = this.loadingChunks.size;
    const canLoad = Math.min(
      this.maxConcurrentLoads - loadsInProgress,
      chunksToLoad.length
    );

    for (let i = 0; i < canLoad; i++) {
      const { x, z } = chunksToLoad[i];
      this.loadChunk(x, z);
    }

    // Unload chunks that are too far away
    for (const [key, chunk] of this.chunks.entries()) {
      if (!chunksToKeep.has(key)) {
        this.unloadChunk(chunk);
      }
    }
  }

  /**
   * Load and generate a chunk asynchronously
   */
  private async loadChunk(chunkX: number, chunkZ: number): Promise<void> {
    const key = Chunk.getKey(chunkX, chunkZ);
    
    if (this.loadingChunks.has(key) || this.chunks.has(key)) {
      return;
    }

    this.loadingChunks.add(key);

    try {
      // Create chunk
      const chunk = new Chunk(chunkX, chunkZ);

      // Generate terrain (async)
      await this.generator.generateChunk(chunk);

      // Generate mesh
      const mesh = chunk.generateMesh();

      // Add to scene
      this.scene.add(mesh);

      // Store chunk
      this.chunks.set(key, chunk);
    } catch (error) {
      console.error(`Error loading chunk ${key}:`, error);
    } finally {
      this.loadingChunks.delete(key);
    }
  }

  /**
   * Unload a chunk and free its resources
   */
  private unloadChunk(chunk: Chunk): void {
    const key = Chunk.getKey(chunk.chunkX, chunk.chunkZ);

    // Remove mesh from scene
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
    }

    // Dispose resources
    chunk.dispose();

    // Remove from storage
    this.chunks.delete(key);
  }

  /**
   * Get a loaded chunk at chunk coordinates
   */
  getChunk(chunkX: number, chunkZ: number): Chunk | undefined {
    const key = Chunk.getKey(chunkX, chunkZ);
    return this.chunks.get(key);
  }

  /**
   * Get block at world coordinates
   */
  getBlockAt(worldX: number, worldY: number, worldZ: number): number {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkZ);

    if (!chunk) return 0; // Air

    const localX = worldX - chunkX * CHUNK_SIZE;
    const localZ = worldZ - chunkZ * CHUNK_SIZE;

    return chunk.getBlock(localX, worldY, localZ);
  }

  /**
   * Force regenerate all loaded chunks (useful when changing seed)
   */
  async regenerateAll(): Promise<void> {
    const chunks = Array.from(this.chunks.values());
    
    for (const chunk of chunks) {
      // Regenerate terrain
      await this.generator.generateChunk(chunk);
      
      // Update mesh
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
      }
      const mesh = chunk.generateMesh();
      this.scene.add(mesh);
    }
  }

  /**
   * Get world generator for configuration
   */
  getGenerator(): WorldGenerator {
    return this.generator;
  }

  /**
   * Set render distance
   */
  setRenderDistance(distance: number): void {
    this.renderDistance = distance;
  }

  /**
   * Get number of loaded chunks
   */
  getLoadedChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * Clean up all chunks
   */
  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.unloadChunk(chunk);
    }
    this.chunks.clear();
    this.loadingChunks.clear();
  }
}
