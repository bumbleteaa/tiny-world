// specific 13 x 13 meadow and trees, outdoor experience and this is the player starting point. The player can explore the meadow, interact with trees and other natural elements, and find hidden items or clues that will help them progress through the story. The meadow will have a peaceful and serene atmosphere, with gentle music and ambient sounds to enhance the experience. The player can also encounter friendly animals or characters in the meadow who can provide information or assistance on their journey.

import BaseWorld from "./BaseWorld";

export default class MeadowWorld extends BaseWorld {
    constructor() {
        super('MeadowWorld');
        this.worldSize = 13;
    }

    preload(): void {
        this.load.image('tile', 'assets/tile_024.png');
    }

    protected onTileCreated(tile: Phaser.GameObjects.Image, x: number, y: number): void {
        const lightTile = 0x2c3e50;
        const darkTile = 0x283848;

        const isEven = (x + y) % 2 === 0;
        tile.setTint(isEven ? lightTile : darkTile);

        tile.setOrigin(0.5, 0);
        tile.setAlpha(0.99);
    }
}