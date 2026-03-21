// the ruler of the game mechanics, the math behind the isometric world
export class IsoMath {
    // convert cartesian coordinates to isometric coordinates
    public static cartToIso(cartX: number, cartY: number): { isoX: number, isoY: number } {
        const isoX = cartX - cartY;
        const isoY = (cartX + cartY) / 2;
        return { isoX, isoY };
    }

    // convert isometric coordinates to cartesian coordinates
    static isoToCart(isoX: number, isoY: number): { cartX: number, cartY: number } {
        const cartX = (isoX + isoY) / 2;
        const cartY = (isoY - isoX) / 2;
        return { cartX, cartY };
    }

    // * Convert tile grid into screen pixel
    /** 
     * Formula:
     * ScreenX = originX + (tx-ty) * halfTileW
     * SreenY = originY + (tx+ty) * halfTileH
     * 
     * @param tx - Collumn tiles
     * @param ty - Row tiles
     * @param tileW - Width of full tile in a pixel
     * @param tileH - Height of full tile in a pixel
     * @param originX - The X center coordinate (0,0)
     * @param originY - The X center coordinate (0,0)
     */
    public static tileToScreen(
        tx: number,
        ty: number,
        tileW: number,
        tileH: number,
        originX: number,
        originY: number,
    ): { x: number; y: number } {
        return {
            x: originX + (tx - ty) * (tileW / 2),
            y: originY + (tx + ty) * (tileH / 2),
        };
    }

    // * Convert tile pixel into tile coordinate

    public static screenToTile(
        sx: number,
        sy: number,
        tileW: number,
        tileH: number,
        originX: number,
        originY: number,
    ): { tx: number; ty: number } {
        const relX = sx - originX;
        const relY = sy - originY;
        return {
            tx: (relX / (tileW / 2) + relY / (tileH / 2)) / 2,
            ty: (relY / (tileH / 2) - relX / (tileW / 2)) / 2,
        };
    }
}

export function getWorldCenterOffset(
    worldSize: number,
    tileW: number,
    tileH: number
): { x: number; y: number } {
    return {
        x: 0,
        y: ((worldSize - 1) * tileH) / 2,
    }
}