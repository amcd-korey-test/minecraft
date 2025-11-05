# Player Controller Implementation

This document describes the player controller implementation for the Minecraft game.

## Features Implemented

### 1. Movement Controls
- **WASD Keys**: Forward, backward, left, and right movement
- **Mouse**: Look around (first-person camera control with yaw and pitch)
- **Space Bar**: Jump when grounded
- **Shift Key**: Sprint (1.3x speed multiplier)

### 2. Physics System
- **Gravity**: 32 blocks/second² pulling player down
- **Jump Force**: 10 blocks/second initial upward velocity
- **Terminal Velocity**: Capped at -50 blocks/second (prevents falling too fast)
- **Collision Detection**: 
  - Bounding box collision with player dimensions (1.8 blocks tall, 0.6 blocks wide)
  - Checks at multiple points (feet, middle, head)
  - Checks all four corners of player's bounding box
  - Prevents walking through solid blocks
- **Terrain Support**: 
  - Ground detection prevents falling through terrain
  - Proper landing physics (velocity reset on ground contact)

### 3. Spawn Initialization
- **Smart Spawn Location**: 
  - Searches in spiral pattern from origin
  - Finds land above sea level (not in water)
  - Places player standing on solid ground (not underground, not floating)
  - Player height properly positioned (1.8 blocks above terrain)
- **Chunk Loading**: Chunks are pre-loaded around spawn location before player spawns

## Implementation Details

### PlayerController Class (`src/PlayerController.ts`)
Main class that handles all player movement, physics, and input:
- `update(deltaTime)`: Main update loop called every frame
- `checkCollision()`: Comprehensive collision detection
- `checkGrounded()`: Determines if player is standing on ground
- `isSolidBlock()`: Queries ChunkManager for block data

### ChunkManager Enhancement (`src/ChunkManager.ts`)
Added method for collision detection:
- `getBlockAt(x, y, z)`: Returns block type at world coordinates

### WorldGenerator Enhancement (`src/WorldGenerator.ts`)
Added spawn location finder:
- `findSpawnLocation()`: Finds suitable land spawn point
- `getTerrainHeightAt()`: Public method to query terrain height

### Main Game Loop (`src/main.ts`)
Updated to use PlayerController:
- Removed old `setupControls()` function
- Integrated `PlayerController` initialization
- Added spawn location finding and player positioning
- Updated UI to show velocity and grounded state

## Controls

- **W**: Move forward
- **S**: Move backward
- **A**: Strafe left
- **D**: Strafe right
- **Space**: Jump (only when grounded)
- **Shift**: Sprint (hold while moving)
- **Mouse**: Look around (requires pointer lock - click to activate)
- **ESC**: Release mouse pointer lock

## Physics Configuration

Default physics values (configurable via `PlayerPhysicsConfig`):
```typescript
{
  gravity: 32.0,              // blocks/second²
  jumpForce: 10.0,            // blocks/second
  moveSpeed: 4.317,           // blocks/second (Minecraft walking speed)
  sprintMultiplier: 1.3,      // Sprint speed multiplier
  playerHeight: 1.8,          // blocks
  playerWidth: 0.6,           // blocks
}
```

## UI Display

The in-game UI now shows:
- Player position (X, Y, Z)
- Player velocity (X, Y, Z)
- Grounded status (Yes/No)
- Current chunk coordinates
- Number of loaded chunks
- World seed

## Technical Notes

1. **Collision Detection**: Uses AABB (Axis-Aligned Bounding Box) collision with sampling at multiple points to ensure accurate collision with terrain.

2. **Movement**: Horizontal movement is independent of vertical movement. The player can control horizontal direction while falling/jumping.

3. **Input Handling**: Uses pointer lock API for mouse control, providing immersive first-person controls.

4. **Performance**: Collision checks only query loaded chunks, making it efficient even with large worlds.

5. **Spawn Safety**: The spawn finder ensures players always start on solid, dry land above sea level.
