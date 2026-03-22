export const MovementState = {
    IDLE: 'idle',
    MOVING: 'moving',
    BLOCKED: 'blocked',
} as const;
export type MovementState = typeof MovementState[keyof typeof MovementState];

export const Direction = {
    NORTH: 'N',
    SOUTH: 'S',
    EAST: 'E',
    WEST: 'W',
    NORTH_EAST: 'NE',
    NORTH_WEST: 'NW',
    SOUTH_EAST: 'SE',
    SOUTH_WEST: 'SW',
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

export const InteractionResult = {
    SUCCESS: 'success',
    REJECTED: 'rejected',
    PASSIVE: 'passive',
} as const;
export type InteractionResult = typeof InteractionResult[keyof typeof InteractionResult]

export interface EntityConfig {
    id: string;
    tx: number;
    ty: number;
    gridUnit: number;
    scene: Phaser.Scene;
    interactable?: boolean;
    walkabilityChecker?: (tx: number, ty: number) => boolean;
}

export interface MoveRequest {
    toTx: number;
    toTy: number;
    durationMs?: number;
}