import * as THREE from "three";
import { BlockType, isBlockSolid, getBlockColor } from "./Block";

/**
 * Chunk configuration
 */
export const CHUNK_SIZE = 32; // 32x32x32 blocks per chunk
export const CHUNK_HEIGHT = 64; // Height of the chunk

/**
 * Represents a chunk of blocks in the world
 */
export class Chunk {
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public position: THREE.Vector3;
  public isGenerated: boolean = false;
  public isDirty: boolean = true;

  constructor(public chunkX: number, public chunkZ: number) {
    // Store blocks in a flat array (x + z * SIZE + y * SIZE * SIZE)
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.position = new THREE.Vector3(
      chunkX * CHUNK_SIZE,
      0,
      chunkZ * CHUNK_SIZE
    );
  }

  /**
   * Get block at local chunk coordinates
   */
  getBlock(x: number, y: number, z: number): BlockType {
    if (
      x < 0 || x >= CHUNK_SIZE ||
      y < 0 || y >= CHUNK_HEIGHT ||
      z < 0 || z >= CHUNK_SIZE
    ) {
      return BlockType.AIR;
    }
    return this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
  }

  /**
   * Set block at local chunk coordinates
   */
  setBlock(x: number, y: number, z: number, blockType: BlockType): void {
    if (
      x < 0 || x >= CHUNK_SIZE ||
      y < 0 || y >= CHUNK_HEIGHT ||
      z < 0 || z >= CHUNK_SIZE
    ) {
      return;
    }
    this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = blockType;
    this.isDirty = true;
  }

  /**
   * Generate mesh for this chunk using greedy meshing
   */
  generateMesh(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    const color = new THREE.Color();

    // Iterate through all blocks
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const blockType = this.getBlock(x, y, z);
          
          if (!isBlockSolid(blockType)) continue;

          const blockColor = getBlockColor(blockType);
          color.setHex(blockColor);

          // Check each face
          const faces = [
            { dir: [0, 1, 0], corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]] }, // Top
            { dir: [0, -1, 0], corners: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]] }, // Bottom
            { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] }, // Right
            { dir: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] }, // Left
            { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }, // Front
            { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }, // Back
          ];

          for (const face of faces) {
            const [dx, dy, dz] = face.dir;
            const neighborBlock = this.getBlock(x + dx, y + dy, z + dz);

            // Only render face if neighbor is not solid
            if (!isBlockSolid(neighborBlock)) {
              const startVertex = vertexCount;

              // Add vertices for this face
              for (const corner of face.corners) {
                vertices.push(
                  x + corner[0],
                  y + corner[1],
                  z + corner[2]
                );
                colors.push(color.r, color.g, color.b);
                vertexCount++;
              }

              // Add indices for two triangles
              indices.push(
                startVertex, startVertex + 1, startVertex + 2,
                startVertex, startVertex + 2, startVertex + 3
              );
            }
          }
        }
      }
    }

    // Set geometry attributes
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material and mesh
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);

    // Clean up old mesh
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }

    this.mesh = mesh;
    this.isDirty = false;
    return mesh;
  }

  /**
   * Dispose of chunk resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }

  /**
   * Get chunk key for storage
   */
  static getKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }
}
