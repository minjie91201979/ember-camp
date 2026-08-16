import type { ItemDef, ItemQuality } from '../types';
import { CLASS_GEAR_DEFS, WARRIOR_BASE_AFFINITY } from './class-gear';

export const ITEM_DEFS: Record<string, ItemDef> = {
  'apprentice-sword': {
    id: 'apprentice-sword',
    name: '学徒长剑',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'common',
    ilvl: 1,
    weaponAtk: 8,
  },
  'apprentice-staff': {
    id: 'apprentice-staff',
    name: '学徒法杖',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'common',
    ilvl: 1,
    weaponAtk: 7,
  },
  'apprentice-bow': {
    id: 'apprentice-bow',
    name: '学徒短弓',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'common',
    ilvl: 1,
    weaponAtk: 7,
  },
  'apprentice-daggers': {
    id: 'apprentice-daggers',
    name: '学徒匕首',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'common',
    ilvl: 1,
    weaponAtk: 7,
  },
  'mist-blade': {
    id: 'mist-blade',
    name: '雾林短刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 3,
    weaponAtk: 12,
  },
  'grove-cleaver': {
    id: 'grove-cleaver',
    name: '林地劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 5,
    weaponAtk: 16,
  },
  'woodland-scrap': {
    id: 'woodland-scrap',
    name: '林地碎材',
    kind: 'material',
    quality: 'common',
    ilvl: 1,
  },
  'life-potion-minor': {
    id: 'life-potion-minor',
    name: '初级生命药水',
    kind: 'potion',
    quality: 'common',
    ilvl: 1,
    heal: 80,
  },
  'mana-potion-minor': {
    id: 'mana-potion-minor',
    name: '初级法力药水',
    kind: 'potion',
    quality: 'common',
    ilvl: 1,
    mana: 50,
  },
  'life-potion-mid': {
    id: 'life-potion-mid',
    name: '中级生命药水',
    kind: 'potion',
    quality: 'uncommon',
    ilvl: 20,
    heal: 160,
  },
  'mana-potion-mid': {
    id: 'mana-potion-mid',
    name: '中级法力药水',
    kind: 'potion',
    quality: 'uncommon',
    ilvl: 20,
    mana: 150,
  },
  'life-potion-greater': {
    id: 'life-potion-greater',
    name: '高级生命药水',
    kind: 'potion',
    quality: 'rare',
    ilvl: 40,
    heal: 280,
  },
  'mana-potion-greater': {
    id: 'mana-potion-greater',
    name: '高级法力药水',
    kind: 'potion',
    quality: 'rare',
    ilvl: 40,
    mana: 350,
  },
  'life-potion-ultra': {
    id: 'life-potion-ultra',
    name: '特级生命药水',
    kind: 'potion',
    quality: 'epic',
    ilvl: 55,
    heal: 1200,
  },
  'mana-potion-ultra': {
    id: 'mana-potion-ultra',
    name: '特级法力药水',
    kind: 'potion',
    quality: 'epic',
    ilvl: 55,
    mana: 700,
  },
  'magic-dust': {
    id: 'magic-dust',
    name: '魔法尘',
    kind: 'material',
    quality: 'rare',
    ilvl: 10,
  },
  'rotwood-essence': {
    id: 'rotwood-essence',
    name: '腐木精华',
    kind: 'material',
    quality: 'rare',
    ilvl: 5,
  },
  'quarry-ore': {
    id: 'quarry-ore',
    name: '荒石矿渣',
    kind: 'material',
    quality: 'common',
    ilvl: 6,
  },
  'iron-pick-blade': {
    id: 'iron-pick-blade',
    name: '铁镐刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 7,
    weaponAtk: 15,
  },
  'slate-cleaver': {
    id: 'slate-cleaver',
    name: '板岩劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 9,
    weaponAtk: 20,
  },
  'warden-core': {
    id: 'warden-core',
    name: '监工岩核',
    kind: 'material',
    quality: 'rare',
    ilvl: 10,
  },
  'driftwood-scrap': {
    id: 'driftwood-scrap',
    name: '潮汐浮木',
    kind: 'material',
    quality: 'common',
    ilvl: 11,
  },
  'coral-blade': {
    id: 'coral-blade',
    name: '珊瑚短刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 12,
    weaponAtk: 18,
  },
  'brine-cleaver': {
    id: 'brine-cleaver',
    name: '咸潮劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 14,
    weaponAtk: 24,
  },
  'tide-pearl': {
    id: 'tide-pearl',
    name: '潮汐巨珠',
    kind: 'material',
    quality: 'rare',
    ilvl: 15,
  },
  'cinder-shard': {
    id: 'cinder-shard',
    name: '焦土烬片',
    kind: 'material',
    quality: 'common',
    ilvl: 16,
  },
  'ember-fang': {
    id: 'ember-fang',
    name: '烬蜥利齿',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 17,
    weaponAtk: 22,
  },
  'ashen-cleaver': {
    id: 'ashen-cleaver',
    name: '灰烬劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 19,
    weaponAtk: 28,
  },
  'cinder-heart': {
    id: 'cinder-heart',
    name: '烬火之心',
    kind: 'material',
    quality: 'rare',
    ilvl: 20,
  },
  'mire-moss': {
    id: 'mire-moss',
    name: '沼地藓',
    kind: 'material',
    quality: 'common',
    ilvl: 21,
  },
  'bog-fang': {
    id: 'bog-fang',
    name: '毒蛙獠牙',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 22,
    weaponAtk: 26,
  },
  'venom-cleaver': {
    id: 'venom-cleaver',
    name: '毒沼劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 24,
    weaponAtk: 32,
  },
  'bog-heart': {
    id: 'bog-heart',
    name: '沼母之心',
    kind: 'material',
    quality: 'rare',
    ilvl: 25,
  },
  'frost-fur': {
    id: 'frost-fur',
    name: '霜狼毛皮',
    kind: 'material',
    quality: 'common',
    ilvl: 26,
  },
  'ice-fang': {
    id: 'ice-fang',
    name: '冰牙短刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 27,
    weaponAtk: 30,
  },
  'glacier-cleaver': {
    id: 'glacier-cleaver',
    name: '冰川劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 29,
    weaponAtk: 36,
  },
  'frostfang-heart': {
    id: 'frostfang-heart',
    name: '霜牙之心',
    kind: 'material',
    quality: 'rare',
    ilvl: 30,
  },
  'dune-chitin': {
    id: 'dune-chitin',
    name: '沙蝎甲壳',
    kind: 'material',
    quality: 'common',
    ilvl: 31,
  },
  'scorpion-stinger': {
    id: 'scorpion-stinger',
    name: '蝎刺短刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 32,
    weaponAtk: 34,
  },
  'sandstorm-cleaver': {
    id: 'sandstorm-cleaver',
    name: '沙暴劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 34,
    weaponAtk: 40,
  },
  'storm-core': {
    id: 'storm-core',
    name: '沙暴之核',
    kind: 'material',
    quality: 'rare',
    ilvl: 35,
  },
  'star-shard': {
    id: 'star-shard',
    name: '坠星碎片',
    kind: 'material',
    quality: 'common',
    ilvl: 36,
  },
  'ruin-blade': {
    id: 'ruin-blade',
    name: '废墟石刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 37,
    weaponAtk: 38,
  },
  'astral-cleaver': {
    id: 'astral-cleaver',
    name: '星辉劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 39,
    weaponAtk: 44,
  },
  'golem-core': {
    id: 'golem-core',
    name: '石像魔核',
    kind: 'material',
    quality: 'rare',
    ilvl: 40,
  },
  'abyss-ink': {
    id: 'abyss-ink',
    name: '暗潮墨汁',
    kind: 'material',
    quality: 'common',
    ilvl: 41,
  },
  'cult-dagger': {
    id: 'cult-dagger',
    name: '教徒短匕',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 42,
    weaponAtk: 42,
  },
  'tide-cleaver': {
    id: 'tide-cleaver',
    name: '暗潮劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 44,
    weaponAtk: 48,
  },
  'tide-lord-heart': {
    id: 'tide-lord-heart',
    name: '暗潮领主之心',
    kind: 'material',
    quality: 'rare',
    ilvl: 45,
  },
  'ridge-scale': {
    id: 'ridge-scale',
    name: '龙脊鳞片',
    kind: 'material',
    quality: 'common',
    ilvl: 46,
  },
  'wing-blade': {
    id: 'wing-blade',
    name: '翼刃短剑',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 47,
    weaponAtk: 46,
  },
  'ridge-cleaver': {
    id: 'ridge-cleaver',
    name: '龙脊劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 49,
    weaponAtk: 52,
  },
  'rockwing-fang': {
    id: 'rockwing-fang',
    name: '岩翼幼龙之牙',
    kind: 'material',
    quality: 'rare',
    ilvl: 50,
  },
  'void-dust': {
    id: 'void-dust',
    name: '虚空尘埃',
    kind: 'material',
    quality: 'common',
    ilvl: 51,
  },
  'rift-blade': {
    id: 'rift-blade',
    name: '裂隙短刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 52,
    weaponAtk: 50,
  },
  'void-cleaver': {
    id: 'void-cleaver',
    name: '虚空劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 54,
    weaponAtk: 56,
  },
  'rift-core': {
    id: 'rift-core',
    name: '裂隙看守核心',
    kind: 'material',
    quality: 'rare',
    ilvl: 55,
  },
  'throne-sigil': {
    id: 'throne-sigil',
    name: '王座徽记',
    kind: 'material',
    quality: 'common',
    ilvl: 56,
  },
  'guard-blade': {
    id: 'guard-blade',
    name: '禁卫长剑',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'uncommon',
    ilvl: 57,
    weaponAtk: 54,
  },
  'end-cleaver': {
    id: 'end-cleaver',
    name: '终焉劈斧',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'rare',
    ilvl: 59,
    weaponAtk: 60,
  },
  'end-king-crown': {
    id: 'end-king-crown',
    name: '终焉君王之冠',
    kind: 'material',
    quality: 'rare',
    ilvl: 60,
  },
  'ashen-crest': {
    id: 'ashen-crest',
    name: '烬灰徽记',
    kind: 'material',
    quality: 'rare',
    ilvl: 60,
  },
  'ember-maul': {
    id: 'ember-maul',
    name: '烬火重槌',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 20,
    weaponAtk: 28,
    legendaryEffect: 'ember-maul',
    effectDesc: '猛击：伤害与范围提升，击晕更久，冷却略增',
  },
  'tide-buckler': {
    id: 'tide-buckler',
    name: '潮盾冲击刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 40,
    weaponAtk: 48,
    legendaryEffect: 'tide-buckler',
    effectDesc: '盾击：冲刺更快、无敌帧更长、耗怒降低',
  },
  'rift-edge': {
    id: 'rift-edge',
    name: '裂隙斩刃',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 55,
    weaponAtk: 62,
    legendaryEffect: 'rift-edge',
    effectDesc: '斩杀：目标低血时伤害暴增，暴击伤害提高',
  },
  'cinder-staff': {
    id: 'cinder-staff',
    name: '烬心法杖',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 25,
    weaponAtk: 30,
    legendaryEffect: 'cinder-staff',
    effectDesc: '火球：爆炸半径约 +30%，伤害约 +18%',
  },
  'venom-longbow': {
    id: 'venom-longbow',
    name: '毒涎长弓',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 40,
    weaponAtk: 46,
    legendaryEffect: 'venom-longbow',
    effectDesc: '毒箭：DoT 更强；爆炸陷阱爆炸半径约 +20%',
  },
  'nightshade-fang': {
    id: 'nightshade-fang',
    name: '夜影毒牙',
    kind: 'gear',
    slot: 'mainhand',
    quality: 'legendary',
    ilvl: 55,
    weaponAtk: 58,
    legendaryEffect: 'nightshade-fang',
    effectDesc: '消失：冷却约 −20%；肾击：眩晕时长约 +25%',
  },
  /** 各区秘密探索遗物（营地高价出售；非战斗掉落） */
  'relic-mist-veil': {
    id: 'relic-mist-veil',
    name: '雾幔残片',
    kind: 'material',
    quality: 'rare',
    ilvl: 3,
    effectDesc: '探索遗物：迷雾林地秘密，可在营地高价出售',
  },
  'relic-ore-sigil': {
    id: 'relic-ore-sigil',
    name: '矿脉印记',
    kind: 'material',
    quality: 'rare',
    ilvl: 8,
    effectDesc: '探索遗物：荒石矿坑秘密，可在营地高价出售',
  },
  'relic-tide-glass': {
    id: 'relic-tide-glass',
    name: '潮璃碎片',
    kind: 'material',
    quality: 'rare',
    ilvl: 13,
    effectDesc: '探索遗物：潮汐海滩秘密，可在营地高价出售',
  },
  'relic-cinder-mask': {
    id: 'relic-cinder-mask',
    name: '烬面残饰',
    kind: 'material',
    quality: 'rare',
    ilvl: 18,
    effectDesc: '探索遗物：焦土丘陵秘密，可在营地高价出售',
  },
  'relic-bog-lantern': {
    id: 'relic-bog-lantern',
    name: '沼灯芯',
    kind: 'material',
    quality: 'rare',
    ilvl: 23,
    effectDesc: '探索遗物：幽影沼泽秘密，可在营地高价出售',
  },
  'relic-frost-charm': {
    id: 'relic-frost-charm',
    name: '霜铃坠',
    kind: 'material',
    quality: 'rare',
    ilvl: 28,
    effectDesc: '探索遗物：霜风雪原秘密，可在营地高价出售',
  },
  'relic-dune-scarab': {
    id: 'relic-dune-scarab',
    name: '沙丘圣甲',
    kind: 'material',
    quality: 'rare',
    ilvl: 33,
    effectDesc: '探索遗物：赤沙峡谷秘密，可在营地高价出售',
  },
  'relic-ruin-glyph': {
    id: 'relic-ruin-glyph',
    name: '遗迹符板',
    kind: 'material',
    quality: 'rare',
    ilvl: 38,
    effectDesc: '探索遗物：坠星废墟秘密，可在营地高价出售',
  },
  'relic-abyss-mask': {
    id: 'relic-abyss-mask',
    name: '暗潮面具',
    kind: 'material',
    quality: 'rare',
    ilvl: 43,
    effectDesc: '探索遗物：暗潮地窟秘密，可在营地高价出售',
  },
  'relic-wyrm-crest': {
    id: 'relic-wyrm-crest',
    name: '龙脊冠羽',
    kind: 'material',
    quality: 'rare',
    ilvl: 48,
    effectDesc: '探索遗物：龙脊山脉秘密，可在营地高价出售',
  },
  'relic-void-prism': {
    id: 'relic-void-prism',
    name: '虚空棱镜',
    kind: 'material',
    quality: 'rare',
    ilvl: 53,
    effectDesc: '探索遗物：虚空裂隙秘密，可在营地高价出售',
  },
  'relic-throne-seal': {
    id: 'relic-throne-seal',
    name: '王座印玺',
    kind: 'material',
    quality: 'rare',
    ilvl: 58,
    effectDesc: '探索遗物：终焉王座秘密，可在营地高价出售',
  },
};

type ItemLore = {
  weaponType?: string;
  flavor?: string;
  traits?: string[];
  effectDesc?: string;
};

const ITEM_LORE: Record<string, ItemLore> = {
  'apprentice-sword': {
    weaponType: '长剑',
    flavor: '烬营训练场的制式长剑，刃口尚新。',
    traits: ['近战', '新手友好'],
  },
  'apprentice-staff': {
    weaponType: '法杖',
    flavor: '学徒法师的入门木杖，顶端嵌着淡青晶石。',
    traits: ['法术聚焦', '新手友好'],
  },
  'apprentice-bow': {
    weaponType: '短弓',
    flavor: '营地猎手改短的练习弓，弦声清脆。',
    traits: ['远程', '新手友好'],
  },
  'apprentice-daggers': {
    weaponType: '双匕',
    flavor: '训练用薄刃，出鞘时几乎无声。',
    traits: ['近战', '迅捷', '新手友好'],
  },
  'mist-blade': {
    weaponType: '短刃',
    flavor: '雾林猎人常用的短刃，挥舞时带出湿冷雾气。',
    traits: ['近战', '迅捷'],
  },
  'grove-cleaver': {
    weaponType: '劈斧',
    flavor: '砍伐腐木的重斧，斧面刻着林地符纹。',
    traits: ['近战', '破甲'],
  },
  'woodland-scrap': {
    flavor: '林地随处可见的碎材，铁匠可用来加固武器。',
    traits: ['强化材料'],
  },
  'life-potion-minor': {
    flavor: '营地药剂师熬制的红液，入口微苦。',
    traits: ['消耗品', '应急'],
  },
  'mana-potion-minor': {
    flavor: '蓝晶粉末兑清水而成，回蓝迅速。',
    traits: ['消耗品', '法力'],
  },
  'life-potion-mid': {
    flavor: '浓缩生命精华，适合中期征途。',
    traits: ['消耗品', '强效回复'],
  },
  'mana-potion-mid': {
    flavor: '浓缩蓝晶浆，中期施法续航。',
    traits: ['消耗品', '法力', '强效回复'],
  },
  'life-potion-greater': {
    flavor: '高级军用药水，瓶身封印着暖光。',
    traits: ['消耗品', '强效回复'],
  },
  'mana-potion-greater': {
    flavor: '高阶法师常备的深蓝药液，冷冽入喉。',
    traits: ['消耗品', '法力', '强效回复'],
  },
  'life-potion-ultra': {
    flavor: '烬营秘方封存的赤金药液，濒死也能拉回一线。',
    traits: ['消耗品', '特级回复'],
  },
  'mana-potion-ultra': {
    flavor: '终焉余烬淬炼的虚空蓝晶，一口气灌满法力池。',
    traits: ['消耗品', '法力', '特级回复'],
  },
  'magic-dust': {
    flavor: '分解精良以上装备析出的细尘，铁匠用以加固。',
    traits: ['强化材料', '分解'],
  },
  'rotwood-essence': {
    flavor: '腐木首领残留的精华，异香刺鼻。',
    traits: ['稀有材料', '强化'],
  },
  'quarry-ore': {
    flavor: '荒石矿坑的粗矿，敲打后可嵌入刃脊。',
    traits: ['强化材料'],
  },
  'iron-pick-blade': {
    weaponType: '镐刃',
    flavor: '矿工改锻的镐刃武器，沉重但耐用。',
    traits: ['近战', '凿击'],
  },
  'slate-cleaver': {
    weaponType: '劈斧',
    flavor: '板岩打造的阔斧，挥动时有石屑飞溅感。',
    traits: ['近战', '破甲'],
  },
  'warden-core': {
    flavor: '矿坑监工体内的岩核，仍有余温。',
    traits: ['稀有材料', '强化'],
  },
  'driftwood-scrap': {
    flavor: '被潮水磨圆的浮木，晒干后可作柄材。',
    traits: ['强化材料'],
  },
  'coral-blade': {
    weaponType: '短刃',
    flavor: '珊瑚磨成的锯齿短刃，触感冰凉。',
    traits: ['近战', '锐利'],
  },
  'brine-cleaver': {
    weaponType: '劈斧',
    flavor: '咸潮锈蚀的重斧，挥砍带出海腥味。',
    traits: ['近战', '破甲'],
  },
  'tide-pearl': {
    flavor: '巨蟹吐出的珍珠，内部隐约有潮汐声。',
    traits: ['稀有材料', '强化'],
  },
  'cinder-shard': {
    flavor: '焦土地表剥落的烬片，烫手。',
    traits: ['强化材料'],
  },
  'ember-fang': {
    weaponType: '利齿刃',
    flavor: '烬蜥牙齿打磨成的弯刃，余烬未熄。',
    traits: ['近战', '灼热'],
  },
  'ashen-cleaver': {
    weaponType: '劈斧',
    flavor: '灰烬覆盖的重斧，劈砍时扬起黑烟。',
    traits: ['近战', '破甲', '灼热'],
  },
  'cinder-heart': {
    flavor: '烬蜥心脏化石，按压仍有脉动热感。',
    traits: ['稀有材料', '强化'],
  },
  'mire-moss': {
    flavor: '沼地潮湿的苔藓团，可填充柄缝。',
    traits: ['强化材料'],
  },
  'bog-fang': {
    weaponType: '獠牙刃',
    flavor: '毒蛙獠牙制成的匕首，刃上泛着幽绿。',
    traits: ['近战', '毒性'],
  },
  'venom-cleaver': {
    weaponType: '劈斧',
    flavor: '浸过沼毒的阔斧，伤口会隐隐发麻。',
    traits: ['近战', '毒性', '破甲'],
  },
  'bog-heart': {
    flavor: '沼母核心，散发腐甜气味。',
    traits: ['稀有材料', '强化'],
  },
  'frost-fur': {
    flavor: '霜狼毛皮，摸上去刺骨。',
    traits: ['强化材料'],
  },
  'ice-fang': {
    weaponType: '短刃',
    flavor: '永不融化的冰牙，出鞘时凝结白雾。',
    traits: ['近战', '冰寒'],
  },
  'glacier-cleaver': {
    weaponType: '劈斧',
    flavor: '冰川碎块锻成的重斧，落地有碎冰声。',
    traits: ['近战', '冰寒', '破甲'],
  },
  'frostfang-heart': {
    flavor: '霜牙首领之心，中央嵌着寒晶。',
    traits: ['稀有材料', '强化'],
  },
  'dune-chitin': {
    flavor: '沙蝎甲壳碎片，轻而硬。',
    traits: ['强化材料'],
  },
  'scorpion-stinger': {
    weaponType: '刺刃',
    flavor: '蝎尾刺改成的刺刃，尖端仍带麻痹液。',
    traits: ['近战', '麻痹'],
  },
  'sandstorm-cleaver': {
    weaponType: '劈斧',
    flavor: '沙暴中淬火的阔斧，刃面有风蚀纹。',
    traits: ['近战', '破甲', '沙暴'],
  },
  'storm-core': {
    flavor: '沙暴凝聚的核心，静置时微微震动。',
    traits: ['稀有材料', '强化'],
  },
  'star-shard': {
    flavor: '坠星碎屑，夜间会发微光。',
    traits: ['强化材料'],
  },
  'ruin-blade': {
    weaponType: '石刃',
    flavor: '废墟石碑削成的钝刃，意外好用。',
    traits: ['近战', '沉重'],
  },
  'astral-cleaver': {
    weaponType: '劈斧',
    flavor: '星辉浸染的劈斧，挥动时拖出淡蓝尾迹。',
    traits: ['近战', '星辉', '破甲'],
  },
  'golem-core': {
    flavor: '石像魔的动力核，纹路仍在缓慢流转。',
    traits: ['稀有材料', '强化'],
  },
  'abyss-ink': {
    flavor: '暗潮生物喷出的墨汁，干后发紫。',
    traits: ['强化材料'],
  },
  'cult-dagger': {
    weaponType: '短匕',
    flavor: '暗潮教徒的仪式短匕，柄上刻着禁语。',
    traits: ['近战', '邪秽'],
  },
  'tide-cleaver': {
    weaponType: '劈斧',
    flavor: '暗潮锻造的重斧，斧身渗出黑水。',
    traits: ['近战', '暗潮', '破甲'],
  },
  'tide-lord-heart': {
    flavor: '暗潮领主之心，按压会渗出墨色液体。',
    traits: ['稀有材料', '强化'],
  },
  'ridge-scale': {
    flavor: '龙脊山脉的幼龙鳞片，边缘锋利。',
    traits: ['强化材料'],
  },
  'wing-blade': {
    weaponType: '短剑',
    flavor: '翼膜骨刺打磨的短剑，轻盈如羽。',
    traits: ['近战', '迅捷'],
  },
  'ridge-cleaver': {
    weaponType: '劈斧',
    flavor: '龙脊骨片镶边的重斧，挥砍带风啸。',
    traits: ['近战', '破甲', '龙息余韵'],
  },
  'rockwing-fang': {
    flavor: '岩翼幼龙的尖牙，仍残留地热。',
    traits: ['稀有材料', '强化'],
  },
  'void-dust': {
    flavor: '裂隙边缘刮下的虚空尘，触之发麻。',
    traits: ['强化材料'],
  },
  'rift-blade': {
    weaponType: '短刃',
    flavor: '裂隙结晶磨成的刃，边缘不稳定地闪烁。',
    traits: ['近战', '虚空'],
  },
  'void-cleaver': {
    weaponType: '劈斧',
    flavor: '虚空铁锻成的阔斧，砍击时空间微微扭曲。',
    traits: ['近战', '虚空', '破甲'],
  },
  'rift-core': {
    flavor: '裂隙看守的核心，内部像有星空在转。',
    traits: ['稀有材料', '强化'],
  },
  'throne-sigil': {
    flavor: '王座禁卫佩戴的徽记残片。',
    traits: ['强化材料'],
  },
  'guard-blade': {
    weaponType: '长剑',
    flavor: '终焉禁卫制式长剑，刃脊镀金。',
    traits: ['近战', '禁卫'],
  },
  'end-cleaver': {
    weaponType: '劈斧',
    flavor: '终焉王座前的仪仗斧，沉重得几乎难举。',
    traits: ['近战', '破甲', '终焉'],
  },
  'end-king-crown': {
    flavor: '终焉君王破碎的冠冕残片，仍有威压。',
    traits: ['稀有材料', '强化'],
  },
  'ashen-crest': {
    flavor: '周目结算留下的烬灰徽记。',
    traits: ['纪念', '稀有材料'],
  },
  'ember-maul': {
    weaponType: '重槌',
    flavor: '烬火淬炼的传说重槌，槌头仍在低鸣。',
    traits: ['传说', '猛击特化', '击晕'],
  },
  'tide-buckler': {
    weaponType: '冲击刃',
    flavor: '潮盾与刃合一的奇兵，前冲时溅起水花。',
    traits: ['传说', '盾击特化', '机动'],
  },
  'rift-edge': {
    weaponType: '斩刃',
    flavor: '裂隙边缘凝成的斩刃，专克残血之敌。',
    traits: ['传说', '斩杀', '暴击'],
  },
  'cinder-staff': {
    weaponType: '法杖',
    flavor: '烬心余烬封入杖尖，火球爆开时卷起赤焰环。',
    traits: ['传说', '火球特化', '范围'],
  },
  'venom-longbow': {
    weaponType: '长弓',
    flavor: '弓臂渗着毒涎，箭矢与陷阱皆带蚀骨之毒。',
    traits: ['传说', '毒箭', '陷阱'],
  },
  'nightshade-fang': {
    weaponType: '短刃',
    flavor: '夜影中淬炼的毒牙，隐匿与肾击的绝配。',
    traits: ['传说', '消失', '控制'],
  },
};

function inferWeaponType(name: string, id: string): string | undefined {
  if (id.includes('staff') || name.includes('杖')) {
    return '法杖';
  }
  if (name.includes('劈斧') || id.includes('cleaver') || id.includes('maul')) {
    return '劈斧';
  }
  if (name.includes('短刃') || name.includes('短匕') || name.includes('短剑') || id.includes('blade') || id.includes('dagger') || id.includes('fang') || id.includes('stinger')) {
    return '短刃';
  }
  if (name.includes('长剑') || id.includes('sword')) {
    return '长剑';
  }
  if (name.includes('镐')) {
    return '镐刃';
  }
  return '主手武器';
}

function applyItemLore(): void {
  for (const def of Object.values(ITEM_DEFS)) {
    const lore = ITEM_LORE[def.id];
    if (lore) {
      if (lore.weaponType) {
        def.weaponType = lore.weaponType;
      }
      if (lore.flavor) {
        def.flavor = lore.flavor;
      }
      if (lore.traits) {
        def.traits = lore.traits;
      }
      if (lore.effectDesc && !def.effectDesc) {
        def.effectDesc = lore.effectDesc;
      }
    }
    if (def.kind === 'gear' && !def.weaponType) {
      def.weaponType = inferWeaponType(def.name, def.id);
    }
    if (def.kind === 'gear' && !def.traits) {
      def.traits = def.quality === 'legendary' ? ['传说', '主手'] : ['主手'];
    }
    if (def.kind === 'material' && !def.traits) {
      def.traits = def.effectDesc?.includes('遗物')
        ? ['探索遗物', '高价出售']
        : ['材料'];
    }
    if (def.kind === 'potion' && !def.traits) {
      def.traits = ['消耗品'];
    }
    if (!def.flavor) {
      if (def.kind === 'gear') {
        def.flavor = `${def.name}，装等 ${def.ilvl} 的主手武器。`;
      } else if (def.kind === 'material' && !def.effectDesc) {
        def.flavor = `${def.name}，可用于强化或出售。`;
      }
    }
  }
}

applyItemLore();

for (const [id, def] of Object.entries(CLASS_GEAR_DEFS)) {
  ITEM_DEFS[id] = def;
}

for (const def of Object.values(ITEM_DEFS)) {
  if (def.kind !== 'gear' || def.classAffinity) {
    continue;
  }
  if (def.legendaryEffect) {
    def.classAffinity = ['warrior', 'mage', 'hunter', 'rogue'];
    continue;
  }
  if (
    idLooksClass(def.id, 'staff') ||
    def.weaponType === '法杖' ||
    def.weaponType === '魔杖'
  ) {
    def.classAffinity = ['mage'];
  } else if (idLooksClass(def.id, 'bow') || def.weaponType?.includes('弓')) {
    def.classAffinity = ['hunter'];
  } else if (
    idLooksClass(def.id, 'dagger') ||
    def.weaponType === '双匕' ||
    def.weaponType === '匕首'
  ) {
    def.classAffinity = ['rogue'];
  } else {
    def.classAffinity = [...WARRIOR_BASE_AFFINITY];
  }
}

function idLooksClass(id: string, token: string): boolean {
  return id.includes(token);
}

export function qualityOf(defId: string): ItemQuality {
  return ITEM_DEFS[defId]?.quality ?? 'common';
}
