import * as THREE from "three";
import { ChunkManager } from "./ChunkManager";
import { BlockType } from "./blocks";

/**
 * Player physics configuration
 */
export interface PlayerPhysicsConfig {
  gravity: number;
  jumpForce: number;
  moveSpeed: number;
  sprintMultiplier: number;
  playerHeight: number;
  playerWidth: number;
}

/**
 * Default player physics configuration
 */
const DEFAULT_PHYSICS_CONFIG: PlayerPhysicsConfig = {
  gravity: 32.0, // Blocks per second squared
  jumpForce: 10.0, // Initial upward velocity when jumping
  moveSpeed: 4.317, // Minecraft walking speed in blocks/second
  sprintMultiplier: 1.3, // Sprint speed multiplier
  playerHeight: 1.8, // Player height in blocks
  playerWidth: 0.6, // Player width in blocks
};

/**
 * Controls the player with physics-based movement and collision detection
 */
export class PlayerController {
  private camera: THREE.Camera;
  private chunkManager: ChunkManager;
  private config: PlayerPhysicsConfig;

  // Movement state
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = false;
  private canJump: boolean = true;

  // Input state
  private keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  };

  // Mouse look
  private yaw: number = 0;
  private pitch: number = 0;
  private isPointerLocked: boolean = false;

  constructor(
    camera: THREE.Camera,
    chunkManager: ChunkManager,
    config: Partial<PlayerPhysicsConfig> = {}
  ) {
    this.camera = camera;
    this.chunkManager = chunkManager;
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };

    this.setupInputHandlers();
  }

  /**
   * Setup keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // Request pointer lock on click
    document.addEventListener("click", () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });

    // Track pointer lock state
    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
    });

    // Mouse movement for camera rotation
    document.addEventListener("mousemove", (event) => {
      if (!this.isPointerLocked) return;

      const sensitivity = 0.002;
      this.yaw -= event.movementX * sensitivity;
      this.pitch -= event.movementY * sensitivity;

      // Clamp pitch to avoid flipping
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    });

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.keys.w = true;
          break;
        case "a":
          this.keys.a = true;
          break;
        case "s":
          this.keys.s = true;
          break;
        case "d":
          this.keys.d = true;
          break;
        case " ":
          this.keys.space = true;
          break;
        case "shift":
          this.keys.shift = true;
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.keys.w = false;
          break;
        case "a":
          this.keys.a = false;
          break;
        case "s":
          this.keys.s = false;
          break;
        case "d":
          this.keys.d = false;
          break;
        case " ":
          this.keys.space = false;
          break;
        case "shift":
          this.keys.shift = false;
          break;
      }
    });
  }

  /**
   * Update player physics and position
   */
  update(deltaTime: number): void {
    // Apply camera rotation
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.z = 0;
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Handle horizontal movement
    this.updateMovement(deltaTime);

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.config.gravity * deltaTime;
    }

    // Handle jumping
    if (this.keys.space && this.isGrounded && this.canJump) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
      this.canJump = false;
    }

    // Reset jump when space is released
    if (!this.keys.space) {
      this.canJump = true;
    }

    // Terminal velocity (prevent falling too fast)
    this.velocity.y = Math.max(this.velocity.y, -50);

    // Apply velocity with collision detection
    this.applyVelocity(deltaTime);

    // Check if grounded
    this.checkGrounded();
  }

  /**
   * Update horizontal movement based on input
   */
  private updateMovement(deltaTime: number): void {
    // Calculate movement direction
    const direction = new THREE.Vector3();

    if (this.keys.w) direction.z -= 1;
    if (this.keys.s) direction.z += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;

    // Normalize to prevent faster diagonal movement
    if (direction.length() > 0) {
      direction.normalize();
    }

    // Apply rotation to direction (only yaw, not pitch)
    direction.applyEuler(new THREE.Euler(0, this.yaw, 0, "YXZ"));

    // Calculate speed (sprint if shift is held)
    const speed = this.config.moveSpeed * (this.keys.shift ? this.config.sprintMultiplier : 1.0);

    // Set horizontal velocity
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;
  }

  /**
   * Apply velocity with collision detection
   */
  private applyVelocity(deltaTime: number): void {
    const movement = this.velocity.clone().multiplyScalar(deltaTime);

    // Apply X movement with collision detection
    const nextX = this.camera.position.x + movement.x;
    if (!this.checkCollision(nextX, this.camera.position.y, this.camera.position.z)) {
      this.camera.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    // Apply Y movement with collision detection
    const nextY = this.camera.position.y + movement.y;
    if (!this.checkCollision(this.camera.position.x, nextY, this.camera.position.z)) {
      this.camera.position.y = nextY;
    } else {
      if (this.velocity.y < 0) {
        // Hit ground
        this.isGrounded = true;
      }
      this.velocity.y = 0;
    }

    // Apply Z movement with collision detection
    const nextZ = this.camera.position.z + movement.z;
    if (!this.checkCollision(this.camera.position.x, this.camera.position.y, nextZ)) {
      this.camera.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }
  }

  /**
   * Check if player collides with terrain at given position
   */
  private checkCollision(x: number, y: number, z: number): boolean {
    // Check collision at player's feet and head
    const positions = [
      { x, y: y - 0.1, z }, // Feet
      { x, y: y + this.config.playerHeight * 0.5, z }, // Middle
      { x, y: y + this.config.playerHeight - 0.1, z }, // Head
    ];

    for (const pos of positions) {
      if (this.isSolidBlock(pos.x, pos.y, pos.z)) {
        return true;
      }

      // Check player width (bounding box)
      const halfWidth = this.config.playerWidth / 2;
      const corners = [
        { x: pos.x + halfWidth, z: pos.z + halfWidth },
        { x: pos.x + halfWidth, z: pos.z - halfWidth },
        { x: pos.x - halfWidth, z: pos.z + halfWidth },
        { x: pos.x - halfWidth, z: pos.z - halfWidth },
      ];

      for (const corner of corners) {
        if (this.isSolidBlock(corner.x, pos.y, corner.z)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if player is standing on ground
   */
  private checkGrounded(): void {
    // Check slightly below player's feet
    const checkY = this.camera.position.y - 0.15;
    this.isGrounded = this.isSolidBlock(
      this.camera.position.x,
      checkY,
      this.camera.position.z
    );

    // If on ground and falling, stop vertical velocity
    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0;
    }
  }

  /**
   * Check if there's a solid block at the given world position
   */
  private isSolidBlock(x: number, y: number, z: number): boolean {
    const blockType = this.chunkManager.getBlockAt(x, y, z);
    return blockType !== null && blockType !== BlockType.AIR && blockType !== BlockType.WATER;
  }

  /**
   * Set player position (useful for spawning)
   */
  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }

  /**
   * Get player position
   */
  getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  /**
   * Get player velocity
   */
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  /**
   * Check if player is on ground
   */
  isPlayerGrounded(): boolean {
    return this.isGrounded;
  }
}
