# Minecraft Three.js

A Minecraft-inspired 3D web application built with Three.js, TypeScript, and Bun. This project demonstrates modern web-based 3D graphics rendering with a fast development workflow powered by Bun's bundler and runtime.

## 🎮 Project Description

This project is a web-based 3D application that serves as a foundation for creating Minecraft-style games or visualizations using Three.js. It features a modern TypeScript setup with Bun for ultra-fast builds and hot-reloading during development.

The current implementation includes:
- 3D scene rendering with WebGL
- Basic lighting setup (directional and ambient)
- Animated 3D cube demo
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
│   └── main.ts          # Main application entry point with Three.js setup
├── tools/
│   └── dev.ts           # Development server with hot-reloading
├── dist/                # Build output directory (generated)
├── index.html           # HTML entry point
├── package.json         # Project configuration and dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Key Files

- **`src/main.ts`**: Contains the main Three.js application logic including:
  - Scene setup with camera, lights, and objects
  - Renderer configuration
  - Animation loop
  - Window resize handling

- **`tools/dev.ts`**: Custom development server that:
  - Bundles TypeScript files with Bun
  - Watches for file changes
  - Serves the application with hot-reloading

- **`index.html`**: Minimal HTML template that loads the bundled JavaScript

## 🛠️ Development

### Code Structure

The main application (`src/main.ts`) is organized into several functions:

- `createRenderer()`: Initializes the WebGL renderer with proper pixel ratio and canvas setup
- `createScene()`: Sets up the 3D scene, camera, lights, and objects
- `main()`: Entry point that ties everything together and starts the animation loop

### Customization

To add your own 3D objects or modify the scene:

1. Edit `src/main.ts`
2. Modify the `createScene()` function to add new objects
3. Update the animation loop to add custom animations
4. The dev server will automatically reload your changes

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

- [Three.js Documentation](https://threejs.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

## 🎨 Future Enhancements

Potential features to implement:
- Minecraft-style voxel terrain generation
- Player controls and camera movement
- Block placement and destruction
- Texture loading and materials
- Multiplayer support
- World persistence
- More complex lighting and shadows

---

**Built with ❤️ using Three.js, TypeScript, and Bun**