/**
 * BaseEntity.ts
 *
 * Kelas abstrak — "cetakan" untuk semua objek hidup di dunia game.
 * Tidak ada entity yang bisa di-instantiate langsung dari sini;
 * semua harus melalui subclass (Player, Npc, DoorTrigger, dll).
 *
 * TANGGUNG JAWAB:
 *   - Memiliki posisi tile (tx, ty) sebagai sumber kebenaran koordinat
 *   - Mengelola state machine pergerakan: IDLE → MOVING → IDLE
 *   - Menyediakan kontrak interaksi via onInteract() abstract
 *   - Menjadi wadah (Container) agar visual bisa diganti tanpa mengubah logika
 *
 * YANG TIDAK DILAKUKAN DI SINI:
 *   - Input (keyboard/analog) → milik Player.ts
 *   - AI movement → milik Npc.ts
 *   - Scene transition → milik World listener di EventBus
 *   - Inventory, dialogue, stats → milik subclass masing-masing
 */

import Phaser from 'phaser';
import { IsoMath } from '../core/IsoMath';
import { EventBus, GameEvent } from '../core/EventBus';
import type { EntityConfig, MoveRequest } from './EntityType';
import { MovementState, Direction, InteractionResult } from './EntityType';


// ─── Constants ───────────────────────────────────────────────────────────────

/** Durasi default tween pergerakan satu tile (ms). Override via MoveRequest.durationMs. */
const DEFAULT_MOVE_DURATION_MS = 200;

/** Ukuran placeholder rectangle (px) — hanya visible sebelum sprite di-load. */
const PLACEHOLDER_SIZE = 10;

/** Warna default placeholder. Override via setPlaceholderTint() di subclass. */
const DEFAULT_PLACEHOLDER_TINT = 0xffffff;

/**
 * Offset tile per arah — sumber kebenaran untuk semua directional movement.
 *
 * UNDER THE HOOD:
 * Tile-space sengaja dipisah dari screen-space. Di sini kita hanya
 * tahu "utara = ty - 1". IsoMath yang menangani proyeksi ke layar.
 * Memisahkan keduanya berarti pathfinding, collision, dan AI
 * semua bekerja di tile-space yang sederhana — bukan di koordinat screen
 * yang miring dan membingungkan.
 */
const DIRECTION_OFFSET: Record<Direction, { dtx: number; dty: number }> = {
    [Direction.NORTH]: { dtx: 0, dty: -1 },
    [Direction.SOUTH]: { dtx: 0, dty: 1 },
    [Direction.EAST]: { dtx: 1, dty: 0 },
    [Direction.WEST]: { dtx: -1, dty: 0 },
    [Direction.NORTH_EAST]: { dtx: 1, dty: -1 },
    [Direction.NORTH_WEST]: { dtx: -1, dty: -1 },
    [Direction.SOUTH_EAST]: { dtx: 1, dty: 1 },
    [Direction.SOUTH_WEST]: { dtx: -1, dty: 1 },
};
export abstract class BaseEntity extends Phaser.GameObjects.Container {
    public readonly entityId: string;
    protected tx: number;
    protected ty: number;
    protected readonly gridUnit: number;

    // ── Facing direction ──────────────────────────────────────────────────────
    /*
     * UNDER THE HOOD:
     * _facing disimpan terpisah dari movement state karena entity bisa
     * menghadap suatu arah sambil tetap IDLE — misalnya NPC menoleh ke player
     * saat dialogue, tanpa bergerak. Kalau facing hanya di-derive dari arah
     * gerakan terakhir, NPC yang diam akan selalu menghadap south selamanya.
     */
    private _facing: Direction = Direction.SOUTH;
    private _movementState: MovementState = MovementState.IDLE;
    private _activeTween: Phaser.Tweens.Tween | null = null;
    private _interactable: boolean;
    private readonly _walkabilityChecker: ((tx: number, ty: number) => boolean) | null;
    private _visual: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;

    // ─────────────────────────────────────────────────────────────────────────
    constructor(config: EntityConfig) {
        const worldPos = BaseEntity.tileToWorld(config.tx, config.ty, config.gridUnit);
        super(config.scene, worldPos.x, worldPos.y);

        this.entityId = config.id;
        this.tx = config.tx;
        this.ty = config.ty;
        this.gridUnit = config.gridUnit;
        this._interactable = config.interactable ?? false;

        // Null jika tidak di-inject — entity bebas collision
        this._walkabilityChecker = config.walkabilityChecker ?? null;

        const placeholder = config.scene.add.rectangle(
            0, 0, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE, DEFAULT_PLACEHOLDER_TINT
        );
        this._visual = placeholder;
        this.add(placeholder);

        config.scene.add.existing(this);
        this.syncDepth();

        EventBus.emit(GameEvent.ENTITY_SPAWNED, {
            entityId: this.entityId,
            tx: this.tx,
            ty: this.ty,
        });

        this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    }

    // =========================================================================
    // GETTERS
    // =========================================================================

    /*
     * UNDER THE HOOD:
     * Getter mengekspos state internal sebagai read-only.
     * Caller di luar tidak bisa set tx/ty langsung — wajib lewat
     * placeAt() atau moveTo() yang punya guard logic masing-masing.
     */
    get tileX(): number { return this.tx; }
    get tileY(): number { return this.ty; }
    get movementState(): MovementState { return this._movementState; }
    get isMoving(): boolean { return this._movementState === MovementState.MOVING; }
    get isInteractable(): boolean { return this._interactable; }

    /**
     * Arah hadap entity saat ini.
     *
     * UNDER THE HOOD:
     * Player.ts menggunakan ini di onFacingChanged() untuk memilih
     * animation key yang benar. Getter ini read-only dari luar —
     * untuk mengubah facing, gunakan setFacing() yang punya
     * side-effect memanggil hook onFacingChanged().
     */
    get facing(): Direction { return this._facing; }

    // =========================================================================
    // PLACEMENT — instant, tanpa animasi
    // =========================================================================

    /**
     * Teleport entity ke tile tertentu secara instan (tanpa tween).
     *
     * UNDER THE HOOD:
     * placeAt() vs moveTo():
     *   placeAt() = spawn, respawn, warp cutscene (tidak ada konteks gameplay)
     *   moveTo()  = gameplay movement (ada animasi, event, state guard)
     */
    public placeAt(tx: number, ty: number): void {
        this.tx = tx;
        this.ty = ty;
        const { x, y } = BaseEntity.tileToWorld(tx, ty, this.gridUnit);
        this.setPosition(x, y);
        this.syncDepth();
    }

    // =========================================================================
    // MOVEMENT — state machine dengan tween
    // =========================================================================

    /**
     * Request pergerakan ke tile target dengan animasi tween.
     * Mengembalikan false jika entity sedang bergerak.
     *
     * UNDER THE HOOD — State machine flow:
     *   [IDLE] ──► [MOVING] ──► onMoveComplete() ──► [IDLE]
     *
     * Kenapa return boolean?
     *   Input analog diterima setiap frame. Tanpa guard ini satu swipe
     *   bisa spawn puluhan tween → entity melayang.
     */
    public requestMoveTo(request: MoveRequest): boolean {
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

    /**
     * Terjemahkan arah analog menjadi satu langkah moveTo() ke tile berikutnya.
     *
     * UNDER THE HOOD — kenapa ada di BaseEntity dan bukan di Player.ts:
     * Gerakan berbasis arah tidak eksklusif milik player. Knockback, conveyor
     * belt, cutscene paksa — semuanya bisa pakai ini. Meletakkan logika
     * offset di sini berarti semua subclass pakai sumber kebenaran yang sama.
     * DIRECTION_OFFSET di atas adalah tabel tunggal yang mendefinisikan
     * "utara = apa" dalam tile-space.
     *
     * Mengembalikan false jika sedang bergerak (diteruskan dari moveTo()).
     */

    public moveInDirection(dir: Direction, durationMs?: number): boolean {
        const { dtx, dty } = DIRECTION_OFFSET[dir];
        const toTx = this.tx + dtx;
        const toTy = this.ty + dty;

        // Update facing dulu — bahkan jika tile tujuan terblokir.
        // UNDER THE HOOD: Player harus menghadap ke tembok yang dicoba
        // ditembus, bukan balik badan. UX terasa natural.
        this.setFacing(dir);

        // Cek collision — hanya jika checker di-inject
        if (this._walkabilityChecker !== null && !this._walkabilityChecker(toTx, toTy)) {
            return false; // Tile terblokir — tween tidak dimulai
        }

        return this.requestMoveTo({ toTx, toTy, durationMs });
    }

    /**
     * Hentikan pergerakan secara paksa, kembali ke IDLE.
     *
     * UNDER THE HOOD:
     * tween.stop() menghentikan animasi di posisi SAAT INI —
     * entity bisa berhenti di tengah jalan antara dua tile.
     * tx, ty TIDAK diupdate karena pergerakan belum selesai.
     */
    public stopMovement(): void {
        this._activeTween?.stop();
        this._activeTween = null;

        if (this._movementState === MovementState.MOVING) {
            this._movementState = MovementState.IDLE;
        }
    }

    /**
     * Ubah arah hadap entity tanpa menggerakkannya.
     *
     * UNDER THE HOOD:
     * Dipanggil otomatis oleh moveInDirection() sebelum tween dimulai,
     * tapi juga bisa dipanggil manual — misalnya NPC rotate ke player
     * saat dialogue dimulai tanpa berpindah tile.
     *
     * Guard `if same direction` mencegah onFacingChanged() terpanggil
     * sia-sia setiap frame saat player terus berjalan ke arah yang sama,
     * yang akan merestart animasi dari frame 0 terus-menerus.
     */
    public setFacing(dir: Direction): void {
        if (this._facing === dir) return;
        this._facing = dir;
        this.onFacingChanged(dir);
    }

    // =========================================================================
    // INTERACTION
    // =========================================================================

    public setInteractable(value: boolean): void {
        this._interactable = value;
    }

    /**
     * Entry point publik untuk interaksi — dipanggil oleh entity lain (biasanya Player).
     *
     * UNDER THE HOOD — Dua lapis pemisahan:
     * Lapis 1 (public interact)   : GUARD — cek _interactable
     * Lapis 2 (protected onInteract) : BEHAVIOR — subclass tentukan apa yang terjadi
     */
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

    // =========================================================================
    // VISUAL — sprite management
    // =========================================================================

    /**
     * Ganti placeholder rectangle dengan Phaser.GameObjects.Sprite sungguhan.
     * Panggil dari subclass setelah asset selesai di-load (dalam initSprite()).
     *
     * UNDER THE HOOD — kenapa Container pattern membuat ini aman:
     * Container sudah ada di world-space coords yang benar.
     * Sprite masuk sebagai child di local (offsetX, offsetY) — relatif
     * terhadap Container, bukan terhadap screen. Swap visual tidak
     * menggeser posisi entity satu pixel pun.
     *
     * offsetY biasanya negatif (misal -(frameHeight / 2)) supaya
     * pivot karakter ada di kaki, bukan di tengah badan.
     */
    protected replaceWithSprite(
        sprite: Phaser.GameObjects.Sprite,
        offsetX: number = 0,
        offsetY: number = 0
    ): void {
        /*
         * UNDER THE HOOD — kenapa destroy dulu sebelum add:
         * Container menyimpan array internal child objects. Tanpa destroy,
         * placeholder Rectangle tetap ada dan ikut di-render setiap frame —
         * ghost object yang tidak terlihat tapi makan draw call.
         */
        this._visual.destroy();
        sprite.setPosition(offsetX, offsetY);
        this._visual = sprite;
        this.add(sprite);
    }

    protected setAnimTimeScale(scale: number): void {
        if (this._visual instanceof Phaser.GameObjects.Sprite) {
            this._visual.anims.timeScale = scale;
        }
    }

    /**
     * Putar animasi pada sprite yang sedang aktif.
     * Silent no-op jika visual masih placeholder Rectangle.
     *
     * UNDER THE HOOD — kenapa instanceof guard:
     * Selama development, initSprite() mungkin belum dipanggil
     * (asset loading, test scene tanpa art). Tanpa guard ini,
     * memanggil play() pada Rectangle akan crash di runtime.
     * Dengan guard, playAnim() aman dipanggil kapan saja dari tick().
     *
     * ignoreIfPlaying: true mencegah animasi restart dari frame 0
     * setiap frame saat player terus berjalan ke arah yang sama.
     */
    protected playAnim(key: string, ignoreIfPlaying: boolean = true): void {
        if (this._visual instanceof Phaser.GameObjects.Sprite) {
            this._visual.play(key, ignoreIfPlaying);
        }
    }

    /**
     * Ubah warna placeholder untuk membedakan tipe entity saat debugging.
     *
     * Konvensi warna yang disarankan:
     *   Player      = 0x00ffff (cyan)
     *   NPC         = 0xffff00 (kuning)
     *   Item        = 0x00ff00 (hijau)
     *   DoorTrigger = setVisible(false)
     */
    protected setPlaceholderTint(tint: number): void {
        if (this._visual instanceof Phaser.GameObjects.Rectangle) {
            this._visual.setFillStyle(tint);
        }
    }

    // =========================================================================
    // ABSTRACT & VIRTUAL HOOKS — subclass wajib / boleh override
    // =========================================================================

    /**
     * Definisikan behavior interaksi spesifik entity ini.
     * Dipanggil HANYA setelah interact() lolos guard (_interactable = true).
     */
    protected abstract onInteract(initiatorId: string): InteractionResult;

    /**
     * Game loop hook — dipanggil setiap frame oleh BaseWorld.update().
     *
     * UNDER THE HOOD:
     * BaseEntity tidak mendaftarkan diri ke scene update secara otomatis.
     * BaseWorld memanggil entity.tick(delta) untuk tiap entity terdaftar.
     * Ini memberi world kontrol penuh: pause semua entity saat cutscene,
     * skip tick untuk entity jauh di luar viewport, dll.
     */
    public abstract tick(delta: number): void;

    /**
     * Hook yang terpanggil setiap kali arah hadap berubah via setFacing().
     *
     * UNDER THE HOOD:
     * Default adalah no-op — subclass yang tidak butuh animasi tidak perlu
     * override ini. Player.ts override untuk mengganti animation key.
     * DoorTrigger tidak perlu override — pintu tidak punya arah hadap.
     *
     * Kenapa hook dan bukan abstract?
     * Tidak semua entity punya animasi directional. Memaksa semua subclass
     * implementasi ini (abstract) akan menghasilkan banyak method kosong
     * yang tidak bermakna. Virtual hook dengan no-op default lebih bersih.
     */
    protected onFacingChanged(_dir: Direction): void {
        // no-op — override di subclass yang butuh animasi directional
    }

    // =========================================================================
    // PRIVATE INTERNALS
    // =========================================================================

    /**
     * Sinkronkan depth value dengan posisi isometric saat ini.
     *
     * UNDER THE HOOD:
     * Formula: depth = this.y + (tx + ty) * 0.001
     *   this.y        → komponen utama sorting (screen-space)
     *   (tx+ty)*0.001 → tie-breaker untuk entity dengan y identik
     */
    private syncDepth(): void {
        this.setDepth(this.y + (this.tx + this.ty) * 0.001);
    }

    /**
     * Callback saat tween moveTo() selesai secara natural.
     *
     * UNDER THE HOOD:
     * "Natural" = tween selesai sendiri, bukan di-stop() paksa.
     * Kalau stopMovement() dipanggil di tengah jalan, method ini
     * tidak jalan — tx,ty tidak diupdate ke tujuan yang belum tercapai.
     */
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

    /**
     * Cleanup handler — otomatis terpanggil saat Container di-destroy().
     *
     * UNDER THE HOOD:
     * Phaser tidak otomatis stop tween saat target di-destroy.
     * Tanpa ini, tween terus running pada object yang sudah tidak ada
     * → crash atau silent memory leak.
     */
    private onDestroy(): void {
        this._activeTween?.stop();
        this._activeTween = null;
        EventBus.emit(GameEvent.ENTITY_DESTROYED, { entityId: this.entityId });
    }

    // ─── Static Utility ───────────────────────────────────────────────────────

    /**
     * Konversi tile coords ke world screen coordinates.
     *
     * UNDER THE HOOD:
     * Static karena dipanggil di dalam super() constructor sebelum
     * `this` tersedia. JavaScript tidak mengizinkan akses instance
     * method sebelum super() selesai — static adalah satu-satunya opsi.
     */
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