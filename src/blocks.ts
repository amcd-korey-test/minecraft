/**
 * Block types available in the world
 */
export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  BEDROCK = 4,
  SAND = 5,
  WATER = 6,
  GLOWSTONE = 7, // Light-emitting block (for future torch/light source support)
}

/**
 * Block properties including visual attributes
 */
export interface BlockProperties {
  type: BlockType;
  name: string;
  color: number;
  transparent: boolean;
  emitsLight: boolean; // Whether this block emits light (for future use)
  lightLevel: number; // Light emission level (0-15, Minecraft style)
}

/**
 * Configuration for block types
 */
export const BLOCK_CONFIG: Record<BlockType, BlockProperties> = {
  [BlockType.AIR]: {
    type: BlockType.AIR,
    name: "Air",
    color: 0x000000,
    transparent: true,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.GRASS]: {
    type: BlockType.GRASS,
    name: "Grass",
    color: 0x4caf50,
    transparent: false,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.DIRT]: {
    type: BlockType.DIRT,
    name: "Dirt",
    color: 0x8b4513,
    transparent: false,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.STONE]: {
    type: BlockType.STONE,
    name: "Stone",
    color: 0x808080,
    transparent: false,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.BEDROCK]: {
    type: BlockType.BEDROCK,
    name: "Bedrock",
    color: 0x1a1a1a,
    transparent: false,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.SAND]: {
    type: BlockType.SAND,
    name: "Sand",
    color: 0xf4a460,
    transparent: false,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.WATER]: {
    type: BlockType.WATER,
    name: "Water",
    color: 0x1e90ff,
    transparent: true,
    emitsLight: false,
    lightLevel: 0,
  },
  [BlockType.GLOWSTONE]: {
    type: BlockType.GLOWSTONE,
    name: "Glowstone",
    color: 0xffff99, // Pale yellow
    transparent: false,
    emitsLight: true,
    lightLevel: 15, // Maximum light level (like Minecraft)
  },
};
