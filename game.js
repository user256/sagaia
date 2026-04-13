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
/** Player shots: range ≈ speed × life (world px before timeout). */
const BLASTER_BULLET_SPEED = 585;
const BLASTER_BULLET_LIFE = 1.38;
/** Secondary upgrade: twin shots along current travel vector. */
const SECONDARY_BULLET_SPEED = 610;
const SECONDARY_BULLET_LIFE = 1.1;
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
const AUTO_SCROLL_SPEED = 64;
/** Diagonal meteor hazards (world-space). Size scales both threat and reward. */
const METEOR_RADIUS_MIN = 15;
const METEOR_RADIUS_MAX = 32;
const METEOR_DAMAGE_MIN = 11;
const METEOR_DAMAGE_MAX = 30;
const METEOR_SPAWN_INTERVAL_MIN = 2.55;
const METEOR_SPAWN_INTERVAL_MAX = 4.85;
const METEOR_MAX_ALIVE = 4;
const METEOR_DROP_SHIELD_CHANCE = 0.72;
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
  paused: false,
  started: false,
  lastTs: 0,
};

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

/** Aim follows held movement keys; default +X (nose-right). */
function getBlasterAimAngleFromControls() {
  const { ix, iy } = getMovementInputAxes();
  if (ix === 0 && iy === 0) return 0;
  return Math.atan2(iy, ix);
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
  game.enemyBullets = [];
  game.hostileSpawnTimer = randf(HOSTILE_SPAWN_INTERVAL_MIN, HOSTILE_SPAWN_INTERVAL_MAX);
  game.smartMissiles = [];
  game.smartMissileFireAcc = 0;
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

/** Blaster, hull, immunity, shield, smart missiles, enhanced shields, deflector, or secondary. */
function rollMysteryPowerupKind() {
  const r = Math.random();
  if (r < 0.23) return 0;
  if (r < 0.39) return 1;
  if (r < 0.53) return 2;
  if (r < 0.67) return 3;
  if (r < 0.78) return 4;
  if (r < 0.87) return 5;
  if (r < 0.94) return 6;
  return 7;
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
  const p = game.player;
  if (!p) return getBlasterAimAngleFromControls();
  const speed = Math.hypot(p.vx, p.vy);
  if (speed >= 40) return Math.atan2(p.vy, p.vx);
  return getBlasterAimAngleFromControls();
}

function fireSecondaryVolley() {
  if (!game.started || game.gameOver || game.paused || game.won) return;
  if (!game.hasSecondaryWeapon || game.secondaryCooldown > 0 || !game.player) return;
  const p = game.player;
  const ang = getTravelAimAngle();
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
      damage: 2,
      kind: "secondary",
    });
  };
  spawnSecondary(-1);
  spawnSecondary(1);
  game.secondaryCooldown = SECONDARY_FIRE_COOLDOWN;
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

/** Shipwreck-style: score ticks add shield only up to `SHIELD_REGEN_CAP` after first shield orb. */
function applyShieldRegenFromScoreDelta(dScore) {
  if (dScore <= 0 || !game.shieldScoreRegenUnlocked || game.shield >= SHIELD_REGEN_CAP) return;
  const add = dScore * SHIELD_REGEN_PER_SCORE;
  game.shield = Math.min(SHIELD_REGEN_CAP, game.shield + add);
}

/** Shift the whole sector left; advance scroll anchor; sync camera to horizon; cull content that left the frontier. */
function applyMapScrollAndCull(dt) {
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
  }
}

function updatePlayer(dt) {
  const p = game.player;
  game.immunityTimer = Math.max(0, game.immunityTimer - dt);
  game.blasterCooldown = Math.max(0, game.blasterCooldown - dt);
  game.secondaryCooldown = Math.max(0, game.secondaryCooldown - dt);

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
    p.vx += (ix / len) * accel * dt * HORIZ_ACCEL_MULT;
    p.vy += (iy / len) * accel * dt * VERT_ACCEL_MULT;
  }
  const maxVx = MAX_SPEED;
  const maxVy = MAX_SPEED * VERT_MAX_SPEED_RATIO;
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
        break;
      }
    }
    for (let ei = game.enemyBullets.length - 1; ei >= 0; ei -= 1) {
      const eb = game.enemyBullets[ei];
      const rr = p.r + eb.radius;
      if (Math.hypot(p.x - eb.x, p.y - eb.y) < rr) {
        game.enemyBullets.splice(ei, 1);
        absorbDamage(HOSTILE_BULLET_DAMAGE);
        game.invuln = INVULN_HIT * 0.52;
        addOverlay("Incoming fire!", "#ffa8d8");
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
      } else {
        applyMysteryPowerup();
      }
      return false;
    }
    return true;
  });

  if (!game.won && playerInCheckpointRange()) {
    game.won = true;
    game.paused = true;
    const bonus = 220 + game.level * 90;
    game.score += bonus;
    addOverlay(`Station checkpoint! +${bonus}`, "#9dff9d");
    statusEl.textContent = "Sector clear — Space or tap for next sector.";
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
  if (!game.started || game.gameOver || game.won) return;
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
  if (!game.started || game.gameOver || game.won) return;
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

function spawnHostile() {
  if (game.hostiles.length >= HOSTILE_MAX_ALIVE) return;
  const H = WORLD.height;
  const cam = game.cameraX;
  const w = WORLD.width;
  const p = game.player;
  const lvl = game.level;
  const speed = HOSTILE_SEEK_SPEED_BASE + lvl * HOSTILE_SEEK_SPEED_PER_LEVEL + randf(-14, 18);
  const pr = p ? p.r : 13;
  game.hostiles.push({
    x: cam + w + randf(36, 200),
    y: randf(52, H - 52),
    vx: 0,
    vy: 0,
    r: pr * 0.92,
    speed,
    hp: 2 + Math.min(2, Math.floor(lvl / 5)),
    shootTimer: randf(0.35, 1.15),
    strafePhase: Math.random() * Math.PI * 2,
  });
}

function updateHostileSpawns(dt) {
  if (!game.started || game.gameOver || game.won) return;
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
  consider(game.mines, true);
  consider(game.meteors, true);
  // Fallback: if nothing forward, allow any direction.
  if (bd >= maxDist) {
    consider(game.hostiles, false);
    consider(game.mines, false);
    consider(game.meteors, false);
  }
  if (bd < maxDist) return { x: bx, y: by };
  const ang = getBlasterAimAngleFromControls();
  return { x: mx + Math.cos(ang) * 520, y: my + Math.sin(ang) * 520 };
}

function spawnSmartMissile() {
  if (!game.player || !game.hasSmartMissiles) return;
  if (game.smartMissiles.length >= SMART_MISSILE_MAX_ALIVE) return;
  const p = game.player;
  const ang = getBlasterAimAngleFromControls();
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
  const aliveM = new Array(game.mines.length).fill(true);
  const aliveR = new Array(game.meteors.length).fill(true);

  for (let si = 0; si < game.smartMissiles.length; si += 1) {
    if (!aliveS[si]) continue;
    const s = game.smartMissiles[si];
    for (let hi = 0; hi < game.hostiles.length; hi += 1) {
      if (!aliveH[hi]) continue;
      const h = game.hostiles[hi];
      if (Math.hypot(s.x - h.x, s.y - h.y) < s.radius + h.r) {
        aliveS[si] = false;
        spawnMineExplosion(s.x, s.y, s.radius);
        h.hp -= 1;
        if (h.hp <= 0) {
          spawnMineExplosion(h.x, h.y, h.r * 0.85);
          aliveH[hi] = false;
          game.score += 28 + Math.min(40, game.level * 4);
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
    const fwd = clamp(p.vx / MAX_SPEED, 0, 1);
    spread *= 1 - BLASTER_SPREAD_FORWARD_TIGHTEN * fwd;
  }
  const spawnBullet = (ang) => {
    game.bullets.push({
      x: p.x + Math.cos(ang) * (p.r + 8),
      y: p.y + Math.sin(ang) * (p.r + 8),
      vx: Math.cos(ang) * bulletSpeed,
      vy: Math.sin(ang) * bulletSpeed,
      radius: 4,
      life: BLASTER_BULLET_LIFE,
      damage: 1,
    });
  };
  const ang0 = getBlasterAimAngleFromControls();
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
        h.hp -= b.damage ?? 1;
        if (h.hp <= 0) {
          spawnMineExplosion(h.x, h.y, h.r * 0.85);
          aliveH[hi] = false;
          game.score += 28 + Math.min(40, game.level * 4);
        }
        break;
      }
    }
  }
  game.bullets = game.bullets.filter((_, idx) => aliveB[idx]);
  game.hostiles = game.hostiles.filter((_, idx) => aliveH[idx]);
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
  const effects = [];
  if (game.immunityTimer > 0) effects.push(`Immunity ${game.immunityTimer.toFixed(1)}s`);
  if (game.shield > 0) {
    const capNote =
      game.shieldScoreRegenUnlocked && game.shield < SHIELD_REGEN_CAP
        ? ` (regen→${SHIELD_REGEN_CAP}%)`
        : "";
    effects.push(`Shield ${Math.ceil(game.shield)}%${capNote}`);
  }
  if (game.hasBlaster) {
    const bl =
      game.blasterTier >= 3 ? "Blaster x6" : game.blasterTier === 2 ? "Blaster x3" : "Blaster";
    effects.push(`${bl} (hold F)`);
  }
  if (game.hasSecondaryWeapon) effects.push("Secondary x2 (G)");
  if (game.hasSmartMissiles) effects.push("Smart missiles");
  if (game.enhancedShields) effects.push("Enhanced shields");
  if (game.hasDeflector) effects.push("Deflector");
  if (effects.length === 0) return;
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "bold 18px Trebuchet MS, sans-serif";
  ctx.fillStyle = "#d6f0ff";
  ctx.fillText(effects.join("  |  "), 16, WORLD.height - 18);
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

function drawHostilesWorld() {
  const img = getHostileShipImage();
  const starOpt = SHIP_SKIN_OPTIONS.find((o) => o.id === "starfighter") ?? { rasterScale: 1 };
  for (const h of game.hostiles) {
    const bank = clamp(h.vy / MAX_SPEED, -1, 1) * 0.2;
    ctx.save();
    ctx.translate(h.x, h.y);
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
  ctx.fillStyle = "#ff6eb4";
  for (const b of game.enemyBullets) {
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

function drawShipThrusterWorld(p, bank) {
  const t = game.lastTs * 0.001;
  const pressingRight = !!(KEY.KeyD || KEY.ArrowRight);
  if (!pressingRight) return;
  const speedT = clamp(Math.hypot(p.vx, p.vy) / MAX_SPEED, 0, 1);
  const flameT = 0.8 + speedT * 0.35;
  const baseLen = p.r * (0.7 + flameT * 0.85);
  const flicker = 1 + Math.sin(t * 28) * 0.16 + Math.cos(t * 17) * 0.07;
  const len = baseLen * flicker;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(bank);

  // Soft plume glow.
  ctx.globalCompositeOperation = "screen";
  const plume = ctx.createRadialGradient(-p.r * 1.05, 0, p.r * 0.08, -p.r * 1.35, 0, p.r * 1.25);
  plume.addColorStop(0, "rgba(255, 248, 208, 0.55)");
  plume.addColorStop(0.35, "rgba(255, 166, 86, 0.42)");
  plume.addColorStop(1, "rgba(255, 80, 24, 0)");
  ctx.fillStyle = plume;
  ctx.beginPath();
  ctx.ellipse(-p.r * 1.2, 0, p.r * 1.05, p.r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main thrust icon/flame.
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ff8a3a";
  ctx.beginPath();
  ctx.moveTo(-p.r * 0.9, 0);
  ctx.lineTo(-p.r * 1.15, -p.r * 0.22);
  ctx.lineTo(-p.r * (1.05 + len / p.r), 0);
  ctx.lineTo(-p.r * 1.15, p.r * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff2ad";
  ctx.beginPath();
  ctx.moveTo(-p.r * 0.98, 0);
  ctx.lineTo(-p.r * 1.12, -p.r * 0.12);
  ctx.lineTo(-p.r * (1 + len * 0.58 / p.r), 0);
  ctx.lineTo(-p.r * 1.12, p.r * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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
    ctx.strokeStyle = "#f2d6ff";
    ctx.stroke();
    ctx.fillStyle = "#fff4ab";
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

  const p = game.player;
  const img = getPlayerShipImage();
  const opt = getShipSkinOption();
  const bank = clamp(p.vy / MAX_SPEED, -1, 1) * 0.22;
  const flash = game.invuln > 0 && Math.floor(game.lastTs / 70) % 2 === 0;

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
  }
}

function resetGame() {
  game.settings.startLevel = getStartLevel();
  game.level = game.settings.startLevel;
  applyPlayfieldLayout();
  buildLevel(game.level);
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
  game.bullets = [];
  game.hasSmartMissiles = false;
  game.smartMissileFireAcc = 0;
  game.smartMissileNextAt = randf(SMART_MISSILE_FIRE_INTERVAL_MIN, SMART_MISSILE_FIRE_INTERVAL_MAX);
  game.smartMissiles = [];
  game.enhancedShields = false;
  game.hasDeflector = false;
  game.gameOver = false;
  game.won = false;
  game.invuln = 0;
  game.overlays = [];
  game.paused = false;
  game.started = false;
  game.cameraX = 0;
  game.lastTs = performance.now();
  statusEl.textContent = `Sector ${game.level} — click to start.`;
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
    updateEnemyBullets(dt);
    updatePlayer(dt);
    updateMines(dt);
    updateSmartMissiles(dt);
    handleSmartMissileHits();
    updateBullets(dt);
    handleBulletMineHits();
    handleBulletMeteorHits();
    handleBulletHostileHits();
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
    ctx.fillText("Cheat (start/pause): type DARIUSII", WORLD.width * 0.5, WORLD.height * 0.64);
  }

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
    statusEl.textContent = `Sector ${game.level} — good luck.`;
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
