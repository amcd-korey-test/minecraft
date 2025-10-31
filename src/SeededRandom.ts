/**
 * Seeded random number generator using Linear Congruential Generator (LCG)
 * This ensures deterministic world generation based on seed
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (same as used in glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 31;

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Create a new SeededRandom with a derived seed based on coordinates
   * This allows generating the same random sequence for the same coordinates
   */
  static fromCoordinates(baseSeed: number, x: number, y: number, z: number): SeededRandom {
    // Hash the coordinates with the base seed
    let hash = baseSeed;
    hash = ((hash << 5) - hash + x) | 0;
    hash = ((hash << 5) - hash + y) | 0;
    hash = ((hash << 5) - hash + z) | 0;
    return new SeededRandom(Math.abs(hash));
  }
}
