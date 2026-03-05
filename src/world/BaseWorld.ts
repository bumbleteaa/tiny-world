// Abstrac class for world, which can be extended to create specific worlds with their own rooms, items, and interactions.

import Phaser from "phaser";
import { IsoMath } from "../core/isoMath";

export default abstract class BaseWorld extends Phaser.Scene {
    protected tileGroup!: Phaser.GameObjects.Group;
    protected entityGroup!: Phaser.GameObjects.Group;
    protected worldSize: number = 13;
    protected tileSize: number = 16;

    constructor(key: string) {
        super(key);
    }

    create(): void {
        this.tileGroup = this.add.group(); //Home tile group for interior world
        this.entityGroup = this.add.group(); //Moving creature group

        this.buildGrid();
        this.setupCamera();

        this.scale.on('resize', this.handleResize, this);
    }

    protected buildGrid(): void {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;


        for (let x = 0; x < this.worldSize; x++) {
            for (let y = 0; y < this.worldSize; y++) {
                const cartX = x * this.tileSize;
                const cartY = y * this.tileSize;
                const isometricPos = IsoMath.cartToIso(cartX, cartY);

                const tile = this.add.image(cx + isometricPos.isoX, cy + isometricPos.isoY, 'tile');
                tile.setOrigin(0.5, 0.5);
                this.tileGroup.add(tile);
                this.onTileCreated(tile, x, y);
            }
        }
    }

    protected abstract onTileCreated(tile: Phaser.GameObjects.Image, x: number, y: number): void;

    private setupCamera(): void {
        this.cameras.main.setZoom(1.5)
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.cameras.main.centerOn(0, 0);
    }

    // dept sorting logic
    update(time: number, delta: number): void {
        this.entityGroup.getChildren().forEach((child: any) => {
            child.depth = child.y;
        })
    }
}
