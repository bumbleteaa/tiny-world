// 11 x 11 and 5 x 5 for interior and exterior, respectively. Each tile is 32 x 32 pixels. The world will be made up of multiple rooms, each with its own layout and interactions. The player can move between rooms, interact with items, and progress through the story.

import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";

const FARM_TILES = new Set([
    '9,5', '8,5', '7,5', '9,4', '8,4', '7,4', '7,3', '8,3', '9,3'
]);
const FLOWER_BASE = new Set([
    '3,5', '4,5'
]);
const NATURAL_FENCE = new Set([
    '0,0', '1,0', '2,0', '5,0', '6,0', '7,0', '8,0', '9,0', '10,0',
    '0,9', '1,9', '2,9', '3,9', '4,9', '5,9', '6,9', '7,9', '8,9', '9,9', '10,9'
]);
const PAVE_TILES_1 = new Set([
    '0,7', '1,8', '2,7', '3,8', '4,7', '5,8', '6,7', '7,8', '8,7', '9,8', '10,7', '5,6', '5,5'
]);
const PAVE_TILES_2 = new Set([
    '0,8', '1,7', '2,8', '3,7', '4,8', '5,7', '6,8', '7,7', '8,8', '9,7', '10,8'
]);

export default class HomeWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 11; //Override size
    }

    //assets prelaoder
    preload(): void {
        this.load.image('tile', 'assets/tile_037.png');
        this.load.image('flower', 'assets/tile_041.png');
        this.load.image('flower-base', 'assets/tile_035.png');
        this.load.image('tree', 'assets/tile_116.png');
        this.load.image('cherry-tree', 'assets/cherry_tree.png');
        this.load.image('flower-bed-1', 'assets/flower_bed_01.png');
        this.load.image('house', 'assets/house.png');
        this.load.image('farm-tiles', 'assets/tile_025.png');
        this.load.image('natural-fence', 'assets/tile_036.png');
        this.load.image('fence-h', 'assets/fence_h.png');
        this.load.image('fence-v', 'assets/fence_v.png');
        this.load.image('pave-tiles-1', 'assets/pave_tiles_1.png');
        this.load.image('pave-tiles-2', 'assets/pave_tiles_2.png');

        //add some in the future

    }

    create(): void {
        super.create();

        //world-spesific setup here
    }

    // ############################

    protected getBaseTileTexture(tx: number, ty: number): string {
        const key = `${tx},${ty}`;
        if (FARM_TILES.has(key)) return 'farm-tiles';
        if (FLOWER_BASE.has(key)) return 'flower-base';
        if (NATURAL_FENCE.has(key)) return 'natural-fence';
        if (PAVE_TILES_1.has(key)) return 'pave-tiles-1';
        if (PAVE_TILES_2.has(key)) return 'pave-tiles-2';
        return 'tile';
    }


    protected onTileCreated(node: TileNode): void {
        if (FARM_TILES.has(`${node.tx},${node.ty}`)) {
            node.occupied = true;
            node.terrain = 'farm-tiles';
        }
        else if (FLOWER_BASE.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'flower-base'
        }
        else if (NATURAL_FENCE.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'natural-fence'
        }
        else if (PAVE_TILES_1.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'pave-tiles-1'
        }
        else if (PAVE_TILES_2.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'pave-tiles-2'
        }
        else {
            node.base.setTint(0x5a8a3c);
        }

    }

    protected buildBaseDecorations(): void {
        const placement: DecorConfig[] = [
            //buat decoration manual di sini
            //gugusan pohon
            { tx: 8, ty: 5, texture: 'cherry-tree', ox: 0.5, oy: 1, offsetY: -10, scale: 0.7 },
            //
            //Kebun kecil
            {
                tx: 1, ty: 5, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            {
                tx: 2, ty: 5, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            {
                tx: 1, ty: 6, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            {
                tx: 2, ty: 6, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            {
                tx: 1, ty: 4, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            {
                tx: 2, ty: 4, texture: 'flower-bed-1', ox: 0.5, oy: 1, offsetY: 3, scale: 0.5
            },
            //rumah
            {
                tx: 7, ty: 6, texture: 'house', ox: 0.5, oy: 1, offsetY: -3, scale: 0.5
            },
            //taman
            {
                tx: 4, ty: 6, texture: 'flower', ox: 0.5, oy: 1, offsetY: 4, scale: 0.5
            },
            {
                tx: 5, ty: 6, texture: 'flower', ox: 0.5, oy: 1, offsetY: 2, scale: 0.5
            },

            //pagar
            {
                tx: 1, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 2, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 3, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 3, ty: 6, texture: 'fence-v', ox: 0.5, oy: 1, offsetY: 6, scale: 1
            },
            {
                tx: 9, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 8, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 10, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 11, ty: 7, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 3, scale: 1
            },
            {
                tx: 1, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 2, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 3, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 4, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 5, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 6, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 5, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 6, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 7, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },

            {
                tx: 8, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 9, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },
            {
                tx: 10, ty: 9, texture: 'fence-h', ox: 0.5, oy: 1, offsetY: 8, scale: 1
            },

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

}