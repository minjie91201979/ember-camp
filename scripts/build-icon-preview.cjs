/**
 * 从 src/ui/item-icon.tsx 解析「余烬暗曜」图标库，生成可预览的 HTML 总览页。
 * 用法: node scripts/build-icon-preview.cjs
 * 输出: docs/icon-preview.html
 *
 * 数据来源全部来自源码本身（SkillSubjectArt / SubjectArt 的 case 分支 +
 * 调色板常量 + SKILL_SUBJECT/SKILL_DEFS 映射），避免手抄出错。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'item-icon.tsx'), 'utf8');
const SKILLS_TS = fs.readFileSync(path.join(ROOT, 'src', 'game', 'systems', 'skills.ts'), 'utf8');
const OUT = path.join(ROOT, 'docs', 'icon-preview.html');

/* ---------- 1. 调色板常量 ---------- */
const colorMap = {};
for (const m of SRC.matchAll(/const ([A-Z0-9_]+) = '([#a-f0-9]+)';/gi)) {
  colorMap[m[1]] = m[2];
}

/* ---------- 2. 从 switch 提取 case 分支 ---------- */
// 模型：case 由「下一个 case 行」或「switch 收尾 2 空格 }」结束。
// 块作用域 `case 'x': { ... }`（4 空格 } 闭合，如 potion-mana）视为 case 内部结构，
// 尾部 `);` / `    }` 由 finishCase 剥除。fall-through 别名（case 'a': 紧接 case 'b':）共享同一主体。
function extractCases(fnSrc) {
  const lines = fnSrc.split('\n');
  const cases = {};
  let current = null; // { name, body }
  const aliases = [];
  const flush = () => {
    if (!current) return;
    const body = finishCase(current.body);
    cases[current.name] = body;
    for (const a of aliases) cases[a] = body;
    aliases.length = 0;
    current = null;
  };
  for (const line of lines) {
    const cm = line.match(/^    case '([\w-]+)':\s*\{?\s*$/);
    if (cm) {
      if (current && current.body.length === 0) aliases.push(current.name);
      else flush();
      current = { name: cm[1], body: [] };
      continue;
    }
    if (current) {
      if (/^  \}$/.test(line)) flush();
      else current.body.push(line);
    }
  }
  flush();
  return cases;
}

function finishCase(body) {
  let out = body;
  while (out.length && !out[0].trim()) out.shift();
  // 剔除 JS 语句行（const 赋值等），仅保留纯 JSX
  out = out.filter((l) => !/^\s*const \w+\s*=.*;\s*$/.test(l));
  if (out[0] && /^      return \($/.test(out[0])) out.shift();
  // 剥掉尾部：空行 → 块作用域闭合 `    }` → `      );`（case 之间常留空行，需先清掉）
  while (out.length && !out[out.length - 1].trim()) out.pop();
  while (out.length && (/^      \);$/.test(out[out.length - 1]) || /^    \}$/.test(out[out.length - 1]))) out.pop();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join('\n');
}

const skillFn = SRC.slice(SRC.indexOf('function SkillSubjectArt'));
const skillCases = extractCases(skillFn);

const itemFn = SRC.slice(SRC.indexOf('function SubjectArt'), SRC.indexOf('function SkillSubjectArt'));
const itemCases = extractCases(itemFn);

/* ---------- 3. SVG 转换（常量→hex、camelCase→kebab） ---------- */
const constRe = new RegExp(
  `\\b(${Object.keys(colorMap).sort((a, b) => b.length - a.length).join('|')})\\b`,
  'g',
);
const ATTRS = [
  'strokeWidth',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeDasharray',
  'strokeDashoffset',
  'fillRule',
  'clipRule',
];
const attrRe = new RegExp(`(${ATTRS.join('|')})(=)`, 'g');
function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toSvg(body, subject) {
  let out = body
    .replace(constRe, (_, name) => colorMap[name])
    .replace(attrRe, (_, a, eq) => `${kebab(a)}${eq}`);
  // JSX 插值 {liquid}（potion-life → 红 / potion-mana → 蓝）
  if (/\{liquid\}/.test(out)) {
    const c = subject === 'potion-life' ? colorMap.LIQUID_RED : colorMap.LIQUID_BLUE;
    out = out.replace(/\{liquid\}/g, `"${c}"`);
  }
  // 其余 JSX 插值 {#hex} → "#hex"（fill/stroke 等属性写法去花括号）
  out = out.replace(/\{([#][a-f0-9]{3,8})\}/gi, '"$1"');
  return out;
}

/* ---------- 4. 技能清单（id → 名称/职业/主体，与 SKILL_SUBJECT 一致） ---------- */
const SKILLS = [
  // 战士
  ['slam', '猛击', 'warrior'], ['bash', '盾击', 'warrior'], ['charge', '冲锋', 'warrior'],
  ['whirlwind', '旋风斩', 'warrior'], ['execute', '斩杀', 'warrior'], ['battle-shout', '战吼', 'warrior'],
  ['sunder', '破甲斩', 'warrior'], ['cleave', '顺劈', 'warrior'],
  // 法师
  ['fireball', '火球术', 'mage'], ['frost-nova', '冰霜新星', 'mage'], ['arcane-missiles', '奥术飞弹', 'mage'],
  ['blink', '闪现', 'mage'], ['blizzard', '暴风雪', 'mage'], ['pyroblast', '炎爆术', 'mage'],
  ['ice-lance', '冰枪术', 'mage'], ['mana-shield', '法力护盾', 'mage'],
  // 猎人
  ['aimed-shot', '瞄准射击', 'hunter'], ['disengage', '后跳射击', 'hunter'], ['multi-shot', '多重射击', 'hunter'],
  ['trap', '捕兽夹', 'hunter'], ['rapid-fire', '急速射击', 'hunter'], ['explosive-trap', '爆炸陷阱', 'hunter'],
  ['concussive-shot', '震荡射击', 'hunter'], ['serpent-sting', '毒箭', 'hunter'],
  // 盗贼
  ['shadow-strike', '影袭', 'rogue'], ['eviscerate', '刺骨', 'rogue'], ['poison-blade', '毒刃', 'rogue'],
  ['sprint', '疾跑', 'rogue'], ['vanish', '消失', 'rogue'], ['kidney-shot', '肾击', 'rogue'],
  ['slice-and-dice', '切割', 'rogue'], ['fan-of-knives', '刀扇', 'rogue'],
  // 圣骑士（复用战士主体，职业描边区分）
  ['judgment', '审判', 'paladin'], ['shield-of-light', '圣盾击', 'paladin'], ['crusader-strike', '十字军打击', 'paladin'],
  ['consecration', '奉献', 'paladin'], ['hammer-of-wrath', '愤怒之锤', 'paladin'], ['blessing', '圣光祝福', 'paladin'],
  ['exorcism', '驱邪', 'paladin'], ['divine-storm', '神圣风暴', 'paladin'],
];

/* SKILL_SUBJECT 映射（从源码解析，与运行时一致） */
const subjectMap = {};
{
  const m = SRC.match(/export const SKILL_SUBJECT: Record<SkillId, SkillSubject> = \{([\s\S]*?)\n\};/);
  for (const line of m[1].split('\n')) {
    const lm = line.match(/^\s*'?([\w-]+)'?\s*:\s*'([\w-]+)',?$/);
    if (lm) subjectMap[lm[1]] = lm[2];
  }
}

/* 技能等级需求（从 skills.ts 解析） */
const reqLevelMap = {};
{
  for (const m of SKILLS_TS.matchAll(/^  ([\w-]+): \{[\s\S]*?reqLevel: (\d+),[\s\S]*?classId: '(\w+)',/gm)) {
    reqLevelMap[m[1]] = { req: Number(m[2]), classId: m[3] };
  }
}

const CLASS_META = {
  warrior: { name: '战士', border: '#d96a45' },
  mage: { name: '法师', border: '#5b8fd4' },
  hunter: { name: '猎人', border: '#6fbe64' },
  rogue: { name: '盗贼', border: '#a86fd8' },
  paladin: { name: '圣骑士', border: '#e0b45c' },
};

/* ---------- 5. 图标 svg 组装 ---------- */
function iconSvg(subject, border, size = 52) {
  const body = skillCases[subject] ?? skillCases.slam;
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
<rect x="2" y="2" width="60" height="60" rx="13" fill="#1b1714" stroke="${border}" stroke-width="2"/>
<rect x="5.5" y="5.5" width="53" height="53" rx="10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
${toSvg(body, subject)}</svg>`;
}

function itemIconSvg(subject, size = 44) {
  const body = itemCases[subject];
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
<rect x="2" y="2" width="60" height="60" rx="13" fill="#1b1714" stroke="#8d8a82" stroke-width="2"/>
<rect x="5.5" y="5.5" width="53" height="53" rx="10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
${toSvg(body, subject)}</svg>`;
}

/* ---------- 6. 生成 HTML ---------- */
const skillGrid = Object.keys(CLASS_META)
  .map((cid) => {
    const meta = CLASS_META[cid];
    const rows = SKILLS.filter(([, , c]) => c === cid)
      .map(([id, name]) => {
        const subj = subjectMap[id];
        const req = reqLevelMap[id]?.req ?? 1;
        return `<li class="cell">
${iconSvg(subj, meta.border, 52)}
<span class="cell-name">${name}</span>
<span class="cell-sub">Lv.${req} · ${subj}</span>
</li>`;
      })
      .join('\n');
    return `<section>
<h2><i class="chip" style="background:${meta.border}"></i>${meta.name}<em>${cid}</em></h2>
<ul class="grid">${rows}</ul>
</section>`;
  })
  .join('\n');

const itemNames = {
  sword: '长剑/短剑', twinblade: '双匕', blade: '短刃', axe: '劈斧', staff: '法杖', bow: '短弓/长弓',
  maul: '重槌', impact: '冲击刃', slasher: '斩刃', pick: '镐刃', stoneblade: '石刃', stinger: '刺刃',
  'potion-life': '生命药水', 'potion-mana': '法力药水', gem: '宝石材料', ore: '矿石材料', relic: '圣物材料', gold: '金币',
};
const itemGrid = Object.keys(itemNames)
  .map((subj) => `<li class="cell">
${itemIconSvg(subj, 44)}
<span class="cell-name">${itemNames[subj]}</span>
<span class="cell-sub">${subj}</span>
</li>`)
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>余烬暗曜 · 图标库总览</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0c1014; color: #c9d4d8; font-family: "Microsoft YaHei", system-ui, sans-serif; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 28px 20px 60px; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #f4f6f5; letter-spacing: 0.04em; }
  .lede { margin: 0 0 22px; font-size: 12px; color: #8a969c; line-height: 1.7; }
  section { margin: 26px 0 0; }
  section h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 15px; color: #f4f6f5; font-weight: 600; }
  section h2 em { font-style: normal; font-size: 11px; color: #6d7a80; font-weight: 400; }
  .chip { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px 8px; border: 1px solid #232b31; background: #12181e; }
  .cell-name { font-size: 12px; color: #e6ecea; font-weight: 600; }
  .cell-sub { font-size: 10px; color: #6d7a80; }
  .rule { margin-top: 30px; padding: 14px 16px; border: 1px dashed #2c3a34; font-size: 12px; color: #8a969c; line-height: 1.8; }
  .rule b { color: #d4a574; }
</style>
</head>
<body>
<div class="wrap">
  <h1>余烬暗曜 · 技能图标库</h1>
  <p class="lede">暗曜石圆角方板 + 职业描边（战士/法师/猎人/盗贼/圣骑士）· 扁平正面光 · 左上 45° 高光 · 中性金属统一配色<br/>
  元素微调色仅用于主体能量处（火=余烬橙 / 冰=冰蓝 / 毒=毒绿 / 圣光=金 / 奥术=紫 / 暗影=紫灰 / 血=血红）· 圣骑士复用战士主体，以金色描边区分</p>
${skillGrid}
  <section>
    <h2><i class="chip" style="background:#8d8a82"></i>物品图标（同体系参考）<em>neutral metal</em></h2>
    <ul class="grid">${itemGrid}</ul>
  </section>
  <p class="rule">
    <b>设计规则</b>：主体约占画面 64%；高光统一来自左上 45°；全部图形为扁平矢量（无渐变、无描边阴影）；<br/>
    描边语言与物品品质 5 档同明度（common #8d8a82 / uncommon #57c84d / rare #4d8df6 / epic #b06bff / legendary #f0a83a）。<br/>
    本页由 <code>scripts/build-icon-preview.cjs</code> 从源码自动生成，与运行时图标严格一致。
  </p>
</div>
</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`✔ 已生成 ${path.relative(ROOT, OUT)}`);
console.log(`  技能主体 ${Object.keys(skillCases).length} 个 · 物品主体 ${Object.keys(itemCases).length} 个 · 技能 40 个（映射 ${Object.keys(subjectMap).length}）`);
const missing = SKILLS.map(([id]) => id).filter((id) => !subjectMap[id]);
if (missing.length) console.log(`  ⚠ 未映射: ${missing.join(', ')}`);
