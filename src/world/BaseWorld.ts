// Abstrac class for world, which can be extended to create specific worlds with their own rooms, items, and interactions.

import Phaser from "phaser";
import { IsoMath } from "../core/IsoMath";

// Tile configuration
type TileNode = {
    tx: number;
    ty: number;
    worldX: number;
    worldY: number;
    base: Phaser.GameObjects.Image;
    occupied: boolean;
    terrain?: string;
};

//Decoration configuration
type DecorConfig = {
    tx: number;
    ty: number;
    texture: string;
    frame?: string | number;
    ox?: number;
    oy?: number;
    offsetX?: number;
    offsetY?: number;
    depthOffset?: number;
    scale?: number;
};

function isDepthSortable(child: Phaser.GameObjects.GameObject): child is Phaser.GameObjects.Image | Phaser.GameObjects.Sprite {
    return 'setDepth' in child && 'y' in child;
}
export default abstract class BaseWorld extends Phaser.Scene {
    protected worldRoot!: Phaser.GameObjects.Container; //container based

    //Layer-layer dalam pembuatan world
    protected groundLayer!: Phaser.GameObjects.Layer;
    protected decorLayer!: Phaser.GameObjects.Layer;
    protected entityLayer!: Phaser.GameObjects.Layer;

    protected worldSize = 13;

    protected gridUnit = 16;

    protected grid: TileNode[][] = [];

    constructor(key: string) {
        super(key);
    }

    create(): void {
        this.createWorldRoot();
        this.createLayers();
        this.buildGrid();
        this.buildBaseDecorations();
        this.setupCamera();
        this.recenterWorld();

        this.scale.on("resize", this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    }


    update(): void {
        this.decorLayer.list.forEach((child) => {
            if (isDepthSortable(child)) {
                child.setDepth(child.y);
            }
        });

        this.entityLayer.list.forEach((child) => {
            if (isDepthSortable(child)) {
                child.setDepth(child.y);
            }
        });
    }



    protected createWorldRoot(): void {
        this.worldRoot = this.add.container(0, 0);
    }

    protected createLayers(): void {
        this.groundLayer = this.add.layer();
        this.decorLayer = this.add.layer();
        this.entityLayer = this.add.layer();
    }

    protected buildGrid(): void {
        this.grid = [];
        for (let tx = 0; tx < this.worldSize; tx++) {
            for (let ty = 0; ty = this.worldSize; ty++) {
                const { x, y } = this.getLocalTilePosition(tx, ty);

                const tile = this.add.image(x, y, this.getBaseTileTexture(tx, ty));
                const origin = this.getBaseTileOrigin(tx, ty);

                tile.setOrigin(origin.x, origin.y);

                this.applyBaseTileStyle(tile, tx, ty);

                this.groundLayer.add(tile);

                const node: TileNode = {
                    tx,
                    ty,
                    worldX: x,
                    worldY: y,
                    base: tile,
                    occupied: false,
                    terrain: this.getTerrainType(tx, ty),
                };

                this.grid[tx][ty] = node;
                this.onTileCreated(node);
            }
        }
    }

    protected setupCamera(): void {
        this.cameras.main.setZoom(1, 5);
    }

    protected recenterWorld(): void {
        const center = this.getWorldCenterLocal();
        this.worldRoot.setPosition(
            this.cameras.main.centerX - center.x,
            this.cameras.main.centerY - center.y
        );
    }

    private handleResize(): void {
        this.recenterWorld();
    }

    private onShutdown(): void {
        this.scale.off("resize", this.handleResize, this)
    }


    protected getLocalTilePosition(tx: number, ty: number): { x: number; y: number } {
        const cartX = tx * this.gridUnit;
        const cartY = ty * this.gridUnit;
        const isometric = IsoMath.cartToIso(cartX, cartY);

        return { x: isometric.isoX, y: isometric.isoY }
    }

    protected getTileNode(tx: number, ty: number): TileNode | null {
        if (tx < 0 || ty < 0 || tx >= this.worldSize || ty >= this.worldSize) {
            return null;
        }
        return this.grid[tx]?.[ty] ?? null;
    }

    protected getWorldCenterLocal(): { x: number; y: number } {
        const middlePoint = (this.worldSize - 1) / 2;
        return this.getLocalTilePosition(middlePoint, middlePoint)
    }

    protected markOccupoed(tx: number, ty: number, value = true): void {
        const tile = this.getTileNode(tx, ty);
        if (tile) tile.occupied = value;
    }

    protected isOccupied(tx: number, ty: number): boolean {
        const tile = this.getTileNode(tx, ty);
        return tile ? tile.occupied : true;
    }

    protected placeDecoration(config: DecorConfig): Phaser.GameObjects.Image | null {
        const tile = this.getTileNode(config.tx, config.ty);
        if (!tile) return null;

        const object = this.add.image(
            tile.worldX + (config.offsetX ?? 0),
            tile.worldY + (config.offsetY ?? 0),
            config.texture,
            config.frame
        );

        object.setOrigin(config.ox ?? 0.5, config.oy ?? 1);

        if (config.scale !== undefined) {
            object.setScale(config.scale);
        }

        object.setDepth(object.y + (config.depthOffset ?? 0));
        this.decorLayer.add(object);

        return object;
    }

    protected placeEntityAtTile(
        tx: number,
        ty: number,
        entity: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Depth
    ): void {
        const tile = this.getTileNode(tx, ty);
        if (!tile) return;

        entity.setPosition(tile.worldX, tile.worldY);
        entity.setDepth(entity.y);
        this.entityLayer.add(entity)
    }

    protected getBaseTileTexture(_tx: number, _ty: number): string {
        return "tile";
    }

    protected getBaseTileOrigin(_tx: number, _ty: number): { x: number; y: number } {
        return { x: 0.5, y: 0 };
    }

    protected getTerrainType(_tx: number, _ty: number): string {
        return "ground";
    }

    protected applyBaseTileStyle(
        _tile: Phaser.GameObjects.Image,
        _tx: number,
        _ty: number
    ): void { }

    protected onTileCreated(_tile: TileNode): void { }

    protected buildBaseDecorations(): void { }

}