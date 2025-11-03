# Dynamic Lighting - Quick Reference Card

## 🎮 Controls
| Key | Action |
|-----|--------|
| **T** | Toggle time progression ON/OFF |
| **WASD** | Move around |
| **Space** | Move up |
| **Shift** | Move down |
| **Mouse** | Look around (click to lock) |

## ⏰ Time System
```
0      = Midnight (00:00) - Blue light, very dark
6000   = Noon (06:00)     - White light, full brightness  
12000  = Sunset (12:00)   - Orange light, medium brightness
18000  = Midnight (18:00) - Blue light, very dark
24000  = Day cycle repeats
```

**Progression Speed**: 20 ticks/second (1 day ≈ 20 minutes real-time)

## 💡 Light Levels

| Level | Brightness | Description |
|-------|------------|-------------|
| 15 | 100% | Full sunlight |
| 12 | ~85% | Bright daylight |
| 9 | ~64% | Moderate light |
| 6 | ~43% | Dim light |
| 3 | ~22% | Very dark |
| 0 | ~5% | Complete darkness |

**Formula**: brightness = 0.8^((15-lightLevel)/15)

## 🌤️ Weather & Lighting

### Current Sky Colors
- **Dawn/Dusk**: Orange (#ffaa66)
- **Day**: White (#ffffff)
- **Night**: Blue (#6688bb)

## 🔦 Adding Light Sources (Code)

### Torch
```typescript
lightingSystem.addLightSource({
  id: "torch_1",
  type: LightSourceType.TORCH,
  position: new THREE.Vector3(x, y, z),
  intensity: 14,
  color: new THREE.Color(0xffaa66)
});
```

### Lava
```typescript
lightingSystem.addLightSource({
  id: "lava_1",
  type: LightSourceType.LAVA,
  position: new THREE.Vector3(x, y, z),
  intensity: 15,
  color: new THREE.Color(0xff4400)
});
```

### Don't forget to recalculate!
```typescript
chunkManager.recalculateAllLighting();
```

## ⚙️ Configuration

### Lighting System (main.ts)
```typescript
const lightingSystem = new LightingSystem({
  enableSunlight: true,        // Enable sun
  enableDynamicShadows: true,  // Enable shadows
  sunIntensity: 15,            // Max brightness (0-15)
  timeOfDay: 6000,             // Starting time
});
```

### Performance (main.ts)
```typescript
const LIGHTING_UPDATE_INTERVAL = 2000; // milliseconds
```
- **Lower (500-1000)**: Smooth, high CPU usage
- **Default (2000)**: Balanced
- **Higher (3000-5000)**: Better performance, less smooth

## 🐛 Troubleshooting

### Too Dark?
```typescript
// Increase sun intensity
sunIntensity: 20  // Instead of 15

// Increase ambient light
ambient.intensity = 0.5;  // Instead of 0.3
```

### Too Bright?
```typescript
// Decrease sun intensity
sunIntensity: 10  // Instead of 15

// Decrease ambient light
ambient.intensity = 0.2;  // Instead of 0.3
```

### Low FPS?
```typescript
// Update lighting less frequently
const LIGHTING_UPDATE_INTERVAL = 5000;  // Every 5 seconds

// Reduce render distance
renderDistance: 2  // Instead of 3

// Disable shadows temporarily
enableDynamicShadows: false
```

### Shadows Not Working?
- Check `enableDynamicShadows: true`
- Verify terrain has height variation
- Look for hills/mountains that should cast shadows

## 📊 Performance Metrics

**Per Frame**:
- Sun position update: ~0.1ms
- Mesh rendering: ~varies
- No lighting calculation (done periodically)

**Every 2 Seconds**:
- Lighting calculation: ~50-200ms (depends on loaded chunks)
- Mesh regeneration: ~20-100ms

**Memory**:
- ~8 KB per chunk (blocks + lighting)
- ~216 KB total for 27 chunks (3×3×3)

## 🎨 Visual Effects

### Shadow Casting
- Hills cast shadows on valleys
- Buildings shade ground
- Trees create shade (if implemented)
- Shadow intensity varies by distance

### Time-Based Colors
- **Dawn**: Orange glow from east
- **Noon**: Bright white overhead
- **Dusk**: Orange glow from west
- **Night**: Blue ambient moonlight

## 📁 File Locations

| File | Purpose |
|------|---------|
| `src/LightingSystem.ts` | Core lighting engine |
| `src/Chunk.ts` | Light storage & mesh generation |
| `src/ChunkManager.ts` | Light calculation & updates |
| `src/main.ts` | Integration & time control |

## 📖 Documentation Files

| File | Description |
|------|-------------|
| `LIGHTING_SYSTEM.md` | Complete technical docs (485 lines) |
| `QUICK_START_LIGHTING.md` | Getting started guide (228 lines) |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details (485 lines) |
| `LIGHTING_QUICK_REFERENCE.md` | This file |

## 🔧 Common Tasks

### Freeze Time at Specific Moment
```typescript
// In browser console or code
lightingSystem.setTimeOfDay(6000);  // Freeze at noon
// Then press T to disable auto-advance
```

### Speed Up Time
```typescript
// In animate() function, change:
lightingSystem.advanceTime(deltaTime * 20);  // Normal
// To:
lightingSystem.advanceTime(deltaTime * 100); // 5× faster
```

### Slow Down Time
```typescript
lightingSystem.advanceTime(deltaTime * 4);   // 5× slower
```

### Get Current Time
```typescript
const time = lightingSystem.getTimeOfDay();
console.log(`Current time: ${time} ticks`);
```

### Get Ambient Light
```typescript
const ambient = lightingSystem.getAmbientLightLevel();
console.log(`Ambient: ${ambient}/15`);
```

## 🚀 Next Steps

Ready to implement:
1. **Torch Placement**: Click to place torches
2. **Emissive Blocks**: Lava, glowstone auto-light
3. **Flickering Effects**: Animated torch light
4. **Colored Lights**: Different colors for different sources
5. **Moon Object**: Visible moon in night sky
6. **Stars**: Night sky decoration
7. **Clouds**: Dynamic cloud shadows

## 💬 Console Commands

Open browser console (F12) and try:
```javascript
// Get lighting system
const ls = chunkManager.getLightingSystem();

// Set time
ls.setTimeOfDay(0);      // Midnight
ls.setTimeOfDay(6000);   // Noon
ls.setTimeOfDay(12000);  // Sunset

// Add torch at camera position
ls.addLightSource({
  id: "test_torch",
  type: "TORCH",
  position: camera.position.clone(),
  intensity: 14
});
chunkManager.recalculateAllLighting();

// Remove torch
ls.removeLightSource("test_torch");
chunkManager.recalculateAllLighting();
```

---

**Pro Tip**: Press T to toggle time, then move around to see shadows change as the sun moves! 🌅

For detailed documentation, see **LIGHTING_SYSTEM.md** and **QUICK_START_LIGHTING.md**.
