import * as THREE from "three";
import { BlockType, BLOCK_CONFIG } from "./blocks";

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

  getBlocks() {
    return this.blocks;
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
  generateMesh(): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexIndex = 0;

    const visited = new Uint8Array(this.blocks.length);

    for (let d = 0; d < 3; d++) {
      const u = (d + 1) % 3;
      const v = (d + 2) % 3;

      const x = [0, 0, 0];
      const q = [0, 0, 0];
      q[d] = 1;

      for (x[d] = -1; x[d] < CHUNK_SIZE;) {
        let n = 0;
        for (x[v] = 0; x[v] < CHUNK_SIZE; x[v]++) {
          for (x[u] = 0; x[u] < CHUNK_SIZE; x[u]++) {
            const block1 = this.getBlock(x[0], x[1], x[2]);
            const block2 = this.getBlock(x[0] + q[0], x[1] + q[1], x[2] + q[2]);

            const transparent1 = block1 === BlockType.AIR || BLOCK_CONFIG[block1].transparent;
            const transparent2 = block2 === BlockType.AIR || BLOCK_CONFIG[block2].transparent;

            if (transparent1 === transparent2) {
              visited[n++] = 0;
              continue;
            }

            visited[n++] = transparent1 ? block2 : block1;
          }
        }

        x[d]++;
        n = 0;

        for (let j = 0; j < CHUNK_SIZE; j++) {
          for (let i = 0; i < CHUNK_SIZE;) {
            const blockType = visited[n] as BlockType;
            if (blockType) {
              let w = 1;
              while (i + w < CHUNK_SIZE && visited[n + w] === blockType) {
                w++;
              }

              let h = 1;
              let done = false;
              while (j + h < CHUNK_SIZE) {
                for (let k = 0; k < w; k++) {
                  if (visited[n + k + h * CHUNK_SIZE] !== blockType) {
                    done = true;
                    break;
                  }
                }
                if (done) {
                  break;
                }
                h++;
              }

              x[u] = i;
              x[v] = j;

              const du = [0, 0, 0];
              du[u] = w;
              const dv = [0, 0, 0];
              dv[v] = h;

              const worldX = this.position.x * CHUNK_SIZE;
              const worldY = this.position.y * CHUNK_SIZE;
              const worldZ = this.position.z * CHUNK_SIZE;

              const v1 = [worldX + x[0], worldY + x[1], worldZ + x[2]];
              const v2 = [worldX + x[0] + du[0], worldY + x[1] + du[1], worldZ + x[2] + du[2]];
              const v3 = [worldX + x[0] + du[0] + dv[0], worldY + x[1] + du[1] + dv[1], worldZ + x[2] + du[2] + dv[2]];
              const v4 = [worldX + x[0] + dv[0], worldY + x[1] + dv[1], worldZ + x[2] + dv[2]];

              const blockConfig = BLOCK_CONFIG[blockType];
              const color = new THREE.Color(blockConfig.color);

              if (blockType !== this.getBlock(x[0], x[1], x[2])) {
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 3);
              } else {
                indices.push(vertexIndex + 2, vertexIndex + 1, vertexIndex);
                indices.push(vertexIndex + 3, vertexIndex + 2, vertexIndex);
              }

              vertices.push(...v1, ...v2, ...v3, ...v4);
              for (let k = 0; k < 4; k++) {
                colors.push(color.r, color.g, color.b);
              }
              vertexIndex += 4;

              for (let l = 0; l < h; l++) {
                for (let k = 0; k < w; k++) {
                  visited[n + k + l * CHUNK_SIZE] = 0;
                }
              }

              i += w;
              n += w;
            } else {
              i++;
              n++;
            }
          }
        }
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

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
