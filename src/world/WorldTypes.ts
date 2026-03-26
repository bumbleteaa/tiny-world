// Shared types for all world/scene classes

/**
 * Describes where and how to place a decoration sprite on an isometric tile.
 *
 * COORDINATE SYSTEM
 * -----------------
 * The world is a (worldSize × worldSize) grid, 0-indexed.
 * - tx: column index, left→right  (0 to worldSize-1, e.g. 0–12 for a 13×13 world)
 * - ty: row index,    top→bottom  (0 to worldSize-1)
 * - Center of a 13×13 map = { tx: 6, ty: 6 }
 * - tx/ty of exactly worldSize (e.g. 13) is OUT OF BOUNDS — decoration will be silently skipped.
 *
 * ANCHOR / ORIGIN (ox, oy)
 * ------------------------
 * Defines which point of the sprite image "sits" on the tile position.
 * Values are normalized (0.0 = left/top, 1.0 = right/bottom).
 * - ox: 0.5, oy: 1  → horizontally centered, anchored at bottom edge of sprite
 * Use this for trees, NPCs, anything with a visible "base"
 * - ox: 0.5, oy: 0.5 → centered on both axes (good for flat ground decals)
 *
 * PIXEL OFFSET (offsetX, offsetY)
 * --------------------------------
 * Fine-tune position in pixels AFTER the tile anchor is applied.
 * - offsetY: -8  → nudges sprite 8px UP, lifts object above tile surface visually
 * - offsetX      → shifts left (negative) or right (positive) for asymmetric placement
 *
 * SCALE
 * -----
 * Multiplier on the original sprite size.
 * - 0.3–0.4 = small/young tree      (adds depth variation in a cluster)
 * - 0.45–0.6 = medium/mature tree
 * - Mixing scales in a cluster makes the forest feel natural, not stamped.
 */

export type TileNode = {
    tx: number;
    ty: number;
    worldX: number;
    worldY: number;
    base: Phaser.GameObjects.Image;
    occupied: boolean;
    terrain?: string;
    isTroughable: boolean;
};

export type DecorConfig = {
    tx: number;
    ty: number;
    texture: string;
    frame?: string | number;
    ox?: number;         // origin X
    oy?: number;         // origin Y
    offsetX?: number;    // pixel nudge from tile center
    offsetY?: number;
    depthOffset?: number;
    scale?: number;
};

// * Declarative data type for per-tile modification
export interface TileModification {
    tx: number;
    ty: number;
    tint?: number;
    alpha?: number;
    textureKey?: string;
    scaleX?: number;
    scaleY?: number;
}

// * Configuration contract 
export interface MapConfig {
    worldSize: number;
    tileWidth: number;
    tileHeight: number;
    originX: number;
    originY: number;
    getBaseTileTexture: (tx: number, ty: number) => string;
    tileModification: TileModification[];
}