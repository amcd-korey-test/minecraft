/**
 * World module - Chunk-based world generation system
 * 
 * This module provides a complete chunk-based world generation system with:
 * - Deterministic seed-based terrain generation
 * - Async chunk loading/unloading
 * - Multiple block types
 * - Efficient mesh generation
 */

export { BlockType, BlockProperties, isBlockSolid, getBlockColor } from "./Block";
export { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from "./Chunk";
export { SimplexNoise } from "./SimplexNoise";
export { 
  WorldGenerator, 
  WorldConfig, 
  DEFAULT_WORLD_CONFIG 
} from "./WorldGenerator";
export { ChunkManager } from "./ChunkManager";
