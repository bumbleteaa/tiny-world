
import Phaser from 'phaser';
import { IsoMath } from '../core/IsoMath';
import { EventBus, GameEvent } from '../core/EventBus';
import { Direction, type EntityConfig, type MoveRequest } from './EntityType';
import { MovementState, InteractionResult } from './EntityType';

const DEFAULT_MOVE_DURATION_MS = 200;
const PLACEHOLDER_SIZE = 10;
const DEFAULT_PLACEHOLDER_TINT = 0xffffff;

// * Tile-step off set

const DIRECTION_OFFSET: Record<Direction, { dtx: number; dty: number }> = {
    [Direction.NORT]: { dtx: 0, dty: -1 },
    [Direction.SOUTH]: { dtx: 0, dty: 1 },
    [Direction.EAST]: { dtx: 1, dty: 0 },
    [Direction.WEST]: { dtx: -1, dty: 0 },
};


export abstract class BaseEntity extends Phaser.GameObjects.Container {

    public readonly entityId: string;

    protected tx: number;
    protected ty: number;
    protected readonly gridUnit: number;

    private _movementState: MovementState = MovementState.IDLE;
    private _activeTween: Phaser.Tweens.Tween | null = null;

    private _interactable: boolean;

    private _placeholder: Phaser.GameObjects.Rectangle;

    constructor(config: EntityConfig) {
        const worldPos = BaseEntity.tileToWorld(config.tx, config.ty, config.gridUnit);
        super(config.scene, worldPos.x, worldPos.y);

        this.entityId = config.id;
        this.tx = config.tx;
        this.ty = config.ty;
        this.gridUnit = config.gridUnit;
        this._interactable = config.interactable ?? false;


        this._placeholder = config.scene.add.rectangle(
            0, 0,
            PLACEHOLDER_SIZE, PLACEHOLDER_SIZE,
            DEFAULT_PLACEHOLDER_TINT
        );
        this.add(this._placeholder);

        config.scene.add.existing(this);
        this.syncDepth();

        EventBus.emit(GameEvent.ENTITY_SPAWNED, {
            entityId: this.entityId,
            tx: this.tx,
            ty: this.ty,
        });

        this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    }

    get tileX(): number { return this.tx; }
    get tileY(): number { return this.ty; }
    get movementState(): MovementState { return this._movementState; }
    get isMoving(): boolean { return this._movementState === MovementState.MOVING; }
    get isInteractable(): boolean { return this._interactable; }

    public placeAt(tx: number, ty: number): void {
        this.tx = tx;
        this.ty = ty;
        const { x, y } = BaseEntity.tileToWorld(tx, ty, this.gridUnit);
        this.setPosition(x, y);
        this.syncDepth();
    }


    public moveToTile(request: MoveRequest): boolean {
        if (this._movementState === MovementState.MOVING) {
            return false;
        }

        const { toTx, toTy, durationMs = DEFAULT_MOVE_DURATION_MS } = request;
        const fromTx = this.tx;
        const fromTy = this.ty;

        this._activeTween?.stop();
        this._activeTween = null;

        const target = BaseEntity.tileToWorld(toTx, toTy, this.gridUnit);

        this._movementState = MovementState.MOVING;

        EventBus.emit(GameEvent.ENTITY_MOVE_START, {
            entityId: this.entityId,
            fromTx,
            fromTy,
            toTx,
            toTy,
        });

        this._activeTween = this.scene.tweens.add({
            targets: this,
            x: target.x,
            y: target.y,
            duration: durationMs,
            ease: 'Sine.easeInOut',
            onUpdate: () => this.syncDepth(),
            onComplete: () => this.onMoveComplete(toTx, toTy),
        });

        return true;
    }

    public stopMovement(): void {
        this._activeTween?.stop();
        this._activeTween = null;

        if (this._movementState === MovementState.MOVING) {
            this._movementState = MovementState.IDLE;
        }
    }


    public setInteractable(value: boolean): void {
        this._interactable = value;
    }

    public interact(initiatorId: string): InteractionResult {
        if (!this._interactable) {
            return InteractionResult.REJECTED;
        }

        const result = this.onInteract(initiatorId);

        if (result === InteractionResult.SUCCESS) {
            EventBus.emit(GameEvent.ENTITY_INTERACT, {
                entityId: this.entityId,
                initiatorId,
            });
        }

        return result;
    }

    protected replaceVisual(visual: Phaser.GameObjects.GameObject): void {
        this._placeholder.destroy();
        this.add(visual);
    }

    protected setPlaceholderTint(tint: number): void {
        this._placeholder.setFillStyle(tint);
    }


    protected abstract onInteract(initiatorId: string): InteractionResult;

    public abstract tick(delta: number): void;

    private syncDepth(): void {

        this.setDepth(this.y + (this.tx + this.ty) * 0.001);
    }

    /** Fires when a moveTo tween completes naturally. */
    private onMoveComplete(toTx: number, toTy: number): void {
        this.tx = toTx;
        this.ty = toTy;
        this._movementState = MovementState.IDLE;
        this._activeTween = null;
        this.syncDepth();

        EventBus.emit(GameEvent.ENTITY_MOVE_END, {
            entityId: this.entityId,
            tx: this.tx,
            ty: this.ty,
        });
    }
    private onDestroy(): void {
        this._activeTween?.stop();
        this._activeTween = null;

        EventBus.emit(GameEvent.ENTITY_DESTROYED, { entityId: this.entityId });
    }

    // * Static utility
    public static tileToWorld(
        tx: number,
        ty: number,
        gridUnit: number
    ): { x: number; y: number } {
        const cartX = tx * gridUnit;
        const cartY = ty * gridUnit;
        const iso = IsoMath.cartToIso(cartX, cartY);
        return { x: iso.isoX, y: iso.isoY };
    }
}