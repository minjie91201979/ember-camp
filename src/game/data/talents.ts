import type { SpecId } from '../systems/specialization';

/** 专精节点档位：20 / 30 / 40 / 50 / 60 各三选一。 */
export const SPEC_NODE_TIERS = [20, 30, 40, 50, 60] as const;
export type SpecNodeTier = (typeof SPEC_NODE_TIERS)[number];

export type SpecNodeEffectId =
  | 'incoming_dr'
  | 'rage_on_hit'
  | 'whirlwind_radius'
  | 'execute_thresh'
  | 'crit_mult'
  | 'charge_cd'
  | 'fireball_crit'
  | 'pyroblast_dmg'
  | 'frost_nova_stun'
  | 'ice_lance_dmg'
  | 'blink_cd'
  | 'arcane_missile_dmg'
  | 'aimed_dmg'
  | 'rapid_fire_interval'
  | 'trap_cd'
  | 'explosive_dmg'
  | 'disengage_cd'
  | 'disengage_range'
  | 'poison_dmg'
  | 'eviscerate_poison'
  | 'energy_regen'
  | 'shadow_strike_cd'
  | 'vanish_cd'
  | 'opener_bonus';

export type SpecNodeDef = {
  id: string;
  name: string;
  desc: string;
  effect: SpecNodeEffectId;
  /** 效果强度：倍率增量或阈值等，由钩子解释 */
  value: number;
};

type SpecNodeTable = Record<SpecId, Record<SpecNodeTier, SpecNodeDef[]>>;

function n(
  id: string,
  name: string,
  desc: string,
  effect: SpecNodeEffectId,
  value: number,
): SpecNodeDef {
  return { id, name, desc, effect, value };
}

/** 每专精每档三选一。同效果多档叠加有软帽（见 specialization.cappedNodeEffect）。 */
export const SPEC_NODES: SpecNodeTable = {
  guard: {
    20: [
      n('guard-20-dr', '铁壁', '受到伤害再降低 5%', 'incoming_dr', 0.05),
      n('guard-20-rage', '砥砺', '受击与命中回怒 +15%', 'rage_on_hit', 0.15),
      n('guard-20-bash', '盾墙余韵', '冲锋冷却 −12%', 'charge_cd', 0.12),
    ],
    30: [
      n('guard-30-dr', '壁垒', '受到伤害再降低 4%', 'incoming_dr', 0.04),
      n('guard-30-rage', '厚积', '回怒 +12%', 'rage_on_hit', 0.12),
      n('guard-30-crit', '反击', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('guard-40-dr', '不破', '受到伤害再降低 4%', 'incoming_dr', 0.04),
      n('guard-40-charge', '守势冲锋', '冲锋冷却 −10%', 'charge_cd', 0.1),
      n('guard-40-rage', '怒潮', '回怒 +10%', 'rage_on_hit', 0.1),
    ],
    50: [
      n('guard-50-dr', '王座铁卫', '受到伤害再降低 5%', 'incoming_dr', 0.05),
      n('guard-50-crit', '格挡余力', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('guard-50-charge', '护阵突击', '冲锋冷却 −12%', 'charge_cd', 0.12),
    ],
    60: [
      n('guard-60-dr', '终焉壁垒', '受到伤害再降低 5%', 'incoming_dr', 0.05),
      n('guard-60-rage', '不灭怒意', '回怒 +14%', 'rage_on_hit', 0.14),
      n('guard-60-crit', '绝境反击', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
  },
  fury: {
    20: [
      n('fury-20-ww', '风暴半径', '旋风斩范围 +12%', 'whirlwind_radius', 0.12),
      n('fury-20-rage', '血怒', '命中回怒 +15%', 'rage_on_hit', 0.15),
      n('fury-20-crit', '狂战暴击', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    30: [
      n('fury-30-ww', '裂空', '旋风范围 +10%', 'whirlwind_radius', 0.1),
      n('fury-30-rage', '狂涌', '回怒 +12%', 'rage_on_hit', 0.12),
      n('fury-30-crit', '血刃', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('fury-40-ww', '旋涡', '旋风范围 +10%', 'whirlwind_radius', 0.1),
      n('fury-40-crit', '狂怒一击', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('fury-40-charge', '血路', '冲锋冷却 −10%', 'charge_cd', 0.1),
    ],
    50: [
      n('fury-50-rage', '沸腾', '回怒 +14%', 'rage_on_hit', 0.14),
      n('fury-50-ww', '屠场', '旋风范围 +12%', 'whirlwind_radius', 0.12),
      n('fury-50-crit', '狂斩', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    60: [
      n('fury-60-ww', '末日旋风', '旋风范围 +14%', 'whirlwind_radius', 0.14),
      n('fury-60-rage', '无尽怒火', '回怒 +15%', 'rage_on_hit', 0.15),
      n('fury-60-crit', '灭世暴击', '暴击伤害 +12%', 'crit_mult', 0.12),
    ],
  },
  arms: {
    20: [
      n('arms-20-exec', '斩尽', '斩杀阈值提高至 36%', 'execute_thresh', 0.36),
      n('arms-20-charge', '疾突', '冲锋冷却 −15%', 'charge_cd', 0.15),
      n('arms-20-crit', '兵器精通', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    30: [
      n('arms-30-exec', '处决', '斩杀阈值提高至 38%', 'execute_thresh', 0.38),
      n('arms-30-crit', '锋锐', '暴击伤害 +8%', 'crit_mult', 0.08),
      n('arms-30-charge', '突进', '冲锋冷却 −10%', 'charge_cd', 0.1),
    ],
    40: [
      n('arms-40-exec', '绝命', '斩杀阈值提高至 40%', 'execute_thresh', 0.4),
      n('arms-40-crit', '武技', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('arms-40-rage', '战意', '回怒 +10%', 'rage_on_hit', 0.1),
    ],
    50: [
      n('arms-50-exec', '斩首', '斩杀阈值提高至 42%', 'execute_thresh', 0.42),
      n('arms-50-charge', '破阵', '冲锋冷却 −12%', 'charge_cd', 0.12),
      n('arms-50-crit', '兵器宗师', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    60: [
      n('arms-60-exec', '终焉斩杀', '斩杀阈值提高至 45%', 'execute_thresh', 0.45),
      n('arms-60-crit', '无双', '暴击伤害 +12%', 'crit_mult', 0.12),
      n('arms-60-charge', '雷霆冲锋', '冲锋冷却 −15%', 'charge_cd', 0.15),
    ],
  },
  fire: {
    20: [
      n('fire-20-crit', '灼心', '火球 / 炎爆额外暴击率 +6%', 'fireball_crit', 0.06),
      n('fire-20-pyro', '炎爆专注', '炎爆伤害 +12%', 'pyroblast_dmg', 0.12),
      n('fire-20-blink', '热浪闪现', '闪现冷却 −12%', 'blink_cd', 0.12),
    ],
    30: [
      n('fire-30-pyro', '烈焰', '炎爆伤害 +10%', 'pyroblast_dmg', 0.1),
      n('fire-30-crit', '燃心', '额外暴击率 +5%', 'fireball_crit', 0.05),
      n('fire-30-blink', '火步', '闪现冷却 −10%', 'blink_cd', 0.1),
    ],
    40: [
      n('fire-40-pyro', '炎狱', '炎爆伤害 +12%', 'pyroblast_dmg', 0.12),
      n('fire-40-crit', '熔核', '额外暴击率 +5%', 'fireball_crit', 0.05),
      n('fire-40-mult', '灼烧余波', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    50: [
      n('fire-50-pyro', '末日炎爆', '炎爆伤害 +14%', 'pyroblast_dmg', 0.14),
      n('fire-50-blink', '焰闪', '闪现冷却 −12%', 'blink_cd', 0.12),
      n('fire-50-crit', '燃尽', '额外暴击率 +6%', 'fireball_crit', 0.06),
    ],
    60: [
      n('fire-60-pyro', '星火陨落', '炎爆伤害 +16%', 'pyroblast_dmg', 0.16),
      n('fire-60-crit', '焚天', '额外暴击率 +7%', 'fireball_crit', 0.07),
      n('fire-60-mult', '灰烬暴击', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
  },
  frost: {
    20: [
      n('frost-20-nova', '深寒', '冰霜新星冻结时长 +18%', 'frost_nova_stun', 0.18),
      n('frost-20-lance', '冰刺', '冰枪伤害 +12%', 'ice_lance_dmg', 0.12),
      n('frost-20-dr', '霜甲', '受到伤害降低 4%', 'incoming_dr', 0.04),
    ],
    30: [
      n('frost-30-lance', '冰锥', '冰枪伤害 +10%', 'ice_lance_dmg', 0.1),
      n('frost-30-nova', '永冻', '新星冻结 +12%', 'frost_nova_stun', 0.12),
      n('frost-30-dr', '寒壳', '减伤 3%', 'incoming_dr', 0.03),
    ],
    40: [
      n('frost-40-lance', '碎冰', '冰枪伤害 +10%', 'ice_lance_dmg', 0.1),
      n('frost-40-blink', '冰闪', '闪现冷却 −10%', 'blink_cd', 0.1),
      n('frost-40-crit', '霜锋', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    50: [
      n('frost-50-nova', '极寒', '新星冻结 +14%', 'frost_nova_stun', 0.14),
      n('frost-50-lance', '冰枪宗师', '冰枪伤害 +12%', 'ice_lance_dmg', 0.12),
      n('frost-50-dr', '冰川护体', '减伤 4%', 'incoming_dr', 0.04),
    ],
    60: [
      n('frost-60-lance', '绝对零度', '冰枪伤害 +14%', 'ice_lance_dmg', 0.14),
      n('frost-60-nova', '永恒冻结', '新星冻结 +16%', 'frost_nova_stun', 0.16),
      n('frost-60-dr', '冰冠', '减伤 5%', 'incoming_dr', 0.05),
    ],
  },
  arcane: {
    20: [
      n('arcane-20-missile', '奥术激流', '奥术飞弹伤害 +12%', 'arcane_missile_dmg', 0.12),
      n('arcane-20-blink', '相位挪移', '闪现冷却 −15%', 'blink_cd', 0.15),
      n('arcane-20-crit', '奥能过载', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    30: [
      n('arcane-30-missile', '魔弹', '飞弹伤害 +10%', 'arcane_missile_dmg', 0.1),
      n('arcane-30-blink', '折跃', '闪现冷却 −10%', 'blink_cd', 0.1),
      n('arcane-30-crit', '奥能', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('arcane-40-missile', '奥术洪流', '飞弹伤害 +12%', 'arcane_missile_dmg', 0.12),
      n('arcane-40-blink', '虚空步', '闪现冷却 −12%', 'blink_cd', 0.12),
      n('arcane-40-dr', '法力护罩', '减伤 3%', 'incoming_dr', 0.03),
    ],
    50: [
      n('arcane-50-missile', '魔网共鸣', '飞弹伤害 +14%', 'arcane_missile_dmg', 0.14),
      n('arcane-50-crit', '奥能爆发', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('arcane-50-blink', '瞬移大师', '闪现冷却 −12%', 'blink_cd', 0.12),
    ],
    60: [
      n('arcane-60-missile', '虚空飞弹', '飞弹伤害 +16%', 'arcane_missile_dmg', 0.16),
      n('arcane-60-blink', '时空撕裂', '闪现冷却 −15%', 'blink_cd', 0.15),
      n('arcane-60-crit', '奥能终极', '暴击伤害 +12%', 'crit_mult', 0.12),
    ],
  },
  marksmanship: {
    20: [
      n('mm-20-aimed', '致命瞄准', '瞄准射击伤害 +12%', 'aimed_dmg', 0.12),
      n('mm-20-rapid', '箭雨密织', '急速射击间隔 −10%', 'rapid_fire_interval', 0.1),
      n('mm-20-crit', '鹰眼', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    30: [
      n('mm-30-aimed', '穿杨', '瞄准伤害 +10%', 'aimed_dmg', 0.1),
      n('mm-30-rapid', '连射', '急速间隔 −8%', 'rapid_fire_interval', 0.08),
      n('mm-30-crit', '锐目', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('mm-40-aimed', '狙击', '瞄准伤害 +12%', 'aimed_dmg', 0.12),
      n('mm-40-rapid', '箭幕', '急速间隔 −8%', 'rapid_fire_interval', 0.08),
      n('mm-40-dis', '风筝', '后跳冷却 −10%', 'disengage_cd', 0.1),
    ],
    50: [
      n('mm-50-aimed', '百步穿杨', '瞄准伤害 +14%', 'aimed_dmg', 0.14),
      n('mm-50-crit', '神射', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('mm-50-rapid', '箭雨风暴', '急速间隔 −10%', 'rapid_fire_interval', 0.1),
    ],
    60: [
      n('mm-60-aimed', '终焉一箭', '瞄准伤害 +16%', 'aimed_dmg', 0.16),
      n('mm-60-rapid', '无限箭雨', '急速间隔 −12%', 'rapid_fire_interval', 0.12),
      n('mm-60-crit', '鹰王', '暴击伤害 +12%', 'crit_mult', 0.12),
    ],
  },
  survival: {
    20: [
      n('sv-20-trap', '陷阱专家', '陷阱冷却 −15%', 'trap_cd', 0.15),
      n('sv-20-boom', '烈性火药', '爆炸陷阱伤害 +12%', 'explosive_dmg', 0.12),
      n('sv-20-dr', '野外求生', '受到伤害降低 4%', 'incoming_dr', 0.04),
    ],
    30: [
      n('sv-30-trap', '伏击', '陷阱冷却 −10%', 'trap_cd', 0.1),
      n('sv-30-boom', '爆破', '爆炸伤害 +10%', 'explosive_dmg', 0.1),
      n('sv-30-dr', '兽皮', '减伤 3%', 'incoming_dr', 0.03),
    ],
    40: [
      n('sv-40-boom', '高爆', '爆炸伤害 +10%', 'explosive_dmg', 0.1),
      n('sv-40-trap', '连环陷阱', '陷阱冷却 −10%', 'trap_cd', 0.1),
      n('sv-40-aimed', '猎手', '瞄准伤害 +8%', 'aimed_dmg', 0.08),
    ],
    50: [
      n('sv-50-trap', '陷阱宗师', '陷阱冷却 −12%', 'trap_cd', 0.12),
      n('sv-50-boom', '毁灭陷阱', '爆炸伤害 +12%', 'explosive_dmg', 0.12),
      n('sv-50-dr', '荒野之心', '减伤 4%', 'incoming_dr', 0.04),
    ],
    60: [
      n('sv-60-boom', '末日爆破', '爆炸伤害 +14%', 'explosive_dmg', 0.14),
      n('sv-60-trap', '完美陷阱', '陷阱冷却 −14%', 'trap_cd', 0.14),
      n('sv-60-dr', '生存王者', '减伤 5%', 'incoming_dr', 0.05),
    ],
  },
  mobility: {
    20: [
      n('mb-20-disengage', '灵巧后跳', '后跳冷却 −15%', 'disengage_cd', 0.15),
      n('mb-20-range', '腾跃', '后跳距离 +12%', 'disengage_range', 0.12),
      n('mb-20-rapid', '游猎箭雨', '急速射击间隔 −8%', 'rapid_fire_interval', 0.08),
    ],
    30: [
      n('mb-30-disengage', '轻身', '后跳冷却 −10%', 'disengage_cd', 0.1),
      n('mb-30-range', '远跃', '后跳距离 +10%', 'disengage_range', 0.1),
      n('mb-30-rapid', '游射', '急速间隔 −6%', 'rapid_fire_interval', 0.06),
    ],
    40: [
      n('mb-40-disengage', '鬼步', '后跳冷却 −10%', 'disengage_cd', 0.1),
      n('mb-40-range', '飞掠', '后跳距离 +10%', 'disengage_range', 0.1),
      n('mb-40-crit', '游猎锐目', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    50: [
      n('mb-50-disengage', '影跃', '后跳冷却 −12%', 'disengage_cd', 0.12),
      n('mb-50-rapid', '疾风箭雨', '急速间隔 −10%', 'rapid_fire_interval', 0.1),
      n('mb-50-range', '天际', '后跳距离 +10%', 'disengage_range', 0.1),
    ],
    60: [
      n('mb-60-disengage', '风神步', '后跳冷却 −14%', 'disengage_cd', 0.14),
      n('mb-60-range', '无界腾跃', '后跳距离 +12%', 'disengage_range', 0.12),
      n('mb-60-rapid', '永恒箭雨', '急速间隔 −10%', 'rapid_fire_interval', 0.1),
    ],
  },
  assassination: {
    20: [
      n('as-20-poison', '剧毒', '毒素伤害 +14%', 'poison_dmg', 0.14),
      n('as-20-evis', '毒刺刺骨', '对中毒目标刺骨再 +8%', 'eviscerate_poison', 0.08),
      n('as-20-energy', '毒腺', '能量回复 +10%', 'energy_regen', 0.1),
    ],
    30: [
      n('as-30-poison', '猛毒', '毒素 +10%', 'poison_dmg', 0.1),
      n('as-30-evis', '毒刺', '中毒刺骨 +8%', 'eviscerate_poison', 0.08),
      n('as-30-energy', '毒息', '能量回复 +8%', 'energy_regen', 0.08),
    ],
    40: [
      n('as-40-poison', '蚀骨', '毒素 +10%', 'poison_dmg', 0.1),
      n('as-40-evis', '毒杀', '中毒刺骨 +8%', 'eviscerate_poison', 0.08),
      n('as-40-ss', '毒袭', '影袭冷却 −8%', 'shadow_strike_cd', 0.08),
    ],
    50: [
      n('as-50-poison', '死神之毒', '毒素 +12%', 'poison_dmg', 0.12),
      n('as-50-evis', '毒心刺骨', '中毒刺骨 +10%', 'eviscerate_poison', 0.1),
      n('as-50-energy', '毒泉', '能量回复 +10%', 'energy_regen', 0.1),
    ],
    60: [
      n('as-60-poison', '虚空剧毒', '毒素 +14%', 'poison_dmg', 0.14),
      n('as-60-evis', '终焉毒刺', '中毒刺骨 +12%', 'eviscerate_poison', 0.12),
      n('as-60-energy', '不竭毒腺', '能量回复 +12%', 'energy_regen', 0.12),
    ],
  },
  combat: {
    20: [
      n('cb-20-energy', '战斗节奏', '能量回复 +12%', 'energy_regen', 0.12),
      n('cb-20-ss', '连斩', '影袭冷却 −12%', 'shadow_strike_cd', 0.12),
      n('cb-20-crit', '刀锋', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    30: [
      n('cb-30-energy', '不息', '能量回复 +10%', 'energy_regen', 0.1),
      n('cb-30-ss', '快斩', '影袭冷却 −8%', 'shadow_strike_cd', 0.08),
      n('cb-30-crit', '利刃', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('cb-40-ss', '乱舞', '影袭冷却 −10%', 'shadow_strike_cd', 0.1),
      n('cb-40-energy', '战意', '能量回复 +10%', 'energy_regen', 0.1),
      n('cb-40-opener', '先机', '破隐加成 +6%', 'opener_bonus', 0.06),
    ],
    50: [
      n('cb-50-energy', '永动', '能量回复 +12%', 'energy_regen', 0.12),
      n('cb-50-ss', '影刃', '影袭冷却 −10%', 'shadow_strike_cd', 0.1),
      n('cb-50-crit', '战刃', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    60: [
      n('cb-60-energy', '无限节奏', '能量回复 +14%', 'energy_regen', 0.14),
      n('cb-60-ss', '千刃', '影袭冷却 −12%', 'shadow_strike_cd', 0.12),
      n('cb-60-crit', '至刃', '暴击伤害 +12%', 'crit_mult', 0.12),
    ],
  },
  subtlety: {
    20: [
      n('sb-20-vanish', '暗影遁逃', '消失冷却 −15%', 'vanish_cd', 0.15),
      n('sb-20-opener', '破隐杀意', '破隐一击伤害再 +10%', 'opener_bonus', 0.1),
      n('sb-20-dr', '阴影披风', '受到伤害降低 4%', 'incoming_dr', 0.04),
    ],
    30: [
      n('sb-30-vanish', '潜影', '消失冷却 −10%', 'vanish_cd', 0.1),
      n('sb-30-opener', '暗袭', '破隐加成 +8%', 'opener_bonus', 0.08),
      n('sb-30-dr', '影纱', '减伤 3%', 'incoming_dr', 0.03),
    ],
    40: [
      n('sb-40-opener', '背刺杀意', '破隐加成 +8%', 'opener_bonus', 0.08),
      n('sb-40-vanish', '消隐', '消失冷却 −10%', 'vanish_cd', 0.1),
      n('sb-40-ss', '影袭加速', '影袭冷却 −8%', 'shadow_strike_cd', 0.08),
    ],
    50: [
      n('sb-50-vanish', '影遁宗师', '消失冷却 −12%', 'vanish_cd', 0.12),
      n('sb-50-opener', '致命破隐', '破隐加成 +10%', 'opener_bonus', 0.1),
      n('sb-50-dr', '暗影护体', '减伤 4%', 'incoming_dr', 0.04),
    ],
    60: [
      n('sb-60-vanish', '虚空消失', '消失冷却 −14%', 'vanish_cd', 0.14),
      n('sb-60-opener', '终焉破隐', '破隐加成 +12%', 'opener_bonus', 0.12),
      n('sb-60-dr', '永夜披风', '减伤 5%', 'incoming_dr', 0.05),
    ],
  },
  protection: {
    20: [
      n('pro-20-dr', '坚壁', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('pro-20-rage', '圣光淬炼', '受击与命中回圣能 +15%', 'rage_on_hit', 0.15),
      n('pro-20-crit', '圣裁', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    30: [
      n('pro-30-dr', '壁垒', '受到伤害降低 4%', 'incoming_dr', 0.04),
      n('pro-30-rage', '厚积圣能', '回圣能 +12%', 'rage_on_hit', 0.12),
      n('pro-30-crit', '裁决', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('pro-40-dr', '不破圣盾', '受到伤害降低 4%', 'incoming_dr', 0.04),
      n('pro-40-rage', '圣潮', '回圣能 +10%', 'rage_on_hit', 0.1),
      n('pro-40-crit', '圣怒', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    50: [
      n('pro-50-dr', '王座铁卫', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('pro-50-crit', '圣光反击', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('pro-50-rage', '不灭圣意', '回圣能 +14%', 'rage_on_hit', 0.14),
    ],
    60: [
      n('pro-60-dr', '终焉壁垒', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('pro-60-rage', '永恒圣能', '回圣能 +15%', 'rage_on_hit', 0.15),
      n('pro-60-crit', '绝境圣裁', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
  },
  retribution: {
    20: [
      n('ret-20-rage', '神圣狂热', '命中回圣能 +15%', 'rage_on_hit', 0.15),
      n('ret-20-ww', '奉献领域', '奉献范围 +12%', 'whirlwind_radius', 0.12),
      n('ret-20-crit', '圣战暴击', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    30: [
      n('ret-30-ww', '裂空奉献', '奉献范围 +10%', 'whirlwind_radius', 0.1),
      n('ret-30-rage', '狂涌圣能', '回圣能 +12%', 'rage_on_hit', 0.12),
      n('ret-30-exec', '审判阈值', '愤怒之锤阈值提高至 36%', 'execute_thresh', 0.36),
    ],
    40: [
      n('ret-40-ww', '旋涡奉献', '奉献范围 +10%', 'whirlwind_radius', 0.1),
      n('ret-40-crit', '圣怒一击', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('ret-40-charge', '圣光冲锋', '冲锋冷却 −10%', 'charge_cd', 0.1),
    ],
    50: [
      n('ret-50-rage', '沸腾圣能', '回圣能 +14%', 'rage_on_hit', 0.14),
      n('ret-50-ww', '审判场', '奉献范围 +12%', 'whirlwind_radius', 0.12),
      n('ret-50-crit', '圣斩', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    60: [
      n('ret-60-ww', '末日奉献', '奉献范围 +14%', 'whirlwind_radius', 0.14),
      n('ret-60-rage', '无尽圣火', '回圣能 +15%', 'rage_on_hit', 0.15),
      n('ret-60-crit', '灭世圣裁', '暴击伤害 +12%', 'crit_mult', 0.12),
    ],
  },
  holy: {
    20: [
      n('holy-20-dr', '圣盾庇护', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('holy-20-rage', '圣光灌注', '回圣能 +12%', 'rage_on_hit', 0.12),
      n('holy-20-crit', '圣耀', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    30: [
      n('holy-30-dr', '庇护所', '受到伤害降低 4%', 'incoming_dr', 0.04),
      n('holy-30-rage', '圣泉', '回圣能 +10%', 'rage_on_hit', 0.1),
      n('holy-30-crit', '圣辉', '暴击伤害 +8%', 'crit_mult', 0.08),
    ],
    40: [
      n('holy-40-dr', '神恩壁垒', '受到伤害降低 4%', 'incoming_dr', 0.04),
      n('holy-40-rage', '圣潮涌动', '回圣能 +10%', 'rage_on_hit', 0.1),
      n('holy-40-crit', '圣怒', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
    50: [
      n('holy-50-dr', '至高庇护', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('holy-50-crit', '圣光反击', '暴击伤害 +10%', 'crit_mult', 0.1),
      n('holy-50-rage', '不灭圣意', '回圣能 +14%', 'rage_on_hit', 0.14),
    ],
    60: [
      n('holy-60-dr', '永恒圣盾', '受到伤害降低 5%', 'incoming_dr', 0.05),
      n('holy-60-rage', '永恒圣光', '回圣能 +15%', 'rage_on_hit', 0.15),
      n('holy-60-crit', '绝境圣裁', '暴击伤害 +10%', 'crit_mult', 0.1),
    ],
  },
};

const NODE_BY_ID: Record<string, SpecNodeDef> = {};
for (const byTier of Object.values(SPEC_NODES)) {
  for (const nodes of Object.values(byTier)) {
    for (const node of nodes) {
      NODE_BY_ID[node.id] = node;
    }
  }
}

export function specNodeDef(id: string | null | undefined): SpecNodeDef | null {
  if (!id) {
    return null;
  }
  return NODE_BY_ID[id] ?? null;
}

export function nodesForSpecTier(specId: string | null, tier: number): SpecNodeDef[] {
  if (!specId || !(specId in SPEC_NODES)) {
    return [];
  }
  const table = SPEC_NODES[specId as SpecId];
  if (!(tier in table)) {
    return [];
  }
  return table[tier as SpecNodeTier] ?? [];
}

export function nextSpecNodeTier(level: number, chosen: Record<number, string>): number | null {
  for (const tier of SPEC_NODE_TIERS) {
    if (level >= tier && !chosen[tier]) {
      return tier;
    }
  }
  return null;
}
