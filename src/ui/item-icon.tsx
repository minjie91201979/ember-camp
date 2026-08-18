import type { ItemKind, ItemQuality } from '../game/types';
import { ITEM_DEFS } from '../game/data/item-defs';
import type { PlayerClassId } from '../game/data/classes';
import { SKILL_DEFS, type SkillId } from '../game/systems/skills';

/**
 * 统一图标体系 ——「余烬暗曜」
 * 暗曜石圆角方板 + 描边（物品=5 档品质色；技能=5 档职业色）
 * 主体为扁平正面光，中性金属（冷钢灰 + 暗金配件）统一配色，
 * 高光统一来自左上 45°，主体约占画面 64%。
 * 技能主体允许一处小面积「元素微调色」（火=余烬橙/冰=冰蓝/毒=毒绿/圣光=金/奥术=紫/暗影=紫灰/血=血红），
 * 与药水红/蓝液体的先例一致，保证 40 个技能一眼可辨。
 */

export type ItemSubject =
  | 'sword'
  | 'twinblade'
  | 'blade'
  | 'axe'
  | 'staff'
  | 'bow'
  | 'maul'
  | 'impact'
  | 'slasher'
  | 'pick'
  | 'stoneblade'
  | 'stinger'
  | 'potion-life'
  | 'potion-mana'
  | 'gem'
  | 'ore'
  | 'relic'
  | 'gold';

export type ItemIconProps = {
  /** 物品定义 id（可精确解析武器类型/药水类型/材料族） */
  defId?: string | null;
  kind?: ItemKind;
  quality: ItemQuality;
  /** 显式指定主体（如金币，或自定义物品） */
  subject?: ItemSubject;
  size?: number;
  className?: string;
  title?: string;
};

/* ---------- 调色板 ---------- */

const QUALITY_BORDER: Record<ItemQuality, string> = {
  common: '#8d8a82',
  uncommon: '#57c84d',
  rare: '#4d8df6',
  epic: '#b06bff',
  legendary: '#f0a83a',
};

const PLATE = '#1b1714';

/* 中性金属统一配色 */
const STEEL = '#c3c9cf';
const STEEL_D = '#8a9199';
const STEEL_XD = '#5f666d';
const HILITE = '#eef2f5';
const GOLD = '#cba35c';
const GOLD_D = '#8d7137';
const WOOD = '#6b4f35';
const STONE = '#9aa3a8';
const STONE_D = '#778086';
const LIQUID_RED = '#c8504a';
const LIQUID_BLUE = '#4a7fd4';

/* 元素微调色（技能能量色，仅小面积使用） */
const EMBER = '#e07b4a';
const EMBER_L = '#f2a05e';
const EMBER_D = '#b04e2e';
const ICE = '#8cc3ef';
const ICE_D = '#5b87b4';
const VENOM = '#84cf6f';
const ARCANE = '#b48ce0';
const ARCANE_D = '#7a5aa8';
const SHADOW = '#8b7aa3';
const BLOOD = '#cf5a52';

/* 职业描边（技能面板 / 技能栏专用，与物品品质描边同一套明度语言） */
const CLASS_BORDER: Record<PlayerClassId, string> = {
  warrior: '#d96a45',
  mage: '#5b8fd4',
  hunter: '#6fbe64',
  rogue: '#a86fd8',
  paladin: '#e0b45c',
};

/* ---------- 武器类型 → 主体 ---------- */

const WEAPON_SUBJECT: Record<string, ItemSubject> = {
  长剑: 'sword',
  短剑: 'sword',
  劈斧: 'axe',
  短刃: 'blade',
  双匕: 'twinblade',
  短匕: 'blade',
  利齿刃: 'blade',
  獠牙刃: 'blade',
  法杖: 'staff',
  短弓: 'bow',
  长弓: 'bow',
  重槌: 'maul',
  冲击刃: 'impact',
  斩刃: 'slasher',
  镐刃: 'pick',
  石刃: 'stoneblade',
  刺刃: 'stinger',
};

/** 由 defId 解析物品主体；解析不到时回退到 kind 级默认。 */
export function itemSubjectOf(
  defId: string | null | undefined,
  kind?: ItemKind,
): ItemSubject {
  if (defId) {
    const def = ITEM_DEFS[defId];
    if (def) {
      if (def.kind === 'gear') {
        const w = def.weaponType ?? '';
        return WEAPON_SUBJECT[w] ?? 'sword';
      }
      if (def.kind === 'potion') {
        return def.mana ? 'potion-mana' : 'potion-life';
      }
      if (def.kind === 'material') {
        if (/^(relic-|throne-sigil|end-king-crown|ashen-crest)/.test(defId)) {
          return 'relic';
        }
        if (/(core|heart|pearl|fang)/.test(defId)) {
          return 'gem';
        }
        return 'ore';
      }
    }
  }
  return kind === 'gear'
    ? 'sword'
    : kind === 'potion'
      ? 'potion-life'
      : 'ore';
}

/** 药水档位角标（1–4 格）：minor / mid / greater / ultra。 */
function potionTier(defId: string | null | undefined): number {
  if (!defId) {
    return 1;
  }
  if (defId.includes('ultra')) {
    return 4;
  }
  if (defId.includes('greater')) {
    return 3;
  }
  if (defId.includes('mid')) {
    return 2;
  }
  return 1;
}

/* ---------- 18 个主体图形 ---------- */

function SubjectArt({ subject }: { subject: ItemSubject }) {
  switch (subject) {
    case 'sword':
      return (
        <g>
          <path d="M32 11 L37 16 L35 34 L29 34 L27 16 Z" fill={STEEL} />
          <path d="M32 12 L28.6 17 L30 32" stroke={HILITE} strokeWidth="0.8" fill="none" opacity="0.7" />
          <line x1="32" y1="15" x2="32" y2="32" stroke={STEEL_XD} strokeWidth="0.8" opacity="0.55" />
          <rect x="25.5" y="34" width="13" height="3" rx="1" fill={GOLD} />
          <rect x="31" y="34" width="2" height="3" fill={GOLD_D} />
          <rect x="29.5" y="37" width="5" height="7" rx="1" fill={WOOD} />
          <line x1="30" y1="39.5" x2="34" y2="39.5" stroke={GOLD_D} strokeWidth="0.9" opacity="0.8" />
          <line x1="30" y1="42" x2="34" y2="42" stroke={GOLD_D} strokeWidth="0.9" opacity="0.8" />
          <circle cx="32" cy="46.5" r="2.2" fill={GOLD} />
        </g>
      );

    case 'twinblade':
      return (
        <g>
          <g transform="rotate(-24 32 32)">
            <polygon points="32,9 35,16 34.5,30 29.5,30 29,16" fill={STEEL} />
            <line x1="30.2" y1="17" x2="31.6" y2="29" stroke={HILITE} strokeWidth="0.7" opacity="0.7" />
            <rect x="27.5" y="30" width="9" height="2.4" rx="0.8" fill={GOLD} />
            <rect x="29.8" y="32.4" width="4.4" height="6" rx="1" fill={WOOD} />
            <circle cx="32" cy="40.5" r="1.8" fill={GOLD} />
          </g>
          <g transform="rotate(24 32 32)">
            <polygon points="32,9 35,16 34.5,30 29.5,30 29,16" fill={STEEL} />
            <line x1="30.2" y1="17" x2="31.6" y2="29" stroke={HILITE} strokeWidth="0.7" opacity="0.7" />
            <rect x="27.5" y="30" width="9" height="2.4" rx="0.8" fill={GOLD} />
            <rect x="29.8" y="32.4" width="4.4" height="6" rx="1" fill={WOOD} />
            <circle cx="32" cy="40.5" r="1.8" fill={GOLD} />
          </g>
        </g>
      );

    case 'blade':
      return (
        <g>
          <path d="M40 12 C47 20 46 30 40 36 L34 36 C38 31 39 24 36 17 Z" fill={STEEL} />
          <path d="M38.6 14 C43.5 20.5 43 28.5 38.4 34" stroke={HILITE} strokeWidth="0.9" fill="none" opacity="0.65" />
          <rect x="32" y="36" width="12" height="2.6" rx="1" fill={GOLD} />
          <path d="M33 38.6 L26 45.5" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="24.8" cy="46.6" r="2" fill={GOLD} />
        </g>
      );

    case 'axe':
      return (
        <g>
          <path d="M46 16 L26 16 C21 16 19 21 19 26 C19 31 21 36 26 36 L46 36 L48 26 Z" fill={STEEL} />
          <path d="M21.5 26 C21.5 30 23 34 26 35" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.65" />
          <path d="M44 17.5 L26 17.5" stroke={HILITE} strokeWidth="0.7" opacity="0.5" />
          <path d="M42 34 L27 34" stroke={STEEL_XD} strokeWidth="0.8" opacity="0.45" />
          <rect x="29.5" y="36" width="5" height="14" rx="1.5" fill={WOOD} />
          <rect x="29.5" y="46" width="5" height="4" fill={GOLD} />
        </g>
      );

    case 'staff':
      return (
        <g>
          <circle cx="32" cy="12" r="5" fill={STEEL} />
          <circle cx="30.5" cy="10.5" r="1.4" fill={HILITE} />
          <path d="M27 13.5 A5 5 0 0 0 37 13.5" stroke={GOLD} strokeWidth="1.1" fill="none" />
          <rect x="30.5" y="17.5" width="3" height="30" rx="1.5" fill={WOOD} />
          <rect x="28.5" y="20" width="7" height="2" rx="1" fill={GOLD} />
          <rect x="28.5" y="42" width="7" height="2" rx="1" fill={GOLD} />
          <rect x="29.5" y="48" width="5" height="3" fill={GOLD_D} />
        </g>
      );

    case 'bow':
      return (
        <g>
          <path d="M44 14 C50 28 48 42 38 50" stroke={STEEL} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M41.5 16.5 C46 28 44.5 39.5 36.5 47" stroke={GOLD} strokeWidth="1.1" fill="none" />
          <line x1="44" y1="14" x2="38" y2="50" stroke={HILITE} strokeWidth="0.8" opacity="0.55" />
          <line x1="24" y1="19" x2="52" y2="45" stroke={WOOD} strokeWidth="1.6" />
          <polygon points="50,41.5 54.5,45.5 51,47" fill={STEEL} />
          <polygon points="25,17.5 28.5,21 24,23.5" fill={GOLD} />
        </g>
      );

    case 'maul':
      return (
        <g>
          <rect x="20" y="14" width="24" height="18" rx="3" fill={STEEL} />
          <rect x="22" y="16" width="20" height="2" rx="1" fill={HILITE} opacity="0.6" />
          <line x1="20" y1="22" x2="44" y2="22" stroke={STEEL_XD} strokeWidth="0.9" opacity="0.5" />
          <line x1="20" y1="28" x2="44" y2="28" stroke={STEEL_XD} strokeWidth="0.9" opacity="0.35" />
          <rect x="20" y="29.5" width="24" height="2.5" fill={GOLD} />
          <rect x="30" y="32" width="4" height="18" rx="1.5" fill={WOOD} />
          <rect x="30" y="40" width="4" height="6" fill={GOLD_D} opacity="0.7" />
          <circle cx="32" cy="52" r="2" fill={GOLD} />
        </g>
      );

    case 'impact':
      return (
        <g>
          <circle cx="32" cy="31" r="16" fill={STEEL} />
          <circle cx="32" cy="31" r="12.5" fill={STEEL_D} />
          <path d="M17 24 A16 16 0 0 1 32 15" stroke={GOLD} strokeWidth="1.4" fill="none" />
          <polygon points="32,15 34.5,20 34.5,42 29.5,42 29.5,20" fill={STEEL} />
          <circle cx="32" cy="31" r="4.5" fill={STEEL} />
          <circle cx="30.8" cy="29.8" r="1.5" fill={HILITE} opacity="0.7" />
          <circle cx="32" cy="19" r="1" fill={GOLD} />
          <circle cx="43" cy="31" r="1" fill={GOLD} />
          <circle cx="21" cy="31" r="1" fill={GOLD} />
          <circle cx="32" cy="43" r="1" fill={GOLD} />
        </g>
      );

    case 'slasher':
      return (
        <g>
          <path d="M44 18 C46 22 46 28 44 32 L24 32 C20 32 18 26 20 22 C22 19 26 18 44 18 Z" fill={STEEL} />
          <path d="M23 20 C21 23 21 29 23 31" stroke={HILITE} strokeWidth="0.9" fill="none" opacity="0.65" />
          <line x1="28" y1="18.8" x2="42" y2="18.8" stroke={HILITE} strokeWidth="0.6" opacity="0.5" />
          <rect x="13" y="22.5" width="9" height="5" rx="1.5" fill={WOOD} />
          <rect x="11.5" y="23.5" width="3" height="3.5" rx="0.8" fill={GOLD} />
        </g>
      );

    case 'pick':
      return (
        <g>
          <path d="M22 16 C30 16 36 20 40 26 L37 28 C34 23 28 20 22 20 Z" fill={STEEL} />
          <path d="M23 17.5 C29 17.5 33.5 20.5 38 25" stroke={HILITE} strokeWidth="0.8" fill="none" opacity="0.65" />
          <line x1="30" y1="24" x2="20" y2="48" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <circle cx="28.6" cy="27.4" r="2.6" fill={GOLD} opacity="0.85" />
          <rect x="18" y="47" width="5" height="2.5" rx="1" fill={GOLD_D} />
        </g>
      );

    case 'stoneblade':
      return (
        <g>
          <polygon
            points="33,10 38,14 37,20 40,24 36,30 37,36 32,40 30,34 32,28 28,24 31,18 29,13"
            fill={STONE}
          />
          <path d="M31 18 L36 24" stroke={STONE_D} strokeWidth="0.8" />
          <path d="M33 28 L36 33" stroke={STONE_D} strokeWidth="0.8" />
          <path d="M30.5 14.5 L33 12.5" stroke={HILITE} strokeWidth="0.8" opacity="0.6" />
          <rect x="28" y="38" width="9" height="4" rx="1.5" fill={GOLD} />
          <rect x="30" y="42" width="4" height="6" rx="1" fill={WOOD} />
        </g>
      );

    case 'stinger':
      return (
        <g>
          <polygon points="32,10 35,16 34.5,34 29.5,34 29,16" fill={STEEL} />
          <line x1="30.2" y1="17" x2="31.6" y2="33" stroke={HILITE} strokeWidth="0.7" opacity="0.7" />
          <path d="M24 34 Q32 38 40 34" stroke={GOLD} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="29.8" y="36.5" width="4.4" height="6.5" rx="1" fill={WOOD} />
          <circle cx="32" cy="45.5" r="2" fill={GOLD} />
        </g>
      );

    case 'potion-life':
    case 'potion-mana': {
      const liquid = subject === 'potion-life' ? LIQUID_RED : LIQUID_BLUE;
      return (
        <g>
          <path
            d="M28.5 15 L35.5 15 L36 21 C39 24 41 28 41 33 C41 40.5 37 45.5 32 45.5 C27 45.5 23 40.5 23 33 C23 28 25 24 28 21 Z"
            fill="none"
            stroke="#c7ccd2"
            strokeWidth="1.5"
          />
          <path
            d="M24.2 30 C26.5 28.6 29 29 32 29 C35 29 37.5 28.6 39.8 30 C40.2 33 40.2 36.5 39.8 39.5 C36.5 42.3 27.5 42.3 24.2 39.5 C23.8 36.5 23.8 33 24.2 30 Z"
            fill={liquid}
          />
          <path
            d="M24.5 29.5 C26.8 28.3 29.2 28.7 32 28.7 C34.8 28.7 37.2 28.3 39.5 29.5"
            stroke={HILITE}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path d="M26 20 C24 24 23.5 28 24 33" stroke={HILITE} strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round" />
          <rect x="29.5" y="11.5" width="5" height="4" rx="1" fill={WOOD} />
          <rect x="27.5" y="15.4" width="9" height="1.6" fill={GOLD} />
        </g>
      );
    }

    case 'gem':
      return (
        <g>
          <polygon points="32,10 44,20 40,36 32,46 24,36 20,20" fill={STEEL} />
          <polygon points="32,10 40,18 32,22 26,18" fill={HILITE} opacity="0.45" />
          <path d="M32 10 L32 46" stroke={STEEL_XD} strokeWidth="0.8" opacity="0.5" />
          <path d="M20 20 L44 20" stroke={STEEL_XD} strokeWidth="0.7" opacity="0.45" />
          <path d="M24 36 L40 36" stroke={STEEL_XD} strokeWidth="0.7" opacity="0.45" />
          <path d="M33 26 L35.5 28.5" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25" cy="28" r="1.1" fill={GOLD} />
        </g>
      );

    case 'ore':
      return (
        <g>
          <path
            d="M22 34 C20 26 24 18 32 16 C39 14 45 20 44 28 C46 34 43 42 36 44 C29 46 24 42 22 34 Z"
            fill={STONE}
          />
          <path d="M27 18 C30 16.5 35 16 39 17.5" stroke={HILITE} strokeWidth="0.9" fill="none" opacity="0.5" />
          <path d="M26 22 L33 26 L30 34" stroke={STONE_D} strokeWidth="0.9" fill="none" />
          <path d="M36 20 L39 30" stroke={STONE_D} strokeWidth="0.9" fill="none" />
          <path d="M24 31 L28 27.5 L31 29.5" stroke={GOLD} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="38" cy="34" r="1.6" fill={GOLD} />
          <circle cx="31" cy="38" r="1" fill={GOLD} />
        </g>
      );

    case 'relic':
      return (
        <g>
          <circle cx="32" cy="14.5" r="2.2" fill="none" stroke={GOLD} strokeWidth="1.6" />
          <circle cx="32" cy="30" r="15" fill={STEEL} />
          <circle cx="32" cy="30" r="11" fill={PLATE} />
          <path d="M22 22 A13 13 0 0 1 42 22" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.5" />
          <path
            d="M32 22 L32 38 M27 26 L37 26 M27 34 L37 34"
            stroke={GOLD}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="32" cy="30" r="15" fill="none" stroke={GOLD} strokeWidth="2" />
        </g>
      );

    case 'gold':
      return (
        <g>
          <circle cx="40" cy="24" r="9" fill={GOLD} />
          <circle cx="40" cy="24" r="6.6" fill="none" stroke={GOLD_D} strokeWidth="1" />
          <path d="M38.5 19.5 A8 8 0 0 1 45 27" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="30" cy="36" r="11" fill={GOLD} />
          <circle cx="30" cy="36" r="8.2" fill="none" stroke={GOLD_D} strokeWidth="1" />
          <path
            d="M30 31 L31.6 34.2 L35 34.6 L32.5 37 L33.2 40.4 L30 38.6 L26.8 40.4 L27.5 37 L25 34.6 L28.4 34.2 Z"
            fill={GOLD_D}
          />
          <path d="M24 30 A10 10 0 0 1 33 26.5" stroke={HILITE} strokeWidth="1.1" fill="none" opacity="0.55" />
        </g>
      );
  }
}

/* ---------- 技能图标体系 ---------- */

export type SkillSubject =
  /* 战士 / 圣骑士（物理系） */
  | 'slam'
  | 'bash'
  | 'charge'
  | 'whirl'
  | 'execute'
  | 'shout'
  | 'sunder'
  | 'cleave'
  /* 法师 */
  | 'fireball'
  | 'frost'
  | 'arcane'
  | 'blink'
  | 'blizzard'
  | 'pyro'
  | 'icelance'
  | 'mana-shield'
  /* 猎人 */
  | 'aim'
  | 'disengage'
  | 'multi'
  | 'trap'
  | 'rapid'
  | 'explosive-trap'
  | 'concussive'
  | 'serpent'
  /* 盗贼 */
  | 'shadow-strike'
  | 'eviscerate'
  | 'poison'
  | 'sprint'
  | 'vanish'
  | 'kidney'
  | 'slice'
  | 'fan';

/**
 * 技能 id → 主体。圣骑士复用战士的物理主体（职业描边区分），
 * 与 SKILL_DEFS 中「圣骑士复用战士 kind」的数据设计一致。
 */
export const SKILL_SUBJECT: Record<SkillId, SkillSubject> = {
  slam: 'slam',
  bash: 'bash',
  charge: 'charge',
  whirlwind: 'whirl',
  execute: 'execute',
  'battle-shout': 'shout',
  sunder: 'sunder',
  cleave: 'cleave',
  fireball: 'fireball',
  'frost-nova': 'frost',
  'arcane-missiles': 'arcane',
  blink: 'blink',
  blizzard: 'blizzard',
  pyroblast: 'pyro',
  'ice-lance': 'icelance',
  'mana-shield': 'mana-shield',
  'aimed-shot': 'aim',
  disengage: 'disengage',
  'multi-shot': 'multi',
  trap: 'trap',
  'rapid-fire': 'rapid',
  'explosive-trap': 'explosive-trap',
  'concussive-shot': 'concussive',
  'serpent-sting': 'serpent',
  'shadow-strike': 'shadow-strike',
  eviscerate: 'eviscerate',
  'poison-blade': 'poison',
  sprint: 'sprint',
  vanish: 'vanish',
  'kidney-shot': 'kidney',
  'slice-and-dice': 'slice',
  'fan-of-knives': 'fan',
  judgment: 'slam',
  'shield-of-light': 'bash',
  'crusader-strike': 'charge',
  consecration: 'whirl',
  'hammer-of-wrath': 'execute',
  blessing: 'shout',
  exorcism: 'sunder',
  'divine-storm': 'cleave',
};

function SkillSubjectArt({ subject }: { subject: SkillSubject }) {
  switch (subject) {
    case 'slam':
      return (
        <g>
          <rect x="21" y="11" width="22" height="15" rx="2.5" fill={STEEL} />
          <rect x="23" y="12.8" width="18" height="2" rx="1" fill={HILITE} opacity="0.6" />
          <line x1="21" y1="18.5" x2="43" y2="18.5" stroke={STEEL_XD} strokeWidth="0.8" opacity="0.5" />
          <rect x="21" y="23.5" width="22" height="2.5" fill={GOLD} />
          <line x1="32" y1="26" x2="40" y2="45" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <circle cx="41" cy="46.5" r="2" fill={GOLD} />
          <path d="M21 51 L17 56 M32 53 L32 58 M43 51 L47 56" stroke={EMBER} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );

    case 'bash':
      return (
        <g>
          <circle cx="32" cy="29" r="16" fill={STEEL} />
          <circle cx="32" cy="29" r="12.5" fill={STEEL_D} />
          <path d="M18 22 A14 14 0 0 1 32 15" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.55" />
          <circle cx="32" cy="29" r="4.2" fill={GOLD} />
          <circle cx="32" cy="29" r="1.7" fill={GOLD_D} />
          <path d="M13 33 A20 20 0 0 1 51 33" stroke={EMBER} strokeWidth="1.6" fill="none" opacity="0.65" />
        </g>
      );

    case 'charge':
      return (
        <g>
          <polygon points="19,32 43,25 43,39" fill={STEEL} />
          <polygon points="24,32 40,28 40,36" fill={STEEL_D} />
          <path d="M46 25.5 L51 22 M46 38.5 L51 42" stroke={EMBER} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="23" x2="17" y2="23" stroke={HILITE} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <line x1="7" y1="32" x2="16" y2="32" stroke={HILITE} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
          <line x1="10" y1="41" x2="17" y2="41" stroke={HILITE} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </g>
      );

    case 'whirl':
      return (
        <g>
          <circle cx="32" cy="32" r="14.5" fill="none" stroke={STEEL_XD} strokeWidth="1.6" opacity="0.45" />
          <path d="M32 9 L34.6 19 L29.4 19 Z" fill={STEEL} />
          <path d="M55 32 L45 29.4 L45 34.6 Z" fill={STEEL} />
          <path d="M32 55 L29.4 45 L34.6 45 Z" fill={STEEL} />
          <path d="M9 32 L19 29.4 L19 34.6 Z" fill={STEEL} />
          <circle cx="32" cy="32" r="5.5" fill={STEEL} />
          <circle cx="32" cy="32" r="2.6" fill={PLATE} />
          <path d="M17 18 A24 24 0 0 1 47 18" stroke={EMBER} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M47 46 A24 24 0 0 1 17 46" stroke={EMBER} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.45" />
        </g>
      );

    case 'execute':
      return (
        <g>
          <g transform="rotate(-35 32 32)">
            <path
              d="M46 17 L24 17 C19.5 17 17.5 22 17.5 27 C17.5 32 19.5 37 24 37 L46 37 L48.5 27 Z"
              fill={STEEL}
            />
            <path d="M21 27 C21 31 22.5 34 25 35.5" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.6" />
            <line x1="24" y1="17.5" x2="44" y2="17.5" stroke={HILITE} strokeWidth="0.7" opacity="0.5" />
            <rect x="27" y="37" width="5" height="13" rx="1.5" fill={WOOD} />
            <rect x="27" y="46" width="5" height="4" fill={GOLD} />
          </g>
          <path d="M13 30 L8.5 27 M13 39 L8.5 42" stroke={EMBER} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );

    case 'shout':
      return (
        <g>
          <path d="M15 25 L23 32 L15 39 Z" fill={STEEL} />
          <path d="M18 28.5 L21 32 L18 35.5 Z" fill={PLATE} />
          <path d="M29 23 A14 14 0 0 1 29 41" stroke={HILITE} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M37 18 A22 22 0 0 1 37 46" stroke={HILITE} strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M45 12 A31 31 0 0 1 45 52" stroke={EMBER} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />
        </g>
      );

    case 'sunder':
      return (
        <g>
          <path d="M19 21 L45 16.5 L49 30 L46.5 44 L23 48.5 L17 34 Z" fill={STEEL} />
          <path d="M23 23.5 L41 20 L44 30 L42 42 L25.5 45.5 L21 34 Z" fill={STEEL_D} />
          <path d="M32 19.5 L30 28 L34.5 33.5 L28 41" stroke={GOLD} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M20 34.5 L27 32" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M42 42.5 L36.5 38.5" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M26 24 L35 21" stroke={HILITE} strokeWidth="0.9" opacity="0.5" />
        </g>
      );

    case 'cleave':
      return (
        <g>
          <path d="M19 41 A27 27 0 0 1 49 19" stroke={STEEL} strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <path d="M22.5 39 A23.5 23.5 0 0 1 46 21.5" stroke={HILITE} strokeWidth="1.2" fill="none" opacity="0.5" />
          <circle cx="18.6" cy="42.6" r="2.2" fill={GOLD} />
          <path d="M12 45 A33 33 0 0 1 13.5 38" stroke={EMBER} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M44 14 A31 31 0 0 1 49 19" stroke={EMBER} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>
      );

    case 'fireball':
      return (
        <g>
          <circle cx="39" cy="23" r="11.5" fill={EMBER} />
          <circle cx="37.5" cy="21.5" r="7.5" fill={EMBER_L} />
          <circle cx="36" cy="20" r="3.2" fill={HILITE} />
          <path d="M31 29 C27 33 22.5 35 17.5 37" stroke={EMBER_D} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M28.5 26.5 L24 28.5 M30 32 L25.5 34.5" stroke={EMBER_L} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="22" cy="26" r="1.2" fill={EMBER_L} />
        </g>
      );

    case 'frost':
      return (
        <g>
          <polygon points="32,18 38.5,28 32,40 25.5,28" fill={ICE} />
          <polygon points="32,22.5 35,28 32,34.5 29,28" fill={HILITE} opacity="0.7" />
          <path d="M32 11 L33.7 18 L30.3 18 Z" fill={ICE} />
          <path d="M49 28 L42 29.7 L42 26.3 Z" fill={ICE} />
          <path d="M32 45 L30.3 38 L33.7 38 Z" fill={ICE} />
          <path d="M15 28 L22 26.3 L22 29.7 Z" fill={ICE} />
          <path d="M45 15.5 L41 18.5 L43 21.5 Z" fill={ICE_D} />
          <path d="M19 40.5 L23 37.5 L21 34.5 Z" fill={ICE_D} />
          <circle cx="32" cy="28" r="16.5" fill="none" stroke={ICE} strokeWidth="1.2" opacity="0.4" />
        </g>
      );

    case 'arcane':
      return (
        <g>
          <polygon points="16,24 20,15 24,24" fill={ARCANE} />
          <line x1="20" y1="16.5" x2="20" y2="11.5" stroke={HILITE} strokeWidth="1" opacity="0.6" />
          <polygon points="30,39 34,30 38,39" fill={ARCANE} />
          <line x1="34" y1="31.5" x2="34" y2="26.5" stroke={HILITE} strokeWidth="1" opacity="0.6" />
          <polygon points="44,24 48,15 52,24" fill={ARCANE} />
          <line x1="48" y1="16.5" x2="48" y2="11.5" stroke={HILITE} strokeWidth="1" opacity="0.6" />
          <path d="M26 28 C30 31.5 36 31.5 40 28" stroke={ARCANE_D} strokeWidth="1.2" fill="none" opacity="0.5" />
        </g>
      );

    case 'blink':
      return (
        <g>
          <path d="M32 10 A22 22 0 0 1 50 30" stroke={ARCANE} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M50 30 A22 22 0 0 1 26 51" stroke={ARCANE} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M26 51 A22 22 0 0 1 12 26" stroke={ARCANE_D} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M12 26 A22 22 0 0 1 32 10" stroke={ARCANE_D} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.35" />
          <circle cx="32" cy="32" r="4.2" fill={HILITE} opacity="0.9" />
          <circle cx="32" cy="32" r="2" fill={ARCANE} />
        </g>
      );

    case 'blizzard':
      return (
        <g>
          <path d="M14 30 C14 23.5 20.5 20 27 21.5 C29 17.5 37 17.5 39 21.5 C45.5 21 51 25.5 50 31 Z" fill={STEEL_D} />
          <path d="M20 26 C22 23 25 21.5 29 22.5" stroke={HILITE} strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M23 36 L23 41 M20.5 38.5 L25.5 38.5" stroke={ICE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M36 34 L36 39 M33.5 36.5 L38.5 36.5" stroke={ICE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M29 43 L29 48 M26.5 45.5 L31.5 45.5" stroke={ICE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M41 40 L41 45 M38.5 42.5 L43.5 42.5" stroke={ICE} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );

    case 'pyro':
      return (
        <g>
          <circle cx="32" cy="30" r="12.5" fill={EMBER} />
          <circle cx="30.5" cy="28.5" r="8.5" fill={EMBER_L} />
          <circle cx="29.5" cy="27" r="3.8" fill={HILITE} opacity="0.9" />
          <path d="M32 10 L33.3 17 M32 10 L29.8 17" stroke={EMBER} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M52 30 L45 31 M52 30 L45 28.6" stroke={EMBER} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M32 50 L30.7 43 M32 50 L34.2 43" stroke={EMBER} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 30 L19 31 M12 30 L19 28.6" stroke={EMBER} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 11.5 L22 16.5 M20 11.5 L25 13" stroke={EMBER_L} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M44 48.5 L42 43.5 M44 48.5 L39 47" stroke={EMBER_L} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );

    case 'icelance':
      return (
        <g transform="rotate(28 32 32)">
          <rect x="28" y="14" width="8" height="40" rx="3" fill={ICE} />
          <rect x="29.6" y="16" width="2.4" height="36" rx="1.2" fill={HILITE} opacity="0.4" />
          <polygon points="32,6 37,15 27,15" fill={ICE} />
          <path d="M27 28 A7 7 0 0 0 37 28" stroke={ICE_D} strokeWidth="1.4" fill="none" />
          <path d="M27 38 A7 7 0 0 0 37 38" stroke={ICE_D} strokeWidth="1.4" fill="none" />
          <path d="M26 22 L24 19 M38 46 L40 49" stroke={ICE_D} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </g>
      );

    case 'mana-shield':
      return (
        <g>
          <path d="M20 42 A13 13 0 0 1 20 22 L44 22 A13 13 0 0 1 44 42 Z" fill="none" stroke={ARCANE} strokeWidth="2.2" />
          <path d="M23.5 40 A11 11 0 0 1 23.5 24.5 L40.5 24.5 A11 11 0 0 1 40.5 40" fill="none" stroke={ARCANE} strokeWidth="0.9" opacity="0.5" />
          <path d="M27 34 A9 9 0 0 1 27 27 L37 27 A9 9 0 0 1 37 34 Z" fill={ARCANE} opacity="0.3" />
          <circle cx="31" cy="29.5" r="1.3" fill={HILITE} opacity="0.85" />
          <circle cx="36.5" cy="35.5" r="1" fill={HILITE} opacity="0.6" />
          <path d="M30 45 L34 45 M31 47.5 L33 47.5" stroke={ARCANE_D} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );

    case 'aim':
      return (
        <g>
          <path d="M44 14 C50.5 26 48.5 40 42 50" stroke={STEEL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <line x1="20" y1="33" x2="37" y2="33" stroke={STEEL} strokeWidth="1.8" />
          <polygon points="39,33 43,35.5 43,30.5" fill={STEEL} />
          <polygon points="20,33 24,29 24,37" fill={GOLD} />
          <circle cx="39" cy="33" r="5.5" fill="none" stroke={EMBER} strokeWidth="1.4" />
          <line x1="45.5" y1="33" x2="49.5" y2="33" stroke={EMBER} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="39" y1="27.5" x2="39" y2="23.5" stroke={EMBER} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="39" y1="38.5" x2="39" y2="42.5" stroke={EMBER} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );

    case 'disengage':
      return (
        <g>
          <line x1="24" y1="30" x2="42" y2="30" stroke={STEEL} strokeWidth="1.8" />
          <polygon points="44,30 48,32.5 48,27.5" fill={STEEL} />
          <polygon points="24,30 28,26 28,34" fill={GOLD} />
          <path d="M21 21 C13 21 10.5 28 12.5 34.5" stroke={STEEL_D} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <polygon points="12.5,34.5 9.5,30 15.5,30" fill={STEEL_D} />
          <circle cx="24" cy="30" r="1.7" fill={EMBER} />
          <path d="M15 16 C17 15 19 15 21 16" stroke={HILITE} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>
      );

    case 'multi':
      return (
        <g>
          <path d="M20 31 L38 31" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="40,31 44,33.5 44,28.5" fill={STEEL} />
          <path d="M23 22 L41 20" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="43,19.8 47.5,21.5 46.5,17" fill={STEEL} />
          <path d="M23 40 L41 42" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="43,42.2 46.5,45 47.5,40.5" fill={STEEL} />
          <path d="M20 31 L16 27 L16 35 Z" fill={GOLD} />
          <path d="M23 22 L19.5 17.5 L19.5 26.5 Z" fill={GOLD} />
          <path d="M23 40 L19.5 35.5 L19.5 44.5 Z" fill={GOLD} />
        </g>
      );

    case 'trap':
      return (
        <g>
          <path d="M15 39 A17 17 0 0 1 49 39 L45 43 L19 43 Z" fill={STEEL} />
          <path d="M19 25 L45 25 L49 29 A17 17 0 0 1 15 29 Z" fill={STEEL} />
          <path d="M21 26 L21 42 M27 26 L27 42 M37 26 L37 42 M43 26 L43 42" stroke={STEEL_D} strokeWidth="1.5" />
          <path d="M19 26 L45 26" stroke={HILITE} strokeWidth="0.8" opacity="0.5" />
          <circle cx="32" cy="34" r="3.6" fill={GOLD} />
          <circle cx="32" cy="34" r="1.5" fill={GOLD_D} />
          <path d="M18 43 L46 43 L43 47 L21 47 Z" fill={STEEL_D} />
        </g>
      );

    case 'rapid':
      return (
        <g>
          <line x1="12" y1="22" x2="38" y2="22" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="40,22 44,24.5 44,19.5" fill={STEEL} />
          <line x1="16" y1="33" x2="42" y2="33" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="44,33 48,35.5 48,30.5" fill={STEEL} />
          <line x1="20" y1="44" x2="46" y2="44" stroke={STEEL} strokeWidth="1.6" />
          <polygon points="48,44 52,46.5 52,41.5" fill={STEEL} />
          <line x1="12" y1="22" x2="22" y2="22" stroke={EMBER} strokeWidth="1.2" opacity="0.7" />
          <line x1="16" y1="33" x2="26" y2="33" stroke={EMBER} strokeWidth="1.2" opacity="0.7" />
          <line x1="20" y1="44" x2="30" y2="44" stroke={EMBER} strokeWidth="1.2" opacity="0.7" />
          <path d="M12 20.5 L8 17.5 L8 26.5 Z" fill={GOLD} opacity="0.8" />
        </g>
      );

    case 'explosive-trap':
      return (
        <g>
          <path d="M23 39 A12 12 0 0 1 41 39 L37.5 42 L26.5 42 Z" fill={STEEL} />
          <path d="M26.5 30 L37.5 30 L41 33 A12 12 0 0 1 23 33 Z" fill={STEEL} />
          <path d="M28 31 L28 41 M36 31 L36 41" stroke={STEEL_D} strokeWidth="1.3" />
          <circle cx="32" cy="36" r="2.8" fill={GOLD} />
          <path
            d="M32 10 L33.9 16.4 L40 16.4 L35.4 20.4 L37.4 27 L32 23.2 L26.6 27 L28.6 20.4 L24 16.4 L30.1 16.4 Z"
            fill={EMBER}
          />
          <circle cx="32" cy="18.5" r="2.6" fill={EMBER_L} />
        </g>
      );

    case 'concussive':
      return (
        <g>
          <line x1="17" y1="32" x2="35" y2="32" stroke={STEEL} strokeWidth="1.8" />
          <polygon points="37,32 41,34.5 41,29.5" fill={STEEL} />
          <polygon points="17,32 21,28 21,36" fill={GOLD} />
          <circle cx="41" cy="32" r="6.5" fill="none" stroke={EMBER} strokeWidth="1.4" />
          <circle cx="41" cy="32" r="10.5" fill="none" stroke={EMBER} strokeWidth="1" opacity="0.5" />
          <path d="M48 25 L52 22 M48 39 L52 42" stroke={EMBER} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        </g>
      );

    case 'serpent':
      return (
        <g>
          <line x1="17" y1="31" x2="37" y2="31" stroke={STEEL} strokeWidth="1.8" />
          <polygon points="39,31 43,33.5 43,28.5" fill={STEEL} />
          <polygon points="17,31 21,27 21,35" fill={GOLD} />
          <path d="M31 15 C34.5 19 34.5 22.5 31 24.5 C27.5 22.5 27.5 19 31 15 Z" fill={VENOM} />
          <path d="M29.6 19 C30.5 18 31.8 17.6 32.8 18" stroke={HILITE} strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M27 35 C29.5 37 33.5 37 36 35" stroke={VENOM} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );

    case 'shadow-strike':
      return (
        <g>
          <polygon points="32,9 35,17 34.5,33 29.5,33 29,17" fill={STEEL} />
          <line x1="30.2" y1="18" x2="31.6" y2="32" stroke={HILITE} strokeWidth="0.7" opacity="0.7" />
          <rect x="29.5" y="33" width="5" height="7" rx="1" fill={WOOD} />
          <rect x="30.2" y="40" width="3.6" height="2.2" rx="0.8" fill={GOLD} />
          <path d="M21 46 C24.5 42.5 28.5 42.5 30.5 44.5" stroke={SHADOW} strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M43 46 C39.5 42.5 35.5 42.5 33.5 44.5" stroke={SHADOW} strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M27 10 L23.5 7.5 M37 10 L40.5 7.5" stroke={SHADOW} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        </g>
      );

    case 'eviscerate':
      return (
        <g>
          <g transform="rotate(-28 32 32)">
            <polygon points="32,9 35,17 34.5,31 29.5,31 29,17" fill={STEEL} />
            <rect x="29.5" y="31" width="5" height="7" rx="1" fill={WOOD} />
          </g>
          <g transform="rotate(28 32 32)">
            <polygon points="32,9 35,17 34.5,31 29.5,31 29,17" fill={STEEL} />
            <rect x="29.5" y="31" width="5" height="7" rx="1" fill={WOOD} />
          </g>
          <path d="M27 24 L22.5 19.5 M37 24 L41.5 19.5 M28 40 L24 45 M36 40 L40 45" stroke={BLOOD} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M32 23 L32 18.5" stroke={BLOOD} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="32" cy="33" r="2" fill={BLOOD} />
        </g>
      );

    case 'poison':
      return (
        <g>
          <polygon points="31,11 34,19 33.5,35 28.5,35 28,19" fill={STEEL} />
          <line x1="29.2" y1="20" x2="30.6" y2="34" stroke={HILITE} strokeWidth="0.7" opacity="0.7" />
          <rect x="28.5" y="35" width="5" height="7" rx="1" fill={WOOD} />
          <rect x="29.2" y="42" width="3.6" height="2.2" rx="0.8" fill={GOLD} />
          <path d="M32 5 C35.5 9 35.5 12.5 32 14.5 C28.5 12.5 28.5 9 32 5 Z" fill={VENOM} />
          <path d="M40 20 C41.5 21.5 41.5 23.5 40 25 C38.5 23.5 38.5 21.5 40 20 Z" fill={VENOM} />
          <circle cx="42" cy="32" r="1.2" fill={VENOM} />
        </g>
      );

    case 'sprint':
      return (
        <g>
          <line x1="8" y1="22" x2="20" y2="22" stroke={HILITE} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <line x1="5" y1="31" x2="18" y2="31" stroke={HILITE} strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="40" x2="20" y2="40" stroke={HILITE} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <circle cx="37" cy="15" r="3.6" fill={STEEL} />
          <path d="M37 19 L35.5 29 L31.5 38 M35.5 29 L40 36 L38 47 M31.5 38 L27.5 47" stroke={STEEL} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45 22 C48.5 23 49.5 26 47.5 28.5" stroke={GOLD} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      );

    case 'vanish':
      return (
        <g>
          <path d="M32 12 L35 20 L29 20 Z" fill={STEEL} />
          <path d="M25 22 C25 19 39 19 39 22 L39 34 L25 34 Z" fill={STEEL} />
          <path d="M28 34 L26 46 M32 34 L32 46 M36 34 L38 46" stroke={STEEL} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M20 30 C24 26.5 28.5 27 31 29.5" stroke={SHADOW} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M37 28 C41 26 45.5 28 46.5 31" stroke={SHADOW} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M22 42 C26 40.5 30 41.5 32 44" stroke={SHADOW} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d="M14 26 L17 29 M14 36 L17 33" stroke={SHADOW} strokeWidth="1.1" strokeLinecap="round" opacity="0.3" />
        </g>
      );

    case 'kidney':
      return (
        <g>
          <path d="M22 18 C18.5 20.5 17.5 26 20.5 30.5 L25 36 L29.5 36 L33 30 C35 26.5 34 22 30 19.5 Z" fill={STEEL} />
          <path d="M23.5 20.5 C21 22.5 20.5 26 23 29" stroke={HILITE} strokeWidth="0.9" fill="none" opacity="0.55" />
          <rect x="26" y="36" width="7" height="9" rx="2.5" fill={STEEL_D} />
          <path
            d="M41 17 L42.8 22.5 L47.5 22.5 L43.9 26 L45.7 31.5 L41.5 28.6 L37.3 31.5 L39.1 26 L35.5 22.5 L40.2 22.5 Z"
            fill={EMBER}
          />
          <circle cx="41.5" cy="24" r="2" fill={EMBER_L} />
        </g>
      );

    case 'slice':
      return (
        <g>
          <line x1="21" y1="19" x2="43" y2="45" stroke={STEEL} strokeWidth="3.4" strokeLinecap="round" />
          <line x1="43" y1="19" x2="21" y2="45" stroke={STEEL} strokeWidth="3.4" strokeLinecap="round" />
          <line x1="23.5" y1="21.5" x2="40.5" y2="42.5" stroke={HILITE} strokeWidth="0.9" opacity="0.55" />
          <line x1="40.5" y1="21.5" x2="23.5" y2="42.5" stroke={HILITE} strokeWidth="0.9" opacity="0.55" />
          <path d="M32 21 L32 15 M27 26 L22.5 21.5 M37 26 L41.5 21.5" stroke={EMBER} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <circle cx="32" cy="32" r="1.8" fill={EMBER} />
        </g>
      );

    case 'fan':
      return (
        <g>
          <g transform="rotate(-40 32 32)">
            <polygon points="32,7 35,15 34.5,30 29.5,30 29,15" fill={STEEL} />
          </g>
          <g transform="rotate(0 32 32)">
            <polygon points="32,7 35,15 34.5,30 29.5,30 29,15" fill={STEEL} />
          </g>
          <g transform="rotate(40 32 32)">
            <polygon points="32,7 35,15 34.5,30 29.5,30 29,15" fill={STEEL} />
          </g>
          <g transform="rotate(-20 32 32)">
            <line x1="30.2" y1="16" x2="31.6" y2="29" stroke={HILITE} strokeWidth="0.7" opacity="0.65" />
          </g>
          <g transform="rotate(20 32 32)">
            <line x1="30.2" y1="16" x2="31.6" y2="29" stroke={HILITE} strokeWidth="0.7" opacity="0.65" />
          </g>
          <circle cx="32" cy="32" r="2.6" fill={GOLD} />
          <path d="M24 21 A15 15 0 0 1 40 21" stroke={EMBER} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
  }
}

export type SkillIconProps = {
  /** 技能定义 id（面板/技能栏均可直接传入） */
  id: string;
  size?: number;
  className?: string;
  title?: string;
};

export function SkillIcon({ id, size = 28, className, title }: SkillIconProps) {
  const def = SKILL_DEFS[id as SkillId];
  const subject = SKILL_SUBJECT[id as SkillId] ?? 'slam';
  const border = CLASS_BORDER[def?.classId ?? 'warrior'] ?? CLASS_BORDER.warrior;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="2" y="2" width="60" height="60" rx="13" fill={PLATE} stroke={border} strokeWidth="2" />
      <rect
        x="5.5"
        y="5.5"
        width="53"
        height="53"
        rx="10"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
      <SkillSubjectArt subject={subject} />
    </svg>
  );
}

/* ---------- 组件 ---------- */

export function ItemIcon({
  defId,
  kind,
  quality,
  subject,
  size = 32,
  className,
  title,
}: ItemIconProps) {
  const resolved: ItemSubject = subject ?? itemSubjectOf(defId, kind);
  const border = QUALITY_BORDER[quality] ?? QUALITY_BORDER.common;
  const isPotion = resolved === 'potion-life' || resolved === 'potion-mana';
  const tier = isPotion ? potionTier(defId) : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="2" y="2" width="60" height="60" rx="13" fill={PLATE} stroke={border} strokeWidth="2" />
      <rect
        x="5.5"
        y="5.5"
        width="53"
        height="53"
        rx="10"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
      <SubjectArt subject={resolved} />
      {tier > 0 ? (
        <g fill={GOLD_D}>
          {Array.from({ length: tier }, (_, i) => (
            <rect key={i} x={30.5 - tier * 3 + i * 6} y="48" width="3.6" height="3.6" rx="0.9" />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
