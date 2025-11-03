# Dynamic Lighting System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN APPLICATION                         │
│                          (main.ts)                              │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │   Scene    │  │   Camera     │  │   Renderer      │        │
│  │  (Three.js)│  │              │  │   (WebGL)       │        │
│  └─────┬──────┘  └──────────────┘  └─────────────────┘        │
│        │                                                         │
│        │  ┌─────────────────────────────────────────┐          │
│        └─▶│         Sun Light (DirectionalLight)     │          │
│           │  • Position: Dynamic (time-based)        │          │
│           │  • Color: Orange/White/Blue (time-based) │          │
│           │  • Intensity: Variable (time-based)      │          │
│           └──────────────┬──────────────────────────┘          │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LIGHTING SYSTEM                             │
│                    (LightingSystem.ts)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Time Management                                          │  │
│  │  • timeOfDay: 0-24000 ticks                              │  │
│  │  • advanceTime(delta): Progress time                     │  │
│  │  • setTimeOfDay(time): Set specific time                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Sun Control                                              │  │
│  │  • updateSunPosition(): Calculate sun arc                │  │
│  │  • Update DirectionalLight position                       │  │
│  │  • Update DirectionalLight color                          │  │
│  │  • Update DirectionalLight intensity                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Light Sources Map                                        │  │
│  │  • "sun" → { type: SUN, intensity: 15 }                  │  │
│  │  • "torch_1" → { type: TORCH, pos: (x,y,z), int: 14 }   │  │
│  │  • "lava_2" → { type: LAVA, pos: (x,y,z), int: 15 }     │  │
│  │  • addLightSource() / removeLightSource()                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Light Calculation                                        │  │
│  │  calculateLightLevel(x, y, z, getBlockAt)               │  │
│  │  │                                                         │  │
│  │  ├─▶ calculateSunlight(x, y, z)                          │  │
│  │  │   • Raycast towards sun                               │  │
│  │  │   • Check for blocking terrain                        │  │
│  │  │   • Return light level with shadow                    │  │
│  │  │                                                         │  │
│  │  └─▶ calculatePointLights(x, y, z)                       │  │
│  │      • For each torch/lava source                        │  │
│  │      • Calculate distance                                │  │
│  │      • Apply falloff (intensity - distance)              │  │
│  │      • Check occlusion                                   │  │
│  │      • Return max light level                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CHUNK MANAGER                              │
│                    (ChunkManager.ts)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chunk Loading Pipeline                                   │  │
│  │                                                            │  │
│  │  1. Generate terrain (WorldGenerator)                     │  │
│  │  2. Calculate lighting (calculateChunkLighting)          │  │
│  │  3. Generate mesh (Chunk.generateMesh)                   │  │
│  │  4. Add to scene                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Lighting Update Pipeline                                 │  │
│  │                                                            │  │
│  │  recalculateAllLighting()                                │  │
│  │  │                                                         │  │
│  │  └─▶ For each loaded chunk:                              │  │
│  │      • calculateChunkLighting(chunk)                     │  │
│  │      • Remove old mesh                                   │  │
│  │      • Generate new mesh with updated lighting           │  │
│  │      • Add new mesh to scene                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Block Lookup                                             │  │
│  │                                                            │  │
│  │  getBlockAtWorldPosition(x, y, z)                        │  │
│  │  • Convert world coords to chunk coords                  │  │
│  │  • Find chunk in loaded chunks                           │  │
│  │  • Return block type (or AIR if not loaded)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Loaded Chunks Map                                        │  │
│  │  • "0,0,0" → Chunk instance                              │  │
│  │  • "1,0,0" → Chunk instance                              │  │
│  │  • "0,1,0" → Chunk instance                              │  │
│  │  • ... (~27 chunks for render distance 3)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CHUNK                                   │
│                        (Chunk.ts)                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Block Storage (16×16×16 = 4096 blocks)                  │  │
│  │                                                            │  │
│  │  blocks: Uint8Array[4096]                                │  │
│  │  • [0] = GRASS, [1] = DIRT, [2] = STONE, ...            │  │
│  │  • Flattened 3D array: index = x + y*16 + z*16*16       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Light Storage (16×16×16 = 4096 values)                  │  │
│  │                                                            │  │
│  │  lightLevels: Uint8Array[4096]                           │  │
│  │  • [0] = 15, [1] = 14, [2] = 12, ...                    │  │
│  │  • Values: 0 (dark) to 15 (bright)                       │  │
│  │  • Same indexing as blocks array                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mesh Generation                                          │  │
│  │                                                            │  │
│  │  generateMesh()                                           │  │
│  │  │                                                         │  │
│  │  └─▶ For each solid block:                               │  │
│  │      • Get block type & color                            │  │
│  │      • Get light level: lightLevels[index]               │  │
│  │      • Convert to brightness: 0.8^((15-level)/15)        │  │
│  │      • Multiply color by brightness                      │  │
│  │      • Generate faces (if not occluded)                  │  │
│  │      • Set vertex colors                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Methods                                                  │  │
│  │  • getBlock(x, y, z): BlockType                          │  │
│  │  • setBlock(x, y, z, type)                               │  │
│  │  • getLightLevel(x, y, z): number                        │  │
│  │  • setLightLevel(x, y, z, level)                         │  │
│  │  • generateMesh(): THREE.Mesh                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Light Calculation

```
┌──────────────┐
│ Time Updates │  (Every frame)
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ LightingSystem          │
│ • advanceTime()         │
│ • updateSunPosition()   │
└──────┬──────────────────┘
       │
       │  (Every 2 seconds)
       ▼
┌─────────────────────────┐
│ ChunkManager            │
│ • recalculateAll()      │
└──────┬──────────────────┘
       │
       │  (For each chunk)
       ▼
┌─────────────────────────┐
│ calculateChunkLighting()│
└──────┬──────────────────┘
       │
       │  (For each block)
       ▼
┌─────────────────────────────────────────┐
│ LightingSystem.calculateLightLevel()    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Calculate Sunlight             │ │
│  │    • Raycast towards sun          │ │
│  │    • 20 steps × 50 blocks         │ │
│  │    • Check each step for terrain  │ │
│  │    • If blocked: shadow depth     │ │
│  │    • Return: 0-15                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 2. Calculate Point Lights         │ │
│  │    For each torch/lava:           │ │
│  │    • Distance = √(dx²+dy²+dz²)    │ │
│  │    • Light = max(0, int - dist)   │ │
│  │    • Check if path blocked        │ │
│  │    • Return: 0-15                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 3. Combine Lights                 │ │
│  │    • Take maximum from all sources│ │
│  │    • Clamp to 0-15                │ │
│  │    • Return final light level     │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │  (Store in chunk)
       ▼
┌─────────────────────────┐
│ Chunk.setLightLevel()   │
│ • lightLevels[index] = L│
└──────┬──────────────────┘
       │
       │  (Generate mesh)
       ▼
┌─────────────────────────────────────────┐
│ Chunk.generateMesh()                    │
│                                         │
│  For each block:                        │
│    lightLevel = lightLevels[index]      │
│    brightness = 0.8^((15-lightLevel)/15)│
│    color = baseColor × brightness       │
│    vertices.push(color.r, color.g, .b)  │
└──────┬──────────────────────────────────┘
       │
       │  (Render)
       ▼
┌─────────────────────────┐
│ Three.js Renderer       │
│ • WebGL                 │
│ • Vertex colors         │
│ • MeshStandardMaterial  │
└─────────────────────────┘
```

## Shadow Casting Algorithm

```
Block Position: (10, 8, 10)
Sun Direction: (0.5, 0.8, 0.0)  [from time of day]

┌─────────────────────────────────────────────────────────┐
│ Raycast from block towards sun (20 steps over 50 blocks)│
└─────────────────────────────────────────────────────────┘

Step  Position        Check Block    Result
────  ──────────────  ────────────   ──────────────────
 0    (10.0, 8.0, 10) START BLOCK    Skip (self)
 1    (11.2, 10.1, 10) BlockType.AIR  Continue
 2    (12.5, 12.1, 10) BlockType.AIR  Continue
 3    (13.7, 14.2, 10) BlockType.AIR  Continue
 4    (15.0, 16.2, 10) BlockType.STONE ← BLOCKED!
                                     
Shadow Depth = max(3, 15 - floor(distance/5))
             = max(3, 15 - floor(8.5/5))
             = max(3, 15 - 1)
             = 14

Return: lightLevel = 14 (slight shadow)

───────────────────────────────────────────────────────────

If NOT blocked after 20 steps:
Return: lightLevel = sunIntensity (15)  [full sunlight]
```

## Light Level to Brightness Conversion

```
Light Level → Brightness Multiplier → Visual Result

    15      →      1.00              → ████████████ Full bright
    14      →      0.98              → ███████████▓ Almost full
    13      →      0.96              → ███████████░ Very bright
    12      →      0.94              → ███████████  Bright
    11      →      0.91              → ██████████▓  
    10      →      0.87              → ██████████░  
     9      →      0.83              → █████████▓   
     8      →      0.79              → █████████░   Medium
     7      →      0.74              → ████████▓    
     6      →      0.68              → ████████░    
     5      →      0.62              → ███████▓     
     4      →      0.56              → ███████░     Dim
     3      →      0.49              → ██████▓      
     2      →      0.41              → ██████░      
     1      →      0.33              → █████▓       Very dim
     0      →      0.24              → █████░       Near dark

Formula: brightness = 0.8^((15-lightLevel)/15)

Applied to color:
  Base Color: RGB(76, 175, 80)  [Grass green]
  Light Level: 10
  Brightness: 0.87
  
  Final Color: RGB(76×0.87, 175×0.87, 80×0.87)
             = RGB(66, 152, 70)  [Darker grass]
```

## Memory Layout

```
┌───────────────────────────────────────────────────────┐
│ Chunk Memory Layout (16×16×16 blocks)                 │
└───────────────────────────────────────────────────────┘

blocks: Uint8Array[4096]
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  1  │  1  │  3  │ ... │  2  │  1  │  0  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
   0     1     2     3     4          4093  4094  4095
 GRASS DIRT GRASS GRASS STONE  ...   DIRT GRASS  AIR

lightLevels: Uint8Array[4096]
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 15  │ 14  │ 15  │ 15  │ 12  │ ... │  8  │ 10  │  0  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
   0     1     2     3     4          4093  4094  4095

Index calculation for position (x, y, z):
  index = x + y × 16 + z × 16 × 16
  
Example: (5, 3, 2)
  index = 5 + 3×16 + 2×256
        = 5 + 48 + 512
        = 565

Total memory per chunk:
  blocks: 4,096 bytes
  lightLevels: 4,096 bytes
  ───────────────────────
  Total: 8,192 bytes (~8 KB)
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────┐
│ Operation                  │ Frequency    │ Complexity  │
├────────────────────────────┼──────────────┼─────────────┤
│ Time advancement           │ Every frame  │ O(1)        │
│ Sun position update        │ Every frame  │ O(1)        │
│ Light recalculation        │ Every 2s     │ O(C×B×S)    │
│ Mesh regeneration          │ Every 2s     │ O(C×B)      │
│ Chunk loading              │ On demand    │ O(B×S)      │
│ Block lookup               │ On demand    │ O(1)        │
└─────────────────────────────────────────────────────────┘

Where:
  C = Loaded chunks (~27 for distance 3)
  B = Blocks per chunk (16³ = 4,096)
  S = Shadow ray steps (20)

Light Calculation per Update:
  27 chunks × 4,096 blocks × 20 steps = 2,211,840 operations
  @ 2 second interval = 1,105,920 ops/second
  
Modern CPU: 3 GHz = 3,000,000,000 cycles/second
  Operations per cycle needed: ~0.0003 cycles
  Very efficient! ✓
```

## Extension Points

```
┌─────────────────────────────────────────────────────────┐
│                    Add New Light Types                   │
└─────────────────────────────────────────────────────────┘

1. Add to enum (LightingSystem.ts):
   export enum LightSourceType {
     SUN = "sun",
     TORCH = "torch",
     LAVA = "lava",
     GLOWSTONE = "glowstone",  ← NEW
   }

2. Create light source:
   const glowstone: LightSource = {
     id: "glowstone_10_5_10",
     type: LightSourceType.GLOWSTONE,
     position: new THREE.Vector3(10, 5, 10),
     intensity: 15,
     color: new THREE.Color(0xffffaa),
   };

3. Add to system:
   lightingSystem.addLightSource(glowstone);
   chunkManager.recalculateAllLighting();

4. Optional - Add special behavior:
   class CustomLightingSystem extends LightingSystem {
     updateGlowstonePulse(id: string, time: number) {
       const light = this.getLightSources().find(s => s.id === id);
       if (light) {
         light.intensity = 14 + Math.sin(time) * 2;
       }
     }
   }
```

## File Dependencies

```
main.ts
  ├─→ THREE (three)
  ├─→ ChunkManager
  │   ├─→ Chunk
  │   │   ├─→ blocks (BlockType, BLOCK_CONFIG)
  │   │   └─→ LightingSystem
  │   ├─→ WorldGenerator
  │   │   ├─→ blocks
  │   │   ├─→ Chunk
  │   │   └─→ SeededRandom
  │   ├─→ LightingSystem
  │   │   ├─→ THREE
  │   │   ├─→ Chunk (CHUNK_SIZE)
  │   │   └─→ blocks (BlockType, BLOCK_CONFIG)
  │   └─→ blocks
  └─→ CHUNK_SIZE (from Chunk)

Dependency Tree:
  blocks.ts (no dependencies)
    ↓
  SeededRandom.ts (no dependencies)
    ↓
  Chunk.ts (blocks, LightingSystem)
    ↓
  WorldGenerator.ts (blocks, Chunk, SeededRandom)
    ↓
  LightingSystem.ts (THREE, Chunk, blocks)
    ↓
  ChunkManager.ts (THREE, Chunk, WorldGenerator, LightingSystem, blocks)
    ↓
  main.ts (THREE, ChunkManager, WorldGenerator, LightingSystem, Chunk)
```

---

**Architecture designed for**:
- ✅ **Performance**: Optimized calculations, periodic updates
- ✅ **Extensibility**: Easy to add new light types
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Handles large worlds efficiently
- ✅ **Flexibility**: Configurable parameters
