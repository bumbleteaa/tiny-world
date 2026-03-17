import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";

export default class BedroomWorld extends BaseWorld {
    constructor() {
        super('BedroomWorld');
        this.worldSize = 7; //Override size
    }

    //assets prelaoder
    preload(): void {
        this.load.image('floor', 'assets/floor_tile.png');
        this.load.image('bed', 'assets/bed.png');
        //add some in the future
    }

    create(): void {
        super.create();

        //world-spesific setup here
    }

    // ############################

    protected getBaseTileTexture(tx: number, ty: number): string {
        return 'floor';
    }

    protected buildBaseDecorations(): void {
        const placement: DecorConfig[] = [
            //buat decoration manual di sini
            //gugusan pohon
            { tx: 2, ty: 2, texture: 'bed', ox: 0.5, oy: 1, offsetY: 4, offsetX: -3, scale: 0.5 },

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