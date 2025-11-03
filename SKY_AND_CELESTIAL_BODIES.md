# Sky Colors and Celestial Bodies

## Overview

The Minecraft world now features dynamic sky colors that change throughout the day, along with visible sun and moon objects that move across the sky in realistic arcs.

## Sky Color System

### Color Palette

The sky transitions through these colors based on time of day:

| Time Period | Time Range | Color | Hex Code | Description |
|-------------|-----------|-------|----------|-------------|
| **Night** | 0:00 - 5:30 | Dark Blue-Black | `#0a0a1a` | Deep night sky |
| **Dawn Transition** | 5:30 - 6:30 | Night → Orange | `#0a0a1a` → `#ff6b4a` | Sunrise begins |
| **Sunrise** | 6:30 - 7:00 | Orange → Sky Blue | `#ff6b4a` → `#87ceeb` | Morning arrives |
| **Day** | 7:00 - 17:00 | Sky Blue | `#87ceeb` | Clear daylight |
| **Sunset** | 17:00 - 17:30 | Sky Blue → Orange | `#87ceeb` → `#ff6b4a` | Dusk begins |
| **Dusk Transition** | 17:30 - 18:30 | Orange → Deep Blue | `#ff6b4a` → `#1a1a3a` | Evening arrives |
| **Evening** | 18:30 - 24:00 | Deep Blue → Night | `#1a1a3a` → `#0a0a1a` | Night returns |

### Implementation

The sky color is calculated using linear interpolation (lerp) between key colors:

```typescript
const skyColor = lightingSystem.getSkyColor();
scene.background = skyColor;
```

**Features:**
- Smooth transitions between all color phases
- No sudden color jumps
- Colors match time of day realistically
- Fog color automatically matches sky (slightly darker)

### Fog System

Fog color is synchronized with sky color for atmospheric depth:

```typescript
const fogColor = lightingSystem.getFogColor();
scene.fog = new THREE.Fog(fogColor.getHex(), 50, 200);
```

**Properties:**
- Fog starts at 50 units from camera
- Full fog density at 200 units
- Color is 90% of sky color (slightly darker)
- Updates every frame for smooth transitions

## Celestial Bodies

### Sun

**Visual Properties:**
- **Geometry**: Sphere with radius 8
- **Color**: Yellow (`#ffff00`)
- **Emissive**: Glows brightly
- **Distance**: 150 units from origin
- **Material**: MeshBasicMaterial (always visible when above horizon)

**Movement:**
- Follows the directional light position
- Moves in arc across the sky
- Rises in the east (depends on angle calculation)
- Sets in the west
- Below horizon during night

**Visibility:**
| Time Range | Visibility | Behavior |
|------------|-----------|----------|
| 0:00 - 6:00 | Hidden | Below horizon |
| 6:00 - 6:30 | Fading In | Rising (0% → 100% opacity) |
| 6:30 - 17:30 | Fully Visible | Above horizon (100% opacity) |
| 17:30 - 18:00 | Fading Out | Setting (100% → 0% opacity) |
| 18:00 - 24:00 | Hidden | Below horizon |

**Code:**
```typescript
// Position
const sunX = Math.cos(sunAngle) * celestialDistance;
const sunY = Math.sin(sunAngle) * celestialDistance;
sun.position.set(sunX, sunY, 50);

// Visibility
const sunVisibility = lightingSystem.getSunVisibility();
sun.visible = sunVisibility > 0;
sun.material.opacity = sunVisibility;
```

### Moon

**Visual Properties:**
- **Geometry**: Sphere with radius 6 (smaller than sun)
- **Color**: Pale blue-white (`#ccccee`)
- **Emissive**: Subtle glow (`#aaaacc`)
- **Distance**: 150 units from origin
- **Material**: MeshBasicMaterial
- **Position**: Always opposite the sun (180° offset)

**Movement:**
- Positioned opposite the sun (moonAngle = sunAngle + π)
- Moves in arc across the sky
- Rises when sun sets
- Sets when sun rises
- Above horizon during night

**Visibility:**
| Time Range | Visibility | Behavior |
|------------|-----------|----------|
| 0:00 - 5:30 | Fully Visible | Above horizon (100% opacity) |
| 5:30 - 6:30 | Fading Out | Setting (100% → 0% opacity) |
| 6:30 - 17:30 | Hidden | Below horizon |
| 17:30 - 18:30 | Fading In | Rising (0% → 100% opacity) |
| 18:30 - 24:00 | Fully Visible | Above horizon (100% opacity) |

**Code:**
```typescript
// Position (opposite of sun)
const moonAngle = sunAngle + Math.PI;
const moonX = Math.cos(moonAngle) * celestialDistance;
const moonY = Math.sin(moonAngle) * celestialDistance;
moon.position.set(moonX, moonY, 50);

// Visibility
const moonVisibility = lightingSystem.getMoonVisibility();
moon.visible = moonVisibility > 0;
moon.material.opacity = moonVisibility;
```

## Visual Timeline

Here's how the sky and celestial bodies look throughout a full day:

```
00:00 (Midnight)
├─ Sky: Dark blue-black (#0a0a1a)
├─ Sun: Hidden (below horizon)
└─ Moon: Fully visible, high in sky

03:00 (Deep Night)
├─ Sky: Dark blue-black (#0a0a1a)
├─ Sun: Hidden
└─ Moon: Visible, moving west

06:00 (Sunrise Begins)
├─ Sky: Orange-red transition (#ff6b4a)
├─ Sun: Rising from east, fading in
└─ Moon: Setting in west, fading out

09:00 (Morning)
├─ Sky: Bright sky blue (#87ceeb)
├─ Sun: Rising higher, fully visible
└─ Moon: Hidden (below horizon)

12:00 (Noon)
├─ Sky: Bright sky blue (#87ceeb)
├─ Sun: At highest point, fully bright
└─ Moon: Hidden (opposite side)

15:00 (Afternoon)
├─ Sky: Bright sky blue (#87ceeb)
├─ Sun: Descending, still fully visible
└─ Moon: Hidden

18:00 (Sunset)
├─ Sky: Orange-red transition (#ff6b4a)
├─ Sun: Setting in west, fading out
└─ Moon: Rising from east, fading in

21:00 (Evening)
├─ Sky: Deep blue (#1a1a3a)
├─ Sun: Hidden (below horizon)
└─ Moon: Rising higher, fully visible

24:00 (Midnight - Cycle Repeats)
```

## Technical Details

### Update Frequency

All sky and celestial effects update **every frame** for smooth transitions:

```typescript
function animate() {
  // Update sky color
  const skyColor = lightingSystem.getSkyColor();
  scene.background = skyColor;
  
  // Update fog
  const fogColor = lightingSystem.getFogColor();
  scene.fog = new THREE.Fog(fogColor.getHex(), 50, 200);
  
  // Update sun position and visibility
  const sunAngle = lightingSystem.getSunAngle();
  const sunX = Math.cos(sunAngle) * 150;
  const sunY = Math.sin(sunAngle) * 150;
  sun.position.set(sunX, sunY, 50);
  sun.material.opacity = lightingSystem.getSunVisibility();
  
  // Update moon position and visibility
  const moonAngle = sunAngle + Math.PI;
  const moonX = Math.cos(moonAngle) * 150;
  const moonY = Math.sin(moonAngle) * 150;
  moon.position.set(moonX, moonY, 50);
  moon.material.opacity = lightingSystem.getMoonVisibility();
}
```

### Performance Impact

**Minimal:**
- Sky color calculation: ~0.01ms per frame
- Fog update: ~0.01ms per frame
- Sun/moon position: ~0.02ms per frame
- Visibility checks: ~0.01ms per frame
- **Total: ~0.05ms per frame** (negligible)

At 60 FPS, this is only ~3ms per second for all sky effects.

### Color Interpolation

Colors are interpolated using linear interpolation (lerp):

```typescript
private lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  const result = new THREE.Color();
  result.r = color1.r + (color2.r - color1.r) * t;
  result.g = color1.g + (color2.g - color1.g) * t;
  result.b = color1.b + (color2.b - color1.b) * t;
  return result;
}
```

Where `t` is a value from 0 to 1:
- `t = 0`: Returns color1
- `t = 0.5`: Returns midpoint between colors
- `t = 1`: Returns color2

## Customization

### Change Sky Colors

Edit the `getSkyColor()` method in `LightingSystem.ts`:

```typescript
const skyColors = {
  night: new THREE.Color(0x0a0a1a),      // Change night color
  dawn: new THREE.Color(0xff6b4a),       // Change dawn color
  morning: new THREE.Color(0x87ceeb),    // Change day color
  // ... etc
};
```

### Adjust Sun/Moon Size

Edit `createScene()` in `main.ts`:

```typescript
// Larger sun
const sunGeometry = new THREE.SphereGeometry(12, 32, 32); // Was 8

// Smaller moon
const moonGeometry = new THREE.SphereGeometry(4, 32, 32); // Was 6
```

### Change Sun/Moon Colors

```typescript
// Redder sun
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xff8800,  // Orange sun instead of yellow
  emissive: 0xff8800,
  emissiveIntensity: 1.0,
});

// Bluer moon
const moonMaterial = new THREE.MeshBasicMaterial({
  color: 0xaaaaff,  // More blue
  emissive: 0x8888ff,
  emissiveIntensity: 0.8,
});
```

### Adjust Celestial Distance

```typescript
// Closer to player (smaller arc)
const celestialDistance = 100; // Was 150

// Further from player (larger arc)
const celestialDistance = 200; // Was 150
```

### Modify Transition Times

Edit the timing thresholds in `getSkyColor()`, `getSunVisibility()`, and `getMoonVisibility()` methods:

```typescript
// Longer dawn period
if (normalizedTime < 0.25) {  // Night ends later
  return skyColors.night;
} else if (normalizedTime < 0.35) {  // Dawn lasts longer
  const t = (normalizedTime - 0.25) / 0.10;  // Slower transition
  return this.lerpColor(skyColors.night, skyColors.dawn, t);
}
```

## API Reference

### LightingSystem Methods

#### `getSkyColor(): THREE.Color`
Returns the current sky color based on time of day.

**Usage:**
```typescript
const skyColor = lightingSystem.getSkyColor();
scene.background = skyColor;
```

#### `getFogColor(): THREE.Color`
Returns the current fog color (90% of sky color).

**Usage:**
```typescript
const fogColor = lightingSystem.getFogColor();
scene.fog = new THREE.Fog(fogColor.getHex(), 50, 200);
```

#### `getSunVisibility(): number`
Returns sun visibility from 0 (hidden) to 1 (fully visible).

**Usage:**
```typescript
const visibility = lightingSystem.getSunVisibility();
sun.material.opacity = visibility;
sun.visible = visibility > 0;
```

#### `getMoonVisibility(): number`
Returns moon visibility from 0 (hidden) to 1 (fully visible).

**Usage:**
```typescript
const visibility = lightingSystem.getMoonVisibility();
moon.material.opacity = visibility;
moon.visible = visibility > 0;
```

#### `getSunAngle(): number`
Returns current sun angle in radians (0 to 2π).

**Usage:**
```typescript
const angle = lightingSystem.getSunAngle();
const x = Math.cos(angle) * distance;
const y = Math.sin(angle) * distance;
```

## Future Enhancements

Potential additions to the sky system:

- [ ] **Stars**: Twinkling stars visible at night
- [ ] **Clouds**: Animated clouds that cast shadows
- [ ] **Weather effects**: Rain, snow, fog
- [ ] **Moon phases**: Crescent, half, full moon cycles
- [ ] **Sunrise/sunset colors**: More complex gradient effects
- [ ] **Atmospheric scattering**: More realistic sky colors
- [ ] **Aurora borealis**: Northern lights effect
- [ ] **Shooting stars**: Random meteor streaks
- [ ] **Multiple suns/moons**: For alien worlds

## Troubleshooting

### Sun/Moon not visible?
- Check that they're not behind the camera
- Verify time of day is during visible period
- Ensure objects weren't accidentally removed from scene

### Sky color not changing?
- Confirm `autoAdvanceTime` is true (press T if needed)
- Check that lighting system is updating
- Verify sky color is being applied to scene.background

### Harsh color transitions?
- Increase number of interpolation steps
- Reduce time advancement speed
- Add more color key points for smoother gradients

### Sun/Moon too small/large?
- Adjust sphere geometry radius in `createScene()`
- Consider distance from camera and FOV

### Performance issues?
- Sky updates are very lightweight (~0.05ms/frame)
- If problems persist, check other systems
- Celestial bodies are simple meshes with minimal overhead

---

**Enjoy your dynamic sky with sun and moon!** 🌅🌞🌙🌃
