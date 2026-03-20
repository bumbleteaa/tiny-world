// src/core/GridHelper.ts
// Utilitas murni — tidak ada dependensi Phaser, tidak ada side effect.
// Gunakan untuk query topologi grid: batas, info tile, dan navigasi arah kompas.

// ---------------------------------------------------------------------------
// Tipe: Arah Kompas (dalam ruang tile, bukan ruang layar)
// Dalam grid isometrik, "Utara" berarti tx--/ty-- (bergerak menuju pojok
// kiri-atas grid, yang secara visual adalah puncak berlian).
// ---------------------------------------------------------------------------
export const CompassDir = {
    NORTH: 'N',
    NORTH_EAST: 'NE',
    EAST: 'E',
    SOUTH_EAST: 'SE',
    SOUTH: 'S',
    SOUTH_WEST: 'SW',
    WEST: 'W',
    NORTH_WEST: 'NW',
    CENTER: 'CENTER',
} as const;
export type CompassDir = typeof CompassDir[keyof typeof CompassDir];

// ---------------------------------------------------------------------------
// Tipe: Posisi Tepi Grid
// Sebuah tile bisa berada di tepi cardinal, di sudut, atau tidak di tepi sama sekali.
// ---------------------------------------------------------------------------
export const GridEdge = {
    NONE: 'NONE',
    TOP: 'TOP',       // ty === 0
    BOTTOM: 'BOTTOM',    // ty === worldSize - 1
    LEFT: 'LEFT',      // tx === 0
    RIGHT: 'RIGHT',     // tx === worldSize - 1
    CORNER_TL: 'CORNER_TL', // tx === 0 && ty === 0
    CORNER_TR: 'CORNER_TR', // tx === worldSize-1 && ty === 0
    CORNER_BL: 'CORNER_BL', // tx === 0 && ty === worldSize-1
    CORNER_BR: 'CORNER_BR', // tx === worldSize-1 && ty === worldSize-1
} as const;
export type GridEdge = typeof GridEdge[keyof typeof GridEdge];

// ---------------------------------------------------------------------------
// Tipe: Value Object untuk informasi satu tile
// ---------------------------------------------------------------------------
export type TileInfo = {
    /** Koordinat tile (0-indexed) */
    tx: number;
    ty: number;
    /** Indeks linier dalam grid: ty * worldSize + tx */
    index: number;
    /** Apakah tile ini berada di dalam batas yang valid? */
    inBounds: boolean;
    /** Posisi tepi, atau NONE jika berada di dalam grid */
    edge: GridEdge;
    /** True jika tile ini berada di tepi terluar (termasuk sudut) */
    isBorder: boolean;
    /** True jika ini salah satu dari empat sudut grid */
    isCorner: boolean;
};

// ---------------------------------------------------------------------------
// Vektor delta tile per arah kompas
// ---------------------------------------------------------------------------
type TileDelta = Readonly<{ dtx: number; dty: number }>;

const COMPASS_DELTAS: Record<CompassDir, TileDelta> = {
    [CompassDir.NORTH]: { dtx: -1, dty: -1 },
    [CompassDir.NORTH_EAST]: { dtx: 0, dty: -1 },
    [CompassDir.EAST]: { dtx: 1, dty: -1 },
    [CompassDir.SOUTH_EAST]: { dtx: 1, dty: 0 },
    [CompassDir.SOUTH]: { dtx: 1, dty: 1 },
    [CompassDir.SOUTH_WEST]: { dtx: 0, dty: 1 },
    [CompassDir.WEST]: { dtx: -1, dty: 1 },
    [CompassDir.NORTH_WEST]: { dtx: -1, dty: 0 },
    [CompassDir.CENTER]: { dtx: 0, dty: 0 },
};

// Urutan arah untuk iterasi tetangga (searah jarum jam dari Utara)
const CARDINAL_DIRS: CompassDir[] = [
    CompassDir.NORTH,
    CompassDir.NORTH_EAST,
    CompassDir.EAST,
    CompassDir.SOUTH_EAST,
    CompassDir.SOUTH,
    CompassDir.SOUTH_WEST,
    CompassDir.WEST,
    CompassDir.NORTH_WEST,
];

// ---------------------------------------------------------------------------
// GridHelper
// Instansiasi satu kali per dunia dan berikan ke entity atau sistem yang membutuhkan.
// Contoh penggunaan:
//   const helper = new GridHelper(13);
//   const info   = helper.getTileInfo(0, 0);     // sudut, pojok TL
//   const next   = helper.getNeighbor(5, 5, CompassDir.NORTH);
//   const dir    = helper.directionBetween({tx:0,ty:0}, {tx:5,ty:5});
// ---------------------------------------------------------------------------
export class GridHelper {
    /** Ukuran sisi grid (jumlah tile per baris/kolom). */
    public readonly worldSize: number;
    /** Koordinat tile maksimum yang valid (worldSize - 1). */
    public readonly maxCoord: number;
    /** Jumlah tile total dalam grid. */
    public readonly totalTiles: number;

    constructor(worldSize: number) {
        if (worldSize < 1) {
            throw new RangeError(`[GridHelper] worldSize harus >= 1, diterima: ${worldSize}`);
        }
        this.worldSize = worldSize;
        this.maxCoord = worldSize - 1;
        this.totalTiles = worldSize * worldSize;
    }

    // -------------------------------------------------------------------------
    // 1. Batas Grid
    // -------------------------------------------------------------------------

    /**
     * True jika koordinat tile berada di dalam batas grid yang valid.
     */
    public isInBounds(tx: number, ty: number): boolean {
        return tx >= 0 && tx <= this.maxCoord &&
            ty >= 0 && ty <= this.maxCoord;
    }

    /**
     * Kembalikan posisi tepi tile ini, atau GridEdge.NONE jika di dalam.
     * Sudut diprioritaskan di atas tepi cardinal.
     */
    public getEdge(tx: number, ty: number): GridEdge {
        const atLeft = tx === 0;
        const atRight = tx === this.maxCoord;
        const atTop = ty === 0;
        const atBottom = ty === this.maxCoord;

        if (atTop && atLeft) return GridEdge.CORNER_TL;
        if (atTop && atRight) return GridEdge.CORNER_TR;
        if (atBottom && atLeft) return GridEdge.CORNER_BL;
        if (atBottom && atRight) return GridEdge.CORNER_BR;
        if (atTop) return GridEdge.TOP;
        if (atBottom) return GridEdge.BOTTOM;
        if (atLeft) return GridEdge.LEFT;
        if (atRight) return GridEdge.RIGHT;

        return GridEdge.NONE;
    }

    /**
     * Jepit koordinat ke rentang tile yang valid [0, maxCoord].
     */
    public clamp(tx: number, ty: number): { tx: number; ty: number } {
        return {
            tx: Math.max(0, Math.min(this.maxCoord, Math.round(tx))),
            ty: Math.max(0, Math.min(this.maxCoord, Math.round(ty))),
        };
    }

    // -------------------------------------------------------------------------
    // 2. Info Tile
    // -------------------------------------------------------------------------

    /**
     * Kembalikan value object TileInfo lengkap untuk koordinat yang diberikan.
     * Aman dipanggil dengan koordinat di luar batas — `inBounds` akan false.
     */
    public getTileInfo(tx: number, ty: number): TileInfo {
        const inBounds = this.isInBounds(tx, ty);
        const edge = inBounds ? this.getEdge(tx, ty) : GridEdge.NONE;
        const isCorner = edge === GridEdge.CORNER_TL ||
            edge === GridEdge.CORNER_TR ||
            edge === GridEdge.CORNER_BL ||
            edge === GridEdge.CORNER_BR;
        const isBorder = inBounds && edge !== GridEdge.NONE;

        return {
            tx,
            ty,
            index: ty * this.worldSize + tx,
            inBounds,
            edge,
            isBorder,
            isCorner,
        };
    }

    /**
     * Konversi indeks linier kembali ke koordinat tile.
     * Berguna saat melakukan iterasi totalTiles.
     */
    public indexToTile(index: number): { tx: number; ty: number } | null {
        if (index < 0 || index >= this.totalTiles) return null;
        return {
            tx: index % this.worldSize,
            ty: Math.floor(index / this.worldSize),
        };
    }

    // -------------------------------------------------------------------------
    // 3. Kompas & Navigasi
    // -------------------------------------------------------------------------

    /**
     * Kembalikan vektor delta tile untuk arah kompas yang diberikan.
     * Berguna untuk menghitung gerakan atau sweep raycast secara manual.
     */
    public getDelta(dir: CompassDir): TileDelta {
        return COMPASS_DELTAS[dir];
    }

    /**
     * Kembalikan koordinat tetangga dalam arah yang diberikan,
     * atau null jika tetangga tersebut berada di luar batas.
     */
    public getNeighbor(
        tx: number,
        ty: number,
        dir: CompassDir,
    ): { tx: number; ty: number } | null {
        const { dtx, dty } = COMPASS_DELTAS[dir];
        const nx = tx + dtx;
        const ny = ty + dty;
        return this.isInBounds(nx, ny) ? { tx: nx, ty: ny } : null;
    }

    /**
     * Kembalikan semua 8 tetangga yang berada di dalam batas, bersama arahnya.
     * Diurutkan searah jarum jam mulai dari Utara.
     */
    public getNeighborsAll(
        tx: number,
        ty: number,
    ): Array<{ tx: number; ty: number; dir: CompassDir }> {
        const result: Array<{ tx: number; ty: number; dir: CompassDir }> = [];

        for (const dir of CARDINAL_DIRS) {
            const neighbor = this.getNeighbor(tx, ty, dir);
            if (neighbor !== null) {
                result.push({ ...neighbor, dir });
            }
        }

        return result;
    }

    /**
     * Kembalikan arah kompas terdekat dari tile `from` menuju tile `to`.
     * Menggunakan perbandingan vektor; cocok untuk pengambilan keputusan NPC/AI.
     *
     * @returns CompassDir.CENTER jika kedua tile identik.
     */
    public directionBetween(
        from: { tx: number; ty: number },
        to: { tx: number; ty: number },
    ): CompassDir {
        const dtx = Math.sign(to.tx - from.tx);
        const dty = Math.sign(to.ty - from.ty);

        // Temukan entri COMPASS_DELTAS yang paling cocok
        for (const dir of CARDINAL_DIRS) {
            const delta = COMPASS_DELTAS[dir];
            if (delta.dtx === dtx && delta.dty === dty) return dir;
        }

        return CompassDir.CENTER;
    }

    /**
     * Jarak Chebyshev antara dua tile (jumlah langkah "king-move" minimum).
     * Lebih tepat untuk grid isometrik dibandingkan jarak Euclidean atau Manhattan.
     */
    public distanceChebyshev(
        from: { tx: number; ty: number },
        to: { tx: number; ty: number },
    ): number {
        return Math.max(Math.abs(to.tx - from.tx), Math.abs(to.ty - from.ty));
    }

    /**
     * Kembalikan semua tile dalam radius Chebyshev (berbentuk persegi dalam ruang tile).
     * Tidak menyertakan tile sumber itu sendiri; memfilter tile di luar batas.
     *
     * @param radius - Ukuran radius; 1 = hanya 8 tetangga terdekat.
     */
    public getTilesInRadius(
        cx: number,
        cy: number,
        radius: number,
    ): Array<{ tx: number; ty: number; distance: number }> {
        const results: Array<{ tx: number; ty: number; distance: number }> = [];

        for (let ty = cy - radius; ty <= cy + radius; ty++) {
            for (let tx = cx - radius; tx <= cx + radius; tx++) {
                if (tx === cx && ty === cy) continue;
                if (!this.isInBounds(tx, ty)) continue;

                results.push({
                    tx,
                    ty,
                    distance: this.distanceChebyshev({ tx: cx, ty: cy }, { tx, ty }),
                });
            }
        }

        return results;
    }

    // -------------------------------------------------------------------------
    // 4. Debug
    // -------------------------------------------------------------------------

    /**
     * Kembalikan representasi string ASCII grid yang menandai batas dan tile tertentu.
     * Hanya untuk debugging — jangan gunakan di production.
     *
     * @param highlight - Kumpulan kunci 'tx,ty' yang akan ditandai dengan '★'
     */
    public toDebugString(highlight: Set<string> = new Set()): string {
        const lines: string[] = [`GridHelper ${this.worldSize}×${this.worldSize}\n`];

        for (let ty = 0; ty < this.worldSize; ty++) {
            let row = '';
            for (let tx = 0; tx < this.worldSize; tx++) {
                const key = `${tx},${ty}`;
                const edge = this.getEdge(tx, ty);
                const mark = highlight.has(key) ? '★' :
                    edge === GridEdge.NONE ? '·' :
                        edge.startsWith('CORNER') ? '╋' : '─';
                row += mark + ' ';
            }
            lines.push(row.trimEnd());
        }

        return lines.join('\n');
    }
}