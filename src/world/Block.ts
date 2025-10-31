/**
 * Block types in the world
 */
export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  SAND = 4,
  WATER = 5,
}

/**
 * Block properties and colors
 */
export const BlockProperties = {
  [BlockType.AIR]: {
    name: "Air",
    solid: false,
    color: 0x000000,
  },
  [BlockType.GRASS]: {
    name: "Grass",
    solid: true,
    color: 0x7cfc00,
  },
  [BlockType.DIRT]: {
    name: "Dirt",
    solid: true,
    color: 0x8b4513,
  },
  [BlockType.STONE]: {
    name: "Stone",
    solid: true,
    color: 0x808080,
  },
  [BlockType.SAND]: {
    name: "Sand",
    solid: true,
    color: 0xf4a460,
  },
  [BlockType.WATER]: {
    name: "Water",
    solid: false,
    color: 0x1e90ff,
  },
};

/**
 * Check if a block is solid (not air or water)
 */
export function isBlockSolid(blockType: BlockType): boolean {
  return BlockProperties[blockType].solid;
}

/**
 * Get block color
 */
export function getBlockColor(blockType: BlockType): number {
  return BlockProperties[blockType].color;
}
