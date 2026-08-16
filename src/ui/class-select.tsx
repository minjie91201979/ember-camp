import { CLASS_DEFS, type PlayerClassId } from '../game/data/classes';
import './class-select.css';

type Props = {
  onSelect: (classId: PlayerClassId) => void;
  onContinue?: () => void;
  hasSave: boolean;
};

const ORDER: PlayerClassId[] = ['warrior', 'mage', 'hunter', 'rogue'];

export function ClassSelect({ onSelect, onContinue, hasSave }: Props): JSX.Element {
  return (
    <div className="class-select">
      <div className="class-select__panel">
        <p className="class-select__kicker">烬营远征 · 阶段 87</p>
        <h1 className="class-select__title">选择职业</h1>
        <p className="class-select__lead">
          四职业齐全；20/30/40/50/60 级各可选一档专精节点强化 build。
        </p>
        <div className="class-select__grid">
          {ORDER.map((id) => {
            const def = CLASS_DEFS[id];
            return (
              <button
                key={id}
                type="button"
                className={`class-select__card class-select__card--${id}`}
                onClick={() => onSelect(id)}
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
    </div>
  );
}
