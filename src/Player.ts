import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { CHUNK_SIZE } from "./Chunk";
import { BlockType } from "./blocks";

/**
 * Player controller with physics and collision detection
 */
export class Player {
  // Player position and dimensions
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  
  // Player bounding box (for collision detection)
  private readonly width = 0.6; // Player width
  private readonly height = 1.8; // Player height (eye level at ~1.6)
  private readonly eyeHeight = 1.6; // Camera height from feet
  
  // Physics properties
  private readonly gravity = 32; // Blocks per second squared
  private readonly jumpForce = 10; // Initial jump velocity
  private readonly moveSpeed = 4.3; // Blocks per second
  private readonly acceleration = 100; // Acceleration when changing direction
  private readonly friction = 10; // Ground friction
  
  // State
  private onGround = false;
  private canJump = false;
  
  // References
  private chunkManager: ChunkManager;
  private camera: THREE.Camera;
  
  constructor(camera: THREE.Camera, chunkManager: ChunkManager, spawnPosition: THREE.Vector3) {
    this.camera = camera;
    this.chunkManager = chunkManager;
    this.position = spawnPosition.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Set camera to player eye position
    this.updateCameraPosition();
  }
  
  /**
   * Update player physics and movement
   */
  update(deltaTime: number, keys: { w: boolean; a: boolean; s: boolean; d: boolean; space: boolean }) {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Calculate intended movement direction from input
    const moveDirection = new THREE.Vector3();
    if (keys.w) moveDirection.z -= 1;
    if (keys.s) moveDirection.z += 1;
    if (keys.a) moveDirection.x -= 1;
    if (keys.d) moveDirection.x += 1;
    
    // Normalize to prevent faster diagonal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }
    
    // Apply camera rotation to movement direction (only yaw, not pitch)
    const yaw = this.camera.rotation.y;
    moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    
    // Calculate target horizontal velocity
    const targetVelocity = moveDirection.multiplyScalar(this.moveSpeed);
    
    // Apply acceleration/friction to horizontal movement
    const currentHorizontalVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
    const targetHorizontalVel = new THREE.Vector2(targetVelocity.x, targetVelocity.z);
    
    if (this.onGround) {
      // On ground: apply friction and acceleration
      const velocityDiff = targetHorizontalVel.clone().sub(currentHorizontalVel);
      const accelAmount = Math.min(this.acceleration * deltaTime, velocityDiff.length());
      
      if (velocityDiff.length() > 0) {
        velocityDiff.normalize().multiplyScalar(accelAmount);
        this.velocity.x += velocityDiff.x;
        this.velocity.z += velocityDiff.y;
      }
      
      // Apply friction when not moving
      if (moveDirection.length() === 0) {
        const frictionAmount = Math.min(this.friction * deltaTime, currentHorizontalVel.length());
        if (currentHorizontalVel.length() > 0) {
          const frictionDir = currentHorizontalVel.clone().normalize().multiplyScalar(-frictionAmount);
          this.velocity.x += frictionDir.x;
          this.velocity.z += frictionDir.y;
        }
      }
    } else {
      // In air: reduced control
      const airControl = 0.3;
      this.velocity.x += targetVelocity.x * airControl * deltaTime;
      this.velocity.z += targetVelocity.z * airControl * deltaTime;
    }
    
    // Handle jumping
    if (keys.space && this.onGround && this.canJump) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
      this.canJump = false;
    }
    
    // Reset jump if space is released
    if (!keys.space) {
      this.canJump = true;
    }
    
    // Apply velocity with collision detection
    this.moveWithCollision(deltaTime);
    
    // Update camera position
    this.updateCameraPosition();
  }
  
  /**
   * Move player with collision detection
   */
  private moveWithCollision(deltaTime: number) {
    // Calculate intended movement
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    
    // Move each axis separately for better collision resolution
    // X axis
    this.position.x += movement.x;
    if (this.checkCollision()) {
      this.position.x -= movement.x;
      this.velocity.x = 0;
    }
    
    // Y axis (vertical)
    this.position.y += movement.y;
    if (this.checkCollision()) {
      if (this.velocity.y < 0) {
        // Hit ground
        this.onGround = true;
      }
      this.position.y -= movement.y;
      this.velocity.y = 0;
    } else {
      this.onGround = false;
    }
    
    // Z axis
    this.position.z += movement.z;
    if (this.checkCollision()) {
      this.position.z -= movement.z;
      this.velocity.z = 0;
    }
    
    // Check if on ground (for friction and jump)
    const groundCheck = this.position.clone();
    groundCheck.y -= 0.01;
    if (!this.onGround) {
      // Check if we're on ground by testing slightly below
      const testPos = this.position.clone();
      testPos.y -= 0.01;
      this.onGround = this.isPositionSolid(testPos);
    }
  }
  
  /**
   * Check if player's bounding box collides with any solid blocks
   */
  private checkCollision(): boolean {
    // Check multiple points around the player's bounding box
    const halfWidth = this.width / 2;
    
    // Check bottom, middle, and top of player
    const checkHeights = [0.1, this.height / 2, this.height - 0.1];
    
    for (const heightOffset of checkHeights) {
      const checkPositions = [
        // Four corners at this height
        new THREE.Vector3(halfWidth, heightOffset, halfWidth),
        new THREE.Vector3(-halfWidth, heightOffset, halfWidth),
        new THREE.Vector3(halfWidth, heightOffset, -halfWidth),
        new THREE.Vector3(-halfWidth, heightOffset, -halfWidth),
        // Center at this height
        new THREE.Vector3(0, heightOffset, 0),
      ];
      
      for (const offset of checkPositions) {
        const checkPos = this.position.clone().add(offset);
        if (this.isPositionSolid(checkPos)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if a world position contains a solid block
   */
  private isPositionSolid(worldPos: THREE.Vector3): boolean {
    const blockPos = {
      x: Math.floor(worldPos.x),
      y: Math.floor(worldPos.y),
      z: Math.floor(worldPos.z),
    };
    
    const blockType = this.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
    
    // Air and water are not solid
    return blockType !== BlockType.AIR && blockType !== BlockType.WATER;
  }
  
  /**
   * Get block type at world coordinates
   */
  private getBlockAt(worldX: number, worldY: number, worldZ: number): BlockType {
    // Convert world coordinates to chunk coordinates
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    
    // Get chunk
    const chunk = this.chunkManager.getChunk({ x: chunkX, y: chunkY, z: chunkZ });
    if (!chunk) {
      // Chunk not loaded, assume air
      return BlockType.AIR;
    }
    
    // Convert to local chunk coordinates
    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    return chunk.getBlock(localX, localY, localZ);
  }
  
  /**
   * Update camera position to match player eye position
   */
  private updateCameraPosition() {
    this.camera.position.copy(this.position);
    this.camera.position.y += this.eyeHeight;
  }
  
  /**
   * Get player's current position
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  /**
   * Check if player is on ground
   */
  isOnGround(): boolean {
    return this.onGround;
  }
  
  /**
   * Find a valid spawn position on land (not in water, not in air)
   */
  static async findSpawnPosition(chunkManager: ChunkManager): Promise<THREE.Vector3> {
    const worldGenerator = chunkManager.getWorldGenerator();
    
    // Search in a spiral pattern around origin for a good spawn location
    const maxSearchRadius = 50;
    
    for (let radius = 0; radius < maxSearchRadius; radius += 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = Math.floor(radius * Math.cos(angle));
        const z = Math.floor(radius * Math.sin(angle));
        
        // Find the surface height at this x, z position
        // Check from high to low to find the first solid block
        for (let y = CHUNK_SIZE * 2; y >= 0; y--) {
          // Ensure chunk is loaded
          const chunkX = Math.floor(x / CHUNK_SIZE);
          const chunkY = Math.floor(y / CHUNK_SIZE);
          const chunkZ = Math.floor(z / CHUNK_SIZE);
          
          const chunk = chunkManager.getChunk({ x: chunkX, y: chunkY, z: chunkZ });
          if (!chunk) {
            // Force load this chunk
            await chunkManager.forceLoadChunk({ x: chunkX, y: chunkY, z: chunkZ });
          }
          
          // Get block at this position
          const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          const localY = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          
          const chunkAtPos = chunkManager.getChunk({ x: chunkX, y: chunkY, z: chunkZ });
          if (!chunkAtPos) continue;
          
          const blockType = chunkAtPos.getBlock(localX, localY, localZ);
          const blockAbove = y + 1 < CHUNK_SIZE * 3 ? 
            chunkManager.getChunk({ x: chunkX, y: Math.floor((y + 1) / CHUNK_SIZE), z: chunkZ })
              ?.getBlock(localX, ((y + 1) % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE, localZ) : BlockType.AIR;
          
          // Found a solid block (not water, not air) with air above
          if (blockType !== BlockType.AIR && 
              blockType !== BlockType.WATER && 
              blockAbove === BlockType.AIR) {
            // Make sure there's enough vertical space (2 blocks)
            const twoBlocksAbove = y + 2 < CHUNK_SIZE * 3 ?
              chunkManager.getChunk({ x: chunkX, y: Math.floor((y + 2) / CHUNK_SIZE), z: chunkZ })
                ?.getBlock(localX, ((y + 2) % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE, localZ) : BlockType.AIR;
            
            if (twoBlocksAbove === BlockType.AIR) {
              // Valid spawn position found! Position player on top of this block
              return new THREE.Vector3(x + 0.5, y + 1, z + 0.5);
            }
          }
        }
      }
    }
    
    // Fallback: spawn at a reasonable height
    console.warn("Could not find ideal spawn position, using fallback");
    return new THREE.Vector3(0.5, CHUNK_SIZE + 5, 0.5);
  }
}
