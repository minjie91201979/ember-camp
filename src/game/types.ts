import type { EliteAffixId } from './data/elite-affixes';

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DummyKind = 'rotwolf' | 'treant';

export type DummyState = 'idle' | 'walk' | 'attack' | 'dead' | 'charge' | 'fuse';

export type EnemyBehavior = 'melee' | 'ranged' | 'charge' | 'suicide';

export type { EliteAffixId };

export type Dummy = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  flash: number;
  deadT: number;
  stunT: number;
  kind: DummyKind;
  enemyId: string;
  name: string;
  behavior: EnemyBehavior;
  elite: boolean;
  boss: boolean;
  noRespawn: boolean;
  lootTable: string;
  xpReward: number;
  moveSpeed: number;
  visualScale: number;
  facing: 1 | -1;
  vx: number;
  patrolMin: number;
  patrolMax: number;
  attackT: number;
  struck: boolean;
  looted: boolean;
  state: DummyState;
  castT: number;
  castMax: number;
  castId: string | null;
  phase: number;
  fightT: number;
  skillCd: number;
  /** 冲锋冲刺剩余时间 */
  chargeDashT: number;
  /** 自爆引信 */
  fuseT: number;
  /** 精英词缀（非 BOSS） */
  affixes: EliteAffixId[];
  /** 词缀技能冷却 */
  affixCd: number;
};

export type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  damage: number;
  age: number;
  life: number;
  radius: number;
};

export type AttackKind = 'basic' | 'slam' | 'bash';

export type PlayerState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'roll'
  | 'attack'
  | 'drink'
  | 'hurt'
  | 'dead';

export type RespawnChoice = 'banner' | 'camp';

export type ItemQuality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemKind = 'gear' | 'potion' | 'material';

export type EquipSlot = 'mainhand';

export type LegendaryEffectId = 'ember-maul' | 'tide-buckler' | 'rift-edge';

export type ItemDef = {
  id: string;
  name: string;
  kind: ItemKind;
  quality: ItemQuality;
  ilvl: number;
  slot?: EquipSlot;
  weaponAtk?: number;
  heal?: number;
  /** 传说武器手感特效 */
  legendaryEffect?: LegendaryEffectId;
  /** 图鉴说明 */
  effectDesc?: string;
};

export type InventoryItem = {
  uid: number;
  defId: string;
  qty: number;
};

export type GroundLoot = {
  id: number;
  x: number;
  y: number;
  kind: 'gold' | 'item';
  amount: number;
  defId?: string;
  age: number;
};

export type BannerPoint = {
  x: number;
  y: number;
};

export type AttrKey = 'str' | 'agi' | 'int' | 'vit' | 'spi';

export type AttrDraft = Record<AttrKey, number>;

export type Player = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  coyote: number;
  jumpBuffer: number;
  state: PlayerState;
  rollT: number;
  rollCd: number;
  attackT: number;
  attackCd: number;
  attackKind: AttackKind;
  slamCd: number;
  bashCd: number;
  iFrame: number;
  hitStop: number;
  /** 喝药动作剩余时间 */
  drinkT: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseStr: number;
  baseAgi: number;
  baseInt: number;
  baseVit: number;
  baseSpi: number;
  spentStr: number;
  spentAgi: number;
  spentInt: number;
  spentVit: number;
  spentSpi: number;
  unspentAttr: number;
  unspentSkill: number;
  str: number;
  agi: number;
  int: number;
  vit: number;
  spi: number;
  weaponAtk: number;
  armorDef: number;
  atk: number;
  def: number;
  critChance: number;
  critMult: number;
  hp: number;
  maxHp: number;
  rage: number;
  maxRage: number;
  combatT: number;
  rageWarnT: number;
  hurtT: number;
  deadT: number;
  /** 减速剩余时间（冰嚎等） */
  slowT: number;
  /** 石化凝视：更强减速 */
  petrifyT: number;
  awaitRespawn: boolean;
  hasBanner: boolean;
  bannerX: number;
  bannerY: number;
  levelFxT: number;
  weaponEnhance: number;
  attrResetCount: number;
  skillResetCount: number;
  specResetCount: number;
};

export type DamagePopup = {
  id: number;
  x: number;
  y: number;
  value: number;
  age: number;
  lethal: boolean;
  crit: boolean;
  kind: 'damage' | 'level';
};

export type DustPuff = {
  id: number;
  x: number;
  y: number;
  age: number;
};

/** 拾取后飞向背包的短时特效 */
export type LootFly = {
  id: number;
  startX: number;
  startY: number;
  kind: 'gold' | 'item';
  quality: ItemQuality;
  age: number;
};

export type BagSnapshotItem = {
  uid: number;
  name: string;
  qty: number;
  quality: ItemQuality;
  equipped: boolean;
  canEquip: boolean;
  canUse: boolean;
  desc: string | null;
};

export type AttrRowSnap = {
  key: AttrKey;
  name: string;
  tag: string;
  note: string;
  value: number;
  draft: number;
  preview: number;
};

export type SkillRowSnap = {
  id: string;
  name: string;
  level: number;
  desc: string;
  canUpgrade: boolean;
  cost: number;
};

export type CampShopRow = {
  defId: string;
  name: string;
  price: number;
};

export type SpecRowSnap = {
  id: string;
  name: string;
  tag: string;
  effects: string[];
};

export type HudSnapshot = {
  hp: number;
  maxHp: number;
  rage: number;
  maxRage: number;
  atk: number;
  def: number;
  critPct: number;
  gold: number;
  level: number;
  xp: number;
  xpToNext: number;
  unspentAttr: number;
  unspentSkill: number;
  weaponEnhance: number;
  enhanceCost: number;
  enhanceMats: number;
  canEnhance: boolean;
  slamCd: number;
  bashCd: number;
  rageWarn: boolean;
  dead: boolean;
  awaitRespawn: boolean;
  hasBanner: boolean;
  invOpen: boolean;
  charOpen: boolean;
  skillOpen: boolean;
  catalogOpen: boolean;
  settingsOpen: boolean;
  campOpen: string | null;
  nearbyCamp: string | null;
  nearbyCampPrompt: string | null;
  campMessage: string | null;
  travelNodes: { id: string; label: string }[];
  shopStock: CampShopRow[];
  attrResetCost: number;
  skillResetCost: number;
  specResetCost: number;
  nearbyLootName: string | null;
  nearbySecretPrompt: string | null;
  bag: BagSnapshotItem[];
  bagCap: number;
  attrs: AttrRowSnap[];
  previewAtk: number;
  previewDef: number;
  previewHp: number;
  previewCrit: number;
  draftLeft: number;
  skills: SkillRowSnap[];
  specs: SpecRowSnap[];
  specId: string | null;
  specName: string | null;
  needsSpec: boolean;
  specPickOpen: boolean;
  zoneName: string;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossCast: string | null;
  bossCastRatio: number;
  eliteName: string | null;
  eliteHp: number;
  eliteMaxHp: number;
  eliteAffixes: string[];
  ngPlusLevel: number;
  canStartNgPlus: boolean;
  challengeActive: boolean;
  challengeT: number;
  legendaryCatalog: { defId: string; name: string; effectDesc: string; discovered: boolean }[];
  levelToast: string | null;
  tutorialHint: string | null;
  potionReady: boolean;
  /** 有拾取飞向背包时，高亮背包键位 */
  lootBagPulse: boolean;
  audio: { bgm: number; sfx: number; muted: boolean };
};

export type Hazard = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  age: number;
  windup: number;
  life: number;
  damage: number;
  struck: boolean;
  /** 移动浪墙等 */
  vx?: number;
  kind?: 'spike' | 'wave' | 'fire' | 'fog' | 'ice' | 'sand' | 'laser' | 'tentacle' | 'void';
  /** 可重复命中间隔（浪墙 / 火池） */
  hitGap?: number;
  lastHitAge?: number;
  /** 向中心拉扯强度（吞噬点名） */
  pull?: number;
};

export type BreakableProp = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  rewardDefId: string;
  rewardQty: number;
  broken: boolean;
  flash: number;
};

export type World = {
  zoneId: string;
  platforms: Rect[];
  rivers: Rect[];
  banners: BannerPoint[];
  player: Player;
  dummies: Dummy[];
  dummyId: number;
  hazards: Hazard[];
  hazardId: number;
  projectiles: Projectile[];
  projectileId: number;
  popups: DamagePopup[];
  popupId: number;
  dusts: DustPuff[];
  dustId: number;
  lootFlies: LootFly[];
  lootFlyId: number;
  loots: GroundLoot[];
  lootId: number;
  gold: number;
  bag: InventoryItem[];
  itemUid: number;
  mainhandUid: number | null;
  invOpen: boolean;
  charOpen: boolean;
  skillOpen: boolean;
  catalogOpen: boolean;
  settingsOpen: boolean;
  campOpen: string | null;
  nearbyCamp: string | null;
  campMessage: string;
  /** 靠近非营地回营传送点 */
  nearbyHubPortal: boolean;
  unlockedZones: string[];
  attrDraft: AttrDraft;
  skills: Record<string, number>;
  specId: string | null;
  specPickOpen: boolean;
  nearbyLootName: string | null;
  secretsClaimed: Record<string, boolean>;
  nearbySecretId: string | null;
  bossKills: Record<string, boolean>;
  /** 新周目层数：0=普通，击败终焉君王后可提升 */
  ngPlusLevel: number;
  /** 词缀试炼进行中 */
  challengeActive: boolean;
  /** 试炼剩余秒数 */
  challengeT: number;
  /** 已发现传说装备 id */
  discoveredLegendaries: string[];
  /** 林地一次性教学步骤 */
  tutorialStep: 'move' | 'attack' | 'roll' | 'potion' | 'loot' | 'done';
  tutorialDone: boolean;
  tutorialAttrHint: boolean;
  tutorialSkillHint: boolean;
  breakables: BreakableProp[];
  kitTheme: string;
  shake: number;
  levelToastT: number;
  levelToastText: string;
};
