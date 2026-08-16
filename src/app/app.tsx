import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/game';
import type { HudSnapshot } from '../game/types';
import { Hud } from '../ui/hud';
import './app.css';

const START_VITALS: HudSnapshot = {
  hp: 1,
  maxHp: 1,
  rage: 0,
  maxRage: 100,
  atk: 0,
  def: 0,
  critPct: 0,
  gold: 50,
  level: 1,
  xp: 0,
  xpToNext: 60,
  unspentAttr: 0,
  unspentSkill: 1,
  weaponEnhance: 0,
  enhanceCost: 35,
  enhanceMats: 0,
  canEnhance: false,
  slamCd: 0,
  bashCd: 0,
  rageWarn: false,
  dead: false,
  awaitRespawn: false,
  hasBanner: true,
  invOpen: false,
  charOpen: false,
  skillOpen: false,
  catalogOpen: false,
  campOpen: null,
  nearbyCamp: null,
  nearbyCampPrompt: null,
  campMessage: null,
  travelNodes: [],
  shopStock: [],
  attrResetCost: 0,
  skillResetCost: 0,
  specResetCost: 0,
  nearbyLootName: null,
  bag: [],
  bagCap: 20,
  attrs: [],
  previewAtk: 0,
  previewDef: 0,
  previewHp: 0,
  previewCrit: 0,
  draftLeft: 0,
  skills: [],
  specs: [],
  specId: null,
  specName: null,
  needsSpec: false,
  specPickOpen: false,
  zoneName: '迷雾林地',
  bossName: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossCast: null,
  bossCastRatio: 0,
  eliteName: null,
  eliteHp: 0,
  eliteMaxHp: 0,
  eliteAffixes: [],
  ngPlusLevel: 0,
  canStartNgPlus: false,
  challengeActive: false,
  challengeT: 0,
  legendaryCatalog: [],
  nearbySecretPrompt: null,
  levelToast: null,
  settingsOpen: false,
  tutorialHint: null,
  potionReady: true,
  lootBagPulse: false,
  audio: { bgm: 0.85, sfx: 0.9, muted: false },
};

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [vitals, setVitals] = useState<HudSnapshot>(START_VITALS);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const game = new Game(canvas, setVitals);
    gameRef.current = game;
    game.start();
    canvas.focus();
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="game-stage">
        <canvas ref={canvasRef} className="game-canvas" tabIndex={0} />
        <Hud
          vitals={vitals}
          onRespawn={(choice) => gameRef.current?.respawn(choice)}
          onEquip={(uid) => gameRef.current?.equipItem(uid)}
          onDiscard={(uid) => gameRef.current?.discardBagItem(uid)}
          onDraftAttr={(key, delta) => gameRef.current?.draftAttr(key, delta)}
          onRecommendAttrs={() => gameRef.current?.recommendAttrs()}
          onClearDraft={() => gameRef.current?.clearDraft()}
          onApplyAttrs={() => gameRef.current?.applyAttrs()}
          onUpgradeSkill={(id) => gameRef.current?.upgradePlayerSkill(id)}
          onBuy={(defId) => gameRef.current?.buyItem(defId)}
          onSell={(uid) => gameRef.current?.sellItem(uid)}
          onEnhance={() => gameRef.current?.enhance()}
          onResetAttrs={() => gameRef.current?.resetAttrsAtTrainer()}
          onResetSkills={() => gameRef.current?.resetSkillsAtTrainer()}
          onResetSpec={() => gameRef.current?.resetSpecAtTrainer()}
          onPickSpec={(id) => gameRef.current?.pickSpec(id)}
          onTeleport={(nodeId) => gameRef.current?.teleport(nodeId)}
          onStartNgPlus={() => gameRef.current?.beginNgPlus()}
          onStartChallenge={() => gameRef.current?.beginChallenge()}
          onSave={() => gameRef.current?.save()}
          onLoad={() => gameRef.current?.load()}
          onUsePotion={(uid) => gameRef.current?.useBagPotion(uid)}
          onSetAudio={(patch) => gameRef.current?.setAudio(patch)}
        />
      </div>
    </div>
  );
}
