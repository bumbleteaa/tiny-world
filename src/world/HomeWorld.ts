// 11 x 11 and 5 x 5 for interior and exterior, respectively. Each tile is 32 x 32 pixels. The world will be made up of multiple rooms, each with its own layout and interactions. The player can move between rooms, interact with items, and progress through the story.

import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";

export default class HomeWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 11; //Override size
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
            //buat decoration manual di sini
            { tx: 2, ty: 2, texture: 'flower', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 2, ty: 2, texture: 'flower', ox: 0.5, oy: 1, offsetY: -5, scale: 0.3 },
            { tx: 10, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -4, scale: 0.3 },
            { tx: 2, ty: 2, texture: 'flower', ox: 0.5, oy: 1, offsetY: -9, scale: 0.3 }

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