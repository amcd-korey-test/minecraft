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
}

/**
 * Block properties including visual attributes
 */
export interface BlockProperties {
  type: BlockType;
  name: string;
  color: number;
  transparent: boolean;
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
  },
  [BlockType.GRASS]: {
    type: BlockType.GRASS,
    name: "Grass",
    color: 0x4caf50,
    transparent: false,
  },
  [BlockType.DIRT]: {
    type: BlockType.DIRT,
    name: "Dirt",
    color: 0x8b4513,
    transparent: false,
  },
  [BlockType.STONE]: {
    type: BlockType.STONE,
    name: "Stone",
    color: 0x808080,
    transparent: false,
  },
  [BlockType.BEDROCK]: {
    type: BlockType.BEDROCK,
    name: "Bedrock",
    color: 0x1a1a1a,
    transparent: false,
  },
  [BlockType.SAND]: {
    type: BlockType.SAND,
    name: "Sand",
    color: 0xf4a460,
    transparent: false,
  },
  [BlockType.WATER]: {
    type: BlockType.WATER,
    name: "Water",
    color: 0x1e90ff,
    transparent: true,
  },
};
