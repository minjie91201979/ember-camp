import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '../game/game';
import type { VirtualAction } from '../input/keyboard';
import './touch-controls.css';

type Props = {
  gameRef: React.MutableRefObject<Game | null>;
  visible: boolean;
};

type SkillBtn = {
  id: VirtualAction;
  label: string;
};

const SKILLS: SkillBtn[] = [
  { id: 'slam', label: 'Q' },
  { id: 'bash', label: 'E' },
  { id: 'skill3', label: '1' },
  { id: 'skill4', label: '2' },
];

const UTIL: SkillBtn[] = [
  { id: 'roll', label: '翻' },
  { id: 'interact', label: '交互' },
  { id: 'potion', label: '红' },
  { id: 'manaPotion', label: '蓝' },
];

const MENU: SkillBtn[] = [
  { id: 'inventory', label: '包' },
  { id: 'character', label: '角' },
  { id: 'skills', label: '技' },
  { id: 'settings', label: '菜单' },
];

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 900px)').matches ||
    'ontouchstart' in window
  );
}

export function TouchControls({ gameRef, visible }: Props): JSX.Element | null {
  const [show, setShow] = useState(false);
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const sync = (): void => setShow(isCoarsePointer());
    sync();
    const mq = window.matchMedia('(pointer: coarse)');
    mq.addEventListener?.('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      mq.removeEventListener?.('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const setMove = useCallback(
    (x: number) => {
      gameRef.current?.getKeyboard().setVirtualMove(x);
    },
    [gameRef],
  );

  const pulse = useCallback(
    (action: VirtualAction) => {
      gameRef.current?.getKeyboard().pulseVirtual(action);
    },
    [gameRef],
  );

  const updateStick = useCallback(
    (clientX: number, clientY: number) => {
      const el = stickRef.current;
      const knob = knobRef.current;
      if (!el || !knob) {
        return;
      }
      const max = el.clientWidth * 0.38;
      let dx = clientX - origin.current.x;
      let dy = clientY - origin.current.y;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / max;
      setMove(Math.abs(nx) < 0.2 ? 0 : nx);
    },
    [setMove],
  );

  const endStick = useCallback(() => {
    touchId.current = null;
    const knob = knobRef.current;
    if (knob) {
      knob.style.transform = 'translate(0px, 0px)';
    }
    setMove(0);
  }, [setMove]);

  const onStickStart = (e: React.PointerEvent): void => {
    if (touchId.current !== null) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const el = stickRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    touchId.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    updateStick(e.clientX, e.clientY);
  };

  const onStickMove = (e: React.PointerEvent): void => {
    if (touchId.current !== e.pointerId) {
      return;
    }
    e.preventDefault();
    updateStick(e.clientX, e.clientY);
  };

  const onStickEnd = (e: React.PointerEvent): void => {
    if (touchId.current !== e.pointerId) {
      return;
    }
    e.preventDefault();
    endStick();
  };

  if (!visible || !show) {
    return null;
  }

  return (
    <div className="touch-overlay" aria-hidden>
      <div className="touch-menu">
        {MENU.map((s) => (
          <button
            key={s.id}
            type="button"
            className="touch-btn touch-menu-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pulse(s.id);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        className="touch-stick"
        ref={stickRef}
        onPointerDown={onStickStart}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
      >
        <div className="touch-stick-base" />
        <div className="touch-stick-knob" ref={knobRef} />
      </div>

      <div className="touch-actions">
        <div className="touch-util">
          {UTIL.map((s) => (
            <button
              key={s.id}
              type="button"
              className="touch-btn touch-util-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pulse(s.id);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="touch-btn touch-jump"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            gameRef.current?.getKeyboard().setVirtualJump(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            gameRef.current?.getKeyboard().setVirtualJump(false);
          }}
          onPointerCancel={() => gameRef.current?.getKeyboard().setVirtualJump(false)}
          onPointerLeave={() => gameRef.current?.getKeyboard().setVirtualJump(false)}
        >
          跳
        </button>
        <button
          type="button"
          className="touch-btn touch-attack"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pulse('attack');
          }}
        >
          攻
        </button>
      </div>

      <div className="touch-skills">
        {SKILLS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="touch-btn touch-skill"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pulse(s.id);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
