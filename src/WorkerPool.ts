/**
 * Worker pool for managing world generation workers
 * Handles communication with workers and load balancing
 */

import { ChunkPosition } from "./Chunk";
import { WorldGenerationConfig } from "./WorldGenerator";
import {
  WorkerMessageType,
  WorkerResponse,
  GenerateChunkRequest,
  UpdateConfigRequest,
  ChunkGeneratedResponse,
} from "./worker-types";

/**
 * Result from chunk generation
 */
export interface ChunkGenerationResult {
  position: ChunkPosition;
  blockData: Uint8Array;
}

/**
 * Manages a pool of web workers for world generation
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private pendingRequests: Map<
    string,
    {
      resolve: (result: ChunkGenerationResult) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private nextWorkerIndex = 0;

  constructor(workerCount: number = navigator.hardwareConcurrency || 4) {
    // Create worker pool
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(new URL("./worldgen.worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      worker.onerror = (error) => {
        console.error("Worker error:", error);
      };

      this.workers.push(worker);
    }

    console.log(`Initialized worker pool with ${workerCount} workers`);
  }

  /**
   * Generate a chunk using the worker pool
   */
  async generateChunk(position: ChunkPosition): Promise<ChunkGenerationResult> {
    return new Promise((resolve, reject) => {
      // Create unique request ID
      const requestId = `${position.x},${position.y},${position.z}-${Date.now()}`;

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject });

      // Select worker using round-robin
      const worker = this.workers[this.nextWorkerIndex];
      this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;

      // Send generation request to worker
      const message: GenerateChunkRequest = {
        type: WorkerMessageType.GENERATE_CHUNK,
        position,
        requestId,
      };

      worker.postMessage(message);
    });
  }

  /**
   * Update world generation configuration for all workers
   */
  updateConfig(config: Partial<WorldGenerationConfig>): void {
    const message: UpdateConfigRequest = {
      type: WorkerMessageType.UPDATE_CONFIG,
      config,
    };

    // Send to all workers
    for (const worker of this.workers) {
      worker.postMessage(message);
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(message: WorkerResponse): void {
    switch (message.type) {
      case WorkerMessageType.CHUNK_GENERATED:
        this.handleChunkGenerated(message);
        break;

      case WorkerMessageType.ERROR:
        this.handleError(message);
        break;

      default:
        console.warn("Unknown worker response type:", message);
    }
  }

  /**
   * Handle chunk generation completion
   */
  private handleChunkGenerated(message: ChunkGeneratedResponse): void {
    const pending = this.pendingRequests.get(message.requestId);
    if (!pending) {
      console.warn("Received response for unknown request:", message.requestId);
      return;
    }

    this.pendingRequests.delete(message.requestId);
    pending.resolve({
      position: message.position,
      blockData: message.blockData,
    });
  }

  /**
   * Handle error from worker
   */
  private handleError(message: { error: string; requestId?: string }): void {
    if (message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        this.pendingRequests.delete(message.requestId);
        pending.reject(new Error(message.error));
        return;
      }
    }
    console.error("Worker error:", message.error);
  }

  /**
   * Terminate all workers
   */
  dispose(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }
}
