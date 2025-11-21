import { Chunk, ChunkPosition } from "./Chunk";
import { WorldGenerationConfig } from "./WorldGenerator";

export class WorldGeneratorProxy {
  private worker: Worker;
  private seed: number;
  private pendingChunks: Map<string, (chunk: Chunk) => void> = new Map();

  constructor(config: Partial<WorldGenerationConfig> = {}) {
    this.worker = new Worker("/src/worldGenerator.worker.js", { type: "module" });
    this.seed = config.seed || 12345;
    this.worker.postMessage({ type: "init", payload: config });

    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === "chunk_generated") {
        const { chunkData, position } = payload;
        const key = Chunk.getKey(position);
        const resolve = this.pendingChunks.get(key);
        if (resolve) {
          const chunk = new Chunk(position);
          chunk.setBlocks(chunkData as Uint8Array);
          resolve(chunk);
          this.pendingChunks.delete(key);
        }
      }
    };
  }

  async generateChunk(position: ChunkPosition): Promise<Chunk> {
    return new Promise((resolve) => {
      const key = Chunk.getKey(position);
      this.pendingChunks.set(key, resolve);
      this.worker.postMessage({ type: "generate_chunk", payload: { position } });
    });
  }

  getSeed(): number {
    return this.seed;
  }
}
