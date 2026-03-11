export const MovementState = {
    IDLE: 'idle',
    MOVING: 'moving',
    BLOCKED: 'blocked',
} as const;
export type MovementState = typeof MovementState[keyof typeof MovementState];

export const Direction = {
    NORT: 'N',
    SOUTH: 'S',
    EAST: 'E',
    WEST: 'W',
} as const;
export type Direction = typeof Direction[keyof typeof Direction]

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
}

export interface MoveRequest {
    toTx: number;
    toTy: number;
    durationMs?: number;
}