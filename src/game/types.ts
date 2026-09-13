import type { EliteAffixId } from './data/elite-affixes';
import type { PlayerClassId } from './data/classes';
import type { SkillId } from './systems/skills';

export type { PlayerClassId };

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 敌人外形族；同族用色盘区分（如腐狼 / 霜狼）。rotwolf 为旧数据别名。 */
export type DummyKind =
  | 'rotwolf'
  | 'wolf'
  | 'treant'
  | 'spitter'
  | 'pod'
  | 'golem'
  | 'bat'
  | 'crab'
  | 'raider'
  | 'lizard'
  | 'frog'
  | 'wraith'
  | 'lurker'
  | 'tadpole'
  | 'mother'
  | 'brute'
  | 'scorpion'
  | 'idol'
  | 'wisp'
  | 'watcher'
  | 'cultist'
  | 'tentacle'
  | 'lord'
  | 'wyvern'
  | 'shard'
  | 'walker'
  | 'guard'
  | 'king';

export type DummyState = 'idle' | 'walk' | 'attack' | 'dead' | 'charge' | 'fuse';

export type EnemyBehavior = 'melee' | 'ranged' | 'charge' | 'suicide' | 'leap' | 'sting' | 'slam';

export type EnemyShotVisual =
  | 'spit'
  | 'poison'
  | 'flame'
  | 'ice'
  | 'void'
  | 'sand'
  | 'arcane'
  | 'bolt';

export type EnemyHitEffect = 'slow' | 'chill';

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
  /** 寒冰减速剩余（暴风雪等；可移动但变慢，非冻结） */
  chillT: number;
  /** 当前寒冰移速倍率（1=无；由施加来源写入） */
  chillMove: number;
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
  /** 盗贼毒刃 DoT 剩余时间 */
  poisonT: number;
  /** 毒刃每秒伤害 */
  poisonDps: number;
  /** 猎人毒箭 DoT 剩余 */
  serpentT: number;
  /** 毒箭每秒伤害（已含叠层） */
  serpentDps: number;
  /** 毒箭叠层 */
  serpentStacks: number;
  /** 破甲层数 */
  sunderStacks: number;
  /** 破甲剩余时间 */
  sunderT: number;
};

export type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy?: number;
  damage: number;
  age: number;
  life: number;
  radius: number;
  /** 缺省视为敌人弹道（兼容旧逻辑）。 */
  owner?: 'enemy' | 'player';
  /** 表现用：火球 / 奥术 / 箭矢等。 */
  visual?:
    | 'spit'
    | 'poison'
    | 'flame'
    | 'ice'
    | 'void'
    | 'sand'
    | 'bolt'
    | 'fireball'
    | 'arcane'
    | 'arrow'
    | 'arrow-fan'
    | 'pyroblast'
    | 'ice-lance';
  /** 敌人弹道命中附加（减速 / 寒冰）。 */
  hitEffect?: EnemyHitEffect;
  /** 玩家弹道对应技能（猎人箭矢区分瞄准/后跳）。 */
  playerSkill?: AttackKind;
  /** 冰枪 5 级弹射剩余次数。 */
  bounceLeft?: number;
};

export type AttackKind =
  | 'basic'
  | 'slam'
  | 'bash'
  | 'fireball'
  | 'frost-nova'
  | 'arcane-missiles'
  | 'blink'
  | 'aimed-shot'
  | 'disengage'
  | 'multi-shot'
  | 'trap'
  | 'shadow-strike'
  | 'eviscerate'
  | 'poison-blade'
  | 'sprint'
  | 'vanish'
  | 'blizzard'
  | 'rapid-fire'
  | 'pyroblast'
  | 'explosive-trap'
  | 'ice-lance'
  | 'concussive-shot'
  | 'mana-shield'
  | 'serpent-sting'
  | 'charge'
  | 'whirlwind'
  | 'execute'
  | 'battle-shout'
  | 'sunder'
  | 'cleave'
  | 'kidney-shot'
  | 'slice-and-dice'
  | 'fan-of-knives';

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

export type LegendaryEffectId =
  | 'ember-maul'
  | 'tide-buckler'
  | 'rift-edge'
  | 'cinder-staff'
  | 'venom-longbow'
  | 'nightshade-fang';

export type ItemDef = {
  id: string;
  name: string;
  kind: ItemKind;
  quality: ItemQuality;
  ilvl: number;
  slot?: EquipSlot;
  weaponAtk?: number;
  heal?: number;
  /** 回复法力（存档资源字段仍为 rage） */
  mana?: number;
  /** 传说武器手感特效 */
  legendaryEffect?: LegendaryEffectId;
  /** 特殊效果 / 图鉴说明 */
  effectDesc?: string;
  /** 武器类型标签（长剑、法杖等） */
  weaponType?: string;
  /** 风味描述 */
  flavor?: string;
  /** 特性标签 */
  traits?: string[];
  /** 职业亲和：掉落加权用；缺省则按武器类型启发式判断 */
  classAffinity?: PlayerClassId[];
};

export type InventoryItem = {
  uid: number;
  defId: string;
  qty: number;
  /** NG+ 掉落淬炼攻击加成 */
  powerBonus?: number;
  /** 装备耐久；缺省视为满耐久 */
  dur?: number;
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
  /** 技能栏第 3 / 4 槽冷却。 */
  skillCd2: number;
  skillCd3: number;
  /** 奥术飞弹剩余待发射次数。 */
  missileBurstLeft: number;
  missileBurstAcc: number;
  iFrame: number;
  hitStop: number;
  /** 喝药动作剩余时间 */
  drinkT: number;
  /** 药水公共冷却剩余时间 */
  potionCd: number;
  /** 职业身份；旧档缺省战士。 */
  classId: PlayerClassId;
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
  /** 法术强度（法师主输出）。 */
  sp: number;
  def: number;
  critChance: number;
  critMult: number;
  hp: number;
  maxHp: number;
  /** 怒气或法力当前值（按职业解释）。 */
  rage: number;
  maxRage: number;
  combatT: number;
  rageWarnT: number;
  hurtT: number;
  deadT: number;
  /** 死亡原因：坠落 / 战斗 */
  deathCause: 'none' | 'fall' | 'combat';
  /** 靠近悬崖/坑缝时的警告剩余时间 */
  fallWarnT: number;
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
  /** 盗贼连击点 0–5 */
  comboPoints: number;
  /** 疾跑 buff 剩余 */
  sprintT: number;
  /** 消失无敌剩余 */
  vanishT: number;
  /** 破隐/疾跑结束后下一次攻击加成剩余时间 */
  openerBonusT: number;
  /** 猎人急速射击剩余 */
  rapidFireT: number;
  rapidFireAcc: number;
  /** 炎爆等延迟弹道待发射 */
  skillShotArmed: boolean;
  /** 法力护盾开启 */
  manaShieldOn: boolean;
  /** 法力护盾剩余吸收量 */
  manaShieldHp: number;
  /** 冲锋后减伤剩余 */
  chargeDrT: number;
  /** 战吼 buff 剩余 */
  warShoutT: number;
  /** 切割攻速 buff 剩余 */
  sliceT: number;
};

export type DamagePopup = {
  id: number;
  x: number;
  y: number;
  value: number;
  age: number;
  lethal: boolean;
  crit: boolean;
  kind: 'damage' | 'level' | 'gold' | 'xp' | 'miss';
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

/** 背包 tip：相对当前装备的对比行 */
export type ItemCompareLine = {
  text: string;
  tone: 'better' | 'worse' | 'equal' | 'note';
};

export type BagSnapshotItem = {
  uid: number;
  /** 物品定义 id（用于图标/查询精确数据） */
  defId: string;
  name: string;
  qty: number;
  quality: ItemQuality;
  equipped: boolean;
  canEquip: boolean;
  canUse: boolean;
  /** 汇总说明（兼容旧 UI） */
  desc: string | null;
  /** 属性行：装等、攻击、回复等 */
  stats: string[];
  /** 特性标签 */
  traits: string[];
  /** 风味 / 特效长文 */
  detail: string | null;
  /** 相对当前主手的对比（装备类） */
  compare: ItemCompareLine[];
  /** 单件售价（商人卖出；丢弃仅作参考） */
  sellPrice: number;
  kind: ItemKind;
  /** 装备耐久（非装备为 null） */
  dur: number | null;
  maxDur: number | null;
  /** 未装备的装备可分解 */
  canDismantle: boolean;
};

export type MaterialsSellSnap = {
  stacks: number;
  units: number;
  gold: number;
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
  reqLevel: number;
  learned: boolean;
  canLearn: boolean;
  canUpgrade: boolean;
  /** 未实装占位 */
  upcoming: boolean;
  cost: number;
  learnCost: number;
  /** 技能栏槽 0–3，未上栏为 -1 */
  barSlot: number;
  barLabel: string | null;
  compare: ItemCompareLine[];
};

export type CampShopRow = {
  defId: string;
  name: string;
  price: number;
  quality: ItemQuality;
  kind: ItemKind;
  /** 药水 / 材料可调数量买入 */
  canBuyBulk: boolean;
  /** 当前金币与堆叠约束下的可买上限 */
  buyMax: number;
  /** 背包中已有数量（堆叠合计；装备按件数） */
  ownedQty: number;
  /** 单行摘要（兼容） */
  detail: string | null;
  stats: string[];
  traits: string[];
  /** 风味 / 特效 */
  flavor: string | null;
  /** 相对当前主手对比（装备类） */
  compare: ItemCompareLine[];
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
  sp: number;
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
  enhanceSuccessPct: number;
  canEnhance: boolean;
  /** 主手当前耐久；无主手为 null */
  weaponDur: number | null;
  weaponMaxDur: number;
  repairCost: number;
  /** 无折扣标价 */
  repairCostFull: number;
  /** 本次修理是否消耗材料换折扣 */
  repairUsesMat: boolean;
  canRepair: boolean;
  slamCd: number;
  bashCd: number;
  skillCd2: number;
  skillCd3: number;
  /** Q/E/1/2 技能显示名与就绪消耗。 */
  skillQName: string;
  skillEName: string;
  skill3Name: string;
  skill4Name: string;
  /** 技能栏槽位对应技能 id（用于图标渲染；空槽为 null）。 */
  skillQId: SkillId | null;
  skillEId: SkillId | null;
  skill3Id: SkillId | null;
  skill4Id: SkillId | null;
  skillQCost: number;
  skillECost: number;
  skill3Cost: number;
  skill4Cost: number;
  skillQCdMax: number;
  skillECdMax: number;
  skill3CdMax: number;
  skill4CdMax: number;
  classId: PlayerClassId;
  className: string;
  resourceLabel: string;
  /** 盗贼连击点 */
  comboPoints: number;
  /** 法力护盾 */
  manaShieldOn: boolean;
  manaShieldHp: number;
  rageWarn: boolean;
  dead: boolean;
  awaitRespawn: boolean;
  hasBanner: boolean;
  /** 坠落 / 战斗 */
  deathCause: 'none' | 'fall' | 'combat';
  fallWarn: boolean;
  invOpen: boolean;
  charOpen: boolean;
  skillOpen: boolean;
  catalogOpen: boolean;
  settingsOpen: boolean;
  /** 升级加点简短弹窗 */
  levelUpOpen: boolean;
  levelUpGainAttr: number;
  levelUpGainSkill: number;
  campOpen: string | null;
  nearbyCamp: string | null;
  nearbyCampPrompt: string | null;
  campMessage: string | null;
  travelNodes: { id: string; label: string }[];
  worldMapNodes: {
    zoneId: string;
    name: string;
    levelMin: number;
    levelMax: number;
    unlocked: boolean;
    bossCleared: boolean;
    current: boolean;
    travelId: string | null;
    lockHint: string;
  }[];
  miniMap: {
    zoneId: string;
    marks: {
      u: number;
      v: number;
      kind: 'player' | 'elite' | 'boss' | 'banner' | 'trail' | 'secret' | 'secretNear' | 'portal' | 'loot';
    }[];
    secretsClaimed: number;
    secretsTotal: number;
  };
  /** 进区大字名牌 */
  zoneAnnounce: { name: string; sub: string } | null;
  shopStock: CampShopRow[];
  attrResetCost: number;
  skillResetCost: number;
  specResetCost: number;
  nearbyLootName: string | null;
  nearbyLootCompare: string | null;
  nearbyLootTone: 'better' | 'worse' | 'equal' | 'note' | null;
  nearbySecretPrompt: string | null;
  bag: BagSnapshotItem[];
  bagCap: number;
  /** 商人一键卖材料预览 */
  materialsSell: MaterialsSellSnap;
  /** 商人一键卖白装预览 */
  commonGearSell: MaterialsSellSnap;
  /** 商人一键卖绿装预览 */
  uncommonGearSell: MaterialsSellSnap;
  /** 商人一键卖蓝装预览 */
  rareGearSell: MaterialsSellSnap;
  /** 背包剩余格数 */
  bagSlotsLeft: number;
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
  /** 专精节点选择弹窗档位；null 表示关闭 */
  specNodePickTier: number | null;
  specNodeOptions: { id: string; name: string; desc: string }[];
  /** 已选节点摘要 */
  specNodePicks: { tier: number; name: string; desc: string }[];
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
  /** 近距精英词缀短提示 */
  eliteAffixHints: string[];
  ngPlusLevel: number;
  canStartNgPlus: boolean;
  challengeActive: boolean;
  challengeT: number;
  /** 试炼当前层（进行中） */
  challengeFloor: number;
  /** 历史最高通关层 */
  challengeBestFloor: number;
  /** 本层全局词缀标签 */
  challengeRunAffixes: string[];
  /** 本层全局词缀短提示 */
  challengeAffixHints: string[];
  legendaryCatalog: { defId: string; name: string; effectDesc: string; discovered: boolean }[];
  levelToast: string | null;
  tutorialHint: string | null;
  potionReady: boolean;
  /** 红药快捷可用 */
  lifePotionReady: boolean;
  /** 蓝药快捷可用 */
  manaPotionReady: boolean;
  /** 药水公共冷却剩余 */
  potionCd: number;
  potionCdMax: number;
  /** 背包内可用药水总数量（红+蓝，兼容） */
  potionCount: number;
  /** 生命药水数量 */
  lifePotionCount: number;
  /** 法力药水数量 */
  manaPotionCount: number;
  /** 低血且有生命药水：催促喝药 */
  potionUrge: boolean;
  /** 生命危急（与喝药提示同阈值，无药也闪条） */
  lowHp: boolean;
  /** 资源危急（无药也闪条） */
  lowResource: boolean;
  /** 低资源且有法力药水：催促喝药（生命危急优先） */
  manaPotionUrge: boolean;
  /** 当前区越级警告（低于区中位 ≥5） */
  levelGapWarn: string | null;
  /** 有拾取飞向背包时，高亮背包键位 */
  lootBagPulse: boolean;
  qaActive: boolean;
  qaGod: boolean;
  audio: { bgm: number; sfx: number; muted: boolean };
  gameplay: {
    showDamageNumbers: boolean;
    autoSortBagOnOpen: boolean;
    autoPickupConsumables: boolean;
  };
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

export type HunterTrapKind = 'snare' | 'explosive';

export type HunterTrap = {
  id: number;
  x: number;
  y: number;
  life: number;
  radius: number;
  kind: HunterTrapKind;
  /** 爆炸陷阱引信；≤0 后接触即爆，或到期自爆 */
  fuse: number;
};

export type BlizzardZone = {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  tickAcc: number;
  dps: number;
  /** 寒冰移速倍率 */
  chillMove: number;
  chillRefresh: number;
  /** 已结算 tick 数（首跳立即） */
  ticks: number;
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
  traps: HunterTrap[];
  trapId: number;
  blizzards: BlizzardZone[];
  blizzardId: number;
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
  /** 升级加点简短弹窗（可稍后，不进存档） */
  levelUpOpen: boolean;
  levelUpGainAttr: number;
  levelUpGainSkill: number;
  campOpen: string | null;
  nearbyCamp: string | null;
  campMessage: string;
  /** 靠近非营地回营传送点 */
  nearbyHubPortal: boolean;
  unlockedZones: string[];
  attrDraft: AttrDraft;
  skills: Record<string, number>;
  /** 长度 4：Q / E / 1 / 2 */
  skillBar: (string | null)[];
  specId: string | null;
  specPickOpen: boolean;
  /** 专精节点：档位 → 节点 id */
  specNodes: Record<number, string>;
  /** 正在选择的专精节点档位 */
  specNodePickTier: number | null;
  nearbyLootName: string | null;
  /** 地上主手相对当前装备的短对比文案 */
  nearbyLootCompare: string | null;
  nearbyLootTone: 'better' | 'worse' | 'equal' | 'note' | null;
  secretsClaimed: Record<string, boolean>;
  nearbySecretId: string | null;
  bossKills: Record<string, boolean>;
  /** 新周目层数：0=普通，击败终焉君王后可提升 */
  ngPlusLevel: number;
  /** 词缀试炼进行中 */
  challengeActive: boolean;
  /** 试炼剩余秒数 */
  challengeT: number;
  /** 当前层（进行中，不进存档） */
  challengeFloor: number;
  /** 历史最高完整通关层 */
  challengeBestFloor: number;
  /** 本层全局词缀 */
  challengeRunAffixes: EliteAffixId[];
  /** 已发现传说装备 id */
  discoveredLegendaries: string[];
  /** 林地一次性教学步骤 */
  tutorialStep: 'move' | 'jump' | 'attack' | 'roll' | 'potion' | 'loot' | 'minimap' | 'secret' | 'done';
  tutorialDone: boolean;
  tutorialAttrHint: boolean;
  tutorialSkillHint: boolean;
  breakables: BreakableProp[];
  kitTheme: string;
  shake: number;
  levelToastT: number;
  levelToastText: string;
  /** 进区名牌剩余时间（不进存档） */
  zoneAnnounceT: number;
  zoneAnnounceName: string;
  zoneAnnounceSub: string;
  /** 击败终焉后回营提示开 NG+（不进存档） */
  offerNgPlusHint: boolean;
  /** BOSS 遭遇关门（不进存档） */
  bossGateClosed: boolean;
  /** 关门墙中心 x，供渲染 */
  bossGateX: number;
  /** 击败 BOSS 慢动作剩余秒（真实时间，不进存档） */
  slowMoT: number;
  /** 本区已探索足迹（世界坐标，不进存档） */
  exploreTrail: { x: number; y: number }[];
};
