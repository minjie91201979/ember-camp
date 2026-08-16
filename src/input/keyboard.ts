export type InputFrame = {
  moveX: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
  rollPressed: boolean;
  attackPressed: boolean;
  slamPressed: boolean;
  bashPressed: boolean;
  interactPressed: boolean;
  inventoryPressed: boolean;
  characterPressed: boolean;
  skillsPressed: boolean;
  catalogPressed: boolean;
  settingsPressed: boolean;
  potionPressed: boolean;
  escapePressed: boolean;
  respawnBannerPressed: boolean;
  respawnCampPressed: boolean;
};

const HOLD_PREVENT = new Set([
  ' ',
  'space',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'escape',
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
      interactPressed: this.wasPressed('f', 'keyf'),
      inventoryPressed: this.wasPressed('i', 'keyi'),
      characterPressed: this.wasPressed('c', 'keyc'),
      skillsPressed: this.wasPressed('k', 'keyk'),
      catalogPressed: this.wasPressed('l', 'keyl'),
      settingsPressed: this.wasPressed('o', 'keyo'),
      potionPressed: this.wasPressed('r', 'keyr'),
      escapePressed: this.wasPressed('escape', 'escape'),
      respawnBannerPressed: this.wasPressed('1', 'digit1', 'numpad1'),
      respawnCampPressed: this.wasPressed('2', 'digit2', 'numpad2'),
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
