// Interclass communication, e.g. for story progression, inventory, etc.

/**
 * EventBus.ts
 * A typed singleton event bus for decoupled inter-system communication.
 *
 * Usage:
 *   EventBus.emit(GameEvent.ENTITY_INTERACT, { entityId: 'npc_01', ... });
 *   EventBus.on(GameEvent.ENTITY_INTERACT, handler, context);
 *   EventBus.off(GameEvent.ENTITY_INTERACT, handler, context); // Always in shutdown!
 */

import Phaser from 'phaser';

// ─── Event Catalogue ────────────────────────────────────────────────────────
// All valid game events live here. Adding a new event = adding one line.
// This is the single source of truth for inter-system communication.
export const GameEvent = {
    ENTITY_SPAWNED: 'entity:spawned',
    ENTITY_DESTROYED: 'entity:destroyed',
    ENTITY_MOVE_START: 'entity:move_start',
    ENTITY_MOVE_END: 'entity:move_end',
    ENTITY_INTERACT: 'entity:interact',
    ENTITY_INTERACT_END: 'entity:interact_end',
    STATE_CHANGED: 'state:changed',
} as const;
export type GameEvent = (typeof GameEvent)[keyof typeof GameEvent];

export interface EventPayloadMap {
    [GameEvent.ENTITY_SPAWNED]: { entityId: string; tx: number; ty: number };
    [GameEvent.ENTITY_DESTROYED]: { entityId: string };
    [GameEvent.ENTITY_MOVE_START]: { entityId: string; fromTx: number; fromTy: number; toTx: number; toTy: number };
    [GameEvent.ENTITY_MOVE_END]: { entityId: string; tx: number; ty: number };
    [GameEvent.ENTITY_INTERACT]: { entityId: string; initiatorId: string };
    [GameEvent.ENTITY_INTERACT_END]: { entityId: string };
    [GameEvent.STATE_CHANGED]: { key: string; value: unknown };
}

// ─── Typed Emitter ───────────────────────────────────────────────────────────

class TypedEventEmitter extends Phaser.Events.EventEmitter {
    emit<K extends GameEvent>(event: K, payload: EventPayloadMap[K]): boolean {
        return super.emit(event, payload);
    }

    on<K extends GameEvent>(
        event: K,
        fn: (payload: EventPayloadMap[K]) => void,
        context?: unknown
    ): this {
        return super.on(event, fn, context);
    }

    once<K extends GameEvent>(
        event: K,
        fn: (payload: EventPayloadMap[K]) => void,
        context?: unknown
    ): this {
        return super.once(event, fn, context);
    }

    off<K extends GameEvent>(
        event: K,
        fn: (payload: EventPayloadMap[K]) => void,
        context?: unknown
    ): this {
        return super.off(event, fn, context);
    }
}

// ─── Singleton Export ────────────────────────────────────────────────────────
export const EventBus = new TypedEventEmitter();
