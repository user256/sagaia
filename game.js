/**
 * Kessel Run — fly in any direction, dodge mines and debris, dock at the station checkpoint.
 * Ship skins use the same SVG assets as the classic build, drawn rotated for side view.
 */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let serenityShipImg = null;
let fireflyShipImg = null;
let starfighterShipImg = null;
let issStationImg = null;

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const hullEl = document.getElementById("hull");
const shieldHudEl = document.getElementById("shieldHud");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const installBtn = document.getElementById("installBtn");
const largeModeBtn = document.getElementById("largeModeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanelEl = document.getElementById("settingsPanel");
const settingsBackdropEl = document.getElementById("settingsBackdrop");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const wikiBtn = document.getElementById("wikiBtn");
const wikiPanelEl = document.getElementById("wikiPanel");
const wikiBackdropEl = document.getElementById("wikiBackdrop");
const wikiCloseBtn = document.getElementById("wikiCloseBtn");
const shipSkinSelectEl = document.getElementById("shipSkinSelect");
const startLevelInputEl = document.getElementById("startLevelInput");
const startAtBtn = document.getElementById("startAtBtn");
const sectorBossFightsChkEl = document.getElementById("sectorBossFightsChk");
const mobileLeftBtn = document.getElementById("mobileLeftBtn");
const mobileDpadUpBtn = document.getElementById("mobileDpadUpBtn");
const mobileRightBtn = document.getElementById("mobileRightBtn");
const mobileReverseBtn = document.getElementById("mobileReverseBtn");
const mobileThrottleBtn = document.getElementById("mobileThrottleBtn");
const mobileFireBtn = document.getElementById("mobileFireBtn");
const mobilePauseBtn = document.getElementById("mobilePauseBtn");
const mobileControlsEl = document.getElementById("mobileControls");
const appEl = document.querySelector(".app");
const loadScreenEl = document.getElementById("loadScreen");
const loadBarEl = document.getElementById("loadBar");

const WORLD = { width: canvas.width, height: canvas.height };
const DEFAULT_CANVAS_WIDTH = 960;
const DEFAULT_CANVAS_HEIGHT = 640;

const BASE_HULL = 100;
const MAX_HULL = 200;
const MAX_SHIELD = 200;
/** Score-based shield repair tops out here; mystery shield can still raise toward `MAX_SHIELD` (Shipwreck parity). */
const SHIELD_REGEN_CAP = 100;
const SHIELD_POWERUP_MIN_AFTER = 100;
/** Shield % restored per 1 score point while regen is unlocked and shield &lt; `SHIELD_REGEN_CAP`. */
const SHIELD_REGEN_PER_SCORE = 0.024;
/** Score when a mystery would upgrade something you already maxed (no standalone “bonus orb”). */
const MYSTERY_MAXED_BONUS = 220;
const MYSTERY_HULL_MAXED_BONUS = 333;
const ACCEL = 3000;
/** Slightly stronger lateral thrust so strafe doesn’t feel stuck in syrup (vertical still uses `VERT_ACCEL_MULT`). */
const HORIZ_ACCEL_MULT = 1.22;
/** Vertical thrust weaker than horizontal (narrower up/down). */
const VERT_ACCEL_MULT = 0.58;
/** Horizontal velocity decays slower than vertical — easier to reverse strafe without “gravity well” mush. */
const DRAG_K_HORIZONTAL = 5.35;
const DRAG_K_VERTICAL = 6.75;
const MAX_SPEED = 420;
/** Elliptical cap: vertical top speed vs `MAX_SPEED`. */
const VERT_MAX_SPEED_RATIO = 0.58;
/** Shield points when two mines detonate each other (chain boom). */
const MINE_CHAIN_BOOM_SHIELD = 5;
const BLASTER_BASE_SPREAD = 0.2;
/** At full forward `vx`, spread shrinks by this fraction (tier 2+ only). */
const BLASTER_SPREAD_FORWARD_TIGHTEN = 0.72;
/** Floor so triple/aft volleys stay separated when flying forward (radians). */
const BLASTER_MIN_SPREAD_TIER2PLUS = 0.11;
/** Player shots: range ≈ speed × life (world px before timeout). */
const BLASTER_BULLET_SPEED = 585;
const BLASTER_BULLET_LIFE = 1.38;
/** Secondary upgrade: twin shots along current travel vector. */
const SECONDARY_BULLET_SPEED = 610;
const SECONDARY_BULLET_LIFE = 2.2;
/** Secondary always fires along +X (nose-right), not aim/travel. */
const SECONDARY_FORWARD_ANGLE = 0;
const SECONDARY_FIRE_COOLDOWN = 0.17;
const SECONDARY_PAIR_OFFSET = 9;
const INVULN_HIT = 1.25;
const MINE_DAMAGE = 26;
/** Softer than solid rock — nebula wisps (purple clouds). Flat damage only; no depth ramp (brown walls are different). */
const CLOUD_DAMAGE = 14;
/** With any shield up, nebula only applies this fraction of `CLOUD_DAMAGE` (shield bleeds off gas gently). */
const CLOUD_DAMAGE_WITH_SHIELD_MULT = 0.05;
/** Brown-only: max damage when you are well inside the ceiling/floor band (surface graze ≈ purple). */
const BROWN_GAS_DEEP = 44;
/** Brown-only: with shield, deep brown uses this fraction of `BROWN_GAS_DEEP` (surface still matches purple shield mult). */
const BROWN_GAS_SHIELD_DEEP_MULT = 0.52;
/** Brown-only: overlap past this (px) before damage ramps toward `BROWN_GAS_DEEP`. */
const BROWN_GAS_GRAZE_PX = 5;
/** Minimum gap between purple clouds, brown walls, and mystery orbs (world px). */
const HAZARD_GAP_PAD = 34;
/** Homing target speed (px/s); higher = mines close faster. */
const MINE_SPEED_BASE = 118;
const MINE_SPEED_PER_LEVEL = 12;
/** Map scrolls left under you (px/s); ship is not pushed by this. */
const AUTO_SCROLL_SPEED = 64 * 0.95;
/** Diagonal meteor hazards (world-space). Size scales both threat and reward. */
const METEOR_RADIUS_MIN = 15;
const METEOR_RADIUS_MAX = 32;
const METEOR_DAMAGE_MIN = 11;
const METEOR_DAMAGE_MAX = 30;
const METEOR_SPAWN_INTERVAL_MIN = 2.55;
const METEOR_SPAWN_INTERVAL_MAX = 4.85;
const METEOR_MAX_ALIVE = 4;
const METEOR_DROP_SHIELD_CHANCE = 0.72;
/** Rare meteor cache: enhanced deflector salvage (burst refill or shave cooldown). */
const METEOR_DROP_BROWN_DEFLECTOR_CHANCE = 0.065;
/** Sector 4+: rare meteor drop; multiplies F+G bullet damage by `WEAPON_UPGRADE_MULT` per pickup. */
const METEOR_DROP_WEAPON_UPGRADE_CHANCE = 0.038;
const WEAPON_UPGRADE_LEVEL_MIN = 4;
const WEAPON_UPGRADE_MULT = 1.1;
/** Hostile station wreck: common weapon capacitor orb (sector 4+). */
const HOSTILE_STATION_WEAPON_UPGRADE_CHANCE = 0.78;
/** One-time reverse thruster upgrade from hostile station (removed from pool once owned). */
const HOSTILE_STATION_REVERSE_BOOST_CHANCE = 0.46;
const METEOR_DROP_REVERSE_BOOST_CHANCE = 0.03;
/** Stronger left thrust after upgrade. */
const REVERSE_THRUST_ACCEL_MULT = 1.62;
/** Minimum leftward speed (px/s) to count as reverse ram vs hostiles. */
const REVERSE_RAM_MIN_VX = -44;
const REVERSE_RAM_BASE_DAMAGE = 30;
/** Wing drones: duration after flawless hostile-station kill (player hull+shield max). */
const DRONE_GUARD_DURATION_SEC = 38;
const DRONE_GUARD_CHEAT_DURATION_SEC = 720;
const DRONE_GUARD_R_MULT = 0.68;
const DRONE_GUARD_STRAFE_MULT = 1.42;
/** Nose +X: shift escorts toward −X so they sit behind the hull silhouette. */
const DRONE_GUARD_AFT_X_MULT = 0.55;
/** Max seconds per burst in brown before cooldown; upgrades raise toward max. */
const ENHANCED_DEFLECTOR_BURST_START = 3;
const ENHANCED_DEFLECTOR_BURST_MAX = 20;
const ENHANCED_DEFLECTOR_BURST_STEP = 2;
const ENHANCED_DEFLECTOR_SALVAGE_SEC = 3;
const ENHANCED_DEFLECTOR_COOLDOWN_SEC = 10;
const METEOR_DROP_POINTS_MIN = 120;
const METEOR_DROP_POINTS_MAX = 260;
/** Occasional brown geysers rising from the floor (same damage family as brown walls). */
const GAS_BLAST_SPAWN_MIN = 3.1;
const GAS_BLAST_SPAWN_MAX = 8.2;
const GAS_BLAST_MAX_ALIVE = 2;
/** Mine count scales with sector length (~1 per this many world px); capped for perf (mine–mine is O(n²)). */
const MINE_SPACING_TARGET_PX = 560;
const MINE_COUNT_MIN = 18;
const MINE_COUNT_MAX = 86;
/** Hostile “reaper” craft: same `starfighter.svg` art, flipped to face you. */
const HOSTILE_SEEK_SPEED_BASE = 118;
const HOSTILE_SEEK_SPEED_PER_LEVEL = 7;
const HOSTILE_MAX_ALIVE = 5;
const HOSTILE_SPAWN_INTERVAL_MIN = 5.2;
const HOSTILE_SPAWN_INTERVAL_MAX = 10.5;
const HOSTILE_COLLISION_DAMAGE = 30;
const HOSTILE_BULLET_DAMAGE = 11;
const HOSTILE_BULLET_SPEED = 340;
/** Raiders in sector 2+ may spawn with a shield; strength capped at 25% of player max shield (points). */
const HOSTILE_RAIDER_SHIELD_MAX = MAX_SHIELD * 0.25;
const HOSTILE_RAIDER_SHIELD_CHANCE = 0.42;
/** Smart missile damage to raiders (shield absorbs first). */
const SMART_MISSILE_HOSTILE_DAMAGE = 38;
/** Isolated stationary hostile platform (sector 2+). */
const HOSTILE_STATION_MAX_ALIVE = 1;
const HOSTILE_STATION_SPAWN_INTERVAL_MIN = 15;
const HOSTILE_STATION_SPAWN_INTERVAL_MAX = 28;
const HOSTILE_STATION_BODY_HP = 62;
const HOSTILE_STATION_COLLISION_DAMAGE = 38;
/** Max station shield points (~half of raider cap). */
const HOSTILE_STATION_SHIELD_MAX = HOSTILE_RAIDER_SHIELD_MAX * 0.5;
const HOSTILE_STATION_FIRE_INTERVAL = 1.12;
const HOSTILE_STATION_BULLET_SPEED = 300;
/** +20% vs prior 11. */
const HOSTILE_STATION_BULLET_DAMAGE = 13;
const HOSTILE_STATION_ISOLATION_PAD = 150;
/** While shield is up, incoming damage is multiplied by this (mystery “enhanced shields”). */
const ENHANCED_SHIELD_DAMAGE_MULT = 0.66;
const DEFLECTOR_MIN_SHIELD = 10;
const LOW_SHIELD_COLLISION_CHIP_THRESHOLD = 50;
const LOW_SHIELD_COLLISION_CHIP_DAMAGE = 1;
/** Friendly homing seekers spawned from sustained firing (mystery upgrade). */
const SMART_MISSILE_MAX_ALIVE = 6;
/** Seconds of holding fire between seekers (halved vs original 5–10 for parity with faster shield regen). */
const SMART_MISSILE_FIRE_INTERVAL_MIN = 2.5;
const SMART_MISSILE_FIRE_INTERVAL_MAX = 5;
/** Drop user seekers only when this far left of the camera (not the tight scroll frontier). */
const SMART_MISSILE_CULL_LEFT_OF_CAM = Math.max(520, DEFAULT_CANVAS_WIDTH * 0.72);
/** Smart seekers hunt with stronger steering/speed than ambient mines. */
const SMART_MISSILE_SPEED_MULT = 1.22;
const SMART_MISSILE_HOMING_BASE = 1.22;
const SMART_MISSILE_HOMING_PER_LEVEL = 0.028;

/** Orbital station checkpoint (Shipwreck tuning, scaled by viewport). */
function stationScaleRef() {
  return Math.min(WORLD.width, WORLD.height) / 640;
}
function stationBodyRadius() {
  return 44 * stationScaleRef();
}
function stationDockRange() {
  return 96 * stationScaleRef();
}
function stationDrawWidth() {
  return 112 * stationScaleRef();
}
/** Keep ship inside the visible band (no damage from these edges — soft stop only). */
const VIEWPORT_EDGE_PAD = 14;

/** Sector 1 end boss: King Fossil–style coelacanth; map scroll pauses until it is destroyed. */
const SECTOR_BOSS_L1_HP = 218;
const SECTOR_BOSS_L1_HIT_R_MULT = 6.35;
const SECTOR_BOSS_L1_SWAY_X = 118;
const SECTOR_BOSS_L1_SWAY_Y = 36;
/** Tier 1: shorter exposure window, faster shots. */
const SECTOR_BOSS_L1_VOLLEY_DURATION = 1.38;
const SECTOR_BOSS_L1_FIRE_INTERVAL = 0.2;
const SECTOR_BOSS_L1_FIREBALL_SPEED = 418;
const SECTOR_BOSS_L1_FIREBALL_DMG = 54;
const SECTOR_BOSS_L2_FIREBALL_DMG = 42;
const SECTOR_BOSS_L1_BODY_DMG = 48;
const SECTOR_BOSS_L1_SMASH_DMG = 101;
const SECTOR_BOSS_L1_KILL_SCORE = 155;
/**
 * Global boss arena tuning (set to 1 to revert): HP (“shields”), boss fireball + body + smash damage,
 * and slam dash velocity scale by this factor for every arena/tier until you change it.
 */
const SECTOR_BOSS_DEFAULT_STAT_MULT = 1.1;

/** Rotate raster SVGs +90° so “up” in the asset becomes nose-right. Classic polygon is drawn nose-right already. */
const RASTER_SHIP_ROTATION = Math.PI / 2;

const SHIP_SKIN_OPTIONS = [
  { id: "default", label: "Classic", rasterScale: 1 },
  { id: "serenity", label: "Serenity", rasterScale: 1 },
  { id: "firefly", label: "Firefly", rasterScale: 0.88 },
  { id: "starfighter", label: "Starfighter", rasterScale: 1 },
];

const COIN_TABLE = [
  { value: 10, color: "#a76b2c" },
  { value: 25, color: "#b7b7b7" },
  { value: 50, color: "#d6d6d6" },
  { value: 100, color: "#ece27a" },
];

const KEY = Object.create(null);

const game = {
  settings: {
    largeMode: defaultLargeModeForDesktop(),
    startLevel: 1,
    shipSkin: "serenity",
    /** When true (default), clearing a sector docks first; continue runs a separate boss arena before the next sector. */
    sectorBossFights: true,
    /** Set from `?boss=N` — boot straight into boss arena (persists until you change the URL). */
    bootBossTier: null,
    /** Tokens from `?cheat=` / `?cheats=` (e.g. raptor, darius2). */
    queryCheats: [],
  },
  player: null,
  clouds: [],
  /** Brown gas ceiling & floor bands (full-width segments, shmup-style corridor). */
  gasWalls: [],
  mines: [],
  /** Brief shockwave bursts when mines detonate (player or mine–mine). */
  mineExplosions: [],
  coins: [],
  /** Purple mystery orbs (same look as Shipwreck). */
  mysteries: [],
  overlays: [],
  cameraX: 0,
  /** Advances with map scroll; culled content lives “behind” this X. */
  worldScrollAnchor: 0,
  levelWidth: 8000,
  goalX: 0,
  /** Sector checkpoint: ISS center (y fixed; x == goalX). */
  stationY: 320,
  spawnX: 120,
  spawnY: 320,
  score: 0,
  hull: BASE_HULL,
  shield: 0,
  /** After first shield mystery: score slowly refills shield up to `SHIELD_REGEN_CAP`. */
  shieldScoreRegenUnlocked: false,
  prevScoreForShieldRegen: 0,
  level: 1,
  gameOver: false,
  won: false,
  invuln: 0,
  immunityTimer: 0,
  hasBlaster: true,
  blasterTier: 1,
  blasterCooldown: 0,
  hasSecondaryWeapon: false,
  secondaryCooldown: 0,
  /** F + G damage multiplier; +10% per capacitor (sector 4+ drops). */
  weaponPowerMult: 1,
  /** Flat damage per F / G / drone shot (stacks +10 each boss clear). */
  weaponFlatBonus: 0,
  /** Ship top-speed multiplier; ×1.01 per boss clear (compounds). */
  playerSpeedMult: 1,
  bullets: [],
  mysterySpawnTimer: 0,
  /** Timer-driven mystery spawns this sector (capped). */
  mysteriesSpawnedFromTimer: 0,
  /** Fast diagonal rocks; timer-driven spawns while flying. */
  meteors: [],
  meteorSpawnTimer: 0,
  /** Short-lived brown columns that shoot up from the floor. */
  gasBlasts: [],
  gasBlastTimer: 0,
  /** Opposing starfighters (classic skin, nose −X). */
  hostiles: [],
  /** Stationary gun platforms with red shields (sector 2+). */
  hostileStations: [],
  hostileStationSpawnTimer: 0,
  enemyBullets: [],
  hostileSpawnTimer: 0,
  /** Mystery: homing “smart missiles” while holding fire; `smartMissileFireAcc` counts seconds held. */
  hasSmartMissiles: false,
  smartMissileFireAcc: 0,
  smartMissileNextAt: 7,
  smartMissiles: [],
  /** Mystery: less damage while any shield remains. */
  enhancedShields: false,
  /** Mystery: purple clouds no longer damage the hull/shield. */
  hasDeflector: false,
  /** Brown tunnel: burst protection then cooldown (separate from purple-cloud `hasDeflector`). */
  hasEnhancedDeflector: false,
  enhancedDeflectorBurstMax: ENHANCED_DEFLECTOR_BURST_START,
  enhancedDeflectorBurstLeft: 0,
  enhancedDeflectorCooldown: 0,
  /** One-time: faster reverse thrust, 2× aft plume when holding left, ram damage into hostiles while reversing. */
  hasAcceleratedReverse: false,
  /** Escorts above/below; F+G at half rate vs main. Cheat RAPTOR or flawless station kill. */
  droneGuardsTimeRemaining: 0,
  droneBlasterHalfToggle: false,
  droneSecondaryHalfToggle: false,
  /** Non-null freezes auto-scroll; boss only appears in the boss arena (not at the station). */
  sectorBoss: null,
  /** Non-null while in a standalone boss map (`buildBossArena`). */
  bossArenaTier: null,
  /** After station clear: next continue opens boss arena instead of the next sector. */
  pendingBossAfterStation: false,
  /** After boss kill: next continue increments sector. */
  advanceLevelAfterBoss: false,
  /** `?boss=N` without starting: spawn boss on first click. */
  deferredBossInitTier: null,
  paused: false,
  started: false,
  lastTs: 0,
};

function playerMoveSpeedScale() {
  return game.playerSpeedMult ?? 1;
}

function playerBlasterDamage() {
  return 1 * game.weaponPowerMult + (game.weaponFlatBonus ?? 0);
}

function playerSecondaryShotDamage() {
  return 4 * game.weaponPowerMult + (game.weaponFlatBonus ?? 0);
}

function smartMissileImpactDamage() {
  return SMART_MISSILE_HOSTILE_DAMAGE + (game.weaponFlatBonus ?? 0);
}

function sectorBossDefaultDamage(n) {
  return Math.max(1, Math.round(n * SECTOR_BOSS_DEFAULT_STAT_MULT));
}

let cheatBuffer = "";

function defaultLargeModeForDesktop() {
  const touch = navigator.maxTouchPoints > 0;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth <= 900;
  return !((coarse || narrow) && touch);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function setLoadProgress(fraction) {
  if (!loadBarEl) return;
  loadBarEl.style.width = `${clamp(fraction, 0, 1) * 100}%`;
}

function dismissLoadScreen() {
  if (!loadScreenEl) return;
  loadScreenEl.classList.add("load-screen--out");
  loadScreenEl.setAttribute("aria-busy", "false");
  window.setTimeout(() => {
    loadScreenEl.remove();
  }, 620);
}

/** Loader stays at least this long so the boot art is readable (local assets are instant). */
const LOAD_SCREEN_MIN_VISIBLE_MS = 2400;
/** Extra beat at 100% before fade. */
const LOAD_SCREEN_FULL_HOLD_MS = 550;

async function runBootLoad() {
  const tBoot = performance.now();
  preloadShipImages();
  const imgs = [serenityShipImg, fireflyShipImg, starfighterShipImg, issStationImg].filter(Boolean);
  const total = Math.max(1, imgs.length);
  let n = 0;
  const mark = () => {
    n += 1;
    if (loadScreenEl) setLoadProgress(0.1 + (n / total) * 0.85);
  };
  if (loadScreenEl) setLoadProgress(0.05);
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          const fin = () => {
            mark();
            resolve();
          };
          if (img.complete && img.naturalWidth) fin();
          else {
            img.onload = fin;
            img.onerror = fin;
          }
        })
    )
  );
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {
      /* ignore */
    }
  }
  if (loadScreenEl) {
    setLoadProgress(1);
    const elapsed = performance.now() - tBoot;
    const padMin = Math.max(0, LOAD_SCREEN_MIN_VISIBLE_MS - elapsed);
    await new Promise((r) => window.setTimeout(r, padMin));
    await new Promise((r) => window.setTimeout(r, LOAD_SCREEN_FULL_HOLD_MS));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    dismissLoadScreen();
  }
}

function getMovementInputAxes() {
  const ix = (KEY.KeyD || KEY.ArrowRight ? 1 : 0) - (KEY.KeyA || KEY.ArrowLeft ? 1 : 0);
  const iy = (KEY.KeyS || KEY.ArrowDown ? 1 : 0) - (KEY.KeyW || KEY.ArrowUp ? 1 : 0);
  return { ix, iy };
}

/**
 * Blaster / secondary / seekers: keys aim first; if coasting with no input, aim matches velocity
 * so backward flight still shoots aft without holding the strafe key every frame.
 */
function getPlayerShotAimAngle() {
  const { ix, iy } = getMovementInputAxes();
  if (ix !== 0 || iy !== 0) return Math.atan2(iy, ix);
  const p = game.player;
  if (p) {
    const speed = Math.hypot(p.vx, p.vy);
    if (speed >= 18) return Math.atan2(p.vy, p.vx);
  }
  return 0;
}

function mulberry32(seed) {
  return function mul() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randf(a, b) {
  return a + Math.random() * (b - a);
}

function rectsOverlapPad(ax, ay, aw, ah, bx, by, bw, bh, pad) {
  return (
    ax + aw + pad > bx - pad &&
    ax - pad < bx + bw + pad &&
    ay + ah + pad > by - pad &&
    ay - pad < by + bh + pad
  );
}

function cloudOverlapsGasWall(cx, cy, cw, ch, walls) {
  for (const w of walls) {
    if (rectsOverlapPad(cx, cy, cw, ch, w.x, w.y, w.w, w.h, HAZARD_GAP_PAD)) return true;
  }
  return false;
}

function cloudOverlapsCloud(cx, cy, cw, ch, clouds) {
  for (const c of clouds) {
    if (rectsOverlapPad(cx, cy, cw, ch, c.x, c.y, c.w, c.h, HAZARD_GAP_PAD)) return true;
  }
  return false;
}

function mysteryClearOfHazards(mx, my, mr, clouds, walls) {
  const d = mr * 2;
  for (const w of walls) {
    if (rectsOverlapPad(mx - mr, my - mr, d, d, w.x, w.y, w.w, w.h, HAZARD_GAP_PAD)) return false;
  }
  for (const c of clouds) {
    if (rectsOverlapPad(mx - mr, my - mr, d, d, c.x, c.y, c.w, c.h, HAZARD_GAP_PAD)) return false;
  }
  return true;
}

function applyPlayfieldLayout() {
  WORLD.width = canvas.width;
  WORLD.height = canvas.height;
}

function getStartLevel() {
  if (!startLevelInputEl) return game.settings.startLevel;
  const n = Number.parseInt(startLevelInputEl.value, 10);
  return clamp(Number.isNaN(n) ? 1 : n, 1, 99);
}

function normalizeShipSkin() {
  if (!SHIP_SKIN_OPTIONS.some((o) => o.id === game.settings.shipSkin)) {
    game.settings.shipSkin = "serenity";
  }
}

function initShipSkinSelect() {
  if (!shipSkinSelectEl) return;
  shipSkinSelectEl.replaceChildren();
  for (const opt of SHIP_SKIN_OPTIONS) {
    const el = document.createElement("option");
    el.value = opt.id;
    el.textContent = opt.label;
    shipSkinSelectEl.appendChild(el);
  }
  normalizeShipSkin();
  shipSkinSelectEl.value = game.settings.shipSkin;
}

function preloadShipImages() {
  if (!serenityShipImg) {
    serenityShipImg = new Image();
    serenityShipImg.src = "./assets/serenity.svg";
  }
  if (!fireflyShipImg) {
    fireflyShipImg = new Image();
    fireflyShipImg.src = "./assets/firefly.svg";
  }
  if (!starfighterShipImg) {
    starfighterShipImg = new Image();
    starfighterShipImg.src = "./assets/starfighter.svg";
  }
  ensureIssStationImg();
}

function ensureIssStationImg() {
  if (!issStationImg) {
    issStationImg = new Image();
    issStationImg.src = "./assets/iss-station.svg";
  }
}

function playerInCheckpointRange() {
  const p = game.player;
  if (!p) return false;
  return Math.hypot(p.x - game.goalX, p.y - game.stationY) < stationDockRange();
}

function getShipSkinOption() {
  return (
    SHIP_SKIN_OPTIONS.find((o) => o.id === game.settings.shipSkin) ??
    SHIP_SKIN_OPTIONS.find((o) => o.id === "serenity") ??
    SHIP_SKIN_OPTIONS[0]
  );
}

function getPlayerShipImage() {
  const skin = game.settings.shipSkin;
  if (skin === "serenity" && serenityShipImg?.complete && serenityShipImg.naturalWidth) return serenityShipImg;
  if (skin === "firefly" && fireflyShipImg?.complete && fireflyShipImg.naturalWidth) return fireflyShipImg;
  if (skin === "starfighter" && starfighterShipImg?.complete && starfighterShipImg.naturalWidth)
    return starfighterShipImg;
  return null;
}

/** Enemies always use the starfighter raster when loaded (classic “reaper” silhouette). */
function getHostileShipImage() {
  if (starfighterShipImg?.complete && starfighterShipImg.naturalWidth) return starfighterShipImg;
  return null;
}

function buildLevel(sector) {
  const H = WORLD.height;
  const rng = mulberry32(sector * 100003 + 7);
  const W = 4 * (5200 + sector * 750 + Math.floor(rng() * 500));
  game.levelWidth = W;
  game.goalX = W - 95;
  game.stationY = H * 0.5;
  game.spawnX = 115;
  game.spawnY = H * 0.5;
  game.worldScrollAnchor = 0;

  const gasWalls = [];
  let gx = 0;
  const minFlyGap = H * 0.44;
  while (gx < W - 40) {
    const segW = 88 + rng() * 125;
    let topH = 26 + rng() * (H * 0.2);
    let botH = 28 + rng() * (H * 0.2);
    if (topH + botH > H - minFlyGap) {
      const s = (H - minFlyGap) / (topH + botH);
      topH *= s;
      botH *= s;
    }
    const jagPad = 14;
    topH += jagPad;
    botH += jagPad;
    if (topH + botH > H - minFlyGap) {
      const s = (H - minFlyGap) / (topH + botH);
      topH *= s;
      botH *= s;
    }
    const sTop = Math.floor(rng() * 1e9);
    const sBot = Math.floor(rng() * 1e9);
    gasWalls.push({
      x: gx,
      y: 0,
      w: segW,
      h: topH,
      seed: sTop,
      drift: rng() * Math.PI * 2,
      band: "top",
    });
    gasWalls.push({
      x: gx,
      y: H - botH,
      w: segW,
      h: botH,
      seed: sBot,
      drift: rng() * Math.PI * 2,
      band: "bottom",
    });
    gx += segW;
  }

  const clouds = [];
  const mines = [];
  const coins = [];
  const mysteries = [];
  let x = 320;
  while (x < W - 450) {
    const span = 120 + rng() * 150;

    if (rng() < 0.4) {
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const cw = 70 + rng() * 130;
        const ch = 48 + rng() * 95;
        const cx = clamp(x + rng() * (span + 200), 30, W - cw - 30);
        const cy = 36 + rng() * (H - ch - 48);
        if (
          !cloudOverlapsGasWall(cx, cy, cw, ch, gasWalls) &&
          !cloudOverlapsCloud(cx, cy, cw, ch, clouds)
        ) {
          clouds.push({
            x: cx,
            y: cy,
            w: cw,
            h: ch,
            seed: Math.floor(rng() * 1e9),
            drift: rng() * Math.PI * 2,
          });
          break;
        }
      }
    }
    {
      /** Preserve main RNG stream (legacy mine roll); real mines use even spacing below. */
      const prob = (0.52 + Math.min(0.12, sector * 0.006)) * 0.5;
      if (rng() < prob) {
        rng();
        rng();
        void (MINE_SPEED_BASE + sector * MINE_SPEED_PER_LEVEL + randf(-6, 9));
      }
    }
    if (rng() < 0.38) {
      const pick = COIN_TABLE[Math.min(COIN_TABLE.length - 1, Math.floor(rng() * rng() * 5))];
      coins.push({
        x: x + rng() * 200,
        y: 50 + rng() * (H - 100),
        r: 7 + rng() * 2,
        value: pick.value,
        color: pick.color,
        taken: false,
      });
    }
    if (rng() < 0.11) {
      for (let attempt = 0; attempt < 18; attempt += 1) {
        const mr = 12;
        const mx = x + 70 + rng() * (span + 120);
        const my = 55 + rng() * (H - 110);
        if (mysteryClearOfHazards(mx, my, mr, clouds, gasWalls)) {
          mysteries.push({
            x: mx,
            y: my,
            radius: mr,
            color: "#8b5cff",
            kind: "mystery",
          });
          break;
        }
      }
    }
    x += span;
  }

  {
    /** Even spacing along the full run; count grows with `W` so long sectors stay mined end-to-end. */
    const mineRng = mulberry32(sector * 404_011 + 91);
    const usableSpan = Math.max(900, W - 680);
    let desired = Math.floor(usableSpan / MINE_SPACING_TARGET_PX);
    desired = clamp(desired, MINE_COUNT_MIN, MINE_COUNT_MAX);
    desired = Math.max(desired, 12 + Math.min(16, Math.round(sector * 0.42)));
    desired = Math.min(desired, MINE_COUNT_MAX);
    const step = (W - 720) / Math.max(6, desired);
    let mx = 400 + mineRng() * Math.min(140, step * 0.35);
    while (mx < W - 260) {
      const speed = MINE_SPEED_BASE + sector * MINE_SPEED_PER_LEVEL + (mineRng() * 15 - 6);
      mines.push({
        x: mx + (mineRng() * 70 - 35),
        y: 48 + mineRng() * (H - 96),
        radius: 10,
        vx: 0,
        vy: 0,
        speed,
      });
      mx += step * (0.72 + mineRng() * 0.52);
    }
  }

  game.gasWalls = gasWalls;
  game.clouds = clouds;
  game.mines = mines;
  game.mineExplosions = [];
  game.coins = coins;
  game.mysteries = mysteries;
  game.mysteriesSpawnedFromTimer = 0;
  game.mysterySpawnTimer = randf(9, 15);
  game.meteors = [];
  game.meteorSpawnTimer = randf(METEOR_SPAWN_INTERVAL_MIN, METEOR_SPAWN_INTERVAL_MAX);
  game.gasBlasts = [];
  game.gasBlastTimer = randf(GAS_BLAST_SPAWN_MIN, GAS_BLAST_SPAWN_MAX);
  game.bullets = [];
  game.hostiles = [];
  game.hostileStations = [];
  game.hostileStationSpawnTimer = randf(HOSTILE_STATION_SPAWN_INTERVAL_MIN, HOSTILE_STATION_SPAWN_INTERVAL_MAX);
  game.enemyBullets = [];
  game.hostileSpawnTimer = randf(HOSTILE_SPAWN_INTERVAL_MIN, HOSTILE_SPAWN_INTERVAL_MAX);
  game.smartMissiles = [];
  game.smartMissileFireAcc = 0;
  game.sectorBoss = null;
  game.bossArenaTier = null;
}

function getMysteryTimerSpawnCap() {
  return 4 + Math.floor(game.level / 3);
}

function spawnMysteryAhead() {
  const p = game.player;
  if (!p) return;
  const r = 12;
  const margin = 50;
  const minX = Math.max(margin, game.worldScrollAnchor + 120);
  let x = clamp(p.x + randf(180, 420), minX, game.levelWidth - margin);
  let y = randf(margin, WORLD.height - margin);
  for (let k = 0; k < 16; k += 1) {
    if (mysteryClearOfHazards(x, y, r, game.clouds, game.gasWalls)) break;
    x = clamp(p.x + randf(120, 500), minX, game.levelWidth - margin);
    y = randf(margin, WORLD.height - margin);
  }
  game.mysteries.push({
    x,
    y,
    radius: r,
    color: "#8b5cff",
    kind: "mystery",
  });
}

/** Blaster, hull, immunity, shield, smart missiles, enhanced shields, deflector, secondary, enhanced deflector. */
function rollMysteryPowerupKind() {
  const r = Math.random();
  if (r < 0.22) return 0;
  if (r < 0.37) return 1;
  if (r < 0.51) return 2;
  if (r < 0.65) return 3;
  if (r < 0.76) return 4;
  if (r < 0.85) return 5;
  if (r < 0.91) return 6;
  if (r < 0.925) return 7;
  if (r < 0.965) return 8;
  if (r < 0.977) return 9;
  if (r < 0.989) return 11;
  return 10;
}

function absorbDamage(amount) {
  let a = amount;
  if (game.enhancedShields && game.shield > 0) {
    a *= ENHANCED_SHIELD_DAMAGE_MULT;
  }
  if (game.shield <= 0) {
    game.hull -= a;
    return;
  }
  const fromShield = Math.min(game.shield, a);
  game.shield -= fromShield;
  game.hull -= a - fromShield;
}

function absorbCollisionDamage(amount) {
  absorbDamage(amount);
  if (game.shield < LOW_SHIELD_COLLISION_CHIP_THRESHOLD) {
    game.hull -= LOW_SHIELD_COLLISION_CHIP_DAMAGE;
  }
}

function isBlasterFireHeld() {
  return !!(KEY.KeyF || KEY.Insert || KEY.Enter);
}

function getTravelAimAngle() {
  return getPlayerShotAimAngle();
}

function fireSecondaryVolley() {
  if (!game.started || game.gameOver || game.paused || game.won) return;
  if (!game.hasSecondaryWeapon || game.secondaryCooldown > 0 || !game.player) return;
  const p = game.player;
  const ang = SECONDARY_FORWARD_ANGLE;
  const nx = Math.cos(ang + Math.PI * 0.5);
  const ny = Math.sin(ang + Math.PI * 0.5);
  const fx = Math.cos(ang);
  const fy = Math.sin(ang);
  const spawnSecondary = (side) => {
    const ox = nx * SECONDARY_PAIR_OFFSET * side;
    const oy = ny * SECONDARY_PAIR_OFFSET * side;
    game.bullets.push({
      x: p.x + fx * (p.r + 10) + ox,
      y: p.y + fy * (p.r + 10) + oy,
      vx: fx * SECONDARY_BULLET_SPEED,
      vy: fy * SECONDARY_BULLET_SPEED,
      radius: 5.2,
      life: SECONDARY_BULLET_LIFE,
      damage: playerSecondaryShotDamage(),
      kind: "secondary",
    });
  };
  spawnSecondary(-1);
  spawnSecondary(1);
  game.secondaryCooldown = SECONDARY_FIRE_COOLDOWN;
  if (droneGuardsActive() && game.hasSecondaryWeapon) {
    game.droneSecondaryHalfToggle = !game.droneSecondaryHalfToggle;
    if (game.droneSecondaryHalfToggle) fireDroneGuardsSecondaryVolley();
  }
}

function applyCheatDariusIi() {
  game.shield = MAX_SHIELD;
  game.shieldScoreRegenUnlocked = true;
  game.hasBlaster = true;
  game.blasterTier = 3;
  game.hasSecondaryWeapon = true;
  game.secondaryCooldown = 0;
  game.hasSmartMissiles = true;
  game.smartMissileFireAcc = 0;
  game.smartMissileNextAt = randf(SMART_MISSILE_FIRE_INTERVAL_MIN, SMART_MISSILE_FIRE_INTERVAL_MAX);
  game.enhancedShields = true;
  game.hasDeflector = true;
  statusEl.textContent = "Cheat active: full shield + all weapon upgrades.";
  addOverlay("DARIUSII: Full Arsenal", "#b7f9ff");
}

function droneGuardsActive() {
  return game.droneGuardsTimeRemaining > 0 && game.hasBlaster && game.player;
}

function playerVitalityFullForDroneUnlock() {
  return game.hull >= MAX_HULL - 0.75 && game.shield >= MAX_SHIELD - 0.75;
}

/** Hostile station kill while **your** hull and shield are topped (MAX). */
function tryGrantDroneGuardsFromFlawlessStationKill() {
  if (!playerVitalityFullForDroneUnlock()) return;
  game.droneGuardsTimeRemaining = Math.max(game.droneGuardsTimeRemaining, DRONE_GUARD_DURATION_SEC);
  statusEl.textContent = "Perfect run — wing drones online!";
  addOverlay("Drone guards deployed!", "#9fd8ff");
}

function applyCheatRaptor() {
  game.droneGuardsTimeRemaining = Math.max(game.droneGuardsTimeRemaining, DRONE_GUARD_CHEAT_DURATION_SEC);
  statusEl.textContent = "Cheat: drone wingmen — mirror fire at half rate.";
  addOverlay("RAPTOR: Drone guards", "#9fd8ff");
}

function fireDroneGuardsBlasterVolley() {
  if (!droneGuardsActive()) return;
  const p = game.player;
  const bulletSpeed = BLASTER_BULLET_SPEED;
  const tier = Math.max(1, game.blasterTier || 1);
  let spread = BLASTER_BASE_SPREAD;
  if (tier >= 2) {
    const fwd = clamp(p.vx / (MAX_SPEED * playerMoveSpeedScale()), 0, 1);
    spread *= 1 - BLASTER_SPREAD_FORWARD_TIGHTEN * fwd;
    spread = Math.max(spread, BLASTER_MIN_SPREAD_TIER2PLUS);
  }
  const ang0 = getPlayerShotAimAngle();
  const gap = p.r * DRONE_GUARD_STRAFE_MULT;
  const dr = p.r * DRONE_GUARD_R_MULT;
  const ax = p.x - p.r * DRONE_GUARD_AFT_X_MULT;
  const dmg = playerBlasterDamage();
  const pushBlaster = (cy, ang) => {
    game.bullets.push({
      x: ax + Math.cos(ang) * (dr + 7),
      y: cy + Math.sin(ang) * (dr + 7),
      vx: Math.cos(ang) * bulletSpeed,
      vy: Math.sin(ang) * bulletSpeed,
      radius: 3.5,
      life: BLASTER_BULLET_LIFE,
      damage: dmg,
      kind: "droneBlaster",
    });
  };
  const fanAt = (cy) => {
    if (tier === 1) pushBlaster(cy, ang0);
    else if (tier === 2) {
      pushBlaster(cy, ang0 - spread);
      pushBlaster(cy, ang0);
      pushBlaster(cy, ang0 + spread);
    } else {
      pushBlaster(cy, ang0 - spread);
      pushBlaster(cy, ang0);
      pushBlaster(cy, ang0 + spread);
      const back = ang0 + Math.PI;
      pushBlaster(cy, back - spread);
      pushBlaster(cy, back);
      pushBlaster(cy, back + spread);
    }
  };
  fanAt(p.y - gap);
  fanAt(p.y + gap);
}

function fireDroneGuardsSecondaryVolley() {
  if (!droneGuardsActive() || !game.hasSecondaryWeapon) return;
  const p = game.player;
  const ang = SECONDARY_FORWARD_ANGLE;
  const nx = Math.cos(ang + Math.PI * 0.5);
  const ny = Math.sin(ang + Math.PI * 0.5);
  const fx = Math.cos(ang);
  const fy = Math.sin(ang);
  const gap = p.r * DRONE_GUARD_STRAFE_MULT;
  const dr = p.r * DRONE_GUARD_R_MULT;
  const ax = p.x - p.r * DRONE_GUARD_AFT_X_MULT;
  const dmg = playerSecondaryShotDamage();
  const offS = SECONDARY_PAIR_OFFSET * (dr / p.r);
  for (const cy of [p.y - gap, p.y + gap]) {
    for (const side of [-1, 1]) {
      const ox = nx * offS * side;
      const oy = ny * offS * side;
      game.bullets.push({
        x: ax + fx * (dr + 9) + ox,
        y: cy + fy * (dr + 9) + oy,
        vx: fx * SECONDARY_BULLET_SPEED,
        vy: fy * SECONDARY_BULLET_SPEED,
        radius: 4.6,
        life: SECONDARY_BULLET_LIFE,
        damage: dmg,
        kind: "secondary",
      });
    }
  }
}

/** Brown gas walls only: penetration into the band (not used for purple nebula). */
function brownGasPenetrationPx(gw, p, cy, ch) {
  if (gw.band === "top") {
    const innerBottom = cy + ch;
    return Math.max(0, innerBottom - (p.y - p.r));
  }
  return Math.max(0, p.y + p.r - cy);
}

/** Brown-only depth ramp; purple clouds stay a single flat hit elsewhere. */
function brownGasDamageFromPenetration(penPx, bandThickness, p) {
  const graze = BROWN_GAS_GRAZE_PX;
  const deepSpan = Math.max(bandThickness * 0.55 + p.r * 0.85, graze + 26);
  const t = clamp((penPx - graze) / deepSpan, 0, 1);
  const hasShield = game.shield > 0;
  if (hasShield) {
    const surf = CLOUD_DAMAGE * CLOUD_DAMAGE_WITH_SHIELD_MULT;
    const deep = BROWN_GAS_DEEP * BROWN_GAS_SHIELD_DEEP_MULT;
    return surf + (deep - surf) * t;
  }
  return CLOUD_DAMAGE + (BROWN_GAS_DEEP - CLOUD_DAMAGE) * t;
}

function playerOverlappingBrownGas(p) {
  for (const gw of game.gasWalls) {
    const insetX = gw.w * 0.18;
    const insetY = gw.h * 0.18;
    const cx = gw.x + insetX;
    const cy = gw.y + insetY;
    const cw = gw.w - insetX * 2;
    const ch = gw.h - insetY * 2;
    if (p.x + p.r > cx && p.x - p.r < cx + cw && p.y + p.r > cy && p.y - p.r < cy + ch) return true;
  }
  for (const gb of game.gasBlasts) {
    const yTop = gb.yBase - gb.rise;
    if (gb.rise < 10) continue;
    const insetX = gb.w * 0.16;
    const insetY = Math.min(gb.rise * 0.14, 24);
    const cx = gb.x + insetX;
    const cy = yTop + insetY;
    const cw = gb.w - insetX * 2;
    const ch = gb.rise - insetY * 2;
    if (ch < 8) continue;
    if (p.x + p.r > cx && p.x - p.r < cx + cw && p.y + p.r > cy && p.y - p.r < cy + ch) return true;
  }
  return false;
}

function applyEnhancedDeflectorFuelPickup() {
  if (!game.hasEnhancedDeflector) {
    game.hasEnhancedDeflector = true;
    game.enhancedDeflectorBurstMax = ENHANCED_DEFLECTOR_BURST_START;
    game.enhancedDeflectorBurstLeft = game.enhancedDeflectorBurstMax;
    game.enhancedDeflectorCooldown = 0;
    addOverlay("Enhanced deflector online", "#d4a574");
    statusEl.textContent = "Salvage: enhanced deflector — protected bursts in brown, then cooldown.";
    return;
  }
  if (game.enhancedDeflectorCooldown > 0) {
    game.enhancedDeflectorCooldown = Math.max(0, game.enhancedDeflectorCooldown - ENHANCED_DEFLECTOR_SALVAGE_SEC);
    addOverlay(`Enhanced deflector · −${ENHANCED_DEFLECTOR_SALVAGE_SEC}s cooldown`, "#d4a574");
  } else {
    game.enhancedDeflectorBurstLeft = Math.min(
      game.enhancedDeflectorBurstMax,
      game.enhancedDeflectorBurstLeft + ENHANCED_DEFLECTOR_SALVAGE_SEC
    );
    addOverlay(`Enhanced deflector +${ENHANCED_DEFLECTOR_SALVAGE_SEC}s burst`, "#d4a574");
  }
}

function applyEnhancedDeflectorBurstCapUpgrade() {
  if (!game.hasEnhancedDeflector) {
    applyEnhancedDeflectorFuelPickup();
    return;
  }
  if (game.enhancedDeflectorBurstMax >= ENHANCED_DEFLECTOR_BURST_MAX) {
    if (game.enhancedDeflectorCooldown > 0) {
      game.enhancedDeflectorCooldown = Math.max(0, game.enhancedDeflectorCooldown - ENHANCED_DEFLECTOR_SALVAGE_SEC);
      addOverlay(`Enhanced deflector · −${ENHANCED_DEFLECTOR_SALVAGE_SEC}s cooldown`, "#d4a574");
    } else {
      game.enhancedDeflectorBurstLeft = Math.min(
        game.enhancedDeflectorBurstMax,
        game.enhancedDeflectorBurstLeft + ENHANCED_DEFLECTOR_SALVAGE_SEC
      );
      addOverlay(`Enhanced deflector +${ENHANCED_DEFLECTOR_SALVAGE_SEC}s burst`, "#d4a574");
    }
    return;
  }
  game.enhancedDeflectorBurstMax = Math.min(
    ENHANCED_DEFLECTOR_BURST_MAX,
    game.enhancedDeflectorBurstMax + ENHANCED_DEFLECTOR_BURST_STEP
  );
  game.enhancedDeflectorBurstLeft = Math.min(
    game.enhancedDeflectorBurstMax,
    game.enhancedDeflectorBurstLeft + 1
  );
  addOverlay(`Enhanced deflector · ${game.enhancedDeflectorBurstMax}s burst cap`, "#e8c89a");
}

function applyWeaponPowerUpgrade() {
  if (game.level < WEAPON_UPGRADE_LEVEL_MIN) return;
  game.weaponPowerMult *= WEAPON_UPGRADE_MULT;
  addOverlay(`Weapons +10% (×${game.weaponPowerMult.toFixed(2)})`, "#ffe066");
}

function spawnWeaponUpgradeOrb(x, y) {
  if (game.level < WEAPON_UPGRADE_LEVEL_MIN) return;
  game.mysteries.push({
    x: clamp(x, 22, game.levelWidth - 22),
    y: clamp(y, 22, WORLD.height - 22),
    radius: 10,
    color: "#e8a020",
    kind: "weaponPowerOrb",
  });
}

function spawnReverseBoostOrb(x, y) {
  if (game.hasAcceleratedReverse) return;
  game.mysteries.push({
    x: clamp(x, 22, game.levelWidth - 22),
    y: clamp(y, 22, WORLD.height - 22),
    radius: 10,
    color: "#5ee0c5",
    kind: "reverseBoostOrb",
  });
}

function trySpawnHostileStationReverseBoost(x, y) {
  if (game.hasAcceleratedReverse) return;
  if (Math.random() >= HOSTILE_STATION_REVERSE_BOOST_CHANCE) return;
  spawnReverseBoostOrb(x + randf(-26, 26), y + randf(-18, 18));
}

function trySpawnHostileStationWeaponUpgrade(x, y) {
  if (game.level < WEAPON_UPGRADE_LEVEL_MIN) return;
  if (Math.random() >= HOSTILE_STATION_WEAPON_UPGRADE_CHANCE) return;
  spawnWeaponUpgradeOrb(x + randf(-22, 22), y + randf(-16, 16));
}

function spawnBrownDeflectorOrb(x, y, salvageKind) {
  game.mysteries.push({
    x: clamp(x, 22, game.levelWidth - 22),
    y: clamp(y, 22, WORLD.height - 22),
    radius: 11,
    color: salvageKind === "upgrade" ? "#d4a85c" : "#b87333",
    kind: "brownDeflectorOrb",
    salvageKind,
  });
}

/** Shipwreck-style: score ticks add shield only up to `SHIELD_REGEN_CAP` after first shield orb. */
function applyShieldRegenFromScoreDelta(dScore) {
  if (dScore <= 0 || !game.shieldScoreRegenUnlocked || game.shield >= SHIELD_REGEN_CAP) return;
  const add = dScore * SHIELD_REGEN_PER_SCORE;
  game.shield = Math.min(SHIELD_REGEN_CAP, game.shield + add);
}

/** Shift the whole sector left; advance scroll anchor; sync camera to horizon; cull content that left the frontier. */
function applyMapScrollAndCull(dt) {
  if (sectorBossActive()) {
    const maxCam = Math.max(0, game.levelWidth - WORLD.width);
    game.cameraX = clamp(game.worldScrollAnchor, 0, maxCam);
    return;
  }
  const dx = AUTO_SCROLL_SPEED * dt;
  game.goalX -= dx;
  game.worldScrollAnchor += dx;

  for (const cl of game.clouds) cl.x -= dx;
  for (const gw of game.gasWalls) gw.x -= dx;
  for (const m of game.mines) m.x -= dx;
  for (const r of game.meteors) r.x -= dx;
  for (const c of game.coins) {
    if (!c.taken) c.x -= dx;
  }
  for (const t of game.mysteries) t.x -= dx;
  for (const gb of game.gasBlasts) gb.x -= dx;
  for (const ex of game.mineExplosions) ex.x -= dx;
  for (const b of game.bullets) b.x -= dx;
  for (const h of game.hostiles) h.x -= dx;
  for (const st of game.hostileStations) st.x -= dx;
  for (const eb of game.enemyBullets) eb.x -= dx;
  for (const sm of game.smartMissiles) sm.x -= dx;

  const ax = game.worldScrollAnchor;
  const cullPad = 160;
  game.clouds = game.clouds.filter((cl) => cl.x + cl.w > ax - cullPad);
  game.gasWalls = game.gasWalls.filter((gw) => gw.x + gw.w > ax - cullPad);
  game.mines = game.mines.filter((m) => m.x + m.radius > ax - cullPad);
  game.meteors = game.meteors.filter((r) => r.x + r.radius > ax - cullPad);
  game.coins = game.coins.filter((c) => c.taken || c.x + c.r > ax - cullPad);
  game.mysteries = game.mysteries.filter((t) => t.x + t.radius > ax - cullPad);
  game.gasBlasts = game.gasBlasts.filter((gb) => gb.x + gb.w > ax - cullPad);
  game.mineExplosions = game.mineExplosions.filter((ex) => ex.x + ex.baseR * 4 > ax - cullPad);
  game.bullets = game.bullets.filter((b) => b.x + b.radius > ax - cullPad);
  game.hostiles = game.hostiles.filter((h) => h.x + h.r > ax - cullPad);
  game.hostileStations = game.hostileStations.filter((st) => st.x + st.r * 1.4 > ax - cullPad);
  game.enemyBullets = game.enemyBullets.filter((eb) => eb.x + eb.radius > ax - cullPad);

  const maxCam = Math.max(0, game.levelWidth - WORLD.width);
  game.cameraX = clamp(ax, 0, maxCam);
  game.smartMissiles = game.smartMissiles.filter(
    (sm) =>
      sm.x + sm.radius > game.cameraX - SMART_MISSILE_CULL_LEFT_OF_CAM &&
      sm.x - sm.radius < game.levelWidth + 200
  );
}

/** Shipwreck-style default hull: browns/tan, already in side view (nose +X). */
function drawDefaultClassicShip(ctx, r, flash, bank) {
  ctx.rotate(bank);
  ctx.globalAlpha = flash ? 0.45 : 1;
  ctx.fillStyle = "#6b5038";
  ctx.strokeStyle = "#2a1d14";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 1.85, 0);
  ctx.lineTo(-r * 1.12, -r * 0.88);
  ctx.lineTo(-r * 0.72, 0);
  ctx.lineTo(-r * 1.12, r * 0.88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c4b59a";
  ctx.fillRect(-r * 0.52, -r * 0.34, r * 0.95, r * 0.68);
  ctx.fillStyle = "#4d3928";
  ctx.fillRect(r * 0.06, -r * 0.22, r * 0.64, r * 0.44);
  ctx.strokeStyle = "#3d2e24";
  ctx.lineWidth = 1;
  ctx.strokeRect(r * 0.06, -r * 0.22, r * 0.64, r * 0.44);
}

function applyMysteryPowerup() {
  const roll = rollMysteryPowerupKind();
  if (roll === 0) {
    if (!game.hasBlaster) {
      game.hasBlaster = true;
      game.blasterTier = 1;
      game.blasterCooldown = 0;
      statusEl.textContent = "Mystery prize: blaster online — hold F / Enter / Insert to fire!";
      addOverlay("POWERUP: Blaster Online", "#ffc38d");
    } else if (game.blasterTier === 1) {
      game.blasterTier = 2;
      game.blasterCooldown = 0;
      statusEl.textContent = "Mystery prize: blaster triple spread!";
      addOverlay("POWERUP: Blaster Spread", "#ffc38d");
    } else if (game.blasterTier === 2) {
      game.blasterTier = 3;
      game.blasterCooldown = 0;
      statusEl.textContent = "Mystery prize: rear blaster batteries!";
      addOverlay("POWERUP: Blaster Aft", "#ffc38d");
    } else {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: blaster already max — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    }
  } else if (roll === 1) {
    const repairPowers = [25, 50, 100];
    const heal = repairPowers[Math.floor(randf(0, repairPowers.length))];
    if (game.hull >= MAX_HULL) {
      game.score += MYSTERY_HULL_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: hull already full — +${MYSTERY_HULL_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_HULL_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.hull = Math.min(MAX_HULL, game.hull + heal);
      statusEl.textContent = `Mystery prize: hull repair +${heal}%`;
      addOverlay(`POWERUP: Hull +${heal}%`, "#a9ffbc");
    }
  } else if (roll === 2) {
    if (game.immunityTimer >= 5.2) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: immunity already up — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.immunityTimer = Math.max(game.immunityTimer, 5.5);
      game.invuln = Math.max(game.invuln, 1.2);
      statusEl.textContent = "Mystery prize: temporary immunity!";
      addOverlay("POWERUP: Temporary Immunity", "#bfc8ff");
    }
  } else if (roll === 3) {
    if (game.shield >= MAX_SHIELD) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: shield already max — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.shieldScoreRegenUnlocked = true;
      const boosted = game.shield + 75;
      game.shield = Math.min(MAX_SHIELD, Math.max(SHIELD_POWERUP_MIN_AFTER, boosted));
      statusEl.textContent = "Mystery prize: shield strengthened!";
      addOverlay(`POWERUP: Shield ${Math.round(game.shield)}%`, "#90d5ff");
    }
  } else if (roll === 4) {
    if (game.hasSmartMissiles) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: smart missiles already online — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.hasSmartMissiles = true;
      game.smartMissileFireAcc = 0;
      game.smartMissileNextAt = randf(SMART_MISSILE_FIRE_INTERVAL_MIN, SMART_MISSILE_FIRE_INTERVAL_MAX);
      statusEl.textContent = "Mystery prize: smart missiles — hold fire to launch seekers!";
      addOverlay("POWERUP: Smart Missiles", "#7dffb3");
    }
  } else if (roll === 5) {
    if (game.enhancedShields) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: shields already enhanced — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.enhancedShields = true;
      statusEl.textContent = "Mystery prize: enhanced shields — less damage while shielded!";
      addOverlay("POWERUP: Enhanced Shields", "#90d5ff");
    }
  } else if (roll === 6) {
    if (game.hasDeflector) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: deflector already online — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.hasDeflector = true;
      statusEl.textContent = "Mystery prize: deflector — purple clouds cannot harm you!";
      addOverlay("POWERUP: Deflector", "#b7f9ff");
    }
  } else if (roll === 7) {
    if (game.hasSecondaryWeapon) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: secondary already online — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.hasSecondaryWeapon = true;
      game.secondaryCooldown = 0;
      statusEl.textContent = "Mystery prize: secondary twin cannons (G)!";
      addOverlay("POWERUP: Secondary x2", "#ffe08a");
    }
  } else if (roll === 8) {
    applyEnhancedDeflectorFuelPickup();
    statusEl.textContent = "Mystery prize: enhanced deflector salvage.";
  } else if (roll === 9) {
    const beforeHas = game.hasEnhancedDeflector;
    const maxBefore = game.enhancedDeflectorBurstMax;
    applyEnhancedDeflectorBurstCapUpgrade();
    if (!beforeHas) {
      statusEl.textContent = "Mystery prize: enhanced deflector (coupling).";
    } else if (game.enhancedDeflectorBurstMax > maxBefore) {
      statusEl.textContent = "Mystery prize: enhanced deflector — longer brown burst!";
    } else {
      statusEl.textContent = "Mystery prize: enhanced deflector salvage.";
    }
  } else if (roll === 10) {
    if (game.level < WEAPON_UPGRADE_LEVEL_MIN) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: schematic (sector ${WEAPON_UPGRADE_LEVEL_MIN}+) — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      applyWeaponPowerUpgrade();
      statusEl.textContent = "Mystery prize: weapon capacitors — F and G +10%!";
    }
  } else if (roll === 11) {
    if (game.hasAcceleratedReverse) {
      game.score += MYSTERY_MAXED_BONUS;
      statusEl.textContent = `Mystery prize: reverse drive already fitted — +${MYSTERY_MAXED_BONUS} credits.`;
      addOverlay(`POWERUP: Bonus +${MYSTERY_MAXED_BONUS}`, "#f2e2a0");
    } else {
      game.hasAcceleratedReverse = true;
      statusEl.textContent = "Mystery prize: vectored reverse — faster back thrust and aft ram!";
      addOverlay("POWERUP: Accelerated reverse", "#9dffce");
    }
  }
}

function updatePlayer(dt) {
  const p = game.player;
  game.immunityTimer = Math.max(0, game.immunityTimer - dt);
  game.blasterCooldown = Math.max(0, game.blasterCooldown - dt);
  game.secondaryCooldown = Math.max(0, game.secondaryCooldown - dt);
  game.droneGuardsTimeRemaining = Math.max(0, game.droneGuardsTimeRemaining - dt);

  if (game.started && !game.gameOver && !game.paused && !game.won && game.hasBlaster) {
    if (isBlasterFireHeld()) fireBlasterVolley();
  }
  if (game.hasSmartMissiles && game.started && !game.gameOver && !game.paused && !game.won) {
    if (isBlasterFireHeld()) {
      game.smartMissileFireAcc += dt;
      if (game.smartMissileFireAcc >= game.smartMissileNextAt) {
        game.smartMissileFireAcc -= game.smartMissileNextAt;
        spawnSmartMissile();
        game.smartMissileNextAt = randf(SMART_MISSILE_FIRE_INTERVAL_MIN, SMART_MISSILE_FIRE_INTERVAL_MAX);
      }
    }
  }
  const { ix, iy } = getMovementInputAxes();
  const len = Math.hypot(ix, iy);
  const accel = ACCEL;
  if (len > 0) {
    let hAccel = HORIZ_ACCEL_MULT;
    if (game.hasAcceleratedReverse && ix < 0) hAccel *= REVERSE_THRUST_ACCEL_MULT;
    p.vx += (ix / len) * accel * dt * hAccel;
    p.vy += (iy / len) * accel * dt * VERT_ACCEL_MULT;
  }
  const sm = playerMoveSpeedScale();
  const maxVx = MAX_SPEED * sm;
  const maxVy = MAX_SPEED * VERT_MAX_SPEED_RATIO * sm;
  const n2 = (p.vx / maxVx) ** 2 + (p.vy / maxVy) ** 2;
  if (n2 > 1) {
    const s = 1 / Math.sqrt(n2);
    p.vx *= s;
    p.vy *= s;
  }
  p.vx *= Math.exp(-DRAG_K_HORIZONTAL * dt);
  p.vy *= Math.exp(-DRAG_K_VERTICAL * dt);

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  const m = 24;
  p.y = clamp(p.y, m, WORLD.height - m);

  game.invuln = Math.max(0, game.invuln - dt);

  if (game.hasEnhancedDeflector) {
    if (game.enhancedDeflectorCooldown > 0) {
      game.enhancedDeflectorCooldown = Math.max(0, game.enhancedDeflectorCooldown - dt);
      if (game.enhancedDeflectorCooldown <= 0) {
        game.enhancedDeflectorBurstLeft = game.enhancedDeflectorBurstMax;
      }
    } else if (playerOverlappingBrownGas(p) && game.enhancedDeflectorBurstLeft > 0) {
      game.enhancedDeflectorBurstLeft = Math.max(0, game.enhancedDeflectorBurstLeft - dt);
      if (game.enhancedDeflectorBurstLeft <= 0) {
        game.enhancedDeflectorCooldown = ENHANCED_DEFLECTOR_COOLDOWN_SEC;
      }
    }
  }

  const canHit = game.invuln <= 0 && game.immunityTimer <= 0;

  if (canHit) {
    for (let mi = game.mines.length - 1; mi >= 0; mi -= 1) {
      const h = game.mines[mi];
      const rr = p.r + h.radius;
      if (Math.hypot(p.x - h.x, p.y - h.y) < rr) {
        spawnMineExplosion(h.x, h.y, h.radius);
        game.mines.splice(mi, 1);
        absorbCollisionDamage(MINE_DAMAGE);
        game.invuln = INVULN_HIT;
        addOverlay("Mine hit!", "#ff7a7a");
        p.vx *= -0.4;
        p.vy *= -0.4;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
    for (let ri = game.meteors.length - 1; ri >= 0; ri -= 1) {
      const r = game.meteors[ri];
      const rr = p.r + r.radius;
      if (Math.hypot(p.x - r.x, p.y - r.y) < rr) {
        spawnMineExplosion(r.x, r.y, r.radius);
        game.meteors.splice(ri, 1);
        spawnMeteorDrop(r.x, r.y, r.radius);
        absorbCollisionDamage(r.damage ?? METEOR_DAMAGE_MIN);
        game.invuln = INVULN_HIT;
        addOverlay("Meteor strike!", "#e8c89a");
        p.vx *= -0.35;
        p.vy *= -0.35;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
    for (const cl of game.clouds) {
      const insetX = cl.w * 0.22;
      const insetY = cl.h * 0.22;
      const cx = cl.x + insetX;
      const cy = cl.y + insetY;
      const cw = cl.w - insetX * 2;
      const ch = cl.h - insetY * 2;
      if (p.x + p.r > cx && p.x - p.r < cx + cw && p.y + p.r > cy && p.y - p.r < cy + ch) {
        if (!(game.hasDeflector && game.shield >= DEFLECTOR_MIN_SHIELD)) {
          const nebulaDmg =
            game.shield > 0 ? CLOUD_DAMAGE * CLOUD_DAMAGE_WITH_SHIELD_MULT : CLOUD_DAMAGE;
          absorbDamage(nebulaDmg);
          addOverlay("Nebula burn!", "#d4b8ff");
        }
        game.invuln = INVULN_HIT * 0.65;
        const mx = cx + cw * 0.5;
        const my = cy + ch * 0.5;
        const nx = p.x - mx;
        const ny = p.y - my;
        const nlen = Math.hypot(nx, ny) || 1;
        p.x = mx + (nx / nlen) * (p.r + Math.min(cw, ch) * 0.35 + 6);
        p.y = my + (ny / nlen) * (p.r + Math.min(cw, ch) * 0.35 + 6);
        p.vx *= -0.25;
        p.vy *= -0.25;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
    for (const gw of game.gasWalls) {
      const insetX = gw.w * 0.18;
      const insetY = gw.h * 0.18;
      const cx = gw.x + insetX;
      const cy = gw.y + insetY;
      const cw = gw.w - insetX * 2;
      const ch = gw.h - insetY * 2;
      if (p.x + p.r > cx && p.x - p.r < cx + cw && p.y + p.r > cy && p.y - p.r < cy + ch) {
        const brownProt =
          game.hasEnhancedDeflector &&
          game.enhancedDeflectorCooldown <= 0 &&
          game.enhancedDeflectorBurstLeft > 0;
        if (!brownProt) {
          const pen = brownGasPenetrationPx(gw, p, cy, ch);
          const brownDmg = brownGasDamageFromPenetration(pen, ch, p);
          absorbDamage(brownDmg);
          game.invuln = INVULN_HIT * 0.7;
          addOverlay("Brown gas!", "#d4a574");
          const mx = cx + cw * 0.5;
          const my = cy + ch * 0.5;
          const nx = p.x - mx;
          const ny = p.y - my;
          const nlen = Math.hypot(nx, ny) || 1;
          p.x = mx + (nx / nlen) * (p.r + Math.min(cw, ch) * 0.35 + 6);
          p.y = my + (ny / nlen) * (p.r + Math.min(cw, ch) * 0.35 + 6);
          p.vx *= -0.28;
          p.vy *= -0.28;
          if (game.hull <= 0) game.gameOver = true;
        } else {
          game.invuln = INVULN_HIT * 0.15;
        }
        break;
      }
    }
    for (const gb of game.gasBlasts) {
      const yTop = gb.yBase - gb.rise;
      if (gb.rise < 10) continue;
      const insetX = gb.w * 0.16;
      const insetY = Math.min(gb.rise * 0.14, 24);
      const cx = gb.x + insetX;
      const cy = yTop + insetY;
      const cw = gb.w - insetX * 2;
      const ch = gb.rise - insetY * 2;
      if (ch < 8) continue;
      if (p.x + p.r > cx && p.x - p.r < cx + cw && p.y + p.r > cy && p.y - p.r < cy + ch) {
        const brownProt =
          game.hasEnhancedDeflector &&
          game.enhancedDeflectorCooldown <= 0 &&
          game.enhancedDeflectorBurstLeft > 0;
        if (!brownProt) {
          const pen = clamp(Math.min(p.y + p.r, cy + ch) - Math.max(p.y - p.r, cy), 0, ch);
          const brownDmg = brownGasDamageFromPenetration(pen, ch, p);
          absorbDamage(brownDmg);
          game.invuln = INVULN_HIT * 0.68;
          addOverlay("Gas plume!", "#d4a574");
          const mx = cx + cw * 0.5;
          const my = cy + ch * 0.5;
          const nx = p.x - mx;
          const ny = p.y - my;
          const nlen = Math.hypot(nx, ny) || 1;
          p.x = mx + (nx / nlen) * (p.r + Math.min(cw, ch) * 0.32 + 6);
          p.y = my + (ny / nlen) * (p.r + Math.min(cw, ch) * 0.32 + 6);
          p.vx *= -0.26;
          p.vy *= -0.26;
          if (game.hull <= 0) game.gameOver = true;
        } else {
          game.invuln = INVULN_HIT * 0.15;
        }
        break;
      }
    }
    for (let ei = game.enemyBullets.length - 1; ei >= 0; ei -= 1) {
      const eb = game.enemyBullets[ei];
      const rr = p.r + eb.radius;
      if (Math.hypot(p.x - eb.x, p.y - eb.y) < rr) {
        game.enemyBullets.splice(ei, 1);
        absorbDamage(eb.damage ?? HOSTILE_BULLET_DAMAGE);
        game.invuln = INVULN_HIT * 0.52;
        addOverlay(
          eb.kind === "turret" ? "Station fire!" : eb.kind === "bossFish" ? "Boss fire!" : "Incoming fire!",
          "#ffa8d8"
        );
        p.vx *= -0.22;
        p.vy *= -0.22;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
    for (let hi = game.hostiles.length - 1; hi >= 0; hi -= 1) {
      const h = game.hostiles[hi];
      const rr = p.r + h.r * 0.9;
      if (Math.hypot(p.x - h.x, p.y - h.y) < rr) {
        const backRam = game.hasAcceleratedReverse && p.vx <= REVERSE_RAM_MIN_VX;
        if (backRam) {
          const bodyBefore = h.bodyHp;
          const shieldBefore = h.shield ?? 0;
          const ramDmg = REVERSE_RAM_BASE_DAMAGE * game.weaponPowerMult;
          const killed = applyDamageToHostileShieldFirst(h, ramDmg);
          const threat = clamp(0.3 + 0.15 * bodyBefore + 0.035 * shieldBefore, 0.26, 1);
          absorbCollisionDamage(Math.round(HOSTILE_COLLISION_DAMAGE * threat));
          game.invuln = INVULN_HIT * 0.88;
          addOverlay(killed ? "Reverse ram!" : "Aft ram — hostile holding!", killed ? "#9dffce" : "#ffb090");
          p.vx *= -0.32;
          p.vy *= -0.28;
          if (killed) {
            spawnMineExplosion(h.x, h.y, h.r * 0.85);
            game.hostiles.splice(hi, 1);
            addHostileKillScore();
          }
          if (game.hull <= 0) game.gameOver = true;
          break;
        }
        spawnMineExplosion(h.x, h.y, h.r);
        game.hostiles.splice(hi, 1);
        absorbCollisionDamage(HOSTILE_COLLISION_DAMAGE);
        game.invuln = INVULN_HIT;
        addOverlay("Hostile contact!", "#ff9a9a");
        p.vx *= -0.38;
        p.vy *= -0.38;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
    for (let ti = game.hostileStations.length - 1; ti >= 0; ti -= 1) {
      const st = game.hostileStations[ti];
      const rr = p.r + st.r * 0.88;
      if (Math.hypot(p.x - st.x, p.y - st.y) < rr) {
        absorbCollisionDamage(HOSTILE_STATION_COLLISION_DAMAGE);
        game.invuln = INVULN_HIT * 0.92;
        addOverlay("Station ram!", "#ff7a7a");
        const nx = p.x - st.x;
        const ny = p.y - st.y;
        const nlen = Math.hypot(nx, ny) || 1;
        p.x = st.x + (nx / nlen) * (st.r + p.r + 4);
        p.y = st.y + (ny / nlen) * (st.r + p.r + 4);
        p.vx *= -0.32;
        p.vy *= -0.32;
        if (game.hull <= 0) game.gameOver = true;
        break;
      }
    }
  }

  for (const c of game.coins) {
    if (c.taken) continue;
    if (Math.hypot(p.x - c.x, p.y - c.y) < c.r + p.r * 0.9) {
      c.taken = true;
      game.score += c.value;
    }
  }

  game.mysteries = game.mysteries.filter((t) => {
    const rr = p.r + t.radius;
    if (Math.hypot(p.x - t.x, p.y - t.y) < rr) {
      if (t.kind === "meteorDrop") {
        if (t.reward === "shield") {
          game.shieldScoreRegenUnlocked = true;
          const add = t.shieldAdd ?? 20;
          game.shield = Math.min(MAX_SHIELD, game.shield + add);
          addOverlay(`Meteor cache: Shield +${add}%`, "#90d5ff");
        } else {
          const pts = t.points ?? METEOR_DROP_POINTS_MIN;
          game.score += pts;
          addOverlay(`Meteor cache: +${pts} credits`, "#d7b3ff");
        }
      } else if (t.kind === "brownDeflectorOrb") {
        if (t.salvageKind === "upgrade") applyEnhancedDeflectorBurstCapUpgrade();
        else applyEnhancedDeflectorFuelPickup();
      } else if (t.kind === "weaponPowerOrb") {
        applyWeaponPowerUpgrade();
        statusEl.textContent = "Weapon capacitors — F and G +10% damage.";
      } else if (t.kind === "reverseBoostOrb") {
        if (game.hasAcceleratedReverse) {
          game.score += Math.round(MYSTERY_MAXED_BONUS * 0.75);
          addOverlay("Salvage: duplicate drive — credits", "#f2e2a0");
        } else {
          game.hasAcceleratedReverse = true;
          addOverlay("Accelerated reverse + aft ram", "#9dffce");
          statusEl.textContent = "Reverse thruster upgrade — hold ← for 2× plume; ram hostiles when reversing.";
        }
      } else {
        applyMysteryPowerup();
      }
      return false;
    }
    return true;
  });

  if (!game.won && playerInCheckpointRange() && !sectorBossActive()) {
    triggerSectorWin();
  }

  if (canHit && sectorBossActive() && game.sectorBoss.kind === "l1Fish") {
    const boss = game.sectorBoss;
    const rr = p.r + boss.hitR * 0.9;
    if (Math.hypot(p.x - boss.x, p.y - boss.y) < rr) {
      const smash = boss.state === "smashDash";
      absorbCollisionDamage(
        sectorBossDefaultDamage(smash ? SECTOR_BOSS_L1_SMASH_DMG : SECTOR_BOSS_L1_BODY_DMG)
      );
      game.invuln = INVULN_HIT * (smash ? 1.05 : 0.92);
      addOverlay(smash ? "Boss ram!" : "Boss hull!", "#ff9a9a");
      const nx = p.x - boss.x;
      const ny = p.y - boss.y;
      const nlen = Math.hypot(nx, ny) || 1;
      p.x = boss.x + (nx / nlen) * (boss.hitR * 0.9 + p.r + 6);
      p.y = boss.y + (ny / nlen) * (boss.hitR * 0.9 + p.r + 6);
      p.vx *= -0.35;
      p.vy *= -0.32;
      if (game.hull <= 0) game.gameOver = true;
    }
  }

  /** Viewport slides only with scroll — ship stays inside it; edges do not deal damage. */
  const cam = game.cameraX;
  const leftX = cam + p.r + VIEWPORT_EDGE_PAD;
  const rightX = Math.min(game.levelWidth - m, cam + WORLD.width - p.r - VIEWPORT_EDGE_PAD);
  p.x = clamp(p.x, leftX, rightX);
  if (p.x <= leftX + 0.5 && p.vx < 0) p.vx = 0;
  if (p.x >= rightX - 0.5 && p.vx > 0) p.vx = 0;
}

function updateMines(dt) {
  const p = game.player;
  const H = WORLD.height;
  const Wl = game.levelWidth;
  const lvl = game.level;
  const homing = clamp(0.95 + lvl * 0.02, 0.9, 1.22);

  for (const m of game.mines) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    const len = Math.hypot(dx, dy) || 1;
    const targetVx = (dx / len) * m.speed;
    const targetVy = (dy / len) * m.speed;
    m.vx += (targetVx - m.vx) * homing * dt;
    m.vy += (targetVy - m.vy) * homing * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.x = clamp(m.x, m.radius + 8, Wl - m.radius - 8);
    m.y = clamp(m.y, m.radius + 16, H - m.radius - 16);
  }

  const alive = new Array(game.mines.length).fill(true);
  let chainBoomShield = 0;
  for (let i = 0; i < game.mines.length; i += 1) {
    if (!alive[i]) continue;
    for (let j = i + 1; j < game.mines.length; j += 1) {
      if (!alive[j]) continue;
      const a = game.mines[i];
      const b = game.mines[j];
      const rr = a.radius + b.radius;
      if (Math.hypot(a.x - b.x, a.y - b.y) < rr) {
        spawnMineExplosion(a.x, a.y, a.radius);
        spawnMineExplosion(b.x, b.y, b.radius);
        alive[i] = false;
        alive[j] = false;
        chainBoomShield += MINE_CHAIN_BOOM_SHIELD;
      }
    }
  }
  if (chainBoomShield > 0) {
    game.shield = Math.min(MAX_SHIELD, game.shield + chainBoomShield);
    const msg =
      chainBoomShield === MINE_CHAIN_BOOM_SHIELD
        ? "Chain boom! +5% shield"
        : `Chain boom! +${chainBoomShield}% shield`;
    addOverlay(msg, "#90d5ff");
  }
  game.mines = game.mines.filter((_, idx) => alive[idx]);
}

function spawnMeteor() {
  if (game.meteors.length >= METEOR_MAX_ALIVE) return;
  const H = WORLD.height;
  const cam = game.cameraX;
  const w = WORLD.width;
  const x = cam + w + randf(24, 160);
  const y = randf(40, H - 40);
  const speed = randf(400, 580);
  const flip = Math.random() < 0.5 ? 1 : -1;
  const vx = -speed * 0.76;
  const vy = flip * speed * 0.5;
  const radius = randf(METEOR_RADIUS_MIN, METEOR_RADIUS_MAX);
  const sizeT = clamp((radius - METEOR_RADIUS_MIN) / (METEOR_RADIUS_MAX - METEOR_RADIUS_MIN), 0, 1);
  const damage = METEOR_DAMAGE_MIN + (METEOR_DAMAGE_MAX - METEOR_DAMAGE_MIN) * sizeT;
  game.meteors.push({
    x,
    y,
    vx,
    vy,
    radius,
    damage,
    rot: Math.random() * Math.PI * 2,
    spin: randf(-6, 6),
  });
}

function spawnMeteorDrop(x, y, r) {
  if (Math.random() < METEOR_DROP_BROWN_DEFLECTOR_CHANCE) {
    spawnBrownDeflectorOrb(x, y, "fuel");
    return;
  }
  if (!game.hasAcceleratedReverse && Math.random() < METEOR_DROP_REVERSE_BOOST_CHANCE) {
    spawnReverseBoostOrb(x, y);
    return;
  }
  if (game.level >= WEAPON_UPGRADE_LEVEL_MIN && Math.random() < METEOR_DROP_WEAPON_UPGRADE_CHANCE) {
    spawnWeaponUpgradeOrb(x, y);
    return;
  }
  const isShield = Math.random() < METEOR_DROP_SHIELD_CHANCE;
  const t = clamp((r - METEOR_RADIUS_MIN) / (METEOR_RADIUS_MAX - METEOR_RADIUS_MIN), 0, 1);
  game.mysteries.push({
    x: clamp(x, 22, game.levelWidth - 22),
    y: clamp(y, 22, WORLD.height - 22),
    radius: 12,
    color: "#8b5cff",
    kind: "meteorDrop",
    reward: isShield ? "shield" : "points",
    shieldAdd: Math.round(16 + t * 28),
    points: Math.round(randf(METEOR_DROP_POINTS_MIN, METEOR_DROP_POINTS_MAX) * (0.92 + t * 0.28)),
  });
}

function updateMeteors(dt) {
  const H = WORLD.height;
  const Wl = game.levelWidth;
  for (const r of game.meteors) {
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    r.rot += r.spin * dt;
    r.y = clamp(r.y, r.radius + 14, H - r.radius - 14);
    r.x = Math.min(r.x, Wl - r.radius - 8);
  }
}

function updateMeteorSpawns(dt) {
  if (!game.started || game.gameOver || game.won || sectorBossActive()) return;
  game.meteorSpawnTimer -= dt;
  if (game.meteorSpawnTimer > 0) return;
  spawnMeteor();
  game.meteorSpawnTimer = randf(METEOR_SPAWN_INTERVAL_MIN, METEOR_SPAWN_INTERVAL_MAX);
}

function trySpawnGasBlast() {
  if (game.gasBlasts.length >= GAS_BLAST_MAX_ALIVE) return;
  const H = WORLD.height;
  const cam = game.cameraX;
  const w = WORLD.width;
  game.gasBlasts.push({
    x: cam + w + randf(14, 140),
    yBase: H - randf(10, 52),
    w: 32 + randf(0, 54),
    rise: 0,
    riseSpeed: randf(98, 198),
    maxRise: randf(68, 220),
    life: 0,
    maxLife: randf(1.35, 2.9),
    seed: Math.floor(Math.random() * 1e9),
  });
}

function updateGasBlastSpawns(dt) {
  if (!game.started || game.gameOver || game.won || sectorBossActive()) return;
  game.gasBlastTimer -= dt;
  if (game.gasBlastTimer > 0) return;
  trySpawnGasBlast();
  game.gasBlastTimer = randf(GAS_BLAST_SPAWN_MIN, GAS_BLAST_SPAWN_MAX);
}

function updateGasBlasts(dt) {
  for (const b of game.gasBlasts) {
    b.life += dt;
    b.rise = Math.min(b.maxRise, b.rise + b.riseSpeed * dt);
  }
  game.gasBlasts = game.gasBlasts.filter((b) => b.life < b.maxLife);
}

function addHostileKillScore() {
  game.score += 28 + Math.min(40, game.level * 4);
}

/** Returns true if hostile is destroyed. */
function applyDamageToHostileShieldFirst(h, dmg) {
  let d = dmg;
  if (h.shield > 0) {
    const use = Math.min(h.shield, d);
    h.shield -= use;
    d -= use;
  }
  h.bodyHp -= d;
  return h.bodyHp <= 0;
}

/** Returns true if station hull is destroyed. */
function applyDamageToHostileStationShieldFirst(st, dmg) {
  let d = dmg;
  if (st.shield > 0) {
    const use = Math.min(st.shield, d);
    st.shield -= use;
    d -= use;
  }
  st.bodyHp -= d;
  return st.bodyHp <= 0;
}

function hostileStationSpawnClear(x, y, rad) {
  const pad = HOSTILE_STATION_ISOLATION_PAD;
  for (const h of game.hostiles) {
    if (Math.hypot(h.x - x, h.y - y) < h.r + rad + pad) return false;
  }
  for (const m of game.mines) {
    if (Math.hypot(m.x - x, m.y - y) < m.radius + rad + pad) return false;
  }
  for (const r of game.meteors) {
    if (Math.hypot(r.x - x, r.y - y) < r.radius + rad + pad) return false;
  }
  for (const t of game.mysteries) {
    if (Math.hypot(t.x - x, t.y - y) < t.radius + rad + pad) return false;
  }
  return true;
}

function spawnHostileStation() {
  if (game.level < 2 || game.hostileStations.length >= HOSTILE_STATION_MAX_ALIVE) return;
  const H = WORLD.height;
  const cam = game.cameraX;
  const w = WORLD.width;
  const r = Math.max(34, (game.player?.r ?? 13) * 2.65);
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const x = cam + w + randf(320, 620);
    const y = randf(72, H - 72);
    if (!hostileStationSpawnClear(x, y, r * 1.35)) continue;
    const frac = randf(0.1, 1);
    const shield = Math.min(HOSTILE_STATION_SHIELD_MAX, frac * HOSTILE_STATION_SHIELD_MAX);
    game.hostileStations.push({
      x,
      y,
      r,
      bodyHp: HOSTILE_STATION_BODY_HP + Math.min(24, game.level * 3),
      shield,
      shootTimer: randf(0.2, 0.85),
      spin: Math.random() * Math.PI * 2,
    });
    return;
  }
}

function updateHostileStationSpawns(dt) {
  if (!game.started || game.gameOver || game.won || sectorBossActive() || game.level < 2) return;
  game.hostileStationSpawnTimer -= dt;
  if (game.hostileStationSpawnTimer > 0) return;
  spawnHostileStation();
  game.hostileStationSpawnTimer = randf(HOSTILE_STATION_SPAWN_INTERVAL_MIN, HOSTILE_STATION_SPAWN_INTERVAL_MAX);
}

function updateHostileStations(dt) {
  const p = game.player;
  if (!p) return;
  for (const st of game.hostileStations) {
    st.shootTimer -= dt;
    st.spin += dt * 0.35;
    if (st.shootTimer > 0) continue;
    const dx = p.x - st.x;
    const dy = p.y - st.y;
    const base = Math.atan2(dy, dx);
    const spreads = [-0.52, -0.26, 0, 0.26, 0.52];
    for (const off of spreads) {
      const a = base + off;
      const bx = Math.cos(a);
      const by = Math.sin(a);
      game.enemyBullets.push({
        x: st.x + bx * (st.r + 10),
        y: st.y + by * (st.r + 10),
        vx: bx * HOSTILE_STATION_BULLET_SPEED,
        vy: by * HOSTILE_STATION_BULLET_SPEED,
        radius: 3.8,
        life: 2.5,
        kind: "turret",
        damage: HOSTILE_STATION_BULLET_DAMAGE,
      });
    }
    st.shootTimer = HOSTILE_STATION_FIRE_INTERVAL + game.level * 0.012;
  }
}

function spawnHostile() {
  if (game.hostiles.length >= HOSTILE_MAX_ALIVE) return;
  const H = WORLD.height;
  const cam = game.cameraX;
  const w = WORLD.width;
  const p = game.player;
  const lvl = game.level;
  const speed = HOSTILE_SEEK_SPEED_BASE + lvl * HOSTILE_SEEK_SPEED_PER_LEVEL + randf(-14, 18);
  const pr = p ? p.r : 13;
  let shield = 0;
  if (lvl >= 2 && Math.random() < HOSTILE_RAIDER_SHIELD_CHANCE) {
    const frac = randf(0.06, 1);
    shield = Math.min(HOSTILE_RAIDER_SHIELD_MAX, frac * HOSTILE_RAIDER_SHIELD_MAX);
  }
  game.hostiles.push({
    x: cam + w + randf(36, 200),
    y: randf(52, H - 52),
    vx: 0,
    vy: 0,
    r: pr * 0.92,
    speed,
    bodyHp: 2 + Math.min(2, Math.floor(lvl / 5)),
    shield,
    shootTimer: randf(0.35, 1.15),
    strafePhase: Math.random() * Math.PI * 2,
  });
}

function updateHostileSpawns(dt) {
  if (!game.started || game.gameOver || game.won || sectorBossActive()) return;
  game.hostileSpawnTimer -= dt;
  if (game.hostileSpawnTimer > 0) return;
  spawnHostile();
  game.hostileSpawnTimer = randf(HOSTILE_SPAWN_INTERVAL_MIN, HOSTILE_SPAWN_INTERVAL_MAX);
}

function updateHostiles(dt) {
  const p = game.player;
  const H = WORLD.height;
  const Wl = game.levelWidth;
  const lvl = game.level;
  const homing = clamp(0.42 + lvl * 0.018, 0.38, 0.62);
  if (!p) return;
  for (const h of game.hostiles) {
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    const len = Math.hypot(dx, dy) || 1;
    const strafe = Math.sin(h.strafePhase) * 108;
    h.strafePhase += dt * 1.75;
    const targetVx = (dx / len) * h.speed;
    const targetVy = (dy / len) * h.speed * 0.5 + strafe;
    h.vx += (targetVx - h.vx) * homing * dt * 2.8;
    h.vy += (targetVy - h.vy) * homing * dt * 2.8;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.x = clamp(h.x, h.r + 8, Wl - h.r - 8);
    h.y = clamp(h.y, h.r + 16, H - h.r - 16);
    h.shootTimer -= dt;
    if (h.shootTimer <= 0 && len > 70 && len < 880) {
      const bx = dx / len;
      const by = dy / len;
      game.enemyBullets.push({
        x: h.x + bx * (h.r + 6),
        y: h.y + by * (h.r + 6),
        vx: bx * HOSTILE_BULLET_SPEED,
        vy: by * HOSTILE_BULLET_SPEED,
        radius: 3.6,
        life: 2.4,
        kind: "raider",
        damage: HOSTILE_BULLET_DAMAGE,
      });
      h.shootTimer = randf(0.75, 1.65) + lvl * 0.025;
    }
  }
}

function updateEnemyBullets(dt) {
  const H = WORLD.height;
  for (const b of game.enemyBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  game.enemyBullets = game.enemyBullets.filter(
    (b) => b.life > 0 && b.y > -40 && b.y < H + 40 && b.x > -60 && b.x < game.levelWidth + 100
  );
}

function canShootBlaster() {
  return (
    game.hasBlaster &&
    game.blasterCooldown <= 0 &&
    !game.paused &&
    game.started &&
    !game.gameOver &&
    !game.won
  );
}

function findSmartMissileAimPoint(mx, my, mvx, maxDist) {
  let bx = 0;
  let by = 0;
  let bd = maxDist;
  const headingRight = mvx >= 0;
  const forwardPad = 20;
  const boss = game.sectorBoss;
  if (boss && boss.kind === "l1Fish") {
    const d = Math.hypot(boss.x - mx, boss.y - my);
    if (d < bd) {
      bd = d;
      bx = boss.x;
      by = boss.y;
    }
  }
  const consider = (list, forwardOnly) => {
    for (const o of list) {
      if (forwardOnly) {
        if (headingRight && o.x < mx - forwardPad) continue;
        if (!headingRight && o.x > mx + forwardPad) continue;
      }
      const d = Math.hypot(o.x - mx, o.y - my);
      if (d < bd) {
        bd = d;
        bx = o.x;
        by = o.y;
      }
    }
  };
  // Prefer targets ahead of current missile travel direction.
  consider(game.hostiles, true);
  consider(game.hostileStations, true);
  consider(game.mines, true);
  consider(game.meteors, true);
  // Fallback: if nothing forward, allow any direction.
  if (bd >= maxDist) {
    consider(game.hostiles, false);
    consider(game.hostileStations, false);
    consider(game.mines, false);
    consider(game.meteors, false);
  }
  if (bd < maxDist) return { x: bx, y: by };
  const ang = getPlayerShotAimAngle();
  return { x: mx + Math.cos(ang) * 520, y: my + Math.sin(ang) * 520 };
}

function spawnSmartMissile() {
  if (!game.player || !game.hasSmartMissiles) return;
  if (game.smartMissiles.length >= SMART_MISSILE_MAX_ALIVE) return;
  const p = game.player;
  const ang = getPlayerShotAimAngle();
  const spd =
    (MINE_SPEED_BASE + game.level * MINE_SPEED_PER_LEVEL + randf(-5, 12)) * SMART_MISSILE_SPEED_MULT;
  game.smartMissiles.push({
    x: p.x + Math.cos(ang) * (p.r + 16),
    y: p.y + Math.sin(ang) * (p.r + 16),
    vx: Math.cos(ang) * spd * 0.4,
    vy: Math.sin(ang) * spd * 0.4,
    radius: 8,
    speed: spd,
  });
}

function updateSmartMissiles(dt) {
  const H = WORLD.height;
  const Wl = game.levelWidth;
  const lvl = game.level;
  const homing = clamp(
    SMART_MISSILE_HOMING_BASE + lvl * SMART_MISSILE_HOMING_PER_LEVEL,
    1.08,
    1.65
  );
  for (const s of game.smartMissiles) {
    const tgt = findSmartMissileAimPoint(s.x, s.y, s.vx, 3400);
    const dx = tgt.x - s.x;
    const dy = tgt.y - s.y;
    const len = Math.hypot(dx, dy) || 1;
    const targetVx = (dx / len) * s.speed;
    const targetVy = (dy / len) * s.speed;
    s.vx += (targetVx - s.vx) * homing * dt;
    s.vy += (targetVy - s.vy) * homing * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.x = clamp(s.x, s.radius + 8, Wl - s.radius - 8);
    s.y = clamp(s.y, s.radius + 16, H - s.radius - 16);
  }
}

function handleSmartMissileHits() {
  if (game.smartMissiles.length === 0) return;
  const aliveS = new Array(game.smartMissiles.length).fill(true);
  const aliveH = new Array(game.hostiles.length).fill(true);
  const aliveSt = new Array(game.hostileStations.length).fill(true);
  const aliveM = new Array(game.mines.length).fill(true);
  const aliveR = new Array(game.meteors.length).fill(true);

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const b = game.sectorBoss;
    if (!b || b.kind !== "l1Fish") continue;
    const s = game.smartMissiles[si];
    const hurtR = b.hitR * 0.88;
    if (Math.hypot(s.x - b.x, s.y - b.y) < s.radius + hurtR) {
      aliveS[si] = false;
      spawnMineExplosion(s.x, s.y, s.radius);
      if (b.vulnerable) {
        b.hp -= smartMissileImpactDamage();
        spawnMineExplosion(b.x + randf(-16, 16), b.y + randf(-12, 12), 20);
        if (b.hp <= 0) completeBossArenaVictory();
      }
    }
  }

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const s = game.smartMissiles[si];
    for (let hi = 0; hi < game.hostiles.length; hi += 1) {
      if (!aliveH[hi]) continue;
      const h = game.hostiles[hi];
      if (Math.hypot(s.x - h.x, s.y - h.y) < s.radius + h.r) {
        aliveS[si] = false;
        spawnMineExplosion(s.x, s.y, s.radius);
        if (applyDamageToHostileShieldFirst(h, smartMissileImpactDamage())) {
          spawnMineExplosion(h.x, h.y, h.r * 0.85);
          aliveH[hi] = false;
          addHostileKillScore();
        }
        break;
      }
    }
  }

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const s = game.smartMissiles[si];
    for (let ti = 0; ti < game.hostileStations.length; ti += 1) {
      if (!aliveSt[ti]) continue;
      const st = game.hostileStations[ti];
      const hitR = st.shield > 0 ? st.r * 1.34 : st.r;
      if (Math.hypot(s.x - st.x, s.y - st.y) < s.radius + hitR) {
        aliveS[si] = false;
        spawnMineExplosion(s.x, s.y, s.radius);
        if (applyDamageToHostileStationShieldFirst(st, smartMissileImpactDamage())) {
          spawnMineExplosion(st.x, st.y, st.r * 1.1);
          aliveSt[ti] = false;
          game.score += 52 + Math.min(50, game.level * 5);
          spawnBrownDeflectorOrb(st.x, st.y, "fuel");
          trySpawnHostileStationWeaponUpgrade(st.x, st.y);
          trySpawnHostileStationReverseBoost(st.x, st.y);
          tryGrantDroneGuardsFromFlawlessStationKill();
        }
        break;
      }
    }
  }

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const s = game.smartMissiles[si];
    for (let mi = 0; mi < game.mines.length; mi += 1) {
      if (!aliveM[mi]) continue;
      const m = game.mines[mi];
      if (Math.hypot(s.x - m.x, s.y - m.y) < s.radius + m.radius) {
        spawnMineExplosion(m.x, m.y, m.radius);
        spawnMineExplosion(s.x, s.y, s.radius);
        aliveS[si] = false;
        aliveM[mi] = false;
        break;
      }
    }
  }

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const s = game.smartMissiles[si];
    for (let ri = 0; ri < game.meteors.length; ri += 1) {
      if (!aliveR[ri]) continue;
      const r = game.meteors[ri];
      if (Math.hypot(s.x - r.x, s.y - r.y) < s.radius + r.radius) {
        spawnMineExplosion(r.x, r.y, r.radius);
        spawnMeteorDrop(r.x, r.y, r.radius);
        spawnMineExplosion(s.x, s.y, s.radius);
        aliveS[si] = false;
        aliveR[ri] = false;
        break;
      }
    }
  }

  game.smartMissiles = game.smartMissiles.filter((_, i) => aliveS[i]);
  game.hostiles = game.hostiles.filter((_, i) => aliveH[i]);
  game.hostileStations = game.hostileStations.filter((_, i) => aliveSt[i]);
  game.mines = game.mines.filter((_, i) => aliveM[i]);
  game.meteors = game.meteors.filter((_, i) => aliveR[i]);
}

function fireBlasterVolley() {
  if (!canShootBlaster()) return;
  const p = game.player;
  const bulletSpeed = BLASTER_BULLET_SPEED;
  const tier = Math.max(1, game.blasterTier || 1);
  let spread = BLASTER_BASE_SPREAD;
  if (tier >= 2) {
    const fwd = clamp(p.vx / (MAX_SPEED * playerMoveSpeedScale()), 0, 1);
    spread *= 1 - BLASTER_SPREAD_FORWARD_TIGHTEN * fwd;
    spread = Math.max(spread, BLASTER_MIN_SPREAD_TIER2PLUS);
  }
  const spawnBullet = (ang) => {
    game.bullets.push({
      x: p.x + Math.cos(ang) * (p.r + 8),
      y: p.y + Math.sin(ang) * (p.r + 8),
      vx: Math.cos(ang) * bulletSpeed,
      vy: Math.sin(ang) * bulletSpeed,
      radius: 4,
      life: BLASTER_BULLET_LIFE,
      damage: playerBlasterDamage(),
    });
  };
  const ang0 = getPlayerShotAimAngle();
  if (tier === 1) {
    spawnBullet(ang0);
  } else if (tier === 2) {
    spawnBullet(ang0 - spread);
    spawnBullet(ang0);
    spawnBullet(ang0 + spread);
  } else {
    spawnBullet(ang0 - spread);
    spawnBullet(ang0);
    spawnBullet(ang0 + spread);
    const back = ang0 + Math.PI;
    spawnBullet(back - spread);
    spawnBullet(back);
    spawnBullet(back + spread);
  }
  game.blasterCooldown = 0.18;
  if (droneGuardsActive()) {
    game.droneBlasterHalfToggle = !game.droneBlasterHalfToggle;
    if (game.droneBlasterHalfToggle) fireDroneGuardsBlasterVolley();
  }
}

function updateBullets(dt) {
  const H = WORLD.height;
  for (const b of game.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  game.bullets = game.bullets.filter(
    (b) => b.life > 0 && b.y > -50 && b.y < H + 50 && b.x < game.levelWidth + 80
  );
}

/** Player shots and hostile shots (stations, raiders, boss) mutually cancel on contact. */
function handlePlayerBulletVsEnemyBulletHits() {
  if (game.bullets.length === 0 || game.enemyBullets.length === 0) return;
  const aliveB = new Array(game.bullets.length).fill(true);
  const aliveE = new Array(game.enemyBullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveB[bi]) continue;
    const b = game.bullets[bi];
    for (let ei = 0; ei < game.enemyBullets.length; ei += 1) {
      if (!aliveE[ei]) continue;
      const eb = game.enemyBullets[ei];
      const rr = b.radius + eb.radius;
      if (Math.hypot(b.x - eb.x, b.y - eb.y) < rr) {
        aliveB[bi] = false;
        aliveE[ei] = false;
        spawnMineExplosion((b.x + eb.x) * 0.5, (b.y + eb.y) * 0.5, 7);
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveB[idx]);
  game.enemyBullets = game.enemyBullets.filter((_, idx) => aliveE[idx]);
}

function handleBulletMineHits() {
  if (game.bullets.length === 0 || game.mines.length === 0) return;
  const aliveMines = new Array(game.mines.length).fill(true);
  const aliveBullets = new Array(game.bullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveBullets[bi]) continue;
    const b = game.bullets[bi];
    for (let mi = 0; mi < game.mines.length; mi += 1) {
      if (!aliveMines[mi]) continue;
      const m = game.mines[mi];
      const rr = b.radius + m.radius;
      if (Math.hypot(b.x - m.x, b.y - m.y) < rr) {
        spawnMineExplosion(m.x, m.y, m.radius);
        aliveBullets[bi] = false;
        aliveMines[mi] = false;
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveBullets[idx]);
  game.mines = game.mines.filter((_, idx) => aliveMines[idx]);
}

function handleBulletMeteorHits() {
  if (game.bullets.length === 0 || game.meteors.length === 0) return;
  const aliveMeteors = new Array(game.meteors.length).fill(true);
  const aliveBullets = new Array(game.bullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveBullets[bi]) continue;
    const b = game.bullets[bi];
    for (let ri = 0; ri < game.meteors.length; ri += 1) {
      if (!aliveMeteors[ri]) continue;
      const r = game.meteors[ri];
      const rr = b.radius + r.radius;
      if (Math.hypot(b.x - r.x, b.y - r.y) < rr) {
        spawnMineExplosion(r.x, r.y, r.radius);
        spawnMeteorDrop(r.x, r.y, r.radius);
        aliveBullets[bi] = false;
        aliveMeteors[ri] = false;
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveBullets[idx]);
  game.meteors = game.meteors.filter((_, idx) => aliveMeteors[idx]);
}

function handleBulletHostileHits() {
  if (game.bullets.length === 0 || game.hostiles.length === 0) return;
  const aliveH = new Array(game.hostiles.length).fill(true);
  const aliveB = new Array(game.bullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveB[bi]) continue;
    const b = game.bullets[bi];
    for (let hi = 0; hi < game.hostiles.length; hi += 1) {
      if (!aliveH[hi]) continue;
      const h = game.hostiles[hi];
      const rr = b.radius + h.r;
      if (Math.hypot(b.x - h.x, b.y - h.y) < rr) {
        aliveB[bi] = false;
        if (applyDamageToHostileShieldFirst(h, b.damage ?? 1)) {
          spawnMineExplosion(h.x, h.y, h.r * 0.85);
          aliveH[hi] = false;
          addHostileKillScore();
        }
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveB[idx]);
  game.hostiles = game.hostiles.filter((_, idx) => aliveH[idx]);
}

function handleBulletStationHits() {
  if (game.bullets.length === 0 || game.hostileStations.length === 0) return;
  const aliveSt = new Array(game.hostileStations.length).fill(true);
  const aliveB = new Array(game.bullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveB[bi]) continue;
    const b = game.bullets[bi];
    for (let ti = 0; ti < game.hostileStations.length; ti += 1) {
      if (!aliveSt[ti]) continue;
      const st = game.hostileStations[ti];
      const hitR = st.shield > 0 ? st.r * 1.34 : st.r;
      if (Math.hypot(b.x - st.x, b.y - st.y) < b.radius + hitR) {
        aliveB[bi] = false;
        if (applyDamageToHostileStationShieldFirst(st, b.damage ?? 1)) {
          spawnMineExplosion(st.x, st.y, st.r * 1.1);
          aliveSt[ti] = false;
          game.score += 52 + Math.min(50, game.level * 5);
          spawnBrownDeflectorOrb(st.x, st.y, "fuel");
          trySpawnHostileStationWeaponUpgrade(st.x, st.y);
          trySpawnHostileStationReverseBoost(st.x, st.y);
          tryGrantDroneGuardsFromFlawlessStationKill();
        }
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveB[idx]);
  game.hostileStations = game.hostileStations.filter((_, idx) => aliveSt[idx]);
}

function sectorBossActive() {
  return game.sectorBoss != null;
}

/** Boss tier after clearing `sectorLevel` (null = dock goes straight to next sector). */
function getBossTierForSector(sectorLevel) {
  if (!game.settings.sectorBossFights) return null;
  if (sectorLevel === 1) return 1;
  if (sectorLevel === 2) return 2;
  return null;
}

function triggerSectorWin() {
  game.won = true;
  game.paused = true;
  game.pendingBossAfterStation = false;
  game.advanceLevelAfterBoss = false;
  const bonus = 220 + game.level * 90;
  game.score += bonus;
  addOverlay(`Station checkpoint! +${bonus}`, "#9dff9d");
  if (getBossTierForSector(game.level) != null) {
    game.pendingBossAfterStation = true;
    statusEl.textContent = "Sector clear — Space / tap for boss arena.";
  } else {
    statusEl.textContent = "Sector clear — Space or tap for next sector.";
  }
}

function buildBossArena(tier) {
  const H = WORLD.height;
  const W = WORLD.width + 340;
  game.levelWidth = W;
  game.goalX = W + 500;
  game.stationY = -99999;
  game.spawnX = 118;
  game.spawnY = H * 0.5;
  game.worldScrollAnchor = 0;
  game.cameraX = 0;
  game.gasWalls = [];
  game.clouds = [];
  game.mines = [];
  game.coins = [];
  game.mysteries = [];
  game.mysteriesSpawnedFromTimer = 0;
  game.mysterySpawnTimer = 999;
  game.meteors = [];
  game.meteorSpawnTimer = 99999;
  game.gasBlasts = [];
  game.gasBlastTimer = 99999;
  game.bullets = [];
  game.hostiles = [];
  game.hostileStations = [];
  game.hostileStationSpawnTimer = 99999;
  game.hostileSpawnTimer = 99999;
  game.enemyBullets = [];
  game.smartMissiles = [];
  game.smartMissileFireAcc = 0;
  game.sectorBoss = null;
  game.mineExplosions = [];
  game.bossArenaTier = tier;
}

function initBossForTier(tier) {
  if (game.sectorBoss) return;
  const p = game.player;
  if (!p) return;
  const H = WORLD.height;
  const anchorX = clamp(game.cameraX + WORLD.width * 0.74, 260, game.levelWidth - 95);
  const baseY = H * 0.5;
  const hpMult = 1 + Math.max(0, tier - 1) * 0.34;
  const rMult = 1 + Math.max(0, tier - 1) * 0.065;
  const hitR = Math.max(88, p.r * SECTOR_BOSS_L1_HIT_R_MULT * rMult);
  const maxHp = Math.round(SECTOR_BOSS_L1_HP * hpMult * SECTOR_BOSS_DEFAULT_STAT_MULT);
  game.sectorBoss = {
    kind: "l1Fish",
    tier,
    anchorX,
    baseY,
    phase: 0,
    x: anchorX,
    y: baseY,
    hitR,
    hp: maxHp,
    maxHp,
    state: "patrol",
    stateT: 2.85 + Math.random() * 0.55,
    volleyCount: 0,
    fireAcc: 0,
    dashVx: 0,
    dashVy: 0,
    dashEndX: anchorX,
    vulnerable: false,
  };
}

function enterBossArena(tier) {
  buildBossArena(tier);
  const p = game.player;
  if (p) {
    p.x = game.spawnX;
    p.y = game.spawnY;
    p.vx = 0;
    p.vy = 0;
  }
  game.bullets = [];
  game.enemyBullets = [];
  game.mineExplosions = [];
  initBossForTier(tier);
  addOverlay(`Boss arena — tier ${tier}`, "#7ec8ff");
  statusEl.textContent = "Shielded except while it fires — dodge the charge.";
}

function completeBossArenaVictory() {
  if (game.advanceLevelAfterBoss) return;
  game.sectorBoss = null;
  game.bossArenaTier = null;
  game.score += SECTOR_BOSS_L1_KILL_SCORE + Math.min(60, game.level * 8);
  game.won = true;
  game.paused = true;
  game.advanceLevelAfterBoss = true;
  game.weaponFlatBonus += 10;
  game.playerSpeedMult *= 1.01;
  addOverlay("Boss destroyed!", "#9dffce");
  addOverlay("Salvage: +10 shot damage · +1% move speed", "#c8ffd8");
  statusEl.textContent = "Boss down — Space for next sector.";
}

function spawnSectorBossL1Fireball(boss, p) {
  const dx = p.x - boss.x;
  const dy = p.y - boss.y;
  const len = Math.hypot(dx, dy) || 1;
  const bx = dx / len;
  const by = dy / len;
  const tier = boss.tier ?? 1;
  const dmg = sectorBossDefaultDamage(
    tier === 1 ? SECTOR_BOSS_L1_FIREBALL_DMG : SECTOR_BOSS_L2_FIREBALL_DMG
  );
  const spd = tier === 1 ? SECTOR_BOSS_L1_FIREBALL_SPEED : 395;
  game.enemyBullets.push({
    x: boss.x - boss.hitR * 0.55,
    y: boss.y + (Math.random() - 0.5) * 22,
    vx: bx * spd,
    vy: by * spd,
    radius: tier === 1 ? 9.5 : 9,
    life: 2.8,
    kind: "bossFish",
    damage: dmg,
  });
}

function updateSectorBoss(dt) {
  const boss = game.sectorBoss;
  if (!boss || boss.kind !== "l1Fish") return;
  const p = game.player;
  const H = WORLD.height;

  boss.stateT -= dt;

  const applySway = () => {
    boss.phase += dt * 0.95;
    boss.x = boss.anchorX + Math.sin(boss.phase) * SECTOR_BOSS_L1_SWAY_X;
    boss.y = boss.baseY + Math.cos(boss.phase * 0.72) * SECTOR_BOSS_L1_SWAY_Y;
    boss.y = clamp(boss.y, boss.hitR + 40, H - boss.hitR - 40);
  };

  if (boss.state === "smashDash") {
    boss.vulnerable = false;
    boss.x += boss.dashVx * dt;
    boss.y += boss.dashVy * dt;
    boss.y = clamp(boss.y, boss.hitR + 36, H - boss.hitR - 36);
    if (boss.x <= (boss.dashEndX ?? game.cameraX - boss.hitR) || boss.stateT <= 0) {
      boss.anchorX = clamp(boss.x, game.cameraX + WORLD.width * 0.48, game.levelWidth - 100);
      boss.baseY = boss.y;
      boss.state = "patrol";
      boss.stateT = 2.6 + Math.random() * 0.9;
    }
    return;
  }

  applySway();

  if (boss.state === "patrol") {
    boss.vulnerable = false;
    if (boss.stateT <= 0) {
      const doSmash = boss.volleyCount >= 1 && boss.volleyCount % 2 === 0 && Math.random() < 0.62;
      if (doSmash) {
        boss.state = "smashWind";
        boss.stateT = 0.68;
      } else {
        boss.state = "volley";
        const tier = boss.tier ?? 1;
        boss.stateT = tier === 1 ? SECTOR_BOSS_L1_VOLLEY_DURATION : 1.78;
        boss.fireAcc = 0;
        boss.volleyCount += 1;
      }
    }
    return;
  }

  if (boss.state === "smashWind") {
    boss.vulnerable = false;
    if (boss.stateT <= 0) {
      if (p) {
        boss.state = "smashDash";
        const dy = p.y - boss.y;
        const ny = clamp(dy * 1.15, -1, 1);
        const sm = SECTOR_BOSS_DEFAULT_STAT_MULT;
        boss.dashVx = Math.round(-618 * sm);
        boss.dashVy = Math.round(ny * 360 * sm);
        boss.dashEndX = game.cameraX - boss.hitR - 18;
        const dashDist = Math.max(80, boss.x - boss.dashEndX);
        const dashSpeed = Math.max(1, Math.abs(boss.dashVx));
        boss.stateT = dashDist / dashSpeed + 0.35;
      } else {
        boss.state = "patrol";
        boss.stateT = 2.2;
      }
    }
    return;
  }

  if (boss.state === "volley") {
    boss.vulnerable = true;
    boss.fireAcc += dt;
    const fireEvery = (boss.tier ?? 1) === 1 ? SECTOR_BOSS_L1_FIRE_INTERVAL : 0.27;
    if (p && boss.fireAcc >= fireEvery) {
      boss.fireAcc = 0;
      spawnSectorBossL1Fireball(boss, p);
    }
    if (boss.stateT <= 0) {
      boss.state = "patrol";
      boss.stateT = 2.5 + Math.random() * 1.1;
      boss.vulnerable = false;
    }
  }
}

function handleBulletSectorBossHits() {
  const boss = game.sectorBoss;
  if (!boss || boss.kind !== "l1Fish" || !boss.vulnerable || game.bullets.length === 0) return;
  const hurtR = boss.hitR * 0.88;
  const aliveB = new Array(game.bullets.length).fill(true);
  for (let bi = 0; bi < game.bullets.length; bi += 1) {
    if (!aliveB[bi]) continue;
    const b = game.bullets[bi];
    if (Math.hypot(b.x - boss.x, b.y - boss.y) < b.radius + hurtR) {
      aliveB[bi] = false;
      boss.hp -= b.damage ?? 1;
      spawnMineExplosion(boss.x + randf(-20, 20), boss.y + randf(-14, 14), 22);
      if (boss.hp <= 0) {
        completeBossArenaVictory();
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveB[idx]);
}

/** Jagged Darius-style shield outline (ellipse sampled with noise). */
function bossJaggedAuraPath(ctx, r, ts, wind, extraAmp) {
  const n = 52;
  const amp = (wind ? 0.11 : 0.065) + extraAmp;
  ctx.beginPath();
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const wobble =
      1 +
      amp * Math.sin(a * 6 + ts * 0.019) * Math.sin(a * 11 + ts * 0.014) +
      0.06 * Math.sin(a * 17 + ts * 0.022);
    const squashX = 1.05 + 0.1 * Math.cos(a * 2);
    const squashY = 0.72 + 0.08 * Math.sin(a * 3);
    const x = Math.cos(a) * r * 1.38 * squashX * wobble;
    const y = Math.sin(a) * r * 0.78 * squashY * wobble;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSectorBossWorld() {
  const boss = game.sectorBoss;
  if (!boss || boss.kind !== "l1Fish") return;
  const r = boss.hitR;
  const tier = boss.tier ?? 1;
  const shielded = !boss.vulnerable;
  const wind = boss.state === "smashWind";
  const ts = game.lastTs;
  const pulse = 0.5 + 0.5 * Math.sin(ts * 0.011);

  const warm = tier >= 2;
  const blueA = warm ? "#3a1a22" : "#0a2248";
  const blueB = warm ? "#6a3040" : "#1a4a8c";
  const blueC = warm ? "#4a2030" : "#2566b8";
  const blueHi = warm ? "#a06070" : "#4a9ee8";
  const scaleShadow = warm ? "#2a1018" : "#061830";
  const silver = warm ? "#8a7878" : "#a8b4c4";
  const silverDeep = warm ? "#4a3c40" : "#5a6878";
  const trim = warm ? "#d8a878" : "#c8dce8";
  const vent = warm ? "#ff4048" : "#ff3038";

  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.scale(-1, 1);

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#010208";
  ctx.beginPath();
  ctx.ellipse(12, r * 0.28, r * 1.12, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (shielded || wind) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    bossJaggedAuraPath(ctx, r, ts, wind, pulse * 0.04);
    const ag = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r * 1.55);
    ag.addColorStop(0, wind ? "rgba(255,248,200,0.55)" : `rgba(255,210,90,${0.25 + pulse * 0.2})`);
    ag.addColorStop(0.35, "rgba(255,130,40,0.28)");
    ag.addColorStop(0.7, "rgba(255,60,20,0.12)");
    ag.addColorStop(1, "rgba(120,20,10,0)");
    ctx.fillStyle = ag;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    bossJaggedAuraPath(ctx, r, ts + 40, wind, pulse * 0.03);
    ctx.strokeStyle = wind ? "rgba(255,240,160,0.85)" : `rgba(255,200,80,${0.55 + pulse * 0.25})`;
    ctx.lineWidth = wind ? 3.2 : 2.4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,200,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(r * 0.98, r * 0.42);
  ctx.bezierCurveTo(r * 0.35, r * 0.58, -r * 0.55, r * 0.52, -r * 1.38, r * 0.28);
  ctx.bezierCurveTo(-r * 1.48, r * 0.12, -r * 1.42, 0, -r * 1.38, -r * 0.28);
  ctx.bezierCurveTo(-r * 0.55, -r * 0.52, r * 0.35, -r * 0.58, r * 0.98, -r * 0.42);
  ctx.bezierCurveTo(r * 1.02, -r * 0.08, r * 1.02, r * 0.08, r * 0.98, r * 0.42);
  ctx.closePath();
  const bellyG = ctx.createLinearGradient(0, r * 0.55, 0, -r * 0.55);
  bellyG.addColorStop(0, silverDeep);
  bellyG.addColorStop(0.45, silver);
  bellyG.addColorStop(1, silverDeep);
  ctx.fillStyle = bellyG;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,60,70,0.5)";
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.85;
  for (let k = 0; k < 9; k += 1) {
    const tx = -r * 1.15 + k * r * 0.28;
    const ty = r * 0.08 + Math.sin(k * 1.7) * r * 0.06;
    ctx.beginPath();
    ctx.arc(tx, ty, r * 0.028, 0, Math.PI * 2);
    ctx.fillStyle = vent;
    ctx.globalAlpha = 0.35 + pulse * 0.25;
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const drawArmoredScale = (cx, cy, rot, sc, shade) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(sc, sc * 1.08);
    const sg = ctx.createLinearGradient(-r * 0.14, -r * 0.14, r * 0.14, r * 0.14);
    sg.addColorStop(0, shade);
    sg.addColorStop(0.45, blueHi);
    sg.addColorStop(1, scaleShadow);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.13);
    ctx.lineTo(r * 0.11, 0);
    ctx.lineTo(0, r * 0.13);
    ctx.lineTo(-r * 0.11, 0);
    ctx.closePath();
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,235,255,0.2)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  };

  const nScales = 17;
  for (let i = 0; i < nScales; i += 1) {
    const t = i / (nScales - 1);
    const cx = -r * 1.12 + t * r * 2.05;
    const bulge = Math.sin(t * Math.PI) * r * 0.44;
    const cy = -r * 0.2 - bulge * 0.88;
    const row = i % 2;
    const shade = i % 3 === 0 ? blueA : i % 3 === 1 ? blueB : blueC;
    drawArmoredScale(cx, cy + row * r * 0.07, -0.08 + t * 0.12, 0.92 + (i % 4) * 0.04, shade);
    if (t > 0.12 && t < 0.92) {
      drawArmoredScale(cx - r * 0.14, cy + r * 0.1 + row * r * 0.05, 0.05, 0.78, blueB);
    }
  }

  ctx.strokeStyle = "rgba(255,50,60,0.35)";
  ctx.lineWidth = 1.2;
  for (let s = 0; s < 7; s += 1) {
    const sx = -r * 1.05 + s * r * 0.32;
    ctx.beginPath();
    ctx.moveTo(sx, r * 0.18);
    ctx.lineTo(sx + r * 0.04, -r * 0.12);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-r * 0.02, -r * 0.5);
  ctx.lineTo(-r * 0.18, -r * 1.02);
  ctx.lineTo(-r * 0.48, -r * 0.46);
  ctx.lineTo(-r * 0.28, -r * 0.38);
  ctx.closePath();
  const df = ctx.createLinearGradient(0, -r, 0, -r * 0.4);
  df.addColorStop(0, blueHi);
  df.addColorStop(0.5, blueC);
  df.addColorStop(1, blueB);
  ctx.fillStyle = df;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  for (let b = 0; b < 4; b += 1) {
    const bx = -r * 0.15 - b * r * 0.08;
    ctx.beginPath();
    ctx.moveTo(bx, -r * 0.42);
    ctx.lineTo(bx - r * 0.03, -r * 0.88);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-r * 1.38, -r * 0.12);
  ctx.lineTo(-r * 1.92, -r * 0.52);
  ctx.lineTo(-r * 1.88, -r * 0.05);
  ctx.lineTo(-r * 2.02, 0);
  ctx.lineTo(-r * 1.88, r * 0.05);
  ctx.lineTo(-r * 1.92, r * 0.52);
  ctx.lineTo(-r * 1.38, r * 0.12);
  ctx.closePath();
  ctx.fillStyle = blueB;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.strokeStyle = blueHi;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 1.45, 0);
  ctx.lineTo(-r * 1.88, 0);
  ctx.stroke();

  const drawPec = (sy) => {
    ctx.beginPath();
    ctx.moveTo(r * 0.22, sy * r * 0.08);
    ctx.lineTo(-r * 0.08, sy * r * 0.62);
    ctx.lineTo(-r * 0.48, sy * r * 0.2);
    ctx.closePath();
    const pg = ctx.createLinearGradient(0, sy * r * 0.5, 0, 0);
    pg.addColorStop(0, blueB);
    pg.addColorStop(1, blueC);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(160,210,255,0.25)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
  };
  drawPec(-1);
  drawPec(1);

  ctx.fillStyle = "#2a3038";
  ctx.beginPath();
  ctx.moveTo(r * 1.02, -r * 0.12);
  ctx.lineTo(r * 0.72, -r * 0.28);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.05, r * 0.78, r * 0.12);
  ctx.lineTo(r * 1.02, r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = silver;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#121418";
  ctx.beginPath();
  ctx.ellipse(r * 0.62, -r * 0.16, r * 0.11, r * 0.088, -0.1, 0, Math.PI * 2);
  ctx.fill();
  const eyeGrad = ctx.createRadialGradient(r * 0.68, -r * 0.18, 0, r * 0.6, -r * 0.15, r * 0.095);
  eyeGrad.addColorStop(0, "#ffffa0");
  eyeGrad.addColorStop(0.25, "#ff5020");
  eyeGrad.addColorStop(0.55, "#c01020");
  eyeGrad.addColorStop(1, "#200408");
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(r * 0.6, -r * 0.15, r * 0.048, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(r * 0.64, -r * 0.17, r * 0.014, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = silver;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r * 0.88, r * 0.06);
  ctx.lineTo(r * 1.05, r * 0.2);
  ctx.moveTo(r * 0.88, -r * 0.06);
  ctx.lineTo(r * 1.05, -r * 0.2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,120,60,0.55)";
  ctx.beginPath();
  ctx.ellipse(r * 0.92, 0, r * 0.045, r * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,210,140,0.5)";
  ctx.beginPath();
  ctx.arc(r * 0.96, 0, r * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (!shielded) {
    ctx.strokeStyle = "rgba(80,255,200,0.65)";
    ctx.lineWidth = 2.8;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.96, r * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function spawnMineExplosion(x, y, baseR) {
  game.mineExplosions.push({
    x,
    y,
    baseR: Math.max(6, baseR),
    t: 0,
    maxT: 0.5,
    rot: Math.random() * Math.PI * 2,
  });
}

function updateMineExplosions(dt) {
  for (const ex of game.mineExplosions) ex.t += dt;
  game.mineExplosions = game.mineExplosions.filter((ex) => ex.t < ex.maxT);
}

function drawMineExplosionsWorld() {
  for (const ex of game.mineExplosions) {
    const u = ex.t / ex.maxT;
    const fade = 1 - u;
    const br = ex.baseR;
    ctx.save();
    ctx.translate(ex.x, ex.y);
    ctx.rotate(ex.rot);
    ctx.globalAlpha = 0.4 * fade;
    ctx.fillStyle = "#ffd4a8";
    ctx.beginPath();
    ctx.arc(0, 0, br * (0.35 + u * 2.8), 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 3; k += 1) {
      const rk = br * (0.85 + u * (3.2 + k * 1.35));
      ctx.globalAlpha = (0.52 - k * 0.13) * fade;
      ctx.strokeStyle = k === 0 ? "#ff5c3d" : "#ff9648";
      ctx.lineWidth = Math.max(1, 3.2 - k * 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, rk, 0, Math.PI * 2);
      ctx.stroke();
    }
    const spikes = 7;
    for (let s = 0; s < spikes; s += 1) {
      const ang = (s / spikes) * Math.PI * 2 + ex.rot * 0.35;
      const len = br * (1.05 + u * 4.8) * fade;
      ctx.globalAlpha = 0.5 * fade;
      ctx.strokeStyle = "#ff7840";
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * br * 0.25, Math.sin(ang) * br * 0.25);
      ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function updateMysterySpawns(dt) {
  if (sectorBossActive()) return;
  const cap = getMysteryTimerSpawnCap();
  game.mysterySpawnTimer -= dt;
  if (game.mysterySpawnTimer > 0) return;
  if (game.mysteriesSpawnedFromTimer < cap && game.mysteries.length < 3) {
    spawnMysteryAhead();
    game.mysteriesSpawnedFromTimer += 1;
  }
  game.mysterySpawnTimer = randf(10.5, 15.5);
}

function addOverlay(text, color = "#fff1be") {
  game.overlays.push({ text, color, life: 1.85, maxLife: 1.85 });
}

function updateOverlays(dt) {
  for (const o of game.overlays) o.life -= dt;
  game.overlays = game.overlays.filter((o) => o.life > 0);
}

function updateHud() {
  scoreEl.textContent = String(game.score);
  levelEl.textContent = String(game.level);
  hullEl.textContent = `${Math.max(0, Math.round(game.hull))}%`;
  if (shieldHudEl) {
    if (game.shield > 0) {
      shieldHudEl.hidden = false;
      const enh = game.enhancedShields ? " · enhanced" : "";
      shieldHudEl.textContent = `(Shield: ${Math.round(game.shield)}%${enh})`;
    } else {
      shieldHudEl.hidden = true;
    }
  }
}

function drawEffectText() {
  /** Top header already shows shield % — keep bottom strip to combat + upgrades only. */
  const primary = [];
  const secondary = [];

  if (sectorBossActive() && game.sectorBoss.kind === "l1Fish") {
    const b = game.sectorBoss;
    primary.push(`Boss t${b.tier ?? 1} ${b.vulnerable ? "VULN" : "SHLD"}`);
  }
  if (game.immunityTimer > 0) primary.push(`Immo ${game.immunityTimer.toFixed(0)}s`);

  const wcap = game.weaponPowerMult > 1.001 ? `×${game.weaponPowerMult.toFixed(2)}` : "";
  const wSeg = [];
  if (game.hasBlaster) {
    const n = game.blasterTier >= 3 ? 6 : game.blasterTier === 2 ? 3 : 1;
    wSeg.push(`F×${n}`);
  }
  if (game.hasSecondaryWeapon) wSeg.push("G×2");
  if (wSeg.length) primary.push(wSeg.join(" ") + (wcap ? ` ${wcap}` : ""));

  const flat = game.weaponFlatBonus ?? 0;
  const spdM = game.playerSpeedMult ?? 1;
  if (flat > 0 || spdM > 1.001) {
    const bits = [];
    if (flat > 0) bits.push(`+${flat}dmg`);
    if (spdM > 1.001) bits.push(`spd×${spdM.toFixed(2)}`);
    primary.push(bits.join(" "));
  }

  if (game.hasSmartMissiles) secondary.push("Seek");
  if (game.enhancedShields) secondary.push("Sh+");
  if (game.hasDeflector) secondary.push("Defl");
  if (game.hasEnhancedDeflector) {
    const sec =
      game.enhancedDeflectorCooldown > 0 ? game.enhancedDeflectorCooldown : game.enhancedDeflectorBurstLeft;
    secondary.push(`Edef ${sec.toFixed(0)}s`);
  }
  if (game.hasAcceleratedReverse) secondary.push("Rev");
  if (game.droneGuardsTimeRemaining > 0) secondary.push(`Wing ${game.droneGuardsTimeRemaining.toFixed(0)}s`);

  if (primary.length === 0 && secondary.length === 0) return;

  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "#d6f0ff";
  const yCombat = WORLD.height - 14;
  const yMods = WORLD.height - 34;
  const sep = " · ";
  if (primary.length) {
    ctx.font = "bold 15px Trebuchet MS, sans-serif";
    ctx.fillText(primary.join(sep), 16, yCombat);
  }
  if (secondary.length) {
    ctx.font = "13px Trebuchet MS, sans-serif";
    ctx.globalAlpha = 0.9;
    ctx.fillText(secondary.join(sep), 16, primary.length ? yMods : yCombat);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** Boss HP % — top-right of the playfield (see `sectorBoss`). */
function drawBossHpCorner() {
  const boss = game.sectorBoss;
  if (!boss || boss.kind !== "l1Fish" || !game.started || game.gameOver) return;
  const pct = clamp((100 * boss.hp) / Math.max(1, boss.maxHp), 0, 100);
  const pctRounded = Math.max(0, Math.round(pct));
  const vuln = boss.vulnerable;
  const x = WORLD.width - 14;
  const y = 12;
  ctx.save();
  ctx.font = "bold 21px Trebuchet MS, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const main = `Boss ${pctRounded}%`;
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = 3.5;
  ctx.strokeText(main, x, y);
  ctx.fillStyle = vuln ? "#8cffc8" : "#ffe9b0";
  ctx.fillText(main, x, y);
  ctx.font = "12px Trebuchet MS, sans-serif";
  ctx.strokeStyle = "rgba(0,0,0,0.65)";
  ctx.lineWidth = 2.5;
  const sub = vuln ? "vulnerable" : "shielded";
  ctx.strokeText(sub, x, y + 24);
  ctx.fillStyle = vuln ? "rgba(190, 255, 220, 0.92)" : "rgba(255, 230, 190, 0.9)";
  ctx.fillText(sub, x, y + 24);
  ctx.restore();
}

function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  g.addColorStop(0, "#0a0618");
  g.addColorStop(0.5, "#1a1240");
  g.addColorStop(1, "#050a14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const scroll = game.cameraX * 0.08;
  ctx.fillStyle = "rgba(40, 28, 80, 0.25)";
  for (let i = 0; i < 24; i += 1) {
    const sx = ((i * 211 - scroll) % (WORLD.width + 120)) - 60;
    const sy = (i * 47) % (WORLD.height - 40);
    ctx.fillRect(sx, sy, 2, 2);
  }
}

function jaggedTunnelEdgeY(px, wall, t, isTopBand) {
  const s = wall.seed * 0.00017;
  const w1 = Math.sin(px * 0.071 + s + t * 0.95) * (wall.h * 0.26);
  const w2 = Math.sin(px * 0.19 + wall.drift + t * 0.55) * (wall.h * 0.15);
  const w3 = Math.sin(px * 0.38 + s * 3.1) * (wall.h * 0.085);
  if (isTopBand) {
    return clamp(wall.h + w1 + w2 + w3, wall.h * 0.38, wall.h + 22);
  }
  const yTop = wall.y + wall.h * 0.1 + w1 + w2 + w3;
  return clamp(yTop, wall.y + 5, wall.y + wall.h * 0.82);
}

function drawBrownGasWalls() {
  const t = game.lastTs * 0.00082;
  const stepsFor = (w) => clamp(Math.floor(w.w / 10), 10, 48);

  for (const wall of game.gasWalls) {
    if (wall.band === "top") {
      const steps = stepsFor(wall);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wall.x, 0);
      ctx.lineTo(wall.x + wall.w, 0);
      for (let i = steps; i >= 0; i -= 1) {
        const u = i / steps;
        const px = wall.x + u * wall.w;
        const py = jaggedTunnelEdgeY(px, wall, t, true);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      const gy = ctx.createLinearGradient(wall.x, 0, wall.x, wall.h + 40);
      gy.addColorStop(0, "rgba(95, 62, 38, 0.92)");
      gy.addColorStop(0.45, "rgba(130, 88, 52, 0.55)");
      gy.addColorStop(0.78, "rgba(175, 120, 72, 0.35)");
      gy.addColorStop(1, "rgba(210, 150, 88, 0.12)");
      ctx.fillStyle = gy;
      ctx.fill();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.35;
      for (let k = 0; k < 5; k += 1) {
        const ox = wall.x + ((k + 0.4) / 5) * wall.w;
        const oy = wall.h * (0.25 + (k % 3) * 0.18);
        const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, wall.h * 0.55);
        rg.addColorStop(0, "rgba(255, 200, 140, 0.22)");
        rg.addColorStop(0.5, "rgba(160, 100, 60, 0.08)");
        rg.addColorStop(1, "rgba(40, 25, 15, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(ox, oy, wall.h * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (wall.band === "bottom") {
      const steps = stepsFor(wall);
      const yBot = wall.y + wall.h;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wall.x, yBot);
      ctx.lineTo(wall.x + wall.w, yBot);
      for (let i = 0; i <= steps; i += 1) {
        const u = i / steps;
        const px = wall.x + u * wall.w;
        const py = jaggedTunnelEdgeY(px, wall, t, false);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      const gy = ctx.createLinearGradient(wall.x, wall.y - 20, wall.x, yBot);
      gy.addColorStop(0, "rgba(210, 150, 88, 0.14)");
      gy.addColorStop(0.22, "rgba(165, 110, 68, 0.38)");
      gy.addColorStop(0.55, "rgba(115, 75, 45, 0.62)");
      gy.addColorStop(1, "rgba(72, 48, 30, 0.94)");
      ctx.fillStyle = gy;
      ctx.fill();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.32;
      for (let k = 0; k < 5; k += 1) {
        const ox = wall.x + ((k + 0.35) / 5) * wall.w;
        const oy = wall.y + wall.h * (0.55 + (k % 3) * 0.12);
        const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, wall.h * 0.5);
        rg.addColorStop(0, "rgba(255, 190, 130, 0.2)");
        rg.addColorStop(0.55, "rgba(130, 82, 48, 0.1)");
        rg.addColorStop(1, "rgba(30, 18, 10, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(ox, oy, wall.h * 0.48, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      const bump = Math.sin(t + wall.drift) * 4 + Math.cos(t * 0.64 + wall.seed * 0.001) * 2.5;
      ctx.save();
      const blobs = [
        { ox: 0.16, oy: 0.34, r: 0.5 },
        { ox: 0.54, oy: 0.26, r: 0.44 },
        { ox: 0.4, oy: 0.6, r: 0.42 },
        { ox: 0.7, oy: 0.48, r: 0.34 },
      ];
      for (const b of blobs) {
        const bx = wall.x + b.ox * wall.w + bump * 0.28;
        const by = wall.y + b.oy * wall.h + bump * 0.16;
        const rad = Math.min(wall.w, wall.h) * b.r * 0.98;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
        g.addColorStop(0, "rgba(150, 102, 62, 0.5)");
        g.addColorStop(0.38, "rgba(92, 62, 40, 0.34)");
        g.addColorStop(0.68, "rgba(48, 34, 22, 0.22)");
        g.addColorStop(1, "rgba(22, 15, 10, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawGaseousClouds() {
  const t = game.lastTs * 0.00085;
  for (const cl of game.clouds) {
    const bump = Math.sin(t + cl.drift) * 5 + Math.cos(t * 0.7 + cl.seed * 0.001) * 3;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const blobs = [
      { ox: 0.22, oy: 0.38, r: 0.44 },
      { ox: 0.58, oy: 0.3, r: 0.4 },
      { ox: 0.4, oy: 0.65, r: 0.38 },
      { ox: 0.75, oy: 0.52, r: 0.3 },
      { ox: 0.48, oy: 0.22, r: 0.26 },
    ];
    for (const b of blobs) {
      const bx = cl.x + b.ox * cl.w + bump * 0.35;
      const by = cl.y + b.oy * cl.h + bump * 0.2;
      const rad = Math.min(cl.w, cl.h) * b.r;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
      g.addColorStop(0, "rgba(210, 175, 255, 0.42)");
      g.addColorStop(0.35, "rgba(140, 100, 210, 0.28)");
      g.addColorStop(0.65, "rgba(80, 50, 140, 0.12)");
      g.addColorStop(1, "rgba(40, 25, 80, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMeteorsWorld() {
  for (const r of game.meteors) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.rot);
    const rad = r.radius;
    ctx.fillStyle = "#6a5344";
    ctx.strokeStyle = "#2c2218";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rad * 1.1, 0);
    ctx.lineTo(rad * 0.35, rad * 0.92);
    ctx.lineTo(-rad * 0.95, rad * 0.45);
    ctx.lineTo(-rad * 0.55, -rad * 0.88);
    ctx.lineTo(rad * 0.62, -rad * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(-rad * 0.25, -rad * 0.2, rad * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Shipwreck `drawMines` — open-sky palette (`spaceMode` branch). */
function drawSmartMissilesWorld() {
  const bodyFill = "#5ee8c8";
  const spikeStroke = "#c9ff4d";
  for (const s of game.smartMissiles) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = bodyFill;
    ctx.beginPath();
    ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = spikeStroke;
    ctx.lineWidth = 2;
    const r = s.radius;
    ctx.beginPath();
    ctx.moveTo(-2, -r - 3);
    ctx.lineTo(2, -r - 9);
    ctx.moveTo(r + 3, -2);
    ctx.lineTo(r + 9, 2);
    ctx.moveTo(-2, r + 3);
    ctx.lineTo(2, r + 9);
    ctx.moveTo(-r - 3, -2);
    ctx.lineTo(-r - 9, 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHostileStationsWorld() {
  ensureIssStationImg();
  const t = game.lastTs / 1000;
  const br = stationBodyRadius();
  const baseW = stationDrawWidth();
  for (const st of game.hostileStations) {
    ctx.save();
    ctx.translate(st.x, st.y);
    if (st.shield > 0) {
      const pulse = 0.72 + 0.28 * Math.sin(t * 2.4 + st.spin);
      const sr = st.r * 1.32;
      const grd = ctx.createRadialGradient(0, 0, sr * 0.15, 0, 0, sr);
      grd.addColorStop(0, `rgba(255, 80, 90, ${0.22 * pulse})`);
      grd.addColorStop(0.55, `rgba(255, 40, 55, ${0.14 * pulse})`);
      grd.addColorStop(1, "rgba(180, 20, 40, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, sr, sr * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const w = baseW * clamp(st.r / Math.max(8, br), 0.65, 2.35);
    const aspect =
      issStationImg && issStationImg.naturalWidth > 0
        ? issStationImg.naturalHeight / issStationImg.naturalWidth
        : 0.63;
    const h = w * aspect;
    ctx.globalAlpha = 0.9;
    if (issStationImg && issStationImg.complete && issStationImg.naturalWidth > 0) {
      ctx.filter = "saturate(1.15) hue-rotate(-8deg)";
      ctx.drawImage(issStationImg, -w * 0.5, -h * 0.5, w, h);
      ctx.filter = "none";
    } else {
      ctx.fillStyle = "rgba(160, 175, 200, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, st.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 100, 110, 0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHostilesWorld() {
  const img = getHostileShipImage();
  const starOpt = SHIP_SKIN_OPTIONS.find((o) => o.id === "starfighter") ?? { rasterScale: 1 };
  for (const h of game.hostiles) {
    const bank = clamp(h.vy / MAX_SPEED, -1, 1) * 0.2;
    ctx.save();
    ctx.translate(h.x, h.y);
    if (h.shield > 0) {
      const ratio = clamp(h.shield / HOSTILE_RAIDER_SHIELD_MAX, 0, 1);
      const glowR = h.r * (1.15 + 0.2 * ratio);
      const grd = ctx.createRadialGradient(0, 0, h.r * 0.2, 0, 0, glowR);
      grd.addColorStop(0, "rgba(120, 220, 255, 0.2)");
      grd.addColorStop(0.65, "rgba(80, 180, 255, 0.12)");
      grd.addColorStop(1, "rgba(40, 120, 200, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, glowR, glowR * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.scale(-1, 1);
    if (img) {
      ctx.rotate(RASTER_SHIP_ROTATION + bank);
      const base = Math.max(img.naturalWidth, img.naturalHeight);
      const target = h.r * 4.2 * (starOpt.rasterScale ?? 1);
      const sc = target / base;
      ctx.scale(sc, sc);
      ctx.drawImage(img, -img.naturalWidth * 0.5, -img.naturalHeight * 0.5);
    } else {
      drawDefaultClassicShip(ctx, h.r, false, bank);
    }
    ctx.restore();
  }
}

function drawEnemyBulletsWorld() {
  ctx.save();
  for (const b of game.enemyBullets) {
    if (b.kind === "bossFish") {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 1.6);
      g.addColorStop(0, "#fff8c8");
      g.addColorStop(0.45, "#ff9a32");
      g.addColorStop(1, "#c43810");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = b.kind === "turret" ? "#ff3d4d" : "#ff6eb4";
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMinesWorld() {
  const bodyFill = "#9fd4f0";
  const spikeStroke = "#c43d52";
  for (const m of game.mines) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = bodyFill;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = spikeStroke;
    ctx.lineWidth = 2;
    const r = m.radius;
    ctx.beginPath();
    ctx.moveTo(-3, -r - 4);
    ctx.lineTo(3, -r - 11);
    ctx.moveTo(r + 4, -3);
    ctx.lineTo(r + 11, 3);
    ctx.moveTo(-3, r + 4);
    ctx.lineTo(3, r + 11);
    ctx.moveTo(-r - 4, -3);
    ctx.lineTo(-r - 11, 3);
    ctx.stroke();
    ctx.restore();
  }
}

/** Shipwreck-style ISS; `goalX` / `stationY` are world center (scroll with map). */
function drawCheckpointStation() {
  if (game.bossArenaTier != null) return;
  ensureIssStationImg();
  const sx = game.goalX;
  const sy = game.stationY;
  const w = stationDrawWidth();
  const aspect =
    issStationImg && issStationImg.naturalWidth > 0
      ? issStationImg.naturalHeight / issStationImg.naturalWidth
      : 0.63;
  const h = w * aspect;
  const br = stationBodyRadius();
  const dockR = stationDockRange();

  ctx.save();
  ctx.translate(sx, sy);
  ctx.globalAlpha = 0.92;
  if (issStationImg && issStationImg.complete && issStationImg.naturalWidth > 0) {
    ctx.drawImage(issStationImg, -w * 0.5, -h * 0.5, w, h);
  } else {
    ctx.fillStyle = "rgba(180, 200, 230, 0.35)";
    ctx.beginPath();
    ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(160, 210, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (
    game.player &&
    game.started &&
    !game.gameOver &&
    !game.won &&
    !sectorBossActive() &&
    playerInCheckpointRange()
  ) {
    ctx.strokeStyle = "rgba(120, 220, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, dockR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** `visualScale` 2 = double-size aft plume (accelerated reverse, hold left). */
function drawThrusterPlume(p, bank, visualScale, mirrorX) {
  const r = p.r * visualScale;
  const t = game.lastTs * 0.001;
  const speedT = clamp(Math.hypot(p.vx, p.vy) / (MAX_SPEED * playerMoveSpeedScale()), 0, 1);
  const flameT = 0.8 + speedT * 0.35;
  const baseLen = p.r * (0.7 + flameT * 0.85) * visualScale;
  const flicker = 1 + Math.sin(t * 28) * 0.16 + Math.cos(t * 17) * 0.07;
  const len = baseLen * flicker;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(bank);
  if (mirrorX) ctx.scale(-1, 1);

  ctx.globalCompositeOperation = "screen";
  const plume = ctx.createRadialGradient(-r * 1.05, 0, r * 0.08, -r * 1.35, 0, r * 1.25);
  plume.addColorStop(0, "rgba(255, 248, 208, 0.55)");
  plume.addColorStop(0.35, "rgba(255, 166, 86, 0.42)");
  plume.addColorStop(1, "rgba(255, 80, 24, 0)");
  ctx.fillStyle = plume;
  ctx.beginPath();
  ctx.ellipse(-r * 1.2, 0, r * 1.05, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ff8a3a";
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(-r * 1.15, -r * 0.22);
  ctx.lineTo(-r * (1.05 + len / r), 0);
  ctx.lineTo(-r * 1.15, r * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff2ad";
  ctx.beginPath();
  ctx.moveTo(-r * 0.98, 0);
  ctx.lineTo(-r * 1.12, -r * 0.12);
  ctx.lineTo(-r * (1 + (len * 0.58) / r), 0);
  ctx.lineTo(-r * 1.12, r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDroneGuardsWorld(p, bank, flash) {
  if (game.droneGuardsTimeRemaining <= 0) return;
  const img = getPlayerShipImage();
  const opt = getShipSkinOption();
  const gap = p.r * DRONE_GUARD_STRAFE_MULT;
  const dr = p.r * DRONE_GUARD_R_MULT;
  const ax = p.x - p.r * DRONE_GUARD_AFT_X_MULT;
  for (const oy of [-gap, gap]) {
    ctx.save();
    ctx.translate(ax, p.y + oy);
    if (img) {
      ctx.rotate(RASTER_SHIP_ROTATION + bank);
      ctx.globalAlpha = flash ? 0.4 : 0.86;
      const base = Math.max(img.naturalWidth, img.naturalHeight);
      const target = dr * 4.2 * (opt.rasterScale ?? 1);
      const sc = target / base;
      ctx.scale(sc, sc);
      ctx.drawImage(img, -img.naturalWidth * 0.5, -img.naturalHeight * 0.5);
    } else {
      drawDefaultClassicShip(ctx, dr, flash, bank);
    }
    ctx.restore();
  }
}

function drawShipThrusterWorld(p, bank) {
  if (KEY.KeyD || KEY.ArrowRight) drawThrusterPlume(p, bank, 1, false);
  if (game.hasAcceleratedReverse && (KEY.KeyA || KEY.ArrowLeft)) drawThrusterPlume(p, bank, 2, true);
}

/** Shield glow around the ship (color shifts with shield strength), plus immunity pulse. */
function drawShieldImmunityRingsWorld(p) {
  const t = game.lastTs;
  ctx.save();
  ctx.translate(p.x, p.y);

  if (game.shield > 0) {
    const shieldRatio = clamp(game.shield / MAX_SHIELD, 0, 1);
    const pulse = 0.9 + Math.sin(t * 0.0056) * 0.1;
    // Static oval envelope (nose-right), no direction-following rotation.
    const r = Math.round(70 + shieldRatio * 70);
    const g = Math.round(220 + shieldRatio * 30);
    const b = Math.round(130 + shieldRatio * 110);
    const coreA = (0.015 + shieldRatio * 0.2) * pulse;
    const midA = (0.045 + shieldRatio * 0.32) * pulse;
    const outerA = (0.01 + shieldRatio * 0.17) * pulse;
    const glow = ctx.createRadialGradient(0, 0, p.r * 0.18, 0, 0, p.r * 2.35);
    glow.addColorStop(0, `rgba(${r + 30}, ${g + 12}, ${b + 10}, ${coreA})`);
    glow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${midA})`);
    glow.addColorStop(0.82, `rgba(${r}, ${g}, ${b}, ${outerA})`);
    glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * (2.35 + shieldRatio * 0.5), p.r * (1.18 + shieldRatio * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();

    // Pure glow style: no explicit ring/outline strokes.
  }

  if (game.immunityTimer > 0 && Math.floor(t / 120) % 2 === 0) {
    ctx.strokeStyle = "#8fd6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGasBlastsWorld() {
  const t = game.lastTs * 0.00105;
  for (const b of game.gasBlasts) {
    const yTop = b.yBase - b.rise;
    if (b.rise < 4) continue;
    const wobble = Math.sin(t + b.seed * 0.0017) * 4 + Math.cos(t * 0.8 + b.seed * 0.002) * 2;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const gy = ctx.createLinearGradient(b.x, yTop, b.x, b.yBase);
    gy.addColorStop(0, "rgba(220, 168, 108, 0.12)");
    gy.addColorStop(0.22, "rgba(165, 108, 62, 0.48)");
    gy.addColorStop(0.65, "rgba(115, 72, 42, 0.58)");
    gy.addColorStop(1, "rgba(72, 44, 28, 0.9)");
    ctx.fillStyle = gy;
    ctx.beginPath();
    ctx.moveTo(b.x + wobble * 0.4, yTop);
    ctx.lineTo(b.x + b.w - wobble * 0.35, yTop);
    ctx.lineTo(b.x + b.w + wobble * 0.2, b.yBase);
    ctx.lineTo(b.x - wobble * 0.15, b.yBase);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.4;
    const ox = b.x + b.w * 0.48;
    const oy = yTop + b.rise * 0.38;
    const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(b.w, b.rise) * 0.52);
    rg.addColorStop(0, "rgba(255, 210, 150, 0.38)");
    rg.addColorStop(0.5, "rgba(150, 95, 55, 0.14)");
    rg.addColorStop(1, "rgba(35, 22, 12, 0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.ellipse(ox, oy, b.w * 0.4, b.rise * 0.45, wobble * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMysteriesWorld() {
  for (const t of game.mysteries) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle =
      t.kind === "brownDeflectorOrb"
        ? "#f0c080"
        : t.kind === "weaponPowerOrb"
          ? "#ffd060"
          : t.kind === "reverseBoostOrb"
            ? "#7af0d8"
            : "#f2d6ff";
    ctx.stroke();
    ctx.fillStyle =
      t.kind === "brownDeflectorOrb"
        ? "#ffe8c8"
        : t.kind === "weaponPowerOrb"
          ? "#fff0a8"
          : t.kind === "reverseBoostOrb"
            ? "#d8fff6"
            : "#fff4ab";
    ctx.beginPath();
    ctx.arc(t.x, t.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWorld() {
  if (!game.player) return;
  ctx.save();
  ctx.translate(-game.cameraX, 0);

  drawGaseousClouds();
  drawBrownGasWalls();
  drawGasBlastsWorld();

  for (const c of game.coins) {
    if (c.taken) continue;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawMysteriesWorld();
  drawMeteorsWorld();
  drawHostileStationsWorld();
  drawHostilesWorld();
  drawSmartMissilesWorld();
  drawMinesWorld();
  drawMineExplosionsWorld();
  drawEnemyBulletsWorld();

  ctx.save();
  for (const b of game.bullets) {
    if (b.kind === "secondary") {
      const len = 28;
      const mag = Math.hypot(b.vx, b.vy) || 1;
      const tx = (b.vx / mag) * len;
      const ty = (b.vy / mag) * len;
      ctx.strokeStyle = "#ffe68a";
      ctx.lineWidth = 5.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x - tx, b.y - ty);
      ctx.lineTo(b.x + tx * 0.25, b.y + ty * 0.25);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffbf7d";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  drawCheckpointStation();
  drawSectorBossWorld();

  const p = game.player;
  const img = getPlayerShipImage();
  const opt = getShipSkinOption();
  const smv = playerMoveSpeedScale();
  const bank = clamp(p.vy / (MAX_SPEED * VERT_MAX_SPEED_RATIO * smv), -1, 1) * 0.22;
  const flash = game.invuln > 0 && Math.floor(game.lastTs / 70) % 2 === 0;

  drawDroneGuardsWorld(p, bank, flash);
  drawShipThrusterWorld(p, bank);

  ctx.save();
  ctx.translate(p.x, p.y);
  if (img) {
    ctx.rotate(RASTER_SHIP_ROTATION + bank);
    ctx.globalAlpha = flash ? 0.45 : 1;
    const base = Math.max(img.naturalWidth, img.naturalHeight);
    const target = p.r * 4.2 * (opt.rasterScale ?? 1);
    const sc = target / base;
    ctx.scale(sc, sc);
    ctx.drawImage(img, -img.naturalWidth * 0.5, -img.naturalHeight * 0.5);
  } else {
    drawDefaultClassicShip(ctx, p.r, flash, bank);
  }
  ctx.restore();

  const blinkOut =
    game.invuln > 0 && game.immunityTimer <= 0 && Math.floor(game.lastTs / 80) % 2 === 0;
  if (!blinkOut) drawShieldImmunityRingsWorld(p);

  ctx.restore();
}

function drawOverlays() {
  let i = 0;
  for (const ov of game.overlays) {
    const t = ov.life / ov.maxLife;
    ctx.save();
    ctx.globalAlpha = clamp(t * 1.4, 0, 1);
    ctx.fillStyle = ov.color;
    ctx.font = "bold 22px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ov.text, WORLD.width * 0.5, 68 + i * 26);
    ctx.restore();
    i += 1;
  }
}

function applyCanvasSize() {
  const oldW = WORLD.width;
  const oldH = WORLD.height;
  let newW = DEFAULT_CANVAS_WIDTH;
  let newH = DEFAULT_CANVAS_HEIGHT;
  if (game.settings.largeMode) {
    newW = Math.max(980, Math.floor(window.innerWidth * 0.95));
    newH = Math.max(620, Math.floor(window.innerHeight * 0.78));
  }
  canvas.width = newW;
  canvas.height = newH;
  if (appEl) appEl.style.width = game.settings.largeMode ? "min(100vw, 99vw)" : "min(100vw, 980px)";
  if (largeModeBtn) largeModeBtn.textContent = game.settings.largeMode ? "Large Mode: On" : "Large Mode: Off";

  applyPlayfieldLayout();

  if (oldW > 0 && oldH > 0 && (oldW !== WORLD.width || oldH !== WORLD.height)) {
    const sx = WORLD.width / oldW;
    const sy = WORLD.height / oldH;
    game.levelWidth *= sx;
    game.goalX *= sx;
    game.stationY *= sy;
    game.spawnX *= sx;
    game.spawnY *= sy;
    game.worldScrollAnchor *= sx;
    game.cameraX *= sx;
    for (const cl of game.clouds) {
      cl.x *= sx;
      cl.y *= sy;
      cl.w *= sx;
      cl.h *= sy;
    }
    for (const gw of game.gasWalls) {
      gw.x *= sx;
      gw.y *= sy;
      gw.w *= sx;
      gw.h *= sy;
    }
    for (const h of game.mines) {
      h.x *= sx;
      h.y *= sy;
      h.radius *= (sx + sy) * 0.5;
      h.vx *= sx;
      h.vy *= sy;
      h.speed *= (sx + sy) * 0.5;
    }
    for (const ex of game.mineExplosions) {
      ex.x *= sx;
      ex.y *= sy;
      ex.baseR *= (sx + sy) * 0.5;
    }
    for (const t of game.mysteries) {
      t.x *= sx;
      t.y *= sy;
      t.radius *= (sx + sy) * 0.5;
    }
    for (const c of game.coins) {
      c.x *= sx;
      c.y *= sy;
      c.r *= (sx + sy) * 0.5;
    }
    const vScale = (sx + sy) * 0.5;
    for (const b of game.bullets) {
      b.x *= sx;
      b.y *= sy;
      b.vx *= sx;
      b.vy *= sy;
      b.radius *= vScale;
    }
    for (const r of game.meteors) {
      r.x *= sx;
      r.y *= sy;
      r.vx *= sx;
      r.vy *= sy;
      r.radius *= vScale;
    }
    for (const h of game.hostiles) {
      h.x *= sx;
      h.y *= sy;
      h.vx *= sx;
      h.vy *= sy;
      h.r *= vScale;
      h.speed *= vScale;
    }
    for (const st of game.hostileStations) {
      st.x *= sx;
      st.y *= sy;
      st.r *= vScale;
    }
    for (const eb of game.enemyBullets) {
      eb.x *= sx;
      eb.y *= sy;
      eb.vx *= sx;
      eb.vy *= sy;
      eb.radius *= vScale;
    }
    for (const sm of game.smartMissiles) {
      sm.x *= sx;
      sm.y *= sy;
      sm.vx *= sx;
      sm.vy *= sy;
      sm.radius *= vScale;
      sm.speed *= vScale;
    }
    for (const gb of game.gasBlasts) {
      gb.x *= sx;
      gb.yBase *= sy;
      gb.w *= sx;
      gb.rise *= sy;
      gb.maxRise *= sy;
      gb.riseSpeed *= sy;
    }
    if (game.player) {
      game.player.x *= sx;
      game.player.y *= sy;
      game.player.r *= (sx + sy) * 0.5;
      game.player.vx *= sx;
      game.player.vy *= sy;
    }
    const sb = game.sectorBoss;
    if (sb && sb.kind === "l1Fish") {
      sb.anchorX *= sx;
      sb.baseY *= sy;
      sb.x *= sx;
      sb.y *= sy;
      sb.hitR *= vScale;
      sb.dashVx *= sx;
      sb.dashVy *= sy;
    }
  }
}

function applyQueryCheatsFromSettings() {
  const list = game.settings.queryCheats;
  if (!list || list.length === 0) return;
  for (const raw of list) {
    const c = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (c === "raptor") applyCheatRaptor();
    else if (c === "dariusii" || c === "darius2") applyCheatDariusIi();
  }
}

function resetGame() {
  game.settings.startLevel = getStartLevel();
  game.level = game.settings.startLevel;
  applyPlayfieldLayout();
  game.pendingBossAfterStation = false;
  game.advanceLevelAfterBoss = false;
  game.deferredBossInitTier = null;
  game.sectorBoss = null;

  const boot = game.settings.bootBossTier;
  if (boot != null && boot >= 1) {
    buildBossArena(clamp(Math.floor(boot), 1, 99));
  } else {
    buildLevel(game.level);
  }

  const pr = 13 * ((WORLD.width / DEFAULT_CANVAS_WIDTH + WORLD.height / DEFAULT_CANVAS_HEIGHT) * 0.5);
  game.player = {
    x: game.spawnX,
    y: game.spawnY,
    vx: 0,
    vy: 0,
    r: pr,
  };
  game.score = 0;
  game.hull = BASE_HULL;
  game.shield = 0;
  game.shieldScoreRegenUnlocked = true;
  game.prevScoreForShieldRegen = 0;
  game.immunityTimer = 0;
  game.hasBlaster = true;
  game.blasterTier = 1;
  game.blasterCooldown = 0;
  game.hasSecondaryWeapon = false;
  game.secondaryCooldown = 0;
  game.weaponPowerMult = 1;
  game.weaponFlatBonus = 0;
  game.playerSpeedMult = 1;
  game.bullets = [];
  game.hasSmartMissiles = false;
  game.smartMissileFireAcc = 0;
  game.smartMissileNextAt = randf(SMART_MISSILE_FIRE_INTERVAL_MIN, SMART_MISSILE_FIRE_INTERVAL_MAX);
  game.smartMissiles = [];
  game.enhancedShields = false;
  game.hasDeflector = false;
  game.hasEnhancedDeflector = false;
  game.enhancedDeflectorBurstMax = ENHANCED_DEFLECTOR_BURST_START;
  game.enhancedDeflectorBurstLeft = 0;
  game.enhancedDeflectorCooldown = 0;
  game.hasAcceleratedReverse = false;
  game.droneGuardsTimeRemaining = 0;
  game.droneBlasterHalfToggle = false;
  game.droneSecondaryHalfToggle = false;
  game.gameOver = false;
  game.won = false;
  game.invuln = 0;
  game.overlays = [];
  game.paused = false;
  game.started = false;
  game.cameraX = 0;
  game.lastTs = performance.now();
  if (boot != null && boot >= 1) {
    game.deferredBossInitTier = clamp(Math.floor(boot), 1, 99);
    statusEl.textContent = `Boss ${game.deferredBossInitTier} arena — click to start.`;
  } else {
    statusEl.textContent = `Sector ${game.level} — click to start.`;
  }
  applyQueryCheatsFromSettings();
  updateHud();
}

function togglePause() {
  if (game.gameOver || !game.started) return;
  if (game.won) return;
  game.paused = !game.paused;
  statusEl.textContent = game.paused ? "Paused. Space to resume." : "Flying.";
}

function resumeFromWin() {
  if (!game.won) return;
  if (game.advanceLevelAfterBoss) {
    game.advanceLevelAfterBoss = false;
    game.won = false;
    game.paused = false;
    game.level += 1;
    game.score += 60;
    buildLevel(game.level);
    const p = game.player;
    p.x = game.spawnX;
    p.y = game.spawnY;
    p.vx = 0;
    p.vy = 0;
    game.invuln = 1.2;
    game.lastTs = performance.now();
    statusEl.textContent = `Sector ${game.level} — go!`;
    updateHud();
    return;
  }
  if (game.pendingBossAfterStation) {
    game.pendingBossAfterStation = false;
    game.won = false;
    game.paused = false;
    enterBossArena(getBossTierForSector(game.level));
    game.lastTs = performance.now();
    updateHud();
    return;
  }
  game.level += 1;
  game.won = false;
  game.paused = false;
  game.score += 60;
  buildLevel(game.level);
  const p = game.player;
  p.x = game.spawnX;
  p.y = game.spawnY;
  p.vx = 0;
  p.vy = 0;
  game.invuln = 1.2;
  game.lastTs = performance.now();
  statusEl.textContent = `Sector ${game.level} — go!`;
  updateHud();
}

function setSettingsOpen(isOpen) {
  if (!settingsPanelEl || !settingsBackdropEl) return;
  if (isOpen && wikiPanelEl && wikiBackdropEl) {
    wikiPanelEl.hidden = true;
    wikiBackdropEl.hidden = true;
  }
  settingsPanelEl.hidden = !isOpen;
  settingsBackdropEl.hidden = !isOpen;
}

function setWikiOpen(isOpen) {
  if (!wikiPanelEl || !wikiBackdropEl) return;
  if (isOpen && settingsPanelEl && settingsBackdropEl) {
    settingsPanelEl.hidden = true;
    settingsBackdropEl.hidden = true;
  }
  wikiPanelEl.hidden = !isOpen;
  wikiBackdropEl.hidden = !isOpen;
  if (isOpen) requestAnimationFrame(() => wikiPanelEl.focus({ preventScroll: true }));
  else if (wikiBtn) wikiBtn.focus({ preventScroll: true });
}

function isMobileLikeDevice() {
  const hasCoarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const narrow = window.innerWidth <= 900;
  const touchCapable = navigator.maxTouchPoints > 0;
  return (hasCoarse || noHover || narrow) && touchCapable;
}

function updateMobileControlsVisibility() {
  if (!mobileControlsEl) return;
  mobileControlsEl.hidden = !isMobileLikeDevice();
}

function frame(ts) {
  const dt = clamp((ts - game.lastTs) / 1000, 0, 0.034);
  game.lastTs = ts;

  if (!game.gameOver && !game.paused && game.started) {
    applyMapScrollAndCull(dt);
    updateMysterySpawns(dt);
    updateMeteorSpawns(dt);
    updateMeteors(dt);
    updateGasBlastSpawns(dt);
    updateGasBlasts(dt);
    updateHostileSpawns(dt);
    updateHostiles(dt);
    updateHostileStationSpawns(dt);
    updateHostileStations(dt);
    updateEnemyBullets(dt);
    updateSectorBoss(dt);
    updatePlayer(dt);
    updateMines(dt);
    updateSmartMissiles(dt);
    handleSmartMissileHits();
    updateBullets(dt);
    handlePlayerBulletVsEnemyBulletHits();
    handleBulletMineHits();
    handleBulletMeteorHits();
    handleBulletHostileHits();
    handleBulletStationHits();
    handleBulletSectorBossHits();
    updateOverlays(dt);
    updateHud();
    const dScore = game.score - game.prevScoreForShieldRegen;
    if (dScore > 0) applyShieldRegenFromScoreDelta(dScore);
    game.prevScoreForShieldRegen = game.score;
  } else {
    updateOverlays(dt);
  }
  if (game.started) updateMineExplosions(dt);

  drawBackdrop();
  drawWorld();
  drawOverlays();
  if (game.started && !game.gameOver) drawEffectText();

  if (game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#fff8ec";
    ctx.textAlign = "center";
    ctx.font = "bold 38px Trebuchet MS, sans-serif";
    ctx.fillText("GAME OVER", WORLD.width * 0.5, WORLD.height * 0.46);
    ctx.font = "20px Trebuchet MS, sans-serif";
    ctx.fillText(`Score: ${game.score}  ·  Sector ${game.level}`, WORLD.width * 0.5, WORLD.height * 0.54);
    ctx.fillText("Restart or click to try again", WORLD.width * 0.5, WORLD.height * 0.62);
  } else if (game.paused && game.started && !game.won) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#fff8ec";
    ctx.textAlign = "center";
    ctx.font = "bold 36px Trebuchet MS, sans-serif";
    ctx.fillText("PAUSED", WORLD.width * 0.5, WORLD.height * 0.5);
    ctx.font = "18px Trebuchet MS, sans-serif";
    ctx.fillText("Space to resume", WORLD.width * 0.5, WORLD.height * 0.56);
  }

  if (!game.started && !game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "#fff8ec";
    ctx.textAlign = "center";
    ctx.font = "bold 36px Trebuchet MS, sans-serif";
    ctx.fillText("CLICK TO START", WORLD.width * 0.5, WORLD.height * 0.36);
    ctx.font = "17px Trebuchet MS, sans-serif";
    ctx.fillStyle = "#c8d8f0";
    ctx.fillText(
      "The view drifts with the scroll — you fly inside it. The back edge stops you; it doesn’t hurt.",
      WORLD.width * 0.5,
      WORLD.height * 0.44
    );
    ctx.fillText(
      "Purple nebulae, brown gas ceiling/floor tunnel, homing mines. Blaster from the start (F). Shield regen after first shield orb.",
      WORLD.width * 0.5,
      WORLD.height * 0.5
    );
    ctx.font = "18px Trebuchet MS, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "Move: WASD or arrows  ·  Pause: Space  ·  Blaster: hold F / Enter / Insert  ·  Secondary: G",
      WORLD.width * 0.5,
      WORLD.height * 0.58
    );
    ctx.font = "16px Trebuchet MS, sans-serif";
    ctx.fillStyle = "#d4e7ff";
    ctx.fillText("Cheats (start/pause): DARIUSII  ·  RAPTOR (drone wingmen)", WORLD.width * 0.5, WORLD.height * 0.64);
  }

  drawBossHpCorner();

  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  const wikiOpen = wikiPanelEl && !wikiPanelEl.hidden;
  if (wikiOpen) {
    if (e.code === "Escape") {
      e.preventDefault();
      setWikiOpen(false);
    }
    return;
  }
  const settingsOpen = settingsPanelEl && !settingsPanelEl.hidden;
  if (settingsOpen) {
    if (e.code === "Escape") {
      e.preventDefault();
      setSettingsOpen(false);
    }
    return;
  }

  if ((!game.started || game.paused) && !game.gameOver) {
    if (/^[a-z0-9 ]$/i.test(e.key)) {
      cheatBuffer = `${cheatBuffer}${e.key.toUpperCase()}`.slice(-24);
      const compact = cheatBuffer.replace(/[^A-Z0-9]/g, "");
      if (compact.endsWith("DARIUSII") || compact.endsWith("DARIUS2")) {
        applyCheatDariusIi();
        cheatBuffer = "";
      }
      if (compact.endsWith("RAPTOR")) {
        applyCheatRaptor();
        cheatBuffer = "";
      }
    }
  }

  if (e.code === "Space") {
    e.preventDefault();
    if (!game.started && !game.gameOver) return;
    if (game.gameOver) return;
    if (game.won) {
      resumeFromWin();
      return;
    }
    togglePause();
    return;
  }

  if (e.code === "KeyG") {
    e.preventDefault();
    fireSecondaryVolley();
    return;
  }

  if (e.code === "KeyF" || e.code === "Enter" || e.code === "Insert") {
    e.preventDefault();
    KEY[e.code] = true;
    return;
  }

  KEY[e.code] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
  KEY[e.code] = false;
});

window.addEventListener("click", (e) => {
  if (e.target.closest(".ui-no-start")) return;
  if (game.gameOver) {
    resetGame();
    return;
  }
  if (!game.started) {
    game.started = true;
    game.paused = false;
    game.lastTs = performance.now();
    if (game.deferredBossInitTier != null) {
      initBossForTier(game.deferredBossInitTier);
      game.deferredBossInitTier = null;
      addOverlay(`Boss tier ${game.sectorBoss?.tier ?? "?"}`, "#7ec8ff");
      statusEl.textContent = "Boss arena — good luck.";
    } else {
      statusEl.textContent = `Sector ${game.level} — good luck.`;
    }
    return;
  }
  if (game.won) resumeFromWin();
});

restartBtn.addEventListener("click", () => resetGame());

if (largeModeBtn) {
  largeModeBtn.addEventListener("click", () => {
    game.settings.largeMode = !game.settings.largeMode;
    applyCanvasSize();
    statusEl.textContent = game.settings.largeMode ? "Large mode on." : "Large mode off.";
  });
}

if (settingsBtn) settingsBtn.addEventListener("click", () => setSettingsOpen(true));
if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", () => setSettingsOpen(false));
if (settingsBackdropEl) settingsBackdropEl.addEventListener("click", () => setSettingsOpen(false));
if (wikiBtn) wikiBtn.addEventListener("click", () => setWikiOpen(true));
if (wikiCloseBtn) wikiCloseBtn.addEventListener("click", () => setWikiOpen(false));
if (wikiBackdropEl) wikiBackdropEl.addEventListener("click", () => setWikiOpen(false));

if (shipSkinSelectEl) {
  shipSkinSelectEl.addEventListener("change", () => {
    game.settings.shipSkin = shipSkinSelectEl.value;
    normalizeShipSkin();
    shipSkinSelectEl.value = game.settings.shipSkin;
    preloadShipImages();
    const label = getShipSkinOption().label;
    statusEl.textContent = `Ship: ${label}`;
  });
}

if (startAtBtn && startLevelInputEl) {
  startAtBtn.addEventListener("click", () => {
    game.settings.startLevel = getStartLevel();
    resetGame();
  });
}

function bindHoldButton(el, keyCode) {
  if (!el) return;
  const press = (ev) => {
    ev.preventDefault();
    KEY[keyCode] = true;
  };
  const release = (ev) => {
    ev.preventDefault();
    KEY[keyCode] = false;
  };
  el.addEventListener("pointerdown", press);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("pointerleave", release);
}

bindHoldButton(mobileLeftBtn, "KeyA");
bindHoldButton(mobileRightBtn, "KeyD");
bindHoldButton(mobileDpadUpBtn, "KeyW");
bindHoldButton(mobileReverseBtn, "KeyS");
bindHoldButton(mobileThrottleBtn, "KeyW");
bindHoldButton(mobileFireBtn, "KeyF");

if (mobilePauseBtn) {
  mobilePauseBtn.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    togglePause();
  });
}

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn) installBtn.hidden = false;
});
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function applyModeFromQueryString() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("size") === "large") game.settings.largeMode = true;
    if (params.get("size") === "small") game.settings.largeMode = false;
    const levelParam = params.get("level");
    if (levelParam !== null && levelParam !== "") {
      const n = Number.parseInt(levelParam, 10);
      if (!Number.isNaN(n)) game.settings.startLevel = clamp(n, 1, 99);
    }
    const bossParam = params.get("boss");
    if (bossParam !== null && bossParam !== "") {
      const bn = Number.parseInt(bossParam, 10);
      if (!Number.isNaN(bn) && bn >= 1) game.settings.bootBossTier = clamp(bn, 1, 99);
      else game.settings.bootBossTier = null;
    } else {
      game.settings.bootBossTier = null;
    }
    const cheatParts = [];
    for (const v of params.getAll("cheat")) {
      for (const part of v.split(/[,+]/)) cheatParts.push(part);
    }
    const cheatsJoined = params.get("cheats");
    if (cheatsJoined) cheatParts.push(...cheatsJoined.split(/[,+]/));
    game.settings.queryCheats = cheatParts
      .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
      .filter(Boolean);
    const shipParam = params.get("ship");
    if (
      shipParam === "serenity" ||
      shipParam === "firefly" ||
      shipParam === "starfighter" ||
      shipParam === "default"
    ) {
      game.settings.shipSkin = shipParam;
    }
  } catch (_) {
    /* ignore */
  }
}

applyModeFromQueryString();
normalizeShipSkin();
initShipSkinSelect();
if (sectorBossFightsChkEl) {
  sectorBossFightsChkEl.checked = game.settings.sectorBossFights;
  sectorBossFightsChkEl.addEventListener("change", () => {
    game.settings.sectorBossFights = sectorBossFightsChkEl.checked;
    statusEl.textContent = game.settings.sectorBossFights
      ? "Boss arenas on — dock first, then boss, then next sector."
      : "Boss arenas off — dock goes straight to the next sector.";
  });
}
if (startLevelInputEl) startLevelInputEl.value = String(game.settings.startLevel);
applyCanvasSize();
resetGame();
updateMobileControlsVisibility();
window.addEventListener("resize", () => {
  if (game.settings.largeMode) applyCanvasSize();
  updateMobileControlsVisibility();
});

runBootLoad().finally(() => {
  requestAnimationFrame(frame);
});
