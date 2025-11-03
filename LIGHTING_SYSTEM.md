# Dynamic Lighting System

## Overview

This Minecraft project now features a comprehensive dynamic lighting system that creates realistic shadows and lighting effects. The system handles both natural light (sun) and is extensible for future artificial light sources like torches, lava, or glowstone.

## Features

### 1. **Dynamic Directional Lighting (Sun)**
- The sun acts as a directional light source that illuminates the world
- Sun position can be dynamically updated (currently rotates to demonstrate day/night cycle)
- Creates realistic shadows when terrain blocks the sunlight

### 2. **Shadow Casting**
- Minecraft-style shadow system using raycasting
- Blocks that cannot "see" the light source appear darker
- Partial shadows based on distance from occluding blocks
- Prevents self-shadowing artifacts

### 3. **Point Light Support**
- Infrastructure for adding point lights (torches, lamps, etc.)
- Distance-based light attenuation
- Dot product calculation for proper surface shading

### 4. **Per-Vertex Lighting**
- Each vertex on block faces has individual brightness calculation
- Lighting is baked into vertex colors for performance
- Supports smooth lighting transitions

## Architecture

### `LightingManager.ts`

Central hub for all lighting calculations:

- **`calculateLightingAtPosition(position, normal)`**: Calculates total brightness at a world position
- **`calculateDirectionalLight()`**: Handles sun/directional light contribution
- **`calculatePointLight()`**: Handles point light sources with distance attenuation
- **`calculateShadow()`**: Performs raycasting to detect shadows
- **`isBlockSolidAt()`**: Checks if a block is opaque at world position

Light source management:
- **`addLightSource(id, lightSource)`**: Add a new light source
- **`removeLightSource(id)`**: Remove a light source
- **`updateLightSource(id, updates)`**: Update existing light properties
- **`updateSunPosition(direction)`**: Move the sun

### `Chunk.ts` Modifications

- Added `generateMesh(lightingManager)` parameter
- Added `calculateFaceLighting()` method to compute per-vertex brightness
- Each face now includes normal vectors for lighting calculations
- Vertex colors multiplied by lighting values

### `ChunkManager.ts` Integration

- Stores reference to `LightingManager`
- Passes lighting manager to chunks during mesh generation
- **`regenerateAllChunkMeshes()`**: Rebuilds all chunk meshes with updated lighting

### `main.ts` Setup

- Creates and initializes `LightingManager`
- Links lighting manager with chunk manager
- Animates sun position for dynamic lighting demonstration
- Periodically regenerates chunk meshes (every 100ms)

## How It Works

### Lighting Calculation Flow

1. **Chunk Generation**: When a chunk is generated, it calls `generateMesh(lightingManager)`

2. **Face Processing**: For each visible block face:
   - Face normal is calculated
   - Four vertices are created (one per corner)
   
3. **Per-Vertex Lighting**: For each vertex:
   - Position is offset slightly along the normal (prevents self-shadowing)
   - `calculateLightingAtPosition()` is called with position and normal
   
4. **Light Accumulation**:
   - Start with ambient light (minimum brightness = 0.3)
   - Add directional light contribution (sun)
   - Add point light contributions
   - Clamp result between 0 and 1

5. **Shadow Calculation**:
   - Cast ray from surface towards light source
   - Sample multiple points along the ray
   - If solid block found, reduce light by shadow factor
   - Closer occluders create darker shadows

6. **Color Application**:
   - Base block color is multiplied by brightness value
   - Brighter areas get full color, darker areas are dimmed

### Shadow Raycasting

The shadow system uses stepped raycasting:
- Casts up to 10 sample points from surface to light
- Each sample checks if a solid block exists at that position
- If obstruction found, returns partial shadow (30% light penetration)
- Shadow strength varies with distance to occluder

## Performance Optimizations

### Current Implementation
- Vertex-based lighting (calculated once per vertex during mesh generation)
- Lighting baked into vertex colors (no per-pixel shader calculations)
- Shadow rays use limited steps (10 max)
- Chunks regenerated periodically, not constantly

### Potential Optimizations
1. **Dirty Tracking**: Only regenerate chunks affected by lighting changes
2. **Light Propagation Cache**: Store light values in a grid for faster lookups
3. **LOD for Shadows**: Reduce shadow quality for distant chunks
4. **Worker Threads**: Offload lighting calculations to web workers

## Adding New Light Sources

### Example: Adding a Torch

```typescript
// In main.ts or wherever you handle player actions
const torchPosition = new THREE.Vector3(10, 5, 10);

lightingManager.addLightSource('torch-1', {
  position: torchPosition,
  intensity: 0.8,
  range: 10, // Lights blocks within 10 units
  color: new THREE.Color(1.0, 0.6, 0.2), // Warm orange glow
  type: 'point'
});

// Regenerate nearby chunks to show the new light
chunkManager.regenerateAllChunkMeshes();
```

### Example: Moving a Light Source

```typescript
// Update torch position (e.g., player holding torch)
lightingManager.updateLightSource('torch-1', {
  position: playerPosition
});

// Regenerate chunks to update lighting
chunkManager.regenerateAllChunkMeshes();
```

## Configuration Options

### Ambient Light Level
```typescript
lightingManager.setAmbientLight(0.3); // 0 = pitch black, 1 = fully lit
```

### Sun Properties
```typescript
const sun = lightingManager.getSunLight();
sun.intensity = 1.0; // Brightness multiplier
sun.color = new THREE.Color(1, 1, 1); // Sun color
```

### Lighting Update Frequency
In `main.ts`:
```typescript
const lightingUpdateInterval = 100; // Milliseconds between updates
```

## Visual Results

### What You'll See
1. **Bright Surfaces**: Faces directly facing the sun are fully illuminated
2. **Dark Surfaces**: Faces facing away from the sun are darker (ambient light only)
3. **Dynamic Shadows**: Hills cast shadows that move as the sun rotates
4. **Shadow Gradients**: Shadows are darker closer to the occluding block
5. **Time of Day**: Sun rotation creates a visual day/night cycle effect

### Testing the System
1. Run the project and observe the rotating sun
2. Watch shadows move across the terrain
3. Notice how valleys between hills become shadowed
4. Observe how top faces are brighter than side faces
5. See the sun angle and direction in the UI overlay

## Future Enhancements

### Planned Features
- [ ] Block light sources (torches, lamps, glowstone)
- [ ] Colored lighting (lava = orange, water = blue tint)
- [ ] Light level persistence (save lighting data)
- [ ] Sky light vs block light separation (like Minecraft)
- [ ] Smooth lighting (average adjacent block light values)
- [ ] Light occlusion for semi-transparent blocks (water, glass)

### Advanced Features
- [ ] Day/night cycle with adjustable speed
- [ ] Ambient occlusion for corner darkening
- [ ] Volumetric fog/god rays
- [ ] Phosphorescent blocks that glow in darkness
- [ ] Light-emitting entities (fireflies, lanterns)

## Technical Details

### Coordinate System
- World coordinates: Global position in the Minecraft world
- Chunk coordinates: Which chunk (x, y, z in chunk grid)
- Local coordinates: Position within chunk (0-15 on each axis)

### Normal Vectors
Each face has a fixed normal:
- Top face: (0, 1, 0)
- Bottom face: (0, -1, 0)
- Front face: (0, 0, 1)
- Back face: (0, 0, -1)
- Right face: (1, 0, 0)
- Left face: (-1, 0, 0)

### Dot Product Lighting
```
brightness = dot(faceNormal, lightDirection)
```
- Result = 1: Face directly faces light (full brightness)
- Result = 0: Face perpendicular to light (no direct light)
- Result = -1: Face away from light (no light contribution)

## Troubleshooting

### Lighting Looks Too Dark
- Increase ambient light: `lightingManager.setAmbientLight(0.5)`
- Increase sun intensity: `lightingManager.getSunLight().intensity = 1.5`

### Performance Issues
- Reduce lighting update frequency in `main.ts`
- Decrease render distance in chunk manager config
- Reduce shadow ray steps in `LightingManager.calculateShadow()`

### Shadows Not Appearing
- Ensure sun position has positive Y component
- Check that blocks are being detected by `isBlockSolidAt()`
- Verify chunk manager has lighting manager set

## Conclusion

This lighting system provides a solid foundation for realistic Minecraft-style lighting with dynamic shadows. The architecture is extensible and optimized for real-time rendering. Future additions like torches, lamps, and colored lighting can be easily integrated using the `LightingManager` API.

Happy mining! ⛏️✨
