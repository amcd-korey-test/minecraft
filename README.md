# Minecraft Three.js

A Minecraft-inspired 3D web application built with Three.js, TypeScript, and Bun. This project demonstrates modern web-based 3D graphics rendering with a fast development workflow powered by Bun's bundler and runtime.

## 🎮 Project Description

This project is a web-based 3D application that serves as a foundation for creating Minecraft-style games or visualizations using Three.js. It features a modern TypeScript setup with Bun for ultra-fast builds and hot-reloading during development.

The current implementation includes:
- **Dynamic Lighting System** with real-time shadow casting
- Procedural voxel terrain generation (Minecraft-style)
- Chunk-based world management with LOD
- First-person camera controls (WASD + mouse)
- 3D scene rendering with WebGL
- Responsive canvas that adapts to window resizing
- Modern development workflow with hot module reloading

## 📋 Requirements

Before you begin, ensure you have the following installed:

- **Bun** >= 1.1.0 ([Installation guide](https://bun.sh/docs/installation))
- **Node.js** (optional, for compatibility) >= 18.0.0
- A modern web browser with WebGL support

## 📦 Dependencies

This project uses the following dependencies:

### Core Dependencies
- **Three.js** (^0.170.0) - JavaScript 3D library for WebGL-based graphics

### Development Tools
- **Bun** - JavaScript runtime and bundler
- **TypeScript** - Type-safe JavaScript with ES2022 target

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd minecraft-threejs
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

   > **Note:** If you don't have Bun installed, install it first:
   > ```bash
   > curl -fsSL https://bun.sh/install | bash
   > ```

## 🎯 Getting Started

### Development Mode

Run the development server with hot-reloading:

```bash
bun run dev
```

This will:
- Start a development server at `http://localhost:5173`
- Watch for file changes and automatically rebuild
- Provide inline source maps for debugging

Open your browser and navigate to `http://localhost:5173` to see the application in action.

### Production Build

Create an optimized production build:

```bash
bun run build
```

This will:
- Bundle your code with minification
- Output the built files to the `./dist` directory
- Optimize for browser performance

### Serving the Production Build

To serve the production build locally, you can use any static file server:

```bash
bun serve dist
```

Or use Python's built-in server:

```bash
python -m http.server 8000 --directory .
```

## 📁 Project Structure

```
minecraft-threejs/
├── src/
│   ├── main.ts              # Main application entry point
│   ├── LightingManager.ts   # Dynamic lighting and shadow system
│   ├── ChunkManager.ts      # Chunk loading/unloading management
│   ├── Chunk.ts             # Individual chunk with mesh generation
│   ├── WorldGenerator.ts    # Procedural terrain generation
│   ├── blocks.ts            # Block type definitions
│   ├── SeededRandom.ts      # Seeded random number generator
│   └── index.html           # HTML entry point
├── examples/
│   └── adding-torch-light.ts # Example: Adding point light sources
├── dist/                    # Build output directory (generated)
├── package.json             # Project configuration and dependencies
├── tsconfig.json            # TypeScript configuration
├── README.md                # This file
├── LIGHTING_SYSTEM.md       # Detailed lighting system documentation
└── WORLD_GENERATION.md      # World generation documentation
```

### Key Files

- **`src/main.ts`**: Main application entry point:
  - Scene setup with camera and lights
  - Renderer configuration
  - Animation loop with dynamic sun movement
  - Player controls (WASD + mouse)
  - Lighting system integration

- **`src/LightingManager.ts`**: Dynamic lighting system:
  - Calculates per-vertex lighting
  - Handles directional (sun) and point lights (torches)
  - Shadow casting via raycasting
  - Extensible for future light sources

- **`src/ChunkManager.ts`**: Manages world chunks:
  - Loads/unloads chunks based on player position
  - Integrates with lighting system
  - Handles mesh regeneration

- **`src/Chunk.ts`**: Individual chunk implementation:
  - 16x16x16 block storage
  - Mesh generation with lighting
  - Face culling optimization

- **`src/WorldGenerator.ts`**: Procedural terrain:
  - Seeded noise-based generation
  - Multiple biomes (grass, sand, water, stone)
  - Configurable terrain parameters

- **`src/blocks.ts`**: Block definitions and properties
  - Block types (grass, stone, water, glowstone, etc.)
  - Visual properties (color, transparency)
  - Light emission properties

## 🛠️ Development

### Code Structure

The main application is organized into modular components:

- **Rendering**: `main.ts` handles scene setup and animation loop
- **Lighting**: `LightingManager.ts` calculates dynamic lighting and shadows
- **World**: `ChunkManager.ts` and `WorldGenerator.ts` handle terrain
- **Blocks**: `Chunk.ts` and `blocks.ts` define block behavior

### Key Features

#### 🌟 Dynamic Lighting System
- **Real-time shadows**: Terrain casts shadows based on sun position
- **Moving sun**: Demonstrates dynamic lighting with rotating sun
- **Point light support**: Add torches, lamps, or glowing blocks
- **Per-vertex lighting**: Efficient lighting calculation baked into vertex colors

See `LIGHTING_SYSTEM.md` for detailed documentation.

#### 🌍 Procedural World Generation
- **Infinite terrain**: Chunks load/unload as player moves
- **Seeded generation**: Reproducible worlds from seeds
- **Multiple biomes**: Grass, sand, water, stone, bedrock
- **Configurable**: Adjust terrain scale, height, sea level

See `WORLD_GENERATION.md` for detailed documentation.

#### 🎮 Player Controls
- **Movement**: WASD keys to move, Space/Shift for up/down
- **Camera**: Mouse to look around (click to lock pointer)
- **Free flight**: Explore the world in creative mode

### Customization

#### Adding a Torch/Light Source

```typescript
// See examples/adding-torch-light.ts for complete examples

// Add a torch at position
lightingManager.addLightSource('torch-1', {
  position: new THREE.Vector3(10, 5, 10),
  intensity: 0.8,
  range: 10,
  color: new THREE.Color(1.0, 0.6, 0.2),
  type: 'point'
});

// Regenerate chunks to show lighting
chunkManager.regenerateAllChunkMeshes();
```

#### Modifying Terrain Generation

```typescript
// In main.ts, adjust WorldGenerator config
const worldGenerator = new WorldGenerator({
  seed: 12345,
  seaLevel: 5,        // Water level
  terrainScale: 0.05,  // Frequency of hills
  terrainHeight: 11    // Max height variation
});
```

#### Adding New Block Types

```typescript
// In blocks.ts, add to BlockType enum and BLOCK_CONFIG
export enum BlockType {
  // ... existing blocks
  TORCH = 8,
}

export const BLOCK_CONFIG: Record<BlockType, BlockProperties> = {
  // ... existing blocks
  [BlockType.TORCH]: {
    type: BlockType.TORCH,
    name: 'Torch',
    color: 0xffaa00,
    transparent: false,
    emitsLight: true,
    lightLevel: 14
  }
};
```

### TypeScript Configuration

The project uses strict TypeScript settings for better type safety:
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- DOM types included for browser APIs

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test your changes**
   ```bash
   bun run dev
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add some amazing feature"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure and naming conventions
- Ensure your code passes TypeScript type checking
- Test your changes in both development and production builds

## 🐛 Troubleshooting

### Bun not found
If you get a "command not found" error for Bun, make sure it's installed and in your PATH:
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
```

### Port already in use
If port 5173 is already in use, you can specify a different port:
```bash
PORT=3000 bun run dev
```

### TypeScript errors
Make sure your IDE is using the workspace TypeScript version and has loaded the type definitions from `node_modules/@types`.

## 📄 License

This project does not currently specify a license. Please contact the repository owner for licensing information before using this code in your own projects.

## 🔗 Resources

### Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

### Project Documentation
- `LIGHTING_SYSTEM.md` - Comprehensive guide to the dynamic lighting system
- `WORLD_GENERATION.md` - World generation and terrain details
- `examples/adding-torch-light.ts` - Example code for adding light sources

## 🎨 Future Enhancements

Potential features to implement:
- ✅ ~~Minecraft-style voxel terrain generation~~ (Implemented)
- ✅ ~~Player controls and camera movement~~ (Implemented)
- ✅ ~~Dynamic lighting and shadows~~ (Implemented)
- Block placement and destruction
- Texture loading and materials (currently using solid colors)
- Multiplayer support
- World persistence (save/load worlds)
- Day/night cycle with adjustable speed
- Biome-specific block generation
- Cave systems and underground structures
- Ambient occlusion for corner darkening
- Water physics and transparency

---

**Built with ❤️ using Three.js, TypeScript, and Bun**