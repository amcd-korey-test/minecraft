import { ChunkPosition } from "./Chunk";
import { WorldGenerationConfig } from "./WorldGenerator";

/**
 * Message types for worker communication
 */
export enum WorkerMessageType {
  GENERATE_CHUNK = "GENERATE_CHUNK",
  CHUNK_GENERATED = "CHUNK_GENERATED",
  UPDATE_CONFIG = "UPDATE_CONFIG",
  ERROR = "ERROR",
}

/**
 * Request to generate a chunk
 */
export interface GenerateChunkRequest {
  type: WorkerMessageType.GENERATE_CHUNK;
  position: ChunkPosition;
  requestId: string;
}

/**
 * Response with generated chunk data
 */
export interface ChunkGeneratedResponse {
  type: WorkerMessageType.CHUNK_GENERATED;
  position: ChunkPosition;
  blockData: Uint8Array;
  requestId: string;
}

/**
 * Request to update world generation config
 */
export interface UpdateConfigRequest {
  type: WorkerMessageType.UPDATE_CONFIG;
  config: Partial<WorldGenerationConfig>;
}

/**
 * Error response from worker
 */
export interface WorkerErrorResponse {
  type: WorkerMessageType.ERROR;
  error: string;
  requestId?: string;
}

/**
 * Union type of all messages from main thread to worker
 */
export type WorkerRequest = GenerateChunkRequest | UpdateConfigRequest;

/**
 * Union type of all messages from worker to main thread
 */
export type WorkerResponse = ChunkGeneratedResponse | WorkerErrorResponse;
