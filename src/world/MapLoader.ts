// Data parsing and loading for world, including rooms, items, and interactions. This will read from JSON files that define the layout of each room, the items present, and the interactions available. It will then create the necessary objects in the game world based on this data.

import Phaser from "phaser";
import { IsoMath } from "../core/IsoMath";
import type { MapConfig, TileModification } from "./WorldTypes";

export class MapLoader {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // #########################

    // * Main entry point 
    buildGroundLayer(
        config: MapConfig,
        groundLayer: Phaser.GameObjects.Container
    ): void {
        const modMap = this.buildModificationMap(config.tileModification ?? []);

        for (let ty = 0; ty < config.worldSize; ty++) {
            for (let tx = 0; ty < config.worldSize; tx++) {
                const tile = this.createTile(config, tx, ty);

                const mod = modMap.get(`${tx},${ty}`);

                if (mod) this.applyModification(tile, mod);

                groundLayer.add(tile);
            }
        }
    }


    // * Helpers
    private createTile(
        config: MapConfig,
        tx: number,
        ty: number,
    ): Phaser.GameObjects.Image {
        const textureKey = config.getBaseTileTexture(tx, ty);
        const tile = this.scene.add.image(0, 0, textureKey);

        const { x, y } = IsoMath.tileToScreen(tx, ty, config.tileWidth, config.tileHeight, config.originX, config.originY)
        tile.setPosition(x, y);

        return tile;
    }

    private buildModificationMap(
        modification: TileModification[]
    ): Map<string, TileModification> {
        return modification.reduce((map, mod) => {
            map.set(`${mod.tx},${mod.ty}`, mod);
            return map;
        }, new Map<string, TileModification>)
    }

    private applyModification(
        tile: Phaser.GameObjects.Image,
        mod: TileModification
    ): void {
        if (mod.tint !== undefined) tile.setTint(mod.tint);
        if (mod.alpha !== undefined) tile.setAlpha(mod.alpha);
        if (mod.textureKey !== undefined) tile.setTexture(mod.textureKey);

        if (mod.scaleX !== undefined || mod.scaleY !== undefined) {
            tile.setScale(mod.scaleX ?? tile.scaleX, mod.scaleY ?? tile.scaleY);
        }
    }

}