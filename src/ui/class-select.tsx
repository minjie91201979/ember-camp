import { useState, type CSSProperties } from 'react';
import { CLASS_DEFS, type PlayerClassId } from '../game/data/classes';
import { peekSaveSummary, type SaveSummary } from '../game/systems/save';
import { ClassModelPreview } from './class-model-preview';
import { SkillIcon } from './item-icon';
import './class-select.css';

type Props = {
  onSelect: (classId: PlayerClassId) => void;
  onContinue?: () => void;
  hasSave: boolean;
};

const ORDER: PlayerClassId[] = ['warrior', 'mage', 'hunter', 'rogue', 'paladin'];

/** 职业 UI 主色（驱动边框/属性条/按钮，3D 模型本身已自带材质配色）。 */
const ACCENT: Record<PlayerClassId, string> = {
  warrior: '#e0593a',
  mage: '#2bb6a0',
  hunter: '#c08a3e',
  rogue: '#9b7bd0',
  paladin: '#e3c069',
};

/** 左栏职业头像使用的代表性技能图标（与游戏内图标体系一致）。 */
const ROSTER_ICON: Record<PlayerClassId, string> = {
  warrior: 'slam',
  mage: 'fireball',
  hunter: 'aimed-shot',
  rogue: 'shadow-strike',
  paladin: 'judgment',
};

const ATTR_LABEL: Record<'str' | 'agi' | 'int' | 'vit' | 'spi', string> = {
  str: '力量',
  agi: '敏捷',
  int: '智力',
  vit: '体力',
  spi: '精神',
};

const ATTR_MAX = 14;

export function ClassSelect({ onSelect, onContinue, hasSave }: Props): JSX.Element {
  const [focus, setFocus] = useState<PlayerClassId>('warrior');
  const [pendingClass, setPendingClass] = useState<PlayerClassId | null>(null);
  const [saveSummary] = useState<SaveSummary | null>(() =>
    hasSave ? peekSaveSummary() : null,
  );

  const def = CLASS_DEFS[focus];
  const accent = ACCENT[focus];

  const requestSelect = (classId: PlayerClassId): void => {
    setFocus(classId);
    if (hasSave) {
      setPendingClass(classId);
      return;
    }
    onSelect(classId);
  };

  const confirmNew = (): void => {
    if (!pendingClass) {
      return;
    }
    const id = pendingClass;
    setPendingClass(null);
    onSelect(id);
  };

  return (
    <div className="class-select">
      <div className="class-select__stage">
        <header className="class-select__head">
          <p className="class-select__kicker">烬营远征 · 阶段 93</p>
          <h1 className="class-select__title">铸就你的英雄</h1>
          <p className="class-select__lead">
            五大职业 · 一份存档。悬停预览，选定后踏入余烬之地。
          </p>
        </header>

        <div className="class-select__main">
          <aside className="class-select__roster">
            <p className="class-select__roster-title">选择职业</p>
            {ORDER.map((id) => {
              const d = CLASS_DEFS[id];
              const active = id === focus;
              return (
                <button
                  key={id}
                  type="button"
                  className={`class-select__card class-select__card--${id}${
                    active ? ' is-active' : ''
                  }`}
                  style={{ '--accent': ACCENT[id] } as CSSProperties}
                  onMouseEnter={() => setFocus(id)}
                  onFocus={() => setFocus(id)}
                  onClick={() => requestSelect(id)}
                  aria-pressed={active}
                >
                  <SkillIcon
                    id={ROSTER_ICON[id]}
                    size={38}
                    className="class-select__card-icon"
                    title={d.name}
                  />
                  <span className="class-select__card-name">
                    {d.name}
                    {id === 'paladin' ? (
                      <span className="class-select__card-new">新</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </aside>

          <section
            className="class-select__model"
            style={{ '--accent': accent } as CSSProperties}
          >
            <ClassModelPreview classId={focus} />
            <span className="class-select__model-hint">点击左栏切换职业预览</span>
          </section>

          <section
            className="class-select__detail"
            style={{ '--accent': accent } as CSSProperties}
          >
            <div className="class-select__crest">
              <span className="class-select__name">{def.name}</span>
              {focus === 'paladin' ? (
                <span className="class-select__badge">新职业</span>
              ) : null}
            </div>
            <p className="class-select__tag">{def.tagline}</p>
            <span className="class-select__res">资源 · {def.resourceLabel}</span>

            <div className="class-select__attrs">
              {(['str', 'agi', 'int', 'vit', 'spi'] as const).map((key) => {
                const v = def.base[key];
                return (
                  <div className="class-select__attr" key={key}>
                    <span className="class-select__attr-label">{ATTR_LABEL[key]}</span>
                    <span className="class-select__attr-track">
                      <span
                        className="class-select__attr-fill"
                        style={{ width: `${Math.round((v / ATTR_MAX) * 100)}%` }}
                      />
                    </span>
                    <span className="class-select__attr-val">{v}</span>
                  </div>
                );
              })}
            </div>

            <div className="class-select__meta">
              <div>
                <span className="class-select__meta-k">起始武器</span>
                <span className="class-select__meta-v">{def.starterWeapon}</span>
              </div>
              <div>
                <span className="class-select__meta-k">推荐加点</span>
                <span className="class-select__meta-v">
                  {def.recommendCycle.map((c) => ATTR_LABEL[c]).join(' · ')}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="class-select__enter"
              onClick={() => requestSelect(focus)}
            >
              进入营地 →
            </button>
          </section>
        </div>

        {hasSave && onContinue ? (
          <button type="button" className="class-select__continue" onClick={onContinue}>
            继续上次存档
          </button>
        ) : null}
      </div>

      {pendingClass ? (
        <div
          className="class-select__confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-game-confirm-title"
        >
          <div className="class-select__confirm-card">
            <h2 id="new-game-confirm-title">覆盖存档？</h2>
            <p>
              将以 <b>{CLASS_DEFS[pendingClass].name}</b> 开新档，并覆盖当前唯一存档。
            </p>
            {saveSummary ? (
              <p className="class-select__confirm-save">
                当前存档：{saveSummary.className} · Lv.{saveSummary.level}
                {saveSummary.ngPlusLevel > 0 ? ` · NG+${saveSummary.ngPlusLevel}` : ''}
                <br />
                位置：{saveSummary.zoneName}
              </p>
            ) : (
              <p className="class-select__confirm-save">检测到已有存档，开新档后无法恢复。</p>
            )}
            <div className="class-select__confirm-actions">
              <button type="button" onClick={() => setPendingClass(null)}>
                取消
              </button>
              <button
                type="button"
                className="class-select__confirm-danger"
                onClick={confirmNew}
              >
                确认开新档
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
