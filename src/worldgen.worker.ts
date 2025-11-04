/**
 * Web Worker for world generation
 * This offloads CPU-intensive chunk generation from the main thread
 */

import { WorldGenerator, WorldGenerationConfig } from "./WorldGenerator";
import { Chunk, ChunkPosition, CHUNK_SIZE } from "./Chunk";
import {
  WorkerMessageType,
  WorkerRequest,
  GenerateChunkRequest,
  UpdateConfigRequest,
} from "./worker-types";

// Initialize world generator with default config
let worldGenerator = new WorldGenerator();

/**
 * Handle incoming messages from main thread
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case WorkerMessageType.GENERATE_CHUNK:
        handleGenerateChunk(message);
        break;

      case WorkerMessageType.UPDATE_CONFIG:
        handleUpdateConfig(message);
        break;

      default:
        console.warn("Unknown worker message type:", message);
    }
  } catch (error) {
    self.postMessage({
      type: WorkerMessageType.ERROR,
      error: error instanceof Error ? error.message : String(error),
      requestId: (message as GenerateChunkRequest).requestId,
    });
  }
};

/**
 * Handle chunk generation request
 */
async function handleGenerateChunk(message: GenerateChunkRequest): Promise<void> {
  const { position, requestId } = message;

  // Generate the chunk (this will do the heavy computation in the worker)
  const chunk = await worldGenerator.generateChunk(position);

  // Extract the block data from the chunk
  const blockData = extractChunkData(chunk);

  // Send the result back to main thread
  // Transfer the Uint8Array buffer for better performance
  self.postMessage(
    {
      type: WorkerMessageType.CHUNK_GENERATED,
      position,
      blockData,
      requestId,
    },
    [blockData.buffer]
  );
}

/**
 * Handle config update request
 */
function handleUpdateConfig(message: UpdateConfigRequest): void {
  const { config } = message;

  // Update the seed if provided
  if (config.seed !== undefined) {
    worldGenerator.setSeed(config.seed);
  }

  // Recreate the world generator with new config
  worldGenerator = new WorldGenerator(config);
}

/**
 * Extract block data from a chunk for transfer to main thread
 */
function extractChunkData(chunk: Chunk): Uint8Array {
  const blockData = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

  // Copy block data from chunk
  for (let y = 0; y < CHUNK_SIZE; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
        blockData[index] = chunk.getBlock(x, y, z);
      }
    }
  }

  return blockData;
}
