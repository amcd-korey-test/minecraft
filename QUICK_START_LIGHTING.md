# Quick Start: Dynamic Lighting System

## What's New

Your Minecraft project now has a complete dynamic lighting and shadow system! Here's what you can do:

## Features Added ✨

### 1. **Dynamic Day/Night Cycle**
- The sun automatically moves across the sky
- Time progresses from dawn → noon → dusk → night
- Different lighting colors for different times of day
- Press **T** to toggle time progression on/off
- **Visible sun and moon** that move across the sky!

### 2. **Dynamic Sky Colors**
- Sky color changes throughout the day:
  - **Night**: Dark blue-black
  - **Dawn**: Orange-red sunrise
  - **Day**: Bright sky blue
  - **Dusk**: Orange-red sunset
  - **Evening**: Deep blue
- Fog color adapts to match the sky
- Smooth color transitions between phases

### 3. **Realistic Shadows**
- Hills and mountains cast shadows on lower terrain
- Shadow intensity varies based on distance
- Shadows move as the sun travels across the sky
- Darker areas receive less light, lighter areas are bright

### 4. **Block-Level Lighting**
- Each block has a light level from 0-15 (like Minecraft)
- Light levels are visualized through vertex colors
- Smooth brightness transitions based on light exposure
- Blocks in shadow appear darker

### 5. **Visible Celestial Bodies**
- **Sun**: Bright yellow sphere visible during the day
- **Moon**: Pale blue-white sphere visible at night
- Both fade in/out during sunrise/sunset
- Move in realistic arcs across the sky
- Positioned opposite each other

### 6. **Extensible for Future Features**
- Ready for torches, lava, glowstone, etc.
- Simple API to add new light sources
- Support for colored lighting
- Point light sources with distance falloff

## Controls

- **WASD**: Move around
- **Space**: Move up
- **Shift**: Move down
- **Mouse**: Look around (click to lock)
- **T**: Toggle automatic time progression

## UI Display

The info panel now shows:
- Current time of day in HH:MM format
- Time ticks (0-24000)
- Position and chunk coordinates
- World seed

## Time System

The time system works like Minecraft:
- **0-6000**: Night → Dawn
- **6000**: Noon (brightest)
- **6000-12000**: Day
- **12000**: Sunset
- **12000-18000**: Dusk
- **18000-24000**: Night

Time advances at 20 ticks per second (one full day ≈ 20 minutes).

## Adding Torches (Example for Future)

When you're ready to add torches, use this code:

```typescript
// In your game logic
const lightingSystem = chunkManager.getLightingSystem();

// Add a torch at position (10, 5, 10)
lightingSystem.addLightSource({
  id: "torch_1",
  type: LightSourceType.TORCH,
  position: new THREE.Vector3(10, 5, 10),
  intensity: 14,
  color: new THREE.Color(0xffaa66), // Warm orange glow
});

// Remove torch
lightingSystem.removeLightSource("torch_1");

// After adding/removing lights, recalculate lighting
chunkManager.recalculateAllLighting();
```

## Performance Settings

To adjust performance, edit `LIGHTING_UPDATE_INTERVAL` in `src/main.ts`:

```typescript
const LIGHTING_UPDATE_INTERVAL = 2000; // Milliseconds between updates
```

- **Lower (1000ms)**: Smoother lighting updates, higher CPU usage
- **Higher (5000ms)**: Better performance, less frequent updates

## Files Modified

- ✅ **LightingSystem.ts** (NEW): Core lighting engine
- ✅ **Chunk.ts**: Added light level storage
- ✅ **ChunkManager.ts**: Integrated lighting calculations
- ✅ **main.ts**: Added time controls and lighting updates

## Visual Effects

### Dawn (05:30-07:00)
- Orange-red sky
- Sun rising from horizon
- Moon setting on opposite side
- Long shadows
- Low ambient light
- Beautiful atmospheric sunrise

### Noon (12:00)  
- Bright sky blue
- Bright yellow sun overhead
- Short shadows
- High visibility
- Clear daylight
- Moon below horizon

### Dusk (17:00-18:30)
- Orange-red sky
- Sun setting on horizon
- Moon rising on opposite side
- Long shadows
- Medium ambient light
- Atmospheric sunset

### Night (00:00)
- Dark blue-black sky
- Pale moon visible
- Very dark terrain
- Minimal ambient light
- Sun below horizon
- Mystical atmosphere

## Technical Details

### Light Calculation
- Uses raycasting for shadow detection
- Checks 20 samples along 50-block ray
- Combines sunlight + point lights
- Takes maximum light level from all sources

### Optimization
- Lighting updated every 2 seconds (configurable)
- Only loaded chunks calculated
- Air blocks skipped
- Efficient Uint8Array storage

## Testing the System

1. **Start the game**: `bun run dev`
2. **Navigate around**: Move to see different lighting on terrain
3. **Watch the sun**: It moves across the sky automatically
4. **Find shadows**: Look for hills casting shadows on valleys
5. **Toggle time**: Press T to freeze/unfreeze time
6. **Check different times**: Watch how lighting changes throughout the day

## Next Steps

Now that you have dynamic lighting, consider adding:
- 🔦 **Torches**: Player-placed light sources
- 🌋 **Lava blocks**: Emissive terrain
- 💡 **Glowstone**: Bright decorative blocks
- 🕯️ **Lanterns**: Hanging light sources
- 🔥 **Campfires**: Animated flickering lights
- ⭐ **Stars**: Night sky decoration
- 🌙 **Moon**: Visible moon object
- ☁️ **Cloud shadows**: Dynamic cloud system

## Troubleshooting

**Too dark?**
- Increase sun intensity in `LightingSystem` config
- Increase ambient light in `main.ts`

**Too bright?**
- Decrease sun intensity
- Increase shadow strength in `calculateSunlight()`

**Choppy updates?**
- Increase `LIGHTING_UPDATE_INTERVAL`
- Reduce render distance

**Shadows not appearing?**
- Check `enableDynamicShadows: true` in config
- Ensure terrain has height variation

## Support

For detailed documentation, see:
- **LIGHTING_SYSTEM.md**: Complete technical documentation
- **WORLD_GENERATION.md**: World generation details
- **README.md**: General project information

Enjoy your dynamically lit Minecraft world! 🌅🌄🌆🌃
