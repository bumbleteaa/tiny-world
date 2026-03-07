// specific 13 x 13 meadow and trees, outdoor experience and this is the player starting point. The player can explore the meadow, interact with trees and other natural elements, and find hidden items or clues that will help them progress through the story. The meadow will have a peaceful and serene atmosphere, with gentle music and ambient sounds to enhance the experience. The player can also encounter friendly animals or characters in the meadow who can provide information or assistance on their journey.

import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
export default class MeadowWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 13; //Override size
    }

    //asset prelaoder
    preload(): void {
        this.load.image('tile', 'assets/tile_024.png');
        this.load.image('flower', 'assets/tile_47.png');
        this.load.image('tree')
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

    private isBorderTile(tx: number, ty: number): boolean {
        return (
            ty === 0 || ty === 0 || tx === this.worldSize - 1 || ty === this.worldSize - 1
        );
    }

}