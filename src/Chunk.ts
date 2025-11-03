import * as THREE from "three";
import { BlockType, BLOCK_CONFIG } from "./blocks";
import { LightingManager } from "./LightingManager";

/**
 * Position identifier for a chunk in the world
 */
export interface ChunkPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Configuration for chunk size
 */
export const CHUNK_SIZE = 16; // 16x16x16 blocks per chunk

/**
 * Represents a single chunk of the world containing blocks
 */
export class Chunk {
  public readonly position: ChunkPosition;
  private blocks: Uint8Array; // Stores block types as 8-bit integers
  private mesh: THREE.Mesh | null = null;

  constructor(position: ChunkPosition) {
    this.position = position;
    // Initialize block array (flattened 3D array)
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
  }

  /**
   * Get block type at local chunk coordinates (0 to CHUNK_SIZE-1)
   */
  getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR;
    }
    const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
    return this.blocks[index];
  }

  /**
   * Set block type at local chunk coordinates
   */
  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
    this.blocks[index] = type;
  }

  /**
   * Fill entire chunk with a single block type
   */
  fill(type: BlockType): void {
    this.blocks.fill(type);
  }

  /**
   * Generate mesh for this chunk using greedy meshing for optimization
   */
  generateMesh(lightingManager?: LightingManager): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexIndex = 0;

    // Iterate through all blocks in the chunk
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const blockType = this.getBlock(x, y, z);

          // Skip air blocks
          if (blockType === BlockType.AIR) continue;

          const blockConfig = BLOCK_CONFIG[blockType];
          const color = new THREE.Color(blockConfig.color);

          // World position of this block
          const worldX = this.position.x * CHUNK_SIZE + x;
          const worldY = this.position.y * CHUNK_SIZE + y;
          const worldZ = this.position.z * CHUNK_SIZE + z;

          // Check each face and only render if adjacent block is air or transparent
          const faces = [
            // Front face (+Z)
            {
              check: () => this.shouldRenderFace(x, y, z + 1),
              normal: new THREE.Vector3(0, 0, 1),
              vertices: [
                [worldX, worldY, worldZ + 1],
                [worldX + 1, worldY, worldZ + 1],
                [worldX + 1, worldY + 1, worldZ + 1],
                [worldX, worldY + 1, worldZ + 1],
              ],
            },
            // Back face (-Z)
            {
              check: () => this.shouldRenderFace(x, y, z - 1),
              normal: new THREE.Vector3(0, 0, -1),
              vertices: [
                [worldX + 1, worldY, worldZ],
                [worldX, worldY, worldZ],
                [worldX, worldY + 1, worldZ],
                [worldX + 1, worldY + 1, worldZ],
              ],
            },
            // Right face (+X)
            {
              check: () => this.shouldRenderFace(x + 1, y, z),
              normal: new THREE.Vector3(1, 0, 0),
              vertices: [
                [worldX + 1, worldY, worldZ + 1],
                [worldX + 1, worldY, worldZ],
                [worldX + 1, worldY + 1, worldZ],
                [worldX + 1, worldY + 1, worldZ + 1],
              ],
            },
            // Left face (-X)
            {
              check: () => this.shouldRenderFace(x - 1, y, z),
              normal: new THREE.Vector3(-1, 0, 0),
              vertices: [
                [worldX, worldY, worldZ],
                [worldX, worldY, worldZ + 1],
                [worldX, worldY + 1, worldZ + 1],
                [worldX, worldY + 1, worldZ],
              ],
            },
            // Top face (+Y)
            {
              check: () => this.shouldRenderFace(x, y + 1, z),
              normal: new THREE.Vector3(0, 1, 0),
              vertices: [
                [worldX, worldY + 1, worldZ + 1],
                [worldX + 1, worldY + 1, worldZ + 1],
                [worldX + 1, worldY + 1, worldZ],
                [worldX, worldY + 1, worldZ],
              ],
            },
            // Bottom face (-Y)
            {
              check: () => this.shouldRenderFace(x, y - 1, z),
              normal: new THREE.Vector3(0, -1, 0),
              vertices: [
                [worldX, worldY, worldZ],
                [worldX + 1, worldY, worldZ],
                [worldX + 1, worldY, worldZ + 1],
                [worldX, worldY, worldZ + 1],
              ],
            },
          ];

          // Render each face if needed
          for (const face of faces) {
            if (face.check()) {
              // Calculate lighting for this face
              const faceLighting = lightingManager
                ? this.calculateFaceLighting(face.vertices, face.normal, lightingManager)
                : [1, 1, 1, 1]; // Default full brightness if no lighting manager

              // Add vertices for this face
              for (let i = 0; i < face.vertices.length; i++) {
                const vertex = face.vertices[i];
                vertices.push(vertex[0], vertex[1], vertex[2]);

                // Apply lighting to color
                const brightness = faceLighting[i];
                colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
              }

              // Add indices for two triangles (quad)
              indices.push(
                vertexIndex,
                vertexIndex + 1,
                vertexIndex + 2,
                vertexIndex,
                vertexIndex + 2,
                vertexIndex + 3
              );

              vertexIndex += 4;
            }
          }
        }
      }
    }

    // Set geometry attributes
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material with vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    return this.mesh;
  }

  /**
   * Check if a face should be rendered (adjacent block is air or transparent)
   */
  private shouldRenderFace(x: number, y: number, z: number): boolean {
    const adjacentBlock = this.getBlock(x, y, z);
    return adjacentBlock === BlockType.AIR || BLOCK_CONFIG[adjacentBlock].transparent;
  }

  /**
   * Calculate lighting values for each vertex of a face
   * Returns an array of 4 brightness values (one per vertex)
   */
  private calculateFaceLighting(
    vertices: number[][],
    normal: THREE.Vector3,
    lightingManager: LightingManager
  ): number[] {
    const lighting: number[] = [];

    // Calculate lighting for each vertex
    for (const vertex of vertices) {
      const position = new THREE.Vector3(vertex[0], vertex[1], vertex[2]);

      // Offset position slightly towards the normal to avoid self-shadowing
      position.add(normal.clone().multiplyScalar(0.01));

      const brightness = lightingManager.calculateLightingAtPosition(position, normal);
      lighting.push(brightness);
    }

    return lighting;
  }

  /**
   * Get the mesh for this chunk (if generated)
   */
  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  /**
   * Dispose of resources used by this chunk
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }

  /**
   * Create a unique key for this chunk position
   */
  static getKey(position: ChunkPosition): string {
    return `${position.x},${position.y},${position.z}`;
  }
}
