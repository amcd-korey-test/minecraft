import { WorldGenerator, WorldGenerationConfig } from "./WorldGenerator";
import { Chunk } from "./Chunk";
import { BlockType } from "./blocks";
import { SeededRandom } from "./SeededRandom";
import { createNoise2D } from "simplex-noise";

let generator: WorldGenerator | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "init") {
    const config: WorldGenerationConfig = payload;
    generator = new WorldGenerator(config);
    self.postMessage({ type: "init_done" });
  } else if (type === "generate_chunk") {
    if (!generator) {
      throw new Error("Worker not initialized!");
    }
    const { position } = payload;
    const chunk = generator.generateChunk(position);
    self.postMessage({ type: "chunk_generated", payload: { chunkData: chunk.blocks, position: position } });
  }
};
