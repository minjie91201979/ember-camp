export type InputFrame = {
  moveX: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
  rollPressed: boolean;
  attackPressed: boolean;
  slamPressed: boolean;
  bashPressed: boolean;
  skill3Pressed: boolean;
  skill4Pressed: boolean;
  interactPressed: boolean;
  inventoryPressed: boolean;
  characterPressed: boolean;
  skillsPressed: boolean;
  catalogPressed: boolean;
  settingsPressed: boolean;
  potionPressed: boolean;
  /** 蓝药快捷（T） */
  manaPotionPressed: boolean;
  escapePressed: boolean;
  respawnBannerPressed: boolean;
  respawnCampPressed: boolean;
  qaToggle: boolean;
  qaHeal: boolean;
  qaSyncLevel: boolean;
  qaClearFoes: boolean;
  qaWarpBoss: boolean;
  qaUnlockAll: boolean;
  qaNextZone: boolean;
  qaSupply: boolean;
  qaGod: boolean;
};

const HOLD_PREVENT = new Set([
  ' ',
  'space',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'escape',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
]);

function keyIds(e: KeyboardEvent): string[] {
  const ids = [e.key.toLowerCase()];
  if (e.code) {
    ids.push(e.code.toLowerCase());
  }
  return ids;
}

export class Keyboard {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private mouseClicked = false;
  private readonly onDown = (e: KeyboardEvent): void => {
    const ids = keyIds(e);
    if (ids.some((id) => HOLD_PREVENT.has(id))) {
      e.preventDefault();
    }
    const fresh = ids.every((id) => !this.down.has(id));
    for (const id of ids) {
      if (fresh) {
        this.pressed.add(id);
      }
      this.down.add(id);
    }
  };
  private readonly onUp = (e: KeyboardEvent): void => {
    for (const id of keyIds(e)) {
      this.down.delete(id);
    }
  };
  private readonly onBlur = (): void => {
    this.down.clear();
  };

  attach(): void {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
  }

  noteMouseDown(): void {
    this.mouseClicked = true;
  }

  sample(consumeEdges: boolean): InputFrame {
    const left = this.isDown('a') || this.isDown('arrowleft') || this.isDown('keya');
    const right = this.isDown('d') || this.isDown('arrowright') || this.isDown('keyd');
    let moveX = 0;
    if (left) {
      moveX -= 1;
    }
    if (right) {
      moveX += 1;
    }
    const jumpPressed = this.wasPressed(' ', 'space', 'w', 'keyw', 'arrowup');
    const frame: InputFrame = {
      moveX,
      jumpHeld:
        this.isDown(' ') ||
        this.isDown('space') ||
        this.isDown('w') ||
        this.isDown('keyw') ||
        this.isDown('arrowup'),
      jumpPressed,
      rollPressed: this.wasPressed('shift', 'shiftleft', 'shiftright'),
      attackPressed: this.wasPressed('j', 'keyj') || this.mouseClicked,
      slamPressed: this.wasPressed('q', 'keyq'),
      bashPressed: this.wasPressed('e', 'keye'),
      skill3Pressed: this.wasPressed('1', 'digit1', 'numpad1'),
      skill4Pressed: this.wasPressed('2', 'digit2', 'numpad2'),
      interactPressed: this.wasPressed('f', 'keyf'),
      inventoryPressed: this.wasPressed('i', 'keyi'),
      characterPressed: this.wasPressed('c', 'keyc'),
      skillsPressed: this.wasPressed('k', 'keyk'),
      catalogPressed: this.wasPressed('l', 'keyl'),
      settingsPressed: this.wasPressed('o', 'keyo'),
      potionPressed: this.wasPressed('r', 'keyr'),
      manaPotionPressed: this.wasPressed('t', 'keyt'),
      escapePressed: this.wasPressed('escape', 'escape'),
      respawnBannerPressed: this.wasPressed('1', 'digit1', 'numpad1'),
      respawnCampPressed: this.wasPressed('2', 'digit2', 'numpad2'),
      qaToggle: this.wasPressed('f8', 'f8'),
      qaHeal: this.wasPressed('f1', 'f1'),
      qaSyncLevel: this.wasPressed('f2', 'f2'),
      qaClearFoes: this.wasPressed('f3', 'f3'),
      qaWarpBoss: this.wasPressed('f4', 'f4'),
      qaNextZone: this.wasPressed('f5', 'f5'),
      qaUnlockAll: this.wasPressed('f6', 'f6'),
      qaSupply: this.wasPressed('f7', 'f7'),
      qaGod: this.wasPressed('f9', 'f9'),
    };
    if (consumeEdges) {
      this.pressed.clear();
      this.mouseClicked = false;
    }
    return frame;
  }

  private wasPressed(...ids: string[]): boolean {
    return ids.some((id) => this.pressed.has(id));
  }

  private isDown(key: string): boolean {
    return this.down.has(key);
  }
}
