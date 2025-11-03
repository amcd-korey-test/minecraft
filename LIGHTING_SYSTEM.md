# Dynamic Lighting and Shadow System

## Overview

This Minecraft project now includes a comprehensive dynamic lighting and shadow system that creates realistic lighting effects based on light sources and terrain occlusion. The system is designed to be extensible for future light sources like torches, lava, and other emissive blocks.

## Features

### 1. **Dynamic Sunlight with Time-of-Day Cycle**
- The sun moves across the sky in a realistic arc based on the time of day (0-24000 ticks, like Minecraft)
- Sun intensity varies throughout the day:
  - **Dawn** (0-6000): Sun rises from the horizon with orange tint
  - **Noon** (6000): Full brightness with white light
  - **Dusk** (12000-18000): Sun sets with orange tint
  - **Night** (18000-24000): Minimal light with blue tint

### 2. **Shadow Casting**
- Terrain that blocks sunlight creates shadows
- Shadows are calculated using raycasting from each block towards the sun
- Shadow intensity varies based on distance to the blocking object
- Shadow depth: blocks closer to occluders are darker

### 3. **Minecraft-Style Light Levels**
- Each block stores a light level from 0 (complete darkness) to 15 (full brightness)
- Light levels are converted to brightness multipliers using an exponential curve
- Formula: `brightness = 0.8^((15-lightLevel)/15)`

### 4. **Extensible Light Source System**
- Abstract `LightSource` interface supports multiple light types:
  - `SUN`: Natural sunlight
  - `TORCH`: Player-placed torches (ready for implementation)
  - `LAVA`: Emissive blocks (ready for implementation)
- Light sources have:
  - Position in 3D space
  - Intensity (0-15)
  - Optional color tint
- Light falloff: intensity decreases with distance from source

### 5. **Ambient Lighting**
- Ambient light levels change based on time of day
- During night, a minimum ambient light level prevents complete darkness
- Smooth transitions between day and night

## Architecture

### Core Classes

#### `LightingSystem` (`src/LightingSystem.ts`)
Main controller for all lighting calculations.

**Key Methods:**
- `setSunLight(sunLight)`: Links Three.js DirectionalLight for sun control
- `setTimeOfDay(time)`: Sets current time (0-24000)
- `advanceTime(delta)`: Progresses time for day/night cycle
- `addLightSource(source)`: Adds dynamic light source (torch, lava, etc.)
- `calculateLightLevel(x, y, z, getBlockAt)`: Calculates light level at a position
- `calculateSunlight(x, y, z, getBlockAt)`: Calculates sunlight with shadow casting
- `getAmbientLightLevel()`: Returns ambient light level for current time

**Static Methods:**
- `lightLevelToBrightness(level)`: Converts light level (0-15) to brightness multiplier

#### `Chunk` (`src/Chunk.ts`)
Extended to store light level data.

**New Properties:**
- `lightLevels: Uint8Array`: Stores light level for each block (0-15)

**New Methods:**
- `getLightLevel(x, y, z)`: Get light level at local coordinates
- `setLightLevel(x, y, z, level)`: Set light level at local coordinates

**Modified Methods:**
- `generateMesh()`: Now applies lighting to vertex colors based on light levels

#### `ChunkManager` (`src/ChunkManager.ts`)
Integrates lighting into chunk loading and management.

**New Properties:**
- `lightingSystem: LightingSystem`: Reference to lighting system

**New Methods:**
- `calculateChunkLighting(chunk)`: Calculates lighting for all blocks in a chunk
- `getBlockAtWorldPosition(x, y, z)`: Gets block type at world coordinates
- `recalculateAllLighting()`: Recalculates and updates lighting for all loaded chunks
- `getLightingSystem()`: Returns lighting system reference

## Usage

### Basic Setup

The lighting system is automatically initialized in `main.ts`:

```typescript
// Create lighting system
const lightingSystem = new LightingSystem({
  enableSunlight: true,
  enableDynamicShadows: true,
  sunIntensity: 15,
  timeOfDay: 6000, // Start at noon
});

// Link to Three.js sun light
lightingSystem.setSunLight(sunLight);

// Pass to chunk manager
const chunkManager = new ChunkManager(scene, worldGenerator, lightingSystem, config);
```

### Time Control

Press **T** to toggle automatic time progression.

Time advances automatically at 20 ticks per second (1 Minecraft day ≈ 20 minutes real time).

```typescript
// Manual time control
lightingSystem.setTimeOfDay(12000); // Set to sunset
lightingSystem.advanceTime(100); // Advance by 100 ticks
```

### Adding Dynamic Light Sources (Future Feature)

To add a torch or other light source:

```typescript
lightingSystem.addLightSource({
  id: "torch_1",
  type: LightSourceType.TORCH,
  position: new THREE.Vector3(10, 5, 10),
  intensity: 14,
  color: new THREE.Color(0xffaa66), // Warm torch light
});
```

To remove a light source:

```typescript
lightingSystem.removeLightSource("torch_1");
```

## Performance Considerations

### Optimization Strategies

1. **Periodic Updates**: Lighting is recalculated every 2 seconds (configurable via `LIGHTING_UPDATE_INTERVAL`)
2. **Chunk-based**: Only loaded chunks have lighting calculated
3. **Skip Air Blocks**: Air blocks don't store light levels, saving memory
4. **Efficient Raycasting**: Shadow rays use stepped sampling (20 steps over 50 blocks)
5. **Light Level Caching**: Light levels stored in chunks, only recalculated when needed

### Performance Tuning

To adjust update frequency (in `main.ts`):

```typescript
const LIGHTING_UPDATE_INTERVAL = 2000; // Milliseconds between lighting updates
```

Lower values = smoother lighting transitions but higher CPU usage.
Higher values = better performance but more noticeable lighting changes.

### Future Optimizations

- **Light Propagation**: Implement flood-fill algorithm for more efficient light spreading
- **Dirty Chunks**: Only recalculate lighting for chunks that have changed
- **LOD**: Reduce lighting detail for distant chunks
- **Web Workers**: Move lighting calculations to background threads

## How It Works

### Light Level Calculation

For each solid block in a chunk:

1. **Calculate Sunlight Contribution:**
   - Raycast from block towards sun position
   - If ray hits solid block, reduce light level (shadow)
   - Shadow depth based on distance to blocker
   - Time of day affects sun intensity

2. **Calculate Point Light Contribution:**
   - Check each dynamic light source (torches, etc.)
   - Calculate distance from block to light
   - Apply light falloff: `max(0, intensity - distance)`
   - Raycast to check for obstacles

3. **Combine Light Sources:**
   - Take maximum light level from all sources
   - Clamp to 0-15 range

4. **Apply to Mesh:**
   - Convert light level to brightness multiplier
   - Multiply block's base color by brightness
   - Store in vertex colors

### Shadow Casting Algorithm

```
For each block position (x, y, z):
  Get sun direction vector from time of day
  For each step along ray towards sun (20 steps over 50 blocks):
    Check if ray hits solid block
    If blocked:
      Calculate shadow intensity based on distance
      Return reduced light level
  Return full sunlight if not blocked
```

### Vertex Color Lighting

Unlike traditional per-vertex lighting, this system:
- Calculates one light level per block
- Applies to all vertices of that block
- Creates Minecraft-style "blocky" lighting
- Maintains visual consistency with voxel aesthetic

## Configuration Options

### LightingConfig

```typescript
interface LightingConfig {
  enableSunlight: boolean;        // Enable/disable sun
  enableDynamicShadows: boolean;  // Enable/disable shadow casting
  sunIntensity: number;           // Max sun light level (0-15)
  timeOfDay: number;              // Starting time (0-24000)
}
```

### ChunkManagerConfig

Affects lighting indirectly through chunk loading:

```typescript
interface ChunkManagerConfig {
  renderDistance: number;   // Chunks to load around player
  unloadDistance: number;   // Distance before unloading chunks
}
```

## Extending the System

### Adding New Light Source Types

1. Add type to enum in `LightingSystem.ts`:
```typescript
export enum LightSourceType {
  SUN = "sun",
  TORCH = "torch",
  LAVA = "lava",
  GLOWSTONE = "glowstone", // New type
}
```

2. Create light source with specific properties:
```typescript
const glowstone: LightSource = {
  id: "glowstone_1",
  type: LightSourceType.GLOWSTONE,
  position: new THREE.Vector3(x, y, z),
  intensity: 15,
  color: new THREE.Color(0xffffaa),
};
```

3. Add to lighting system:
```typescript
lightingSystem.addLightSource(glowstone);
```

### Custom Light Behaviors

Extend `LightingSystem` to add special behaviors:

```typescript
class CustomLightingSystem extends LightingSystem {
  // Flickering torch effect
  updateFlickeringTorch(torchId: string) {
    const torch = this.getLightSources().find(s => s.id === torchId);
    if (torch) {
      torch.intensity = 14 + Math.random() * 2; // Flicker between 14-16
    }
  }
  
  // Pulsing lava effect
  updatePulsingLava(lavaId: string, time: number) {
    const lava = this.getLightSources().find(s => s.id === lavaId);
    if (lava) {
      lava.intensity = 15 + Math.sin(time * 0.001) * 3; // Pulse
    }
  }
}
```

## Visual Examples

### Time of Day Lighting

- **06:00 (Dawn)**: Orange-tinted light, long shadows, low intensity
- **12:00 (Noon)**: White light, short shadows, high intensity  
- **18:00 (Dusk)**: Orange-tinted light, long shadows, medium intensity
- **00:00 (Midnight)**: Blue-tinted light, very dim, ambient only

### Shadow Effects

- Hills cast shadows on valleys
- Tall structures create shade
- Caves are naturally dark (will need torches)
- Underwater areas receive reduced sunlight

## Troubleshooting

### Lighting too dark?
- Increase `sunIntensity` in LightingConfig
- Increase ambient light intensity in `main.ts`
- Reduce shadow intensity in `calculateSunlight()`

### Performance issues?
- Increase `LIGHTING_UPDATE_INTERVAL`
- Reduce `renderDistance` in ChunkManagerConfig
- Disable shadows: `enableDynamicShadows: false`

### Lighting not updating?
- Check that `recalculateAllLighting()` is being called
- Verify time is advancing with autoAdvanceTime
- Ensure chunks are loaded before lighting calculation

## Technical Details

### Memory Usage

Per chunk (16³ blocks):
- Block data: 4,096 bytes (Uint8Array)
- Light data: 4,096 bytes (Uint8Array)
- Total: ~8 KB per chunk + mesh geometry

### Lighting Calculation Complexity

- Per block: O(20) for sun raycasting
- Per chunk: O(16³ × 20) ≈ 82,000 operations
- For 27 chunks (3x3x3): ~2.2M operations per update
- Update every 2 seconds = ~1.1M operations/second

This is acceptable for real-time rendering on modern hardware.

## Future Enhancements

- [ ] Block placement triggers lighting recalculation
- [ ] Block destruction triggers lighting recalculation
- [ ] Smooth light interpolation between blocks
- [ ] Colored lighting for different light sources
- [ ] Light bleeding/scattering effects
- [ ] Underwater caustics from sunlight
- [ ] Volumetric lighting effects (god rays)
- [ ] Dynamic cloud shadows
- [ ] Per-face lighting for more detail
- [ ] Light level visualization (debug mode)

## Credits

This lighting system is inspired by Minecraft's lighting engine while adapted for web-based rendering with Three.js. It uses modern JavaScript/TypeScript features and WebGL for efficient real-time rendering.
