import { PLAYER } from '../game/config';
import { CHALLENGE_DURATION } from '../game/systems/challenge';
import type { AttrKey, HudSnapshot, RespawnChoice } from '../game/types';
import './hud.css';

type HudProps = {
  vitals: HudSnapshot;
  onRespawn: (choice: RespawnChoice) => void;
  onEquip: (uid: number) => void;
  onDiscard: (uid: number) => void;
  onDraftAttr: (key: AttrKey, delta: 1 | -1) => void;
  onRecommendAttrs: () => void;
  onClearDraft: () => void;
  onApplyAttrs: () => void;
  onUpgradeSkill: (id: string) => void;
  onBuy: (defId: string) => void;
  onSell: (uid: number) => void;
  onEnhance: () => void;
  onResetAttrs: () => void;
  onResetSkills: () => void;
  onResetSpec: () => void;
  onPickSpec: (id: string) => void;
  onTeleport: (nodeId: string) => void;
  onStartNgPlus: () => void;
  onStartChallenge: () => void;
  onSave: () => void;
  onLoad: () => void;
  onUsePotion: (uid?: number) => void;
  onSetAudio: (patch: { bgm?: number; sfx?: number; muted?: boolean }) => void;
};

type SkillSlot = {
  key: string;
  name: string;
  ready: boolean;
  cdRatio: number;
};

const QUALITY_CLASS: Record<string, string> = {
  common: 'inv__item--common',
  uncommon: 'inv__item--uncommon',
  rare: 'inv__item--rare',
  epic: 'inv__item--epic',
  legendary: 'inv__item--legendary',
};

const CHALLENGE_HINT = `进入短图，击杀全部精英词缀怪。限时 ${CHALLENGE_DURATION} 秒，成功奖励碎材与金币。`;

export function Hud({
  vitals,
  onRespawn,
  onEquip,
  onDiscard,
  onDraftAttr,
  onRecommendAttrs,
  onClearDraft,
  onApplyAttrs,
  onUpgradeSkill,
  onBuy,
  onSell,
  onEnhance,
  onResetAttrs,
  onResetSkills,
  onResetSpec,
  onPickSpec,
  onTeleport,
  onStartNgPlus,
  onStartChallenge,
  onSave,
  onLoad,
  onUsePotion,
  onSetAudio,
}: HudProps): JSX.Element {
  const hpPct = vitals.maxHp <= 0 ? 0 : Math.round((vitals.hp / vitals.maxHp) * 100);
  const ragePct = vitals.maxRage <= 0 ? 0 : Math.round((vitals.rage / vitals.maxRage) * 100);
  const xpPct =
    vitals.xpToNext <= 0 ? 0 : Math.round((vitals.xp / vitals.xpToNext) * 100);
  const slots: SkillSlot[] = [
    {
      key: 'Q',
      name: '猛击',
      ready: vitals.slamCd <= 0,
      cdRatio: vitals.slamCd / PLAYER.slamCooldown,
    },
    {
      key: 'E',
      name: '盾击',
      ready: vitals.bashCd <= 0 && vitals.rage >= PLAYER.bashCost,
      cdRatio: vitals.bashCd / PLAYER.bashCooldown,
    },
    {
      key: 'R',
      name: '药水',
      ready: Boolean(vitals.potionReady) && vitals.hp < vitals.maxHp,
      cdRatio: 0,
    },
    { key: 'T', name: '', ready: false, cdRatio: 0 },
  ];
  const hasDraft = vitals.attrs.some((row) => row.draft > 0);
  const audio = vitals.audio ?? { bgm: 0.85, sfx: 0.9, muted: false };
  return (
    <div className="hud">
      <header className="hud__brand">
        <p className="hud__kicker">封版 · 阶段 7</p>
        <h1>烬营远征</h1>
        <p className="hud__sub">
          {vitals.zoneName}
          {vitals.ngPlusLevel > 0 ? ` · NG+${vitals.ngPlusLevel}` : ''} · 战士 · Lv.
          {vitals.level}
          {vitals.specName ? ` · ${vitals.specName}` : ''}
          {vitals.unspentAttr > 0 || vitals.unspentSkill > 0 ? ' · 有未分配点' : ''}
        </p>
        <p className="hud__meta">
          攻 {vitals.atk}
          {vitals.weaponEnhance > 0 ? `(+${vitals.weaponEnhance})` : ''} · 防 {vitals.def} · 暴{' '}
          {vitals.critPct}% · 金 {vitals.gold}
        </p>
        <div className="hud__bar hud__bar--xp">
          <span className="hud__bar-label">经验</span>
          <div className="hud__bar-track">
            <i className="hud__bar-fill hud__bar-fill--xp" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="hud__bar-num">
            {vitals.xp}/{vitals.xpToNext}
          </span>
        </div>
      </header>

      {vitals.bossName ? (
        <div className="bossbar">
          <div className="bossbar__head">
            <b>{vitals.bossName}</b>
            <span>
              {vitals.bossHp}/{vitals.bossMaxHp}
            </span>
          </div>
          <div className="bossbar__track">
            <i
              className="bossbar__fill"
              style={{
                width: `${vitals.bossMaxHp <= 0 ? 0 : Math.round((vitals.bossHp / vitals.bossMaxHp) * 100)}%`,
              }}
            />
          </div>
          {vitals.bossCast ? (
            <div className="bossbar__cast">
              <span>{vitals.bossCast}</span>
              <div className="bossbar__cast-track">
                <i style={{ width: `${Math.round(vitals.bossCastRatio * 100)}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : vitals.challengeActive ? (
        <div className="bossbar bossbar--challenge">
          <div className="bossbar__head">
            <b>词缀试炼</b>
            <span>{Math.ceil(vitals.challengeT)}s</span>
          </div>
          <div className="bossbar__track">
            <i
              className="bossbar__fill bossbar__fill--challenge"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round((vitals.challengeT / 90) * 100)))}%`,
              }}
            />
          </div>
          <div className="bossbar__cast">
            <span>清光全部精英</span>
          </div>
        </div>
      ) : vitals.eliteName ? (
        <div className="bossbar bossbar--elite">
          <div className="bossbar__head">
            <b>{vitals.eliteName}</b>
            <span>
              {vitals.eliteHp}/{vitals.eliteMaxHp}
            </span>
          </div>
          <div className="bossbar__track">
            <i
              className="bossbar__fill bossbar__fill--elite"
              style={{
                width: `${vitals.eliteMaxHp <= 0 ? 0 : Math.round((vitals.eliteHp / vitals.eliteMaxHp) * 100)}%`,
              }}
            />
          </div>
          {vitals.eliteAffixes.length > 0 ? (
            <div className="bossbar__cast">
              <span>{vitals.eliteAffixes.join(' · ')}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="hud__dock">
        <div className="hud__vitals">
          <div className="hud__bar">
            <span className="hud__bar-label">生命</span>
            <div className="hud__bar-track">
              <i className="hud__bar-fill hud__bar-fill--hp" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hud__bar-num">
              {vitals.hp}/{vitals.maxHp}
            </span>
          </div>
          <div className={vitals.rageWarn ? 'hud__bar hud__bar--warn' : 'hud__bar'}>
            <span className="hud__bar-label">怒气</span>
            <div className="hud__bar-track">
              <i className="hud__bar-fill hud__bar-fill--rage" style={{ width: `${ragePct}%` }} />
            </div>
            <span className="hud__bar-num">
              {vitals.rage}/{vitals.maxRage}
            </span>
          </div>
        </div>
        {vitals.rageWarn ? <p className="hud__down">怒气不足</p> : null}
        {vitals.tutorialHint ? <p className="hud__tutorial">{vitals.tutorialHint}</p> : null}
        {vitals.levelToast ? <p className="hud__levelup">{vitals.levelToast}</p> : null}
        {vitals.nearbyLootName ? (
          <p className="hud__prompt">
            <kbd>F</kbd> 拾取 {vitals.nearbyLootName}
          </p>
        ) : null}
        {vitals.nearbySecretPrompt ? (
          <p className="hud__prompt">
            <kbd>F</kbd> 开启 {vitals.nearbySecretPrompt}
          </p>
        ) : null}
        <div className="hud__save">
          <button type="button" onClick={onSave}>
            存档
          </button>
          <button type="button" onClick={onLoad}>
            读档
          </button>
        </div>
        <ul className="hud__skills">
          {slots.map((slot) => (
            <li key={slot.key} className={slot.ready ? 'hud__slot' : 'hud__slot hud__slot--wait'}>
              {slot.cdRatio > 0 ? (
                <i className="hud__slot-cd" style={{ height: `${Math.min(1, slot.cdRatio) * 100}%` }} />
              ) : null}
              {slot.name ? <b>{slot.name}</b> : null}
              <span>{slot.key}</span>
            </li>
          ))}
        </ul>
        <ul className="hud__keys">
          <li className={vitals.lootBagPulse ? 'hud__key--pulse' : undefined}>
            <kbd>I</kbd>
            背包
          </li>
          <li>
            <kbd>C</kbd>
            加点
            {vitals.unspentAttr > 0 ? <em className="hud__dot" /> : null}
          </li>
          <li>
            <kbd>K</kbd>
            技能
            {vitals.unspentSkill > 0 || vitals.needsSpec ? <em className="hud__dot" /> : null}
          </li>
          <li>
            <kbd>L</kbd>
            图鉴
          </li>
          <li>
            <kbd>R</kbd>
            药水
          </li>
          <li>
            <kbd>O</kbd>
            设置
          </li>
          <li>
            <kbd>F</kbd>
            拾取
          </li>
        </ul>
      </div>

      {vitals.awaitRespawn ? (
        <div className="death">
          <h2>倒下了</h2>
          <p>选择复活地点</p>
          <div className="death__actions">
            <button
              type="button"
              className="death__btn"
              disabled={!vitals.hasBanner}
              onClick={() => onRespawn('banner')}
            >
              回旗帜 <kbd>1</kbd>
            </button>
            <button type="button" className="death__btn" onClick={() => onRespawn('camp')}>
              回营 <kbd>2</kbd>
            </button>
          </div>
        </div>
      ) : null}

      {vitals.invOpen ? (
        <div className="inv">
          <header className="inv__head">
            <h2>背包</h2>
            <p>
              {vitals.bag.length}/{vitals.bagCap ?? 20} · 金币 {vitals.gold}
            </p>
          </header>
          <ul className="inv__list">
            {vitals.bag.length === 0 ? <li className="inv__empty">空空如也</li> : null}
            {vitals.bag.map((item) => (
              <li key={item.uid} className={`inv__item ${QUALITY_CLASS[item.quality] ?? ''}`}>
                <span>
                  {item.name}
                  {item.qty > 1 ? ` ×${item.qty}` : ''}
                  {item.equipped ? ' · 已装备' : ''}
                  {item.desc ? (
                    <>
                      <br />
                      <small>{item.desc}</small>
                    </>
                  ) : null}
                </span>
                <div className="inv__item-actions">
                  {item.canEquip && !item.equipped ? (
                    <button type="button" onClick={() => onEquip(item.uid)}>
                      装备
                    </button>
                  ) : null}
                  {item.canUse ? (
                    <button type="button" onClick={() => onUsePotion(item.uid)}>
                      使用
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inv__discard"
                    onClick={() => onDiscard(item.uid)}
                  >
                    丢弃
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="inv__hint">
            <kbd>I</kbd> / <kbd>Esc</kbd> 关闭 · <kbd>R</kbd> 快捷喝药 · 丢弃整组腾空格
          </p>
        </div>
      ) : null}

      {vitals.settingsOpen ? (
        <div className="inv inv--settings">
          <header className="inv__head">
            <h2>设置</h2>
            <p>音频与快捷键</p>
          </header>
          <div className="settings">
            <label className="settings__row">
              <span>静音</span>
              <input
                type="checkbox"
                checked={audio.muted}
                onChange={(e) => onSetAudio({ muted: e.target.checked })}
              />
            </label>
            <label className="settings__row">
              <span>音乐 {Math.round(audio.bgm * 100)}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(audio.bgm * 100)}
                disabled={audio.muted}
                onChange={(e) => onSetAudio({ bgm: Number(e.target.value) / 100 })}
              />
            </label>
            <label className="settings__row">
              <span>音效 {Math.round(audio.sfx * 100)}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(audio.sfx * 100)}
                disabled={audio.muted}
                onChange={(e) => onSetAudio({ sfx: Number(e.target.value) / 100 })}
              />
            </label>
          </div>
          <p className="inv__hint">
            换区 / 击败 BOSS / 复活会自动存档。
            <kbd>O</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.catalogOpen ? (
        <div className="inv inv--catalog">
          <header className="inv__head">
            <h2>橙装图鉴</h2>
            <p>
              已发现{' '}
              {(vitals.legendaryCatalog ?? []).filter((e) => e.discovered).length}/
              {(vitals.legendaryCatalog ?? []).length}
            </p>
          </header>
          <ul className="inv__list">
            {(vitals.legendaryCatalog ?? []).map((entry) => (
              <li
                key={entry.defId}
                className={`inv__item ${entry.discovered ? 'inv__item--legendary' : 'inv__item--common'}`}
              >
                <span>
                  <b>{entry.name}</b>
                  <br />
                  <small>{entry.effectDesc}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="inv__hint">
            BOSS 掉落概率出橙装；换区重进可反复刷。
            <kbd>L</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.charOpen ? (
        <div className="panel panel--char">
          <header className="inv__head">
            <h2>角色 · Lv.{vitals.level}</h2>
            <p>可分配 {vitals.draftLeft}</p>
          </header>
          <ul className="attr__list">
            {vitals.attrs.map((row) => (
              <li key={row.key} className="attr__row">
                <div>
                  <b>
                    {row.name} <span className="attr__tag">{row.tag}</span>
                  </b>
                  <small>{row.note}</small>
                </div>
                <div className="attr__ctrl">
                  <button type="button" disabled={row.draft <= 0} onClick={() => onDraftAttr(row.key, -1)}>
                    −
                  </button>
                  <span>
                    {row.value}
                    {row.draft > 0 ? ` → ${row.preview}` : ''}
                  </span>
                  <button
                    type="button"
                    disabled={vitals.draftLeft <= 0}
                    onClick={() => onDraftAttr(row.key, 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="panel__preview">
            <p>
              生命 {vitals.maxHp}
              {hasDraft ? ` → ${vitals.previewHp}` : ''}
            </p>
            <p>
              攻击 {vitals.atk}
              {hasDraft ? ` → ${vitals.previewAtk}` : ''}
            </p>
            <p>
              防御 {vitals.def}
              {hasDraft ? ` → ${vitals.previewDef}` : ''}
            </p>
            <p>
              暴击 {vitals.critPct}%
              {hasDraft ? ` → ${vitals.previewCrit}%` : ''}
            </p>
          </div>
          <div className="panel__actions">
            <button type="button" onClick={onRecommendAttrs}>
              推荐分配
            </button>
            <button type="button" disabled={!hasDraft} onClick={onClearDraft}>
              清空草稿
            </button>
            <button type="button" className="panel__primary" disabled={!hasDraft} onClick={onApplyAttrs}>
              确认加点
            </button>
          </div>
          <p className="inv__hint">
            <kbd>C</kbd> / <kbd>Esc</kbd> 关闭 · 先点 + 预览，再确认
          </p>
        </div>
      ) : null}

      {vitals.specPickOpen ? (
        <div className="panel panel--spec">
          <header className="inv__head">
            <h2>选择专精</h2>
            <p>Lv.10 · 三选一</p>
          </header>
          <ul className="spec__list">
            {vitals.specs.map((spec) => (
              <li key={spec.id} className="spec__card">
                <div className="spec__title">
                  <b>{spec.name}</b>
                  <span>{spec.tag}</span>
                </div>
                <ul className="spec__effects">
                  {spec.effects.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <button type="button" className="panel__primary" onClick={() => onPickSpec(spec.id)}>
                  选择
                </button>
              </li>
            ))}
          </ul>
          <p className="inv__hint">
            <kbd>Esc</kbd> 稍后选择 · 未选前 K 会提示
          </p>
        </div>
      ) : null}

      {vitals.skillOpen ? (
        <div className="panel panel--skill">
          <header className="inv__head">
            <h2>技能</h2>
            <p>技能点 {vitals.unspentSkill}</p>
          </header>
          <p className="spec__current">
            专精：{vitals.specName ?? (vitals.needsSpec ? '未选择' : '未解锁')}
          </p>
          {vitals.needsSpec ? (
            <ul className="spec__list spec__list--compact">
              {vitals.specs.map((spec) => (
                <li key={spec.id} className="spec__card">
                  <div className="spec__title">
                    <b>{spec.name}</b>
                    <span>{spec.tag}</span>
                  </div>
                  <ul className="spec__effects">
                    {spec.effects.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <button type="button" className="panel__primary" onClick={() => onPickSpec(spec.id)}>
                    选择
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="skill__list">
            {vitals.skills.map((skill) => (
              <li key={skill.id} className="skill__row">
                <div>
                  <b>
                    {skill.name} · {skill.level}/5
                  </b>
                  <small>{skill.desc}</small>
                </div>
                <button
                  type="button"
                  disabled={!skill.canUpgrade}
                  onClick={() => onUpgradeSkill(skill.id)}
                >
                  升级{skill.cost > 0 ? ` (${skill.cost})` : ''}
                </button>
              </li>
            ))}
          </ul>
          <p className="inv__hint">
            <kbd>K</kbd> / <kbd>Esc</kbd> 关闭 · 升级提高技能伤害倍率
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'merchant' ? (
        <div className="panel panel--camp">
          <header className="inv__head">
            <h2>杂货商人</h2>
            <p>金币 {vitals.gold}</p>
          </header>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <h3 className="camp__sub">购买</h3>
          <ul className="skill__list">
            {vitals.shopStock.map((row) => (
              <li key={row.defId} className="skill__row">
                <span>{row.name}</span>
                <button type="button" onClick={() => onBuy(row.defId)}>
                  {row.price} 金
                </button>
              </li>
            ))}
          </ul>
          <h3 className="camp__sub">出售背包</h3>
          <ul className="skill__list">
            {vitals.bag.map((item) => (
              <li key={item.uid} className="skill__row">
                <span>
                  {item.name}
                  {item.qty > 1 ? ` ×${item.qty}` : ''}
                  {item.equipped ? ' · 装备中' : ''}
                </span>
                <button type="button" disabled={item.equipped} onClick={() => onSell(item.uid)}>
                  卖出
                </button>
              </li>
            ))}
          </ul>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'blacksmith' ? (
        <div className="panel panel--camp">
          <header className="inv__head">
            <h2>铁匠</h2>
            <p>强化 +{vitals.weaponEnhance}/5</p>
          </header>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <p className="camp__desc">
            消耗 {vitals.enhanceCost} 金 + 1 任意材料（材料 {vitals.enhanceMats}）· 每级按武器基础攻击提升。
          </p>
          <div className="panel__actions">
            <button
              type="button"
              className="panel__primary"
              disabled={!vitals.canEnhance}
              onClick={onEnhance}
            >
              {vitals.weaponEnhance >= 5 ? '已达上限' : '强化主手'}
            </button>
          </div>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'trainer' ? (
        <div className="panel panel--camp">
          <header className="inv__head">
            <h2>训练师</h2>
            <p>重置加点</p>
          </header>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <div className="panel__actions">
            <button type="button" onClick={onResetAttrs}>
              重置属性{vitals.attrResetCost > 0 ? ` (${vitals.attrResetCost}金)` : '（首次免费）'}
            </button>
            <button type="button" onClick={onResetSkills}>
              重置技能{vitals.skillResetCost > 0 ? ` (${vitals.skillResetCost}金)` : '（首次免费）'}
            </button>
            <button type="button" onClick={onResetSpec}>
              重置专精{vitals.specResetCost > 0 ? ` (${vitals.specResetCost}金)` : '（首次免费）'}
            </button>
          </div>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'challenge' ? (
        <div className="panel panel--camp">
          <header className="inv__head">
            <h2>词缀试炼</h2>
            <p>限时清光精英 · 刷强化材料</p>
          </header>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <p className="inv__hint">
            {CHALLENGE_HINT}
          </p>
          <div className="panel__actions">
            <button type="button" className="panel__primary" onClick={onStartChallenge}>
              开始挑战（90 秒）
            </button>
          </div>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'teleport' ? (
        <div className="panel panel--camp">
          <header className="inv__head">
            <h2>传送阵</h2>
            <p>
              已解锁节点
              {vitals.ngPlusLevel > 0 ? ` · NG+${vitals.ngPlusLevel}` : ''}
            </p>
          </header>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <div className="panel__actions">
            {(vitals.travelNodes ?? []).map((node, i) => (
              <button
                key={node.id}
                type="button"
                className={i === vitals.travelNodes.length - 1 ? 'panel__primary' : undefined}
                onClick={() => onTeleport(node.id)}
              >
                {node.label}
              </button>
            ))}
            {vitals.canStartNgPlus ? (
              <button type="button" className="panel__primary" onClick={onStartNgPlus}>
                开启新周目 NG+{(vitals.ngPlusLevel ?? 0) + 1}
              </button>
            ) : null}
          </div>
          <p className="inv__hint">
            {vitals.canStartNgPlus
              ? 'NG+ 保留装备成长，怪物更强、掉落更好'
              : null}
            {vitals.canStartNgPlus ? <br /> : null}
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}
    </div>
  );
}
