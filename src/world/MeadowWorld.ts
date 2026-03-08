// specific 13 x 13 meadow and trees, outdoor experience and this is the player starting point. The player can explore the meadow, interact with trees and other natural elements, and find hidden items or clues that will help them progress through the story. The meadow will have a peaceful and serene atmosphere, with gentle music and ambient sounds to enhance the experience. The player can also encounter friendly animals or characters in the meadow who can provide information or assistance on their journey.

import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";

export default class MeadowWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 13; //Override size
    }

    //asset prelaoder
    preload(): void {
        this.load.image('tile', 'assets/tile_024.png');
        this.load.image('flower', 'assets/tile_047.png');
        this.load.image('tree', 'assets/tile_116.png')
        this.load.image('branchwood', 'assets/tile_050.png')

        //add some in the future

    }

    create(): void {
        super.create();

        //world-spesific setup here
    }

    // ############################

    protected getBaseTileTexture(_tx: number, _ty: number): string {
        return 'tile';
    }

    protected onTileCreated(node: TileNode): void {
        node.base.setTint(0x5a8a3c)
    }

    protected buildBaseDecorations(): void {
        const placement: DecorConfig[] = [
            { tx: 2, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 3, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 4, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 5, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 5, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 4, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 2, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 3, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
        ];

        placement.forEach(
            config => {
                const decoration = this.placeDecoration(config);
                if (decoration) {
                    this.decorLayer.add(decoration);
                    decoration.setDepth(decoration.y);
                }
            }
        );

    }

    private isBorderTile(tx: number, ty: number): boolean {
        return (
            tx === 0 || ty === 0 || tx === this.worldSize - 1 || ty === this.worldSize - 1
        );
    }

}