// specific 13 x 13 meadow and trees, outdoor experience and this is the player starting point. The player can explore the meadow, interact with trees and other natural elements, and find hidden items or clues that will help them progress through the story. The meadow will have a peaceful and serene atmosphere, with gentle music and ambient sounds to enhance the experience. The player can also encounter friendly animals or characters in the meadow who can provide information or assistance on their journey.

import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";

const POND_TILES = new Set([
    '12,12', '12,11', '11,12', '11,11', '10,12', '10,11', '10,10', '11,10', '12,10', '12,9', '11,9', '12,8', '12,7', '9,12'
]);

const BORDER_TILES = new Set([
    '8,12', '8,11', '9,11', '9,10', '9,9', '10,9', '10,8', '11,8', '11,7', '11,6', '12,6'
])

export default class MeadowWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 13; //Override size
    }

    //asset prelaoder
    preload(): void {
        this.load.image('tile', 'assets/tile_023.png');
        this.load.image('water', 'assets/tile_104.png');
        this.load.image('dirt', 'assets/tile_020.png');
        this.load.image('flower', 'assets/tile_047.png');
        this.load.image('tree', 'assets/tile_116.png');
        this.load.image('branchwood-horizontal', 'assets/tile_050.png');
        this.load.image('branchwood-vertical', 'assets/tile_052.png');
        this.load.image('stone', 'assets/tile_067.png');
        this.load.image('water-plant', 'assets/tile_043.png');
        this.load.image('riverside-flower', 'assets/tile_044.png');
        this.load.image('forest-flower', 'assets/tile_041.png');
        this.load.image('fern', 'assets/tile_043.png');
        this.load.image('lonely-tree', 'assets/tile_115.png');


        //add some in the future

    }

    create(): void {
        super.create();

        //world-spesific setup here
    }

    // ############################

    protected getBaseTileTexture(tx: number, ty: number): string {
        const key = `${tx},${ty}`;
        if (POND_TILES.has(key)) return 'water';
        if (BORDER_TILES.has(key)) return 'dirt';
        return 'tile';
    }

    protected onTileCreated(node: TileNode): void {
        if (POND_TILES.has(`${node.tx},${node.ty}`)) {
            node.occupied = true;
            node.terrain = 'water';
        } else if (BORDER_TILES.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'dirt'
        }
        else {
            node.base.setTint(0x5a8a3c)
        }
    }

    protected buildBaseDecorations(): void {
        const placement: DecorConfig[] = [
            // * Semua dekorasi tentang pohon
            // * koordinat x dan y (12.12)
            //Gugusan pohon kiri atas
            { tx: 2, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 3, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: 6, scale: 0.55 },
            { tx: 2, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 2, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 3, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 4, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -4, scale: 0.3 },
            { tx: 3, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 4, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 2, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 3, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 2, ty: 6, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.2 },
            { tx: 8, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 7, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 6, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -6, scale: 0.5 },
            { tx: 4, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 5, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 5, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 6, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.32 },
            { tx: 7, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: 0, scale: 0.5 },

            // * Forest ornament
            { tx: 5, ty: 3, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -5, scale: 0.35 },
            { tx: 5, ty: 3, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: 5, scale: 0.5 },
            { tx: 2, ty: 4, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: 4, scale: 0.35 },
            { tx: 2, ty: 4, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -1, scale: 0.5 },
            { tx: 2, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.5 },
            { tx: 2, ty: 5, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 5, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 4, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -3, scale: 0.3 },
            { tx: 7, ty: 2, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -1, scale: 0.35 },
            { tx: 7, ty: 2, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: 8, scale: 0.5 },
            { tx: 7, ty: 3, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -4, scale: 0.5 },


            //Pohon utama di tengah
            //{ tx: 8, ty: 8, texture: 'lonely-tree', ox: 0.5, oy: 1, offsetY: -4, scale: 0.5 },

            // * Meadow Flower
            // Random placement

            //Cluster 1
            { tx: 4, ty: 8, texture: 'flower', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 5, ty: 8, texture: 'flower', ox: 0.5, oy: 1, offsetY: -4, scale: 0.2 },
            { tx: 3, ty: 8, texture: 'flower', ox: 0.5, oy: 1, offsetY: -1, scale: 0.3 },

            //Cluster 2
            { tx: 3, ty: 12, texture: 'flower', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 5, ty: 12, texture: 'flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.3 },
            { tx: 2, ty: 11, texture: 'flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.3 },
            { tx: 6, ty: 10, texture: 'flower', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },

            //Cluster 3
            { tx: 10, ty: 4, texture: 'flower', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 11, ty: 3, texture: 'flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.3 },
            { tx: 9, ty: 4, texture: 'flower', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 8, ty: 6, texture: 'flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.3 },


            // * Ornamen Kolam
            { tx: 10, ty: 12, texture: 'stone', ox: 0.5, oy: 1, offsetY: 0, scale: 0.8 },
            { tx: 10, ty: 11, texture: 'stone', ox: 0.5, oy: 1, offsetY: 4, scale: 0.7 },
            { tx: 9, ty: 12, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.7 },
            { tx: 10, ty: 9, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.7 },
            { tx: 10, ty: 8, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 8, scale: 0.7 },
            { tx: 11, ty: 8, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 8, scale: 0.7 },
            { tx: 10, ty: 11, texture: 'water-plant', ox: 0.5, oy: 1, offsetY: 6, scale: 0.6 },
            { tx: 12, ty: 8, texture: 'fern', ox: 0.5, oy: 1, offsetY: 6, scale: 1 },
            { tx: 12, ty: 9, texture: 'fern', ox: 0.5, oy: 1, offsetY: 6, scale: 0.8 },
            { tx: 12, ty: 7, texture: 'stone', ox: 0.5, oy: 1, offsetY: 4, scale: 1 },
            { tx: 11, ty: 11, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: -3, scale: 0.7 },

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