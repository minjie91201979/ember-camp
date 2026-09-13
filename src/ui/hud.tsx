import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { PLAYER } from '../game/config';
import { CONTROL_HELP } from '../game/data/controls';
import { ZONE_FLIGHT_EDGES, ZONE_MAP_POS } from '../game/data/world-map-layout';
import { PLAYER_LEVEL_CAP } from '../game/systems/stats';
import { CHALLENGE_DURATION, challengeDurationOf } from '../game/systems/challenge';
import type { AttrKey, BagSnapshotItem, CampShopRow, HudSnapshot, ItemKind, ItemQuality, RespawnChoice } from '../game/types';
import { ItemIcon, SkillIcon } from './item-icon';
import './hud.css';

type ItemTipPayload = {
  name: string;
  quality: ItemQuality;
  defId: string | null;
  kind: ItemKind;
  stats: string[];
  traits: string[];
  detail: string | null;
  compare: BagSnapshotItem['compare'];
};

type FloatTipState = {
  left: number;
  top: number;
  payload: ItemTipPayload;
};

type HudProps = {
  vitals: HudSnapshot;
  onRespawn: (choice: RespawnChoice) => void;
  onEquip: (uid: number) => void;
  onDiscard: (uid: number, qty?: number) => void;
  onDraftAttr: (key: AttrKey, delta: 1 | -1) => void;
  onRecommendAttrs: () => void;
  onClearDraft: () => void;
  onApplyAttrs: () => void;
  onUpgradeSkill: (id: string) => void;
  onLearnSkill: (id: string) => void;
  onAssignSkillBar: (id: string, slot: number) => void;
  onBuy: (defId: string, qty?: number) => void;
  onSell: (uid: number, qty?: number) => void;
  onSellMaterials: () => void;
  onSellCommonGear: () => void;
  onSellUncommonGear: () => void;
  onSellRareGear: () => void;
  onEnhance: () => void;
  onRepair: () => void;
  onDismantle: (uid: number) => void;
  onResetAttrs: () => void;
  onResetSkills: () => void;
  onResetSpec: () => void;
  onPickSpec: (id: string) => void;
  onPickSpecNode: (id: string) => void;
  onDismissLevelUp: () => void;
  onLevelUpAttrs: () => void;
  onLevelUpSkills: () => void;
  onTeleport: (nodeId: string) => void;
  onStartNgPlus: () => void;
  onStartChallenge: () => void;
  onSave: () => void;
  onLoad: () => void;
  onBackToClassSelect: () => void;
  onUsePotion: (uid?: number) => void;
  onSetAudio: (patch: { bgm?: number; sfx?: number; muted?: boolean }) => void;
  onSetGameplay: (patch: {
    showDamageNumbers?: boolean;
    autoSortBagOnOpen?: boolean;
    autoPickupConsumables?: boolean;
  }) => void;
  onSortBag: () => void;
  onClosePause: () => void;
  onClosePanel: () => void;
  onPauseOpenChar: () => void;
  onPauseOpenSkills: () => void;
};

type SkillSlot = {
  key: string;
  /** 槽位技能 id；空槽为 null */
  id: string | null;
  name: string;
  ready: boolean;
  cdRatio: number;
  /** 冷却剩余秒数文案；无冷却为 null */
  cdLabel: string | null;
  /** 资源消耗；0 或不适用为 null */
  costLabel: string | null;
  /** 当前资源不足 */
  costShort: boolean;
  urge?: boolean;
  /** 药水槽着色 */
  tone?: 'life' | 'mana';
};

function formatCdLabel(cd: number): string | null {
  if (cd <= 0.05) {
    return null;
  }
  if (cd < 1) {
    return cd.toFixed(1);
  }
  return String(Math.ceil(cd));
}

function skillCostMeta(
  cost: number,
  rage: number,
  empty: boolean,
): { costLabel: string | null; costShort: boolean } {
  if (empty || cost <= 0) {
    return { costLabel: null, costShort: false };
  }
  return { costLabel: String(cost), costShort: rage < cost };
}

const QUALITY_CLASS: Record<string, string> = {
  common: 'inv__item--common',
  uncommon: 'inv__item--uncommon',
  rare: 'inv__item--rare',
  epic: 'inv__item--epic',
  legendary: 'inv__item--legendary',
};

const CHALLENGE_HINT =
  '短图限时清精英。通关后自动进下一层（词缀重滚、敌人加强），失败回营。刷强化材料与金币。';

function clampQty(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function QtyStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}): ReactElement {
  return (
    <span className="qty-step">
      <button
        type="button"
        className="qty-step__btn"
        disabled={value <= min}
        aria-label="减少数量"
        onClick={() => onChange(clampQty(value - 1, min, max))}
      >
        −
      </button>
      <span className="qty-step__n">{value}</span>
      <button
        type="button"
        className="qty-step__btn"
        disabled={value >= max}
        aria-label="增加数量"
        onClick={() => onChange(clampQty(value + 1, min, max))}
      >
        +
      </button>
      <button
        type="button"
        className="qty-step__max"
        disabled={value >= max}
        onClick={() => onChange(max)}
      >
        最大
      </button>
    </span>
  );
}

function PanelHead({
  title,
  subtitle,
  onClose,
  extra,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  extra?: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <header className={className ? `inv__head ${className}` : 'inv__head'}>
      <div className="inv__head-row">
        <h2>{title}</h2>
        <div className="inv__head-tools">
          {extra}
          <button type="button" className="panel__close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      {subtitle != null && subtitle !== false ? <p>{subtitle}</p> : null}
    </header>
  );
}

function PanelBody({ children }: { children: ReactNode }): ReactElement {
  return <div className="panel__body">{children}</div>;
}

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
  onLearnSkill,
  onAssignSkillBar,
  onBuy,
  onSell,
  onSellMaterials,
  onSellCommonGear,
  onSellUncommonGear,
  onSellRareGear,
  onEnhance,
  onRepair,
  onDismantle,
  onResetAttrs,
  onResetSkills,
  onResetSpec,
  onPickSpec,
  onPickSpecNode,
  onDismissLevelUp,
  onLevelUpAttrs,
  onLevelUpSkills,
  onTeleport,
  onStartNgPlus,
  onStartChallenge,
  onSave,
  onLoad,
  onBackToClassSelect,
  onUsePotion,
  onSetAudio,
  onSetGameplay,
  onSortBag,
  onClosePause,
  onClosePanel,
  onPauseOpenChar,
  onPauseOpenSkills,
}: HudProps): JSX.Element {
  const hpPct = vitals.maxHp <= 0 ? 0 : Math.round((vitals.hp / vitals.maxHp) * 100);
  const ragePct = vitals.maxRage <= 0 ? 0 : Math.round((vitals.rage / vitals.maxRage) * 100);
  const xpPct =
    vitals.xpToNext <= 0 ? 0 : Math.round((vitals.xp / vitals.xpToNext) * 100);
  const slots: SkillSlot[] = [
    {
      key: 'Q',
      id: vitals.skillQId ?? null,
      name: vitals.skillQName ?? '猛击',
      ready: vitals.slamCd <= 0 && vitals.rage >= (vitals.skillQCost ?? 0),
      cdRatio: vitals.slamCd / Math.max(0.01, vitals.skillQCdMax ?? PLAYER.slamCooldown),
      cdLabel: formatCdLabel(vitals.slamCd),
      ...skillCostMeta(
        vitals.skillQCost ?? 0,
        vitals.rage,
        !vitals.skillQName || vitals.skillQName === '空',
      ),
    },
    {
      key: 'E',
      id: vitals.skillEId ?? null,
      name: vitals.skillEName ?? '盾击',
      ready: vitals.bashCd <= 0 && vitals.rage >= (vitals.skillECost ?? PLAYER.bashCost),
      cdRatio: vitals.bashCd / Math.max(0.01, vitals.skillECdMax ?? PLAYER.bashCooldown),
      cdLabel: formatCdLabel(vitals.bashCd),
      ...skillCostMeta(
        vitals.skillECost ?? PLAYER.bashCost,
        vitals.rage,
        !vitals.skillEName || vitals.skillEName === '空',
      ),
    },
    {
      key: '1',
      id: vitals.skill3Id ?? null,
      name: vitals.skill3Name ?? '空',
      ready:
        Boolean(vitals.skill3Name && vitals.skill3Name !== '空') &&
        (vitals.skillCd2 ?? 0) <= 0 &&
        vitals.rage >= (vitals.skill3Cost ?? 0),
      cdRatio: (vitals.skillCd2 ?? 0) / Math.max(0.01, vitals.skill3CdMax ?? 1),
      cdLabel: formatCdLabel(vitals.skillCd2 ?? 0),
      ...skillCostMeta(
        vitals.skill3Cost ?? 0,
        vitals.rage,
        !vitals.skill3Name || vitals.skill3Name === '空',
      ),
    },
    {
      key: '2',
      id: vitals.skill4Id ?? null,
      name: vitals.skill4Name ?? '空',
      ready:
        Boolean(vitals.skill4Name && vitals.skill4Name !== '空') &&
        (vitals.skillCd3 ?? 0) <= 0 &&
        vitals.rage >= (vitals.skill4Cost ?? 0),
      cdRatio: (vitals.skillCd3 ?? 0) / Math.max(0.01, vitals.skill4CdMax ?? 1),
      cdLabel: formatCdLabel(vitals.skillCd3 ?? 0),
      ...skillCostMeta(
        vitals.skill4Cost ?? 0,
        vitals.rage,
        !vitals.skill4Name || vitals.skill4Name === '空',
      ),
    },
    {
      key: 'R',
      id: null,
      name:
        (vitals.lifePotionCount ?? 0) > 0
          ? `红药×${vitals.lifePotionCount}`
          : '红药',
      ready: Boolean(vitals.lifePotionReady),
      cdRatio: (vitals.potionCd ?? 0) / Math.max(0.01, vitals.potionCdMax ?? 1.2),
      cdLabel: formatCdLabel(vitals.potionCd ?? 0),
      costLabel: null,
      costShort: false,
      urge: Boolean(vitals.potionUrge),
      tone: 'life',
    },
    {
      key: 'T',
      id: null,
      name:
        (vitals.manaPotionCount ?? 0) > 0
          ? `蓝药×${vitals.manaPotionCount}`
          : '蓝药',
      ready: Boolean(vitals.manaPotionReady),
      cdRatio: (vitals.potionCd ?? 0) / Math.max(0.01, vitals.potionCdMax ?? 1.2),
      cdLabel: formatCdLabel(vitals.potionCd ?? 0),
      costLabel: null,
      costShort: false,
      urge: Boolean(vitals.manaPotionUrge),
      tone: 'mana',
    },
  ];
  const hasDraft = vitals.attrs.some((row) => row.draft > 0);
  const worldMapNodes = vitals.worldMapNodes ?? [];
  const worldNodeById = new Map(worldMapNodes.map((n) => [n.zoneId, n]));
  const audio = vitals.audio ?? { bgm: 0.85, sfx: 0.9, muted: false };
  const gameplay = vitals.gameplay ?? {
    showDamageNumbers: true,
    autoSortBagOnOpen: true,
    autoPickupConsumables: true,
  };
  const [floatTip, setFloatTip] = useState<FloatTipState | null>(null);
  const [buyQty, setBuyQty] = useState<Record<string, number>>({});
  const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy');
  const [confirmAct, setConfirmAct] = useState<
    | { kind: 'discard' | 'sell' | 'dismantle'; uid: number; qty: number }
    | { kind: 'sell-mats' | 'sell-white' | 'sell-green' | 'sell-blue' }
    | null
  >(null);

  useEffect(() => {
    if (
      !vitals.invOpen &&
      vitals.campOpen !== 'merchant' &&
      vitals.campOpen !== 'apothecary' &&
      vitals.campOpen !== 'weaponsmith'
    ) {
      setFloatTip(null);
    }
    setConfirmAct(null);
    setBuyQty({});
    setShopTab('buy');
  }, [vitals.invOpen, vitals.campOpen]);

  const placeFloatTip = (el: HTMLElement, payload: ItemTipPayload): void => {
    const rect = el.getBoundingClientRect();
    const tipW = 260;
    const gap = 10;
    let left = rect.left - tipW - gap;
    if (left < 12) {
      left = Math.min(rect.right + gap, window.innerWidth - tipW - 12);
    }
    let top = rect.top;
    if (top + 180 > window.innerHeight) {
      top = Math.max(12, window.innerHeight - 200);
    }
    setFloatTip({ left, top, payload });
  };

  const tipFromBag = (item: BagSnapshotItem): ItemTipPayload => ({
    name: item.name,
    quality: item.quality,
    defId: item.defId,
    kind: item.kind,
    stats: item.stats ?? [],
    traits: item.traits ?? [],
    detail: item.detail ?? item.desc,
    compare: item.compare ?? [],
  });

  const tipFromShop = (row: CampShopRow): ItemTipPayload => ({
    name: row.name,
    quality: row.quality,
    defId: row.defId,
    kind: row.kind,
    stats: row.stats ?? [],
    traits: row.traits ?? [],
    detail: row.flavor ?? row.detail,
    compare: row.compare ?? [],
  });

  const requestDiscard = (uid: number, stackQty: number): void => {
    if (confirmAct?.kind === 'discard' && confirmAct.uid === uid) {
      const qty = confirmAct.qty;
      setConfirmAct(null);
      onDiscard(uid, qty);
      return;
    }
    setConfirmAct({ kind: 'discard', uid, qty: stackQty });
  };

  const requestDismantle = (uid: number): void => {
    if (confirmAct?.kind === 'dismantle' && confirmAct.uid === uid) {
      setConfirmAct(null);
      onDismantle(uid);
      return;
    }
    setConfirmAct({ kind: 'dismantle', uid, qty: 1 });
  };

  const requestSell = (uid: number, stackQty: number): void => {
    if (confirmAct?.kind === 'sell' && confirmAct.uid === uid) {
      const qty = confirmAct.qty;
      setConfirmAct(null);
      onSell(uid, qty);
      return;
    }
    setConfirmAct({ kind: 'sell', uid, qty: stackQty });
  };

  const requestSellMaterials = (): void => {
    if (confirmAct?.kind === 'sell-mats') {
      setConfirmAct(null);
      onSellMaterials();
      return;
    }
    setConfirmAct({ kind: 'sell-mats' });
  };

  const requestSellCommonGear = (): void => {
    if (confirmAct?.kind === 'sell-white') {
      setConfirmAct(null);
      onSellCommonGear();
      return;
    }
    setConfirmAct({ kind: 'sell-white' });
  };

  const requestSellUncommonGear = (): void => {
    if (confirmAct?.kind === 'sell-green') {
      setConfirmAct(null);
      onSellUncommonGear();
      return;
    }
    setConfirmAct({ kind: 'sell-green' });
  };

  const requestSellRareGear = (): void => {
    if (confirmAct?.kind === 'sell-blue') {
      setConfirmAct(null);
      onSellRareGear();
      return;
    }
    setConfirmAct({ kind: 'sell-blue' });
  };

  const hasTipPayload = (p: ItemTipPayload): boolean =>
    p.stats.length > 0 ||
    p.traits.length > 0 ||
    p.compare.length > 0 ||
    Boolean(p.detail);

  return (
    <div
      className={`hud${vitals.awaitRespawn ? ' hud--dead' : ''}${vitals.fallWarn ? ' hud--pit-warn' : ''}${vitals.settingsOpen ? ' hud--paused' : ''}`}
    >
      <div className="hud__compact" aria-label="状态">
        <span>{vitals.zoneName}</span>
        <span>
          Lv.{vitals.level}
          {vitals.ngPlusLevel > 0 ? ` · NG+${vitals.ngPlusLevel}` : ''}
        </span>
        <span>{vitals.gold} 金</span>
        {vitals.unspentAttr > 0 || vitals.unspentSkill > 0 ? (
          <span className="hud__compact-dot">可加点</span>
        ) : null}
      </div>
      <header className="hud__brand">
        <p className="hud__kicker">阶段 93 · 暴风雪</p>
        <h1>烬营远征</h1>
        <p className="hud__sub">
          {vitals.zoneName}
          {vitals.ngPlusLevel > 0 ? ` · NG+${vitals.ngPlusLevel}` : ''} ·{' '}
          {vitals.className ?? '战士'} · Lv.
          {vitals.level}
          {vitals.specName ? ` · ${vitals.specName}` : ''}
          {vitals.unspentAttr > 0 || vitals.unspentSkill > 0 ? ' · 有未分配点' : ''}
        </p>
        <p className="hud__meta">
              {vitals.classId === 'mage' ? (
            <>
              法强 {vitals.sp ?? 0}
              {vitals.weaponEnhance > 0 ? `(+${vitals.weaponEnhance})` : ''}
              {vitals.weaponDur !== null && vitals.weaponDur <= 0 ? ' · 破损' : ''} · 防{' '}
              {vitals.def} · 暴 {vitals.critPct}% · 金 {vitals.gold}
            </>
          ) : (
            <>
              攻 {vitals.atk}
              {vitals.weaponEnhance > 0 ? `(+${vitals.weaponEnhance})` : ''}
              {vitals.weaponDur !== null && vitals.weaponDur <= 0 ? ' · 破损' : ''} · 防{' '}
              {vitals.def} · 暴 {vitals.critPct}% · 金 {vitals.gold}
            </>
          )}
        </p>
        {vitals.qaActive ? (
          <p className="hud__qa">
            QA{vitals.qaGod ? ' · 无敌' : ''} · F1满血 F2等级 F3清场 F4BOSS F5下区 F6解锁 F7补给 F8关 F9无敌
          </p>
        ) : null}
        <div className="hud__bar hud__bar--xp">
          <span className="hud__bar-label">Lv.{vitals.level}</span>
          <div className="hud__bar-track">
            <i className="hud__bar-fill hud__bar-fill--xp" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="hud__bar-num">
            {vitals.level >= PLAYER_LEVEL_CAP
              ? '满级 · 击杀折金'
              : `${vitals.xp}/${vitals.xpToNext} · ${xpPct}%`}
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
            <b>词缀试炼 · 第 {vitals.challengeFloor} 层</b>
            <span>{Math.ceil(vitals.challengeT)}s</span>
          </div>
          <div className="bossbar__track">
            <i
              className="bossbar__fill bossbar__fill--challenge"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(
                      (vitals.challengeT /
                        challengeDurationOf(Math.max(1, vitals.challengeFloor))) *
                        100,
                    ),
                  ),
                )}%`,
              }}
            />
          </div>
          <div className="bossbar__cast">
            <span>
              {(vitals.challengeRunAffixes ?? []).length > 0
                ? vitals.challengeRunAffixes.join(' / ')
                : '清光全部精英'}
            </span>
          </div>
          {(vitals.challengeAffixHints ?? []).length > 0 ? (
            <p className="bossbar__hint">{vitals.challengeAffixHints.join('；')}</p>
          ) : null}
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
          {(vitals.eliteAffixHints ?? []).length > 0 ? (
            <p className="bossbar__hint">{vitals.eliteAffixHints.join('；')}</p>
          ) : null}
        </div>
      ) : null}

      <aside
        className={`minimap${
          vitals.invOpen ||
          vitals.charOpen ||
          vitals.skillOpen ||
          vitals.catalogOpen ||
          vitals.settingsOpen ||
          vitals.levelUpOpen ||
          vitals.campOpen
            ? ' minimap--dim'
            : ''
        }`}
        aria-label="区域小地图"
      >
        <div className="minimap__frame">
          {(vitals.miniMap?.marks ?? []).map((m, i) => (
            <i
              key={`${m.kind}-${i}`}
              className={`minimap__mark minimap__mark--${m.kind}`}
              style={{ left: `${m.u * 100}%`, top: `${m.v * 100}%` }}
            />
          ))}
        </div>
        <p className="minimap__legend">
          <span>你</span>
          <span>足迹</span>
          <span>传送</span>
          <span>装备</span>
          <span>秘密</span>
          <span>
            {vitals.miniMap?.secretsTotal
              ? `${vitals.miniMap.secretsClaimed}/${vitals.miniMap.secretsTotal}`
              : '—'}
          </span>
        </p>
      </aside>

      {vitals.zoneAnnounce ? (
        <div className="zone-announce" aria-live="polite">
          <p className="zone-announce__kicker">抵达</p>
          <h2 className="zone-announce__name">{vitals.zoneAnnounce.name}</h2>
          <p className="zone-announce__sub">{vitals.zoneAnnounce.sub}</p>
        </div>
      ) : null}

      <div className="hud__dock">
        <div className="hud__vitals">
          <div className={vitals.lowHp ? 'hud__bar hud__bar--danger' : 'hud__bar'}>
            <span className="hud__bar-label">生命</span>
            <div className="hud__bar-track">
              <i className="hud__bar-fill hud__bar-fill--hp" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hud__bar-num">
              {vitals.hp}/{vitals.maxHp}
            </span>
          </div>
          {vitals.manaShieldOn && vitals.manaShieldHp > 0 ? (
            <div className="hud__bar hud__bar--shield">
              <span className="hud__bar-label">护盾</span>
              <div className="hud__bar-track">
                <i
                  className="hud__bar-fill hud__bar-fill--shield"
                  style={{
                    width: `${Math.min(100, Math.round((vitals.manaShieldHp / Math.max(vitals.maxRage, 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="hud__bar-num">{vitals.manaShieldHp}</span>
            </div>
          ) : null}
          <div
            className={`hud__bar${vitals.rageWarn ? ' hud__bar--warn' : ''}${
              vitals.lowResource ? ' hud__bar--resource-danger' : ''
            }`}
          >
            <span className="hud__bar-label">{vitals.resourceLabel ?? '怒气'}</span>
            <div className="hud__bar-track">
              <i className="hud__bar-fill hud__bar-fill--rage" style={{ width: `${ragePct}%` }} />
            </div>
            <span className="hud__bar-num">
              {vitals.rage}/{vitals.maxRage}
            </span>
          </div>
          {vitals.classId === 'rogue' ? (
            <div className="hud__combo" aria-label="连击点">
              {Array.from({ length: 5 }, (_, i) => (
                <i
                  key={i}
                  className={
                    i < (vitals.comboPoints ?? 0) ? 'hud__combo-pip hud__combo-pip--on' : 'hud__combo-pip'
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
        {vitals.rageWarn ? (
          <p className="hud__down">{vitals.resourceLabel ?? '怒气'}不足</p>
        ) : null}
        {vitals.tutorialHint ? <p className="hud__tutorial">{vitals.tutorialHint}</p> : null}
        {vitals.levelToast ? <p className="hud__levelup">{vitals.levelToast}</p> : null}
        {vitals.nearbyLootName ? (
          <p
            className={`hud__prompt${
              vitals.nearbyLootTone ? ` hud__prompt--loot-${vitals.nearbyLootTone}` : ''
            }`}
          >
            <kbd>F</kbd> 拾取 {vitals.nearbyLootName}
            {vitals.nearbyLootCompare ? (
              <span className="hud__loot-cmp"> · {vitals.nearbyLootCompare}</span>
            ) : null}
          </p>
        ) : null}
        {vitals.nearbySecretPrompt ? (
          <p className="hud__prompt">
            <kbd>F</kbd> 开启 {vitals.nearbySecretPrompt}
          </p>
        ) : null}
        {!vitals.nearbyLootName && !vitals.nearbySecretPrompt && vitals.nearbyCampPrompt ? (
          <p className="hud__prompt hud__prompt--camp">
            <kbd>F</kbd> {vitals.nearbyCampPrompt}
          </p>
        ) : null}
        {!vitals.nearbyLootName &&
        !vitals.nearbySecretPrompt &&
        !vitals.nearbyCampPrompt &&
        vitals.potionUrge ? (
          <p className="hud__prompt hud__prompt--urge">
            <kbd>R</kbd> 红药 · 生命危急
          </p>
        ) : null}
        {!vitals.nearbyLootName &&
        !vitals.nearbySecretPrompt &&
        !vitals.nearbyCampPrompt &&
        !vitals.potionUrge &&
        vitals.manaPotionUrge ? (
          <p className="hud__prompt hud__prompt--urge hud__prompt--mana">
            <kbd>T</kbd> 蓝药 · {vitals.resourceLabel ?? '资源'}危急
          </p>
        ) : null}
        {!vitals.nearbyLootName &&
        !vitals.nearbySecretPrompt &&
        !vitals.nearbyCampPrompt &&
        !vitals.potionUrge &&
        !vitals.manaPotionUrge &&
        vitals.levelGapWarn ? (
          <p className="hud__prompt hud__prompt--gap">{vitals.levelGapWarn}</p>
        ) : null}
        <div className="hud__save">
          <button type="button" disabled={vitals.awaitRespawn || vitals.dead} onClick={onSave}>
            存档
          </button>
          <button type="button" disabled={vitals.awaitRespawn || vitals.dead} onClick={onLoad}>
            读档
          </button>
          <button type="button" onClick={onBackToClassSelect}>
            选职
          </button>
        </div>
        <ul className="hud__skills">
          {slots.map((slot) => (
            <li
              key={slot.key}
              className={`hud__slot${slot.ready ? '' : ' hud__slot--wait'}${
                slot.urge ? ' hud__slot--urge' : ''
              }${slot.tone === 'life' ? ' hud__slot--life' : ''}${
                slot.tone === 'mana' ? ' hud__slot--mana' : ''
              }`}
            >
              {slot.id ? (
                <SkillIcon id={slot.id} size={38} className="hud__slot-icon" title={slot.name} />
              ) : (
                <span className="hud__slot-icon hud__slot-icon--empty" />
              )}
              {slot.cdRatio > 0 ? (
                <i className="hud__slot-cd" style={{ height: `${Math.min(1, slot.cdRatio) * 100}%` }} />
              ) : null}
              {slot.cdLabel ? <em className="hud__slot-sec">{slot.cdLabel}</em> : null}
              {slot.costLabel ? (
                <em className={`hud__slot-cost${slot.costShort ? ' hud__slot-cost--short' : ''}`}>
                  {slot.costLabel}
                </em>
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
            {vitals.unspentSkill > 0 || vitals.needsSpec || vitals.specNodePickTier !== null ? (
              <em className="hud__dot" />
            ) : null}
          </li>
          <li>
            <kbd>L</kbd>
            图鉴
          </li>
          <li className={vitals.potionUrge ? 'hud__key--urge' : undefined}>
            <kbd>R</kbd>
            红药
            {(vitals.lifePotionCount ?? 0) > 0 ? (
              <em className="hud__count">×{vitals.lifePotionCount}</em>
            ) : null}
          </li>
          <li className={vitals.manaPotionUrge ? 'hud__key--urge hud__key--mana' : undefined}>
            <kbd>T</kbd>
            蓝药
            {(vitals.manaPotionCount ?? 0) > 0 ? (
              <em className="hud__count">×{vitals.manaPotionCount}</em>
            ) : null}
          </li>
          <li>
            <kbd>Esc</kbd>
            暂停
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
          <h2>{vitals.deathCause === 'fall' ? '坠落身亡' : '倒下了'}</h2>
          <p>选择复活地点</p>
          {!vitals.hasBanner ? <p className="death__hint">尚未激活旗帜 · 请回营</p> : null}
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
          <PanelHead
            title="背包"
            onClose={onClosePanel}
            extra={
              <button
                type="button"
                className="inv__sort"
                disabled={vitals.bag.length < 2}
                onClick={() => onSortBag()}
              >
                排序
              </button>
            }
            subtitle={
              <>
                {vitals.bag.length}/{vitals.bagCap ?? 40} ·{' '}
                <span className="inv__gold">
                  <ItemIcon subject="gold" quality="legendary" size={15} /> {vitals.gold}
                </span>
                {(vitals.bagSlotsLeft ?? 99) <= 2 && (vitals.bagSlotsLeft ?? 0) > 0
                  ? ` · 将满（剩 ${vitals.bagSlotsLeft}）`
                  : ''}
                {(vitals.bagSlotsLeft ?? 1) <= 0 ? ' · 已满' : ''}
              </>
            }
          />
          <PanelBody>
          <ul className="inv__list">
            {vitals.bag.length === 0 ? <li className="inv__empty">空空如也</li> : null}
            {vitals.bag.map((item) => {
              const payload = tipFromBag(item);
              const hasTip = hasTipPayload(payload);
              return (
                <li
                  key={item.uid}
                  className={`inv__item ${QUALITY_CLASS[item.quality] ?? ''}${hasTip ? ' inv__item--tip' : ''}`}
                  tabIndex={hasTip ? 0 : undefined}
                  onMouseEnter={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onMouseLeave={() => setFloatTip(null)}
                  onFocus={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onBlur={() => setFloatTip(null)}
                >
                  <ItemIcon
                    defId={item.defId}
                    kind={item.kind}
                    quality={item.quality}
                    size={34}
                    className="item-icon"
                  />
                  <div className="inv__item-body">
                    <strong className="inv__item-name">
                      {item.name}
                      {item.qty > 1 ? ` ×${item.qty}` : ''}
                      {item.equipped ? ' · 已装备' : ''}
                    </strong>
                  </div>
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
                    {item.canDismantle ? (
                      <button type="button" onClick={() => requestDismantle(item.uid)}>
                        {confirmAct?.kind === 'dismantle' && confirmAct.uid === item.uid
                          ? '确认分解'
                          : '分解'}
                      </button>
                    ) : null}
                    {confirmAct?.kind === 'discard' &&
                    confirmAct.uid === item.uid &&
                    item.qty > 1 ? (
                      <QtyStepper
                        value={clampQty(confirmAct.qty, 1, item.qty)}
                        min={1}
                        max={item.qty}
                        onChange={(qty) => setConfirmAct({ kind: 'discard', uid: item.uid, qty })}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="inv__discard"
                      onClick={() => requestDiscard(item.uid, item.qty)}
                    >
                      {confirmAct?.kind === 'discard' && confirmAct.uid === item.uid
                        ? item.qty > 1
                          ? `确认丢弃 ×${clampQty(confirmAct.qty, 1, item.qty)}`
                          : `确认丢弃（约 ${item.sellPrice} 金）`
                        : item.qty > 1
                          ? `丢弃 ×${item.qty}`
                          : '丢弃'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          </PanelBody>
          <p className="inv__hint">
            <kbd>I</kbd> / <kbd>Esc</kbd> 关闭 · 「排序」或暂停里可开自动排序 · 悬停对比当前主手 · 未装备可分解为材料 ·
            丢弃需再点确认（堆叠可调数量，不退金） · <kbd>R</kbd> 红药 / <kbd>T</kbd> 蓝药
          </p>
        </div>
      ) : null}

      {floatTip ? (
        <div
          className={`inv__float-tip ${QUALITY_CLASS[floatTip.payload.quality] ?? ''}`}
          role="tooltip"
          style={{ left: floatTip.left, top: floatTip.top }}
        >
          <div className="inv__float-tip-head">
            <ItemIcon
              defId={floatTip.payload.defId}
              kind={floatTip.payload.kind}
              quality={floatTip.payload.quality}
              size={40}
            />
            <strong className="inv__float-tip-name">{floatTip.payload.name}</strong>
          </div>
          {floatTip.payload.stats.length > 0 ? (
            <ul className="inv__stats">
              {floatTip.payload.stats.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {floatTip.payload.compare.length > 0 ? (
            <ul className="inv__compare">
              {floatTip.payload.compare.map((line) => (
                <li
                  key={line.text}
                  className={`inv__compare-line inv__compare-line--${line.tone}`}
                >
                  {line.text}
                </li>
              ))}
            </ul>
          ) : null}
          {floatTip.payload.traits.length > 0 ? (
            <p className="inv__traits">
              {floatTip.payload.traits.map((t) => (
                <span key={t} className="inv__trait">
                  {t}
                </span>
              ))}
            </p>
          ) : null}
          {floatTip.payload.detail ? (
            <p className="inv__detail">{floatTip.payload.detail}</p>
          ) : null}
        </div>
      ) : null}

      {vitals.settingsOpen ? (
        <div className="inv inv--settings" role="dialog" aria-label="暂停">
          <PanelHead title="暂停" subtitle="世界已冻结" onClose={onClosePause} />
          <PanelBody>
          <div className="panel__actions" style={{ marginBottom: 12 }}>
            <button type="button" className="panel__primary" onClick={onClosePause}>
              继续
            </button>
            <button type="button" className="death__btn" onClick={onPauseOpenChar}>
              加点 <kbd>C</kbd>
            </button>
            <button type="button" className="death__btn" onClick={onPauseOpenSkills}>
              技能 <kbd>K</kbd>
            </button>
          </div>
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
            <label className="settings__row">
              <span>伤害飘字</span>
              <input
                type="checkbox"
                checked={gameplay.showDamageNumbers}
                onChange={(e) => onSetGameplay({ showDamageNumbers: e.target.checked })}
              />
            </label>
            <label className="settings__row">
              <span>打开背包自动排序</span>
              <input
                type="checkbox"
                checked={gameplay.autoSortBagOnOpen}
                onChange={(e) => onSetGameplay({ autoSortBagOnOpen: e.target.checked })}
              />
            </label>
            <label className="settings__row">
              <span>自动拾取材料/药水</span>
              <input
                type="checkbox"
                checked={gameplay.autoPickupConsumables}
                onChange={(e) => onSetGameplay({ autoPickupConsumables: e.target.checked })}
              />
            </label>
            <div className="settings__row">
              <span>角色</span>
              <button type="button" className="settings__btn" onClick={onBackToClassSelect}>
                返回选职
              </button>
            </div>
          </div>
          <h3 className="settings__sub">操作键位</h3>
          <ul className="settings__keys" aria-label="操作键位">
            {CONTROL_HELP.map((row) => (
              <li key={row.keys}>
                <kbd>{row.keys}</kbd>
                <span>{row.action}</span>
              </li>
            ))}
          </ul>
          </PanelBody>
          <p className="inv__hint">
            <kbd>Esc</kbd> / <kbd>O</kbd> 继续 · 换区 / BOSS / 复活会自动存档
          </p>
        </div>
      ) : null}

      {vitals.catalogOpen ? (
        <div className="inv inv--catalog">
          <PanelHead
            title="橙装图鉴"
            onClose={onClosePanel}
            subtitle={
              <>
                已发现 {(vitals.legendaryCatalog ?? []).filter((e) => e.discovered).length}/
                {(vitals.legendaryCatalog ?? []).length}
              </>
            }
          />
          <PanelBody>
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
          </PanelBody>
          <p className="inv__hint">
            BOSS 掉落概率出橙装；换区重进可反复刷。
            <kbd>L</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.charOpen ? (
        <div className="panel panel--char">
          <PanelHead
            title={`角色 · Lv.${vitals.level}`}
            subtitle={`可分配 ${vitals.draftLeft}`}
            onClose={onClosePanel}
          />
          <PanelBody>
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
          </PanelBody>
          <p className="inv__hint">
            <kbd>C</kbd> / <kbd>Esc</kbd> 关闭 · 先点 + 预览，再确认
          </p>
        </div>
      ) : null}

      {vitals.levelUpOpen && !vitals.specPickOpen && vitals.specNodePickTier === null ? (
        <div className="levelup-prompt" role="dialog" aria-label="升级加点">
          <button
            type="button"
            className="panel__close panel__close--float"
            aria-label="关闭"
            onClick={onDismissLevelUp}
          >
            ×
          </button>
          <p className="levelup-prompt__kicker">升级</p>
          <h2 className="levelup-prompt__title">Lv.{vitals.level}</h2>
          <p className="levelup-prompt__gain">
            +{vitals.levelUpGainAttr} 属性点 · +{vitals.levelUpGainSkill} 技能点
          </p>
          <p className="levelup-prompt__hint">点数会保留，可随时按 C / K 分配</p>
          <div className="levelup-prompt__actions">
            <button type="button" className="panel__primary" onClick={onLevelUpAttrs}>
              去加点
            </button>
            <button type="button" className="death__btn" onClick={onLevelUpSkills}>
              去技能
            </button>
            <button type="button" className="death__btn" onClick={onDismissLevelUp}>
              稍后
            </button>
          </div>
          <p className="inv__hint">
            <kbd>Esc</kbd> 稍后
          </p>
        </div>
      ) : null}

      {vitals.specPickOpen ? (
        <div className="panel panel--spec">
          <PanelHead title="选择专精" subtitle="Lv.10 · 三选一" onClose={onClosePanel} />
          <PanelBody>
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
          </PanelBody>
          <p className="inv__hint">
            <kbd>Esc</kbd> 稍后选择 · 未选前 K 会提示
          </p>
        </div>
      ) : null}

      {vitals.specNodePickTier !== null ? (
        <div className="panel panel--spec">
          <PanelHead
            title="专精节点"
            subtitle={`Lv.${vitals.specNodePickTier} · ${vitals.specName ?? '专精'} · 三选一`}
            onClose={onClosePanel}
          />
          <PanelBody>
          <ul className="spec__list">
            {vitals.specNodeOptions.map((node) => (
              <li key={node.id} className="spec__card">
                <div className="spec__title">
                  <b>{node.name}</b>
                </div>
                <ul className="spec__effects">
                  <li>{node.desc}</li>
                </ul>
                <button
                  type="button"
                  className="panel__primary"
                  onClick={() => onPickSpecNode(node.id)}
                >
                  选择
                </button>
              </li>
            ))}
          </ul>
          </PanelBody>
          <p className="inv__hint">
            <kbd>Esc</kbd> 稍后选择 · 可在技能面板查看已选节点
          </p>
        </div>
      ) : null}

      {vitals.skillOpen ? (
        <div className="panel panel--skill">
          <PanelHead title="技能" subtitle={`技能点 ${vitals.unspentSkill}`} onClose={onClosePanel} />
          <PanelBody>
          <p className="spec__current">
            专精：{vitals.specName ?? (vitals.needsSpec ? '未选择' : '未解锁')}
          </p>
          {vitals.specNodePicks.length > 0 ? (
            <ul className="spec__effects spec__effects--picks">
              {vitals.specNodePicks.map((n) => (
                <li key={`${n.tier}-${n.name}`}>
                  Lv.{n.tier} · {n.name}：{n.desc}
                </li>
              ))}
            </ul>
          ) : null}
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
              <li
                key={skill.id}
                className={`skill__row${!skill.learned ? ' skill__row--locked' : ''}${skill.upcoming ? ' skill__row--upcoming' : ''}${skill.barLabel ? ' skill__row--onbar' : ''}`}
              >
                <SkillIcon id={skill.id} size={32} className="skill__row-icon" title={skill.name} />
                <div>
                  <b>
                    {skill.name}
                    {skill.learned ? ` · ${skill.level}/5` : ` · 需求 Lv.${skill.reqLevel ?? 1}`}
                    {skill.barLabel ? ` · ${skill.barLabel}` : ''}
                  </b>
                  <small>{skill.desc}</small>
                  {skill.compare.length > 0 ? (
                    <ul className="inv__compare skill__compare">
                      {skill.compare.map((line) => (
                        <li
                          key={line.text}
                          className={`inv__compare-line inv__compare-line--${line.tone}`}
                        >
                          {line.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {skill.learned && !skill.upcoming ? (
                    <div className="skill__slots">
                      {[0, 1, 2, 3].map((slot) => {
                        const label = slot === 0 ? 'Q' : slot === 1 ? 'E' : slot === 2 ? '1' : '2';
                        const active = skill.barSlot === slot;
                        return (
                          <button
                            key={label}
                            type="button"
                            className={`skill__slot-btn${active ? ' skill__slot-btn--on' : ''}`}
                            onClick={() => onAssignSkillBar(skill.id, slot)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {skill.upcoming ? (
                  <button type="button" disabled>
                    即将开放
                  </button>
                ) : !skill.learned ? (
                  <button
                    type="button"
                    disabled={!skill.canLearn}
                    onClick={() => onLearnSkill(skill.id)}
                  >
                    学习 ({skill.learnCost ?? 1})
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!skill.canUpgrade}
                    onClick={() => onUpgradeSkill(skill.id)}
                  >
                    升级{skill.cost > 0 ? ` (${skill.cost})` : ''}
                  </button>
                )}
              </li>
            ))}
          </ul>
          </PanelBody>
          <p className="inv__hint">
            <kbd>K</kbd> / <kbd>Esc</kbd> 关闭 · 点 Q/E/1/2 换栏 · 对比相对 Q 栏
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'merchant' ||
      vitals.campOpen === 'apothecary' ||
      vitals.campOpen === 'weaponsmith' ? (
        <div className="panel panel--camp">
          <PanelHead
            title={
              vitals.campOpen === 'apothecary'
                ? '药水商人'
                : vitals.campOpen === 'weaponsmith'
                  ? '武器商人'
                  : '杂货商人'
            }
            onClose={onClosePanel}
            subtitle={
              <span className="inv__gold">
                <ItemIcon subject="gold" quality="legendary" size={15} /> {vitals.gold}
              </span>
            }
          />
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <div className="camp__tabs" role="tablist" aria-label="买卖">
            <button
              type="button"
              role="tab"
              aria-selected={shopTab === 'buy'}
              className={`camp__tab${shopTab === 'buy' ? ' camp__tab--on' : ''}`}
              onClick={() => {
                setShopTab('buy');
                setConfirmAct(null);
              }}
            >
              购买
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={shopTab === 'sell'}
              className={`camp__tab${shopTab === 'sell' ? ' camp__tab--on' : ''}`}
              onClick={() => {
                setShopTab('sell');
                setConfirmAct(null);
              }}
            >
              出售
            </button>
          </div>
          <PanelBody>
          {shopTab === 'buy' ? (
          <ul className="skill__list">
            {vitals.shopStock.map((row) => {
              const payload = tipFromShop(row);
              const hasTip = hasTipPayload(payload);
              const maxBuy = Math.max(0, row.buyMax);
              const qty = clampQty(buyQty[row.defId] ?? 1, 1, Math.max(1, maxBuy));
              const total = row.price * (row.canBuyBulk ? qty : 1);
              return (
                <li
                  key={row.defId}
                  className={`skill__row skill__row--shop ${QUALITY_CLASS[row.quality] ?? ''}${hasTip ? ' inv__item--tip' : ''}`}
                  tabIndex={hasTip ? 0 : undefined}
                  onMouseEnter={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onMouseLeave={() => setFloatTip(null)}
                  onFocus={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onBlur={() => setFloatTip(null)}
                >
                  <ItemIcon
                    defId={row.defId}
                    kind={row.kind}
                    quality={row.quality}
                    size={32}
                    className="item-icon"
                  />
                  <span className="inv__item-name">
                    {row.name}
                    {row.ownedQty > 0 ? (
                      <small className="camp__owned">已有 ×{row.ownedQty}</small>
                    ) : null}
                  </span>
                  <span className="camp__buy">
                    {row.canBuyBulk && maxBuy > 1 ? (
                      <QtyStepper
                        value={qty}
                        min={1}
                        max={maxBuy}
                        onChange={(n) => setBuyQty((prev) => ({ ...prev, [row.defId]: n }))}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onBuy(row.defId, row.canBuyBulk ? qty : 1)}
                    >
                      {row.canBuyBulk && qty > 1
                        ? `购买 ×${qty} · ${total} 金`
                        : `×1 · ${row.price} 金`}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          ) : null}
          {shopTab === 'sell' ? (
            <>
          {vitals.campOpen === 'merchant' ? (
          <div className="panel__actions" style={{ marginBottom: 8 }}>
            <button
              type="button"
              className="panel__primary"
              disabled={(vitals.materialsSell?.stacks ?? 0) <= 0}
              onClick={() => requestSellMaterials()}
            >
              {confirmAct?.kind === 'sell-mats'
                ? `确认出售材料 ${vitals.materialsSell?.gold ?? 0} 金`
                : `一键出售材料${
                    (vitals.materialsSell?.units ?? 0) > 0
                      ? `（${vitals.materialsSell.units} 件 · ${vitals.materialsSell.gold} 金）`
                      : ''
                  }`}
            </button>
            <button
              type="button"
              disabled={(vitals.commonGearSell?.stacks ?? 0) <= 0}
              onClick={() => requestSellCommonGear()}
            >
              {confirmAct?.kind === 'sell-white'
                ? `确认出售白装 ${vitals.commonGearSell?.gold ?? 0} 金`
                : `一键出售白装${
                    (vitals.commonGearSell?.units ?? 0) > 0
                      ? `（${vitals.commonGearSell.units} 件 · ${vitals.commonGearSell.gold} 金）`
                      : ''
                  }`}
            </button>
            <button
              type="button"
              disabled={(vitals.uncommonGearSell?.stacks ?? 0) <= 0}
              onClick={() => requestSellUncommonGear()}
            >
              {confirmAct?.kind === 'sell-green'
                ? `确认出售绿装 ${vitals.uncommonGearSell?.gold ?? 0} 金`
                : `一键出售绿装${
                    (vitals.uncommonGearSell?.units ?? 0) > 0
                      ? `（${vitals.uncommonGearSell.units} 件 · ${vitals.uncommonGearSell.gold} 金）`
                      : ''
                  }`}
            </button>
            <button
              type="button"
              disabled={(vitals.rareGearSell?.stacks ?? 0) <= 0}
              onClick={() => requestSellRareGear()}
            >
              {confirmAct?.kind === 'sell-blue'
                ? `确认出售蓝装 ${vitals.rareGearSell?.gold ?? 0} 金`
                : `一键出售蓝装${
                    (vitals.rareGearSell?.units ?? 0) > 0
                      ? `（${vitals.rareGearSell.units} 件 · ${vitals.rareGearSell.gold} 金）`
                      : ''
                  }`}
            </button>
          </div>
          ) : null}
          <ul className="skill__list">
            {vitals.bag
              .filter((item) => {
                if (vitals.campOpen === 'weaponsmith') {
                  return item.kind === 'gear';
                }
                if (vitals.campOpen === 'apothecary') {
                  return item.kind === 'potion';
                }
                return true;
              })
              .map((item) => {
              const payload = tipFromBag(item);
              const hasTip = hasTipPayload(payload);
              return (
                <li
                  key={item.uid}
                  className={`skill__row skill__row--shop ${QUALITY_CLASS[item.quality] ?? ''}${hasTip ? ' inv__item--tip' : ''}`}
                  tabIndex={hasTip ? 0 : undefined}
                  onMouseEnter={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onMouseLeave={() => setFloatTip(null)}
                  onFocus={(e) => {
                    if (hasTip) {
                      placeFloatTip(e.currentTarget, payload);
                    }
                  }}
                  onBlur={() => setFloatTip(null)}
                >
                  <ItemIcon
                    defId={item.defId}
                    kind={item.kind}
                    quality={item.quality}
                    size={32}
                    className="item-icon"
                  />
                  <span className="inv__item-name">
                    {item.name}
                    {item.qty > 1 ? ` ×${item.qty}` : ''}
                    {item.equipped ? ' · 装备中' : ''}
                  </span>
                  {confirmAct?.kind === 'sell' && confirmAct.uid === item.uid && item.qty > 1 ? (
                    <QtyStepper
                      value={clampQty(confirmAct.qty, 1, item.qty)}
                      min={1}
                      max={item.qty}
                      onChange={(qty) => setConfirmAct({ kind: 'sell', uid: item.uid, qty })}
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={item.equipped}
                    onClick={() => requestSell(item.uid, item.qty)}
                  >
                    {confirmAct?.kind === 'sell' && confirmAct.uid === item.uid
                      ? `确认卖出 ×${clampQty(confirmAct.qty, 1, item.qty)} · ${
                          item.sellPrice * clampQty(confirmAct.qty, 1, item.qty)
                        } 金`
                      : item.qty > 1
                        ? `卖出 ×${item.qty} · ${item.sellPrice * item.qty} 金`
                        : `卖出 ${item.sellPrice} 金`}
                  </button>
                </li>
              );
            })}
            {vitals.bag.filter((item) => {
              if (vitals.campOpen === 'weaponsmith') {
                return item.kind === 'gear';
              }
              if (vitals.campOpen === 'apothecary') {
                return item.kind === 'potion';
              }
              return true;
            }).length === 0 ? (
              <li className="inv__empty">没有可出售的物品</li>
            ) : null}
          </ul>
            </>
          ) : null}
          </PanelBody>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
            {vitals.campOpen === 'apothecary'
              ? ' · 切换出售可卖药水 · 买入受堆叠上限'
              : vitals.campOpen === 'weaponsmith'
                ? ' · 库存随等级刷新 · 可回收未装备武器'
                : ' · 材料可调数量买卖 · 一键卖至蓝装需确认 · 紫/橙仍逐件卖'}
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'blacksmith' ? (
        <div className="panel panel--camp">
          <PanelHead
            title="铁匠"
            onClose={onClosePanel}
            subtitle={
              <>
                强化 +{vitals.weaponEnhance}/8
                {vitals.weaponDur !== null
                  ? ` · 耐久 ${vitals.weaponDur}/${vitals.weaponMaxDur}`
                  : ''}
              </>
            }
          />
          <PanelBody>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <p className="camp__desc">
            强化：消耗 {vitals.enhanceCost} 金 + 1 任意材料（材料 {vitals.enhanceMats}）
            {vitals.weaponEnhance < 8
              ? ` · 成功率 ${vitals.enhanceSuccessPct}%`
              : ''}
            · 失败只耗材料不掉级。
          </p>
          <p className="camp__desc">
            修理：
            {vitals.weaponDur === null
              ? '先装备主手'
              : vitals.repairCost <= 0
                ? '主手完好'
                : vitals.repairUsesMat
                  ? `花费 ${vitals.repairCost} 金 + 1 材料（原价 ${vitals.repairCostFull} 金）`
                  : `花费 ${vitals.repairCost} 金（带材料可约六折）`}
            。死亡会损耗耐久；破损后攻击大幅下降。未装备装备可在背包分解为碎材（蓝装以上另得魔法尘）。
          </p>
          <div className="panel__actions">
            <button
              type="button"
              className="panel__primary"
              disabled={!vitals.canEnhance}
              onClick={onEnhance}
            >
              {vitals.weaponEnhance >= 8 ? '已达上限' : '强化主手'}
            </button>
            <button
              type="button"
              className="panel__primary"
              disabled={!vitals.canRepair}
              onClick={onRepair}
            >
              {vitals.repairCost <= 0
                ? '无需修理'
                : vitals.repairUsesMat
                  ? `修理（${vitals.repairCost} 金 + 材料）`
                  : `修理（${vitals.repairCost} 金）`}
            </button>
          </div>
          </PanelBody>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'trainer' ? (
        <div className="panel panel--camp">
          <PanelHead title="训练师" subtitle="重置加点" onClose={onClosePanel} />
          <PanelBody>
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
          </PanelBody>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'challenge' ? (
        <div className="panel panel--camp">
          <PanelHead title="词缀试炼" subtitle="限时清精英 · 层层攀升刷材料" onClose={onClosePanel} />
          <PanelBody>
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <p className="inv__hint">
            最高通关：第 {vitals.challengeBestFloor} 层
          </p>
          <p className="inv__hint">{CHALLENGE_HINT}</p>
          <div className="panel__actions">
            <button type="button" className="panel__primary" onClick={onStartChallenge}>
              开始挑战（第 1 层 · {CHALLENGE_DURATION}s）
            </button>
          </div>
          </PanelBody>
          <p className="inv__hint">
            <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
          </p>
        </div>
      ) : null}

      {vitals.campOpen === 'teleport' ? (
        <div className="panel panel--camp panel--worldmap" role="dialog" aria-label="世界地图">
          <PanelHead
            className="worldmap__head"
            title="世界地图"
            onClose={onClosePanel}
            subtitle={
              <>
                烬土大陆 · 传送阵
                {vitals.ngPlusLevel > 0 ? ` · NG+${vitals.ngPlusLevel}` : ''}
              </>
            }
          />
          {vitals.campMessage ? <p className="camp__msg">{vitals.campMessage}</p> : null}
          <div className="worldmap worldmap--atlas" role="list">
            <div className="worldmap__terrain" aria-hidden>
              <picture>
                <source srcSet="/maps/ember-continent.webp" type="image/webp" />
                <img
                  className="worldmap__art"
                  src="/maps/ember-continent.png"
                  alt=""
                  draggable={false}
                />
              </picture>
            </div>
            <svg
              className="worldmap__flight"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              {ZONE_FLIGHT_EDGES.map(([fromId, toId]) => {
                const from = ZONE_MAP_POS[fromId];
                const to = ZONE_MAP_POS[toId];
                const fromNode = worldNodeById.get(fromId);
                const toNode = worldNodeById.get(toId);
                if (!from || !to) {
                  return null;
                }
                const lit = Boolean(fromNode?.unlocked && toNode?.unlocked);
                const half = Boolean(fromNode?.unlocked && !toNode?.unlocked);
                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={
                      lit
                        ? 'worldmap__path worldmap__path--open'
                        : half
                          ? 'worldmap__path worldmap__path--next'
                          : 'worldmap__path'
                    }
                  />
                );
              })}
            </svg>
            {worldMapNodes.map((node) => {
              const pos = ZONE_MAP_POS[node.zoneId] ?? { x: 50, y: 50 };
              const isHub = node.zoneId === 'a01';
              return (
                <button
                  key={node.zoneId}
                  type="button"
                  role="listitem"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={[
                    'worldmap__pin',
                    isHub ? 'worldmap__pin--hub' : '',
                    node.unlocked ? 'worldmap__pin--open' : 'worldmap__pin--locked',
                    node.current ? 'worldmap__pin--here' : '',
                    node.bossCleared ? 'worldmap__pin--cleared' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={!node.unlocked || !node.travelId}
                  title={node.lockHint}
                  onClick={() => {
                    if (node.travelId) {
                      onTeleport(node.travelId);
                    }
                  }}
                >
                  <i className="worldmap__pin-dot" aria-hidden />
                  {node.current ? <em className="worldmap__you">你在此处</em> : null}
                  <span className="worldmap__pin-name">
                    {isHub ? '烬营' : node.name}
                  </span>
                  <span className="worldmap__pin-meta">
                    {node.zoneId.toUpperCase()} · {node.levelMin}–{node.levelMax}
                  </span>
                  {!node.unlocked ? (
                    <span className="worldmap__pin-lock">{node.lockHint}</span>
                  ) : node.bossCleared ? (
                    <span className="worldmap__pin-clear">已肃清</span>
                  ) : null}
                </button>
              );
            })}
            <p className="worldmap__legend" aria-hidden>
              <span className="worldmap__legend-item worldmap__legend-item--open">已解锁</span>
              <span className="worldmap__legend-item worldmap__legend-item--path">航线</span>
              <span className="worldmap__legend-item worldmap__legend-item--lock">未探索</span>
            </p>
          </div>
          <footer className="worldmap__dock">
            <p className="inv__hint worldmap__dock-label">区内落点</p>
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
                <button type="button" className="panel__primary panel__primary--ng" onClick={onStartNgPlus}>
                  开启新周目 NG+{(vitals.ngPlusLevel ?? 0) + 1}
                </button>
              ) : null}
            </div>
            <p className="inv__hint">
              {vitals.canStartNgPlus
                ? '击败终焉君王后可用：保留装备成长，怪物更强、掉落淬炼更好；开启后烬灰披风点亮并自动存档'
                : vitals.ngPlusLevel > 0
                  ? '烬灰披风已点亮 · 掉落装备可带周目淬炼'
                  : '点击地图钉点传送至区域入口；击败 BOSS 后区内落点含「门前」'}
              <br />
              <kbd>F</kbd> / <kbd>Esc</kbd> 关闭
            </p>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
