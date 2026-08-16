import { useState } from 'react';
import { CLASS_DEFS, type PlayerClassId } from '../game/data/classes';
import { peekSaveSummary, type SaveSummary } from '../game/systems/save';
import './class-select.css';

type Props = {
  onSelect: (classId: PlayerClassId) => void;
  onContinue?: () => void;
  hasSave: boolean;
};

const ORDER: PlayerClassId[] = ['warrior', 'mage', 'hunter', 'rogue'];

export function ClassSelect({ onSelect, onContinue, hasSave }: Props): JSX.Element {
  const [pendingClass, setPendingClass] = useState<PlayerClassId | null>(null);
  const [saveSummary] = useState<SaveSummary | null>(() =>
    hasSave ? peekSaveSummary() : null,
  );

  const requestSelect = (classId: PlayerClassId): void => {
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
      <div className="class-select__panel">
        <p className="class-select__kicker">烬营远征 · 阶段 93</p>
        <h1 className="class-select__title">选择职业</h1>
        <p className="class-select__lead">
          四职业齐全；一期仅一份存档。开新档会覆盖上次进度。
        </p>
        <div className="class-select__grid">
          {ORDER.map((id) => {
            const def = CLASS_DEFS[id];
            return (
              <button
                key={id}
                type="button"
                className={`class-select__card class-select__card--${id}`}
                onClick={() => requestSelect(id)}
              >
                <span className="class-select__name">{def.name}</span>
                <span className="class-select__tag">{def.tagline}</span>
                <span className="class-select__res">{def.resourceLabel}</span>
              </button>
            );
          })}
        </div>
        {hasSave && onContinue ? (
          <button type="button" className="class-select__continue" onClick={onContinue}>
            继续上次存档
          </button>
        ) : null}
      </div>

      {pendingClass ? (
        <div className="class-select__confirm" role="dialog" aria-modal="true" aria-labelledby="new-game-confirm-title">
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
              <button type="button" className="class-select__confirm-danger" onClick={confirmNew}>
                确认开新档
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
