# Block World Generation System

This document describes the chunk-based world generation system implemented for the Minecraft project.

## Architecture Overview

The world generation system is built with the following components:

### 1. **Block System** (`src/blocks.ts`)
- Defines `BlockType` enum with 7 block types: AIR, GRASS, DIRT, STONE, BEDROCK, SAND, WATER
- Each block type has properties including color and transparency
- Easily extensible for adding new block types

### 2. **Seeded Random Number Generator** (`src/SeededRandom.ts`)
- Implements a Linear Congruential Generator (LCG) for deterministic randomness
- Same seed always produces same random sequence
- Supports coordinate-based seed derivation for chunk-specific generation
- Ensures chunks can be safely unloaded and regenerated identically

### 3. **Chunk System** (`src/Chunk.ts`)
- Each chunk is a 16?16?16 cube of blocks (configurable via `CHUNK_SIZE`)
- Blocks stored as flat `Uint8Array` for memory efficiency
- Implements greedy meshing algorithm to optimize rendering
- Only renders visible faces (culls faces between solid blocks)
- Supports chunk disposal for proper memory management

### 4. **World Generator** (`src/WorldGenerator.ts`)
- Seed-based procedural terrain generation
- Uses multi-octave noise for natural-looking terrain
- Configurable parameters:
  - `seed`: World seed for deterministic generation
  - `seaLevel`: Y-coordinate where water fills to
  - `terrainScale`: Frequency of terrain variation
  - `terrainHeight`: Maximum height variation
- Generates different block types based on height:
  - Bedrock at Y=0
  - Stone in lower layers
  - Dirt in middle layers
  - Grass on surface (or sand near water)
  - Water fills to sea level

### 5. **Chunk Manager** (`src/ChunkManager.ts`)
- Manages loading and unloading of chunks
- **Web Worker-based generation**: Chunks generate in parallel worker threads (see WORKER_IMPLEMENTATION.md)
- Automatically loads chunks within render distance of player
- Automatically unloads chunks beyond unload distance
- Tracks loading state to prevent duplicate requests
- Provides methods to query loaded chunks
- Uses WorkerPool for parallel, non-blocking generation

### 6. **Main Application** (`src/main.ts`)
- Integrates all systems
- Implements first-person camera controls:
  - **WASD**: Movement
  - **Space/Shift**: Up/Down
  - **Mouse**: Look around (click to lock pointer)
- Real-time UI showing:
  - Player position
  - Current chunk coordinates
  - Number of loaded chunks
  - World seed
- Sky blue background with fog for atmosphere
- Proper lighting setup (sun, ambient, hemisphere)

## Key Features

### ? Single Chunk Generation
The system generates chunks as 16?16?16 cubes in memory, with efficient storage using typed arrays.

### ? Multiple Chunks Architecture
The `ChunkManager` supports managing unlimited chunks, with position-based keys for efficient lookup.

### ? Async Chunk Loading
Chunks are generated asynchronously using Promises, preventing frame drops during generation.

### ? Seed-Based Generation
The `SeededRandom` class ensures deterministic world generation:
- Same seed always produces identical worlds
- Chunks can be safely unloaded and regenerated
- Each chunk's generation is independent but deterministic

### ? Dynamic Loading/Unloading
As the player moves:
- Chunks within render distance are automatically loaded
- Chunks beyond unload distance are automatically removed
- Memory is properly cleaned up when chunks are unloaded

## Configuration

### Chunk Size
Default: 16?16?16 blocks per chunk
Change in `src/Chunk.ts`:
```typescript
export const CHUNK_SIZE = 16; // Modify to 32, 64, 128, or 256
```

### Render Distance
Default: 2 chunks in each direction
Change in `src/main.ts`:
```typescript
const chunkManager = new ChunkManager(scene, worldGenerator, {
  renderDistance: 2,    // Increase for more visible chunks
  unloadDistance: 3,    // Should be > renderDistance
});
```

### World Seed
Default: 12345
Change in `src/main.ts`:
```typescript
const worldGenerator = new WorldGenerator({
  seed: 12345,          // Change to any number
  seaLevel: 5,          // Height of water level
  terrainScale: 0.05,   // Lower = smoother terrain
  terrainHeight: 8,     // Maximum height variation
});
```

## Performance Optimizations

1. **Web Workers**: World generation runs in parallel threads (off main thread)
2. **Greedy Meshing**: Only visible block faces are rendered
3. **Face Culling**: Faces between solid blocks are not generated
4. **Typed Arrays**: Efficient memory usage with `Uint8Array`
5. **Parallel Generation**: Multiple chunks generate simultaneously
6. **Automatic Unloading**: Distant chunks removed from memory
7. **Flat Shading**: Reduces vertex count for blocky aesthetic
8. **Transferable Objects**: Zero-copy data transfer between threads

See [WORKER_IMPLEMENTATION.md](./WORKER_IMPLEMENTATION.md) for details on the worker architecture.

## Future Enhancements

- Implement true Perlin or Simplex noise for better terrain
- Add biomes with different generation rules
- Implement caves and underground structures
- Add chunk saving/loading to disk
- Support chunk modifications (place/break blocks)
- Optimize with instanced rendering for repeated blocks
- Add frustum culling for better performance
- Implement LOD (Level of Detail) for distant chunks

## Testing the System

1. Run the dev server: `bun run dev`
2. Open browser to `http://localhost:5173`
3. Click to lock mouse pointer
4. Move around with WASD, Space, Shift
5. Watch chunks load/unload as you move
6. Try different seeds to see different worlds

## Technical Details

### Memory Usage
- Each chunk: ~4KB for block data + mesh geometry
- With render distance of 2: ~125 chunks loaded (~500KB)
- Increase render distance carefully on lower-end devices

### Coordinate System
- World coordinates: Global position in blocks
- Chunk coordinates: Which chunk (divide world coords by CHUNK_SIZE)
- Local coordinates: Position within chunk (0 to CHUNK_SIZE-1)

### Deterministic Generation
The seed ensures that chunk at position (X, Y, Z) will always generate the same blocks, regardless of:
- When it's generated
- How many times it's been loaded/unloaded
- What other chunks exist
- The order of generation

This is critical for multiplayer support and world persistence in the future.
