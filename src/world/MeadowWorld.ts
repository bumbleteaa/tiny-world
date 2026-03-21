// specific 13 x 13 meadow and trees, outdoor experience and this is the player starting point. The player can explore the meadow, interact with trees and other natural elements, and find hidden items or clues that will help them progress through the story. The meadow will have a peaceful and serene atmosphere, with gentle music and ambient sounds to enhance the experience. The player can also encounter friendly animals or characters in the meadow who can provide information or assistance on their journey.

import { Player } from "../entities/Player";
import BaseWorld from "./BaseWorld";
import type { TileNode } from "./WorldTypes";
import type { DecorConfig } from "./WorldTypes";
import { BaseEntity } from "../entities/BaseEntity";
import { VirtualAnalog } from "../core/VirtualAnalog";
import { CompassDir, GridEdge } from "../core/GridHelper";
import { IsoMath } from "../core/IsoMath";

const POND_TILES = new Set([
    '12,12', '12,11', '11,12', '11,11', '10,12', '10,11', '10,10', '11,10', '12,10', '12,9', '11,9', '12,8', '12,7', '9,12'
]);

const BORDER_TILES = new Set([
    '8,12', '8,11', '9,11', '9,10', '9,9', '10,9', '10,8', '11,8', '11,7', '11,6', '12,6'
])

export default class MeadowWorld extends BaseWorld {
    private player!: Player;
    private analogStick!: VirtualAnalog;

    private debugGraphics?: Phaser.GameObjects.Graphics;
    private debugTexts: Phaser.GameObjects.Text[] = [];
    private debugVisible = false;

    // Tile debugger color type
    private static readonly TINT = {
        inner: 0xffffff,
        border: 0x9fe1cb,
        corner: 0xafa9ec,
    } as const;

    constructor() {
        super('MeadowWorld');
        this.worldSize = 13; //Override size
    }

    // ! ===================================================
    // !  WORLD INIT
    // ! ===================================================

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

        Player.preloadAssets(this);


        //add some in the future

    }

    create(): void {
        super.create();
        this.spawnPlayer();
        this.setupDebugOverlay();
        this.bindingDebugToggle();

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            this.onMeadowShutdown,
            this
        );

        //world-spesific setup here
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        this.player.tick(delta);
    }

    // ! ===================================================
    // !  PRIVATE METHOD / HELPER METHOD
    // ! ===================================================

    // * ====== Grid Helper Debugger ======
    // bindingDebugToggle() -- 
    private bindingDebugToggle(): void {
        this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => {
            this.debugVisible = !this.debugVisible;
            this.debugGraphics?.setVisible(this.debugVisible);
            this.debugTexts.forEach(t => t.setVisible(this.debugVisible));
        });
    }

    // setupDebugOverlay
    private setupDebugOverlay(): void {
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setVisible(false);
        this.entityLayer.add(this.debugGraphics);

        for (let ty = 0; ty < this.worldSize; ty++) {
            for (let tx = 0; tx < this.worldSize; tx++) {
                this.drawDebugTile(tx, ty);
            }
        }

        //Hide the text by default
        this.debugTexts.forEach(t => t.setVisible(false));
    }

    // drawDebugTile
    private drawDebugTile(tx: number, ty: number): void {
        const info = this.gridHelper.getTileInfo(tx, ty);

        // Converse to screen coordination via IsoMath
        const { x, y } = IsoMath.tileToScreen(
            tx, ty,
            this.tileW,
            this.tileH,
            this.originX,
            this.originY,
        );

        const color = info.isCorner ? 0x7f77dd :
            info.isBorder ? 0x1d9e75 : 0x888780;

        const cx = x;
        const cy = y + this.tileH / 2;

        this.debugGraphics!.fillStyle(color, 0.8).fillCircle(cx, cy, 3);

        // const edgeShort = info.edge === GridEdge.NONE ? '' : ` [${info.edge.replace('CORNER_', '⌞')}]`;

        const label = this.add.text(cx, cy - 14, `${tx},${ty}`, {
            fontSize: '9px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 2,
        });
        label.setOrigin(0.5, 1).setVisible(false);
        this.debugTexts.push(label);
        this.entityLayer.add(label);

        const mid = Math.floor(this.worldSize / 2);
        if (tx === mid && ty === mid) {
            this.drawCompassArrows(tx, ty, x, y);
        }
    }

    private drawCompassArrows(
        tx: number, ty: number,
        sx: number, sy: number,
    ): void {
        const dirs = this.gridHelper.getNeighborsAll(tx, ty);

        for (const { tx: nx, ty: ny, dir } of dirs) {
            const { x: nx2, y: ny2 } = IsoMath.tileToScreen(
                nx, ny,
                this.tileW,
                this.tileH,
                this.originX,
                this.originY,
            );

            this.debugGraphics!.lineStyle(1, 0xef9f27, 0.6).lineBetween(sx, sy, nx2, ny2);

            const mx = (sx + nx2) / 2;
            const my = (sy + ny2) / 2;
            const t = this.add.text(mx, my, dir, {
                fontSize: '8px',
                color: '#cf0000',
                stroke: '000000',
                strokeThickness: 2,
                resolution: 2,
            })
            t.setOrigin(0.5).setVisible(false);
            this.debugTexts.push(t);
            this.entityLayer.add(t);
        }
    }

    // Clean up - dont leak the listener if scene is shutdown
    shutdown(): void {
        this.debugTexts.forEach(t => t.destroy());
        this.debugTexts = [];
        this.debugGraphics?.destroy();
        super.shutdown?.();
    }

    // * ====== Player Init ======

    private spawnPlayer(): void {
        this.analogStick = new VirtualAnalog(this, this.worldRoot);

        this.player = new Player({
            id: 'player_01',
            scene: this,
            tx: 6,
            ty: 6,
            gridUnit: this.gridUnit,
            analogStick: this.analogStick,
        });

        this.player.initSprite();
        this.placeEntityAtTile(6, 6, this.player);
    }

    private onMeadowShutdown(): void {
        this.analogStick.destroy();
    }

    // * ====== World Appearance Init ======

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
        }
        else if (BORDER_TILES.has(`${node.tx},${node.ty}`)) {
            node.terrain = 'dirt';
        }
        else {
            node.base.setTint(0x5a8a3c);
        }
    }

    protected buildBaseDecorations(): void {
        const placement: DecorConfig[] = [
            // * Semua dekorasi tentang pohon
            // * koordinat x dan y (12.12)
            // Gugusan pohon kiri atas
            { tx: 1, ty: 1, texture: 'tree', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 1, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: 0, scale: 0.3 },
            { tx: 1, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 1, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 1, ty: 6, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.2 },
            { tx: 2, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: 6, scale: 0.55 },
            { tx: 2, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 2, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 3, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 3, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -4, scale: 0.3 },
            { tx: 3, ty: 5, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 4, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 4, ty: 4, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },
            { tx: 5, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -6, scale: 0.5 },
            { tx: 5, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.32 },
            { tx: 6, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.4 },
            { tx: 6, ty: 3, texture: 'tree', ox: 0.5, oy: 1, offsetY: 0, scale: 0.5 },
            { tx: 7, ty: 2, texture: 'tree', ox: 0.5, oy: 1, offsetY: -8, scale: 0.3 },

            // * Forest ornament
            { tx: 1, ty: 4, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: 4, scale: 0.35 },
            { tx: 1, ty: 4, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -1, scale: 0.5 },
            { tx: 1, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.5 },
            { tx: 1, ty: 5, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 3, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -3, scale: 0.3 },
            { tx: 4, ty: 3, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -5, scale: 0.35 },
            { tx: 4, ty: 3, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: 5, scale: 0.5 },
            { tx: 4, ty: 4, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -6, scale: 0.4 },
            { tx: 6, ty: 2, texture: 'branchwood-horizontal', ox: 0.5, oy: 1, offsetY: -1, scale: 0.35 },
            { tx: 6, ty: 2, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: 8, scale: 0.5 },
            { tx: 6, ty: 3, texture: 'forest-flower', ox: 0.5, oy: 1, offsetY: -4, scale: 0.5 },


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
            { tx: 8, ty: 12, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.7 },
            { tx: 9, ty: 8, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 8, scale: 0.7 },
            { tx: 9, ty: 9, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 6, scale: 0.7 },
            { tx: 9, ty: 11, texture: 'stone', ox: 0.5, oy: 1, offsetY: 4, scale: 0.7 },
            { tx: 9, ty: 11, texture: 'water-plant', ox: 0.5, oy: 1, offsetY: 6, scale: 0.6 },
            { tx: 9, ty: 12, texture: 'stone', ox: 0.5, oy: 1, offsetY: 0, scale: 0.8 },
            { tx: 10, ty: 8, texture: 'riverside-flower', ox: 0.5, oy: 1, offsetY: 8, scale: 0.7 },
            { tx: 10, ty: 11, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: -3, scale: 0.7 },
            { tx: 11, ty: 7, texture: 'stone', ox: 0.5, oy: 1, offsetY: 4, scale: 1 },
            { tx: 11, ty: 8, texture: 'fern', ox: 0.5, oy: 1, offsetY: 6, scale: 1 },
            { tx: 11, ty: 9, texture: 'fern', ox: 0.5, oy: 1, offsetY: 6, scale: 0.8 },

            //Test
            { tx: 0, ty: 0, texture: 'branchwood-vertical', ox: 0.5, oy: 1, offsetY: 0, scale: 0.7 },

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