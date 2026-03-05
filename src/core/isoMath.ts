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
}