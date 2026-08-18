import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/game';
import { hasSave } from '../game/systems/save';
import type { PlayerClassId } from '../game/data/classes';
import type { HudSnapshot } from '../game/types';
import { ClassSelect } from '../ui/class-select';
import { Hud } from '../ui/hud';
import './app.css';

const START_VITALS: HudSnapshot = {
  hp: 1,
  maxHp: 1,
  rage: 0,
  maxRage: 100,
  atk: 0,
  sp: 0,
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
  enhanceSuccessPct: 100,
  canEnhance: false,
  weaponDur: null,
  weaponMaxDur: 100,
  repairCost: 0,
  repairCostFull: 0,
  repairUsesMat: false,
  canRepair: false,
  slamCd: 0,
  bashCd: 0,
  skillCd2: 0,
  skillCd3: 0,
  skillQName: '猛击',
  skillEName: '盾击',
  skill3Name: '空',
  skill4Name: '空',
  skillQId: null,
  skillEId: null,
  skill3Id: null,
  skill4Id: null,
  skillQCost: 0,
  skillECost: 20,
  skill3Cost: 0,
  skill4Cost: 0,
  skillQCdMax: 0.85,
  skillECdMax: 1.35,
  skill3CdMax: 1,
  skill4CdMax: 1,
  classId: 'warrior',
  className: '战士',
  resourceLabel: '怒气',
  comboPoints: 0,
  manaShieldOn: false,
  manaShieldHp: 0,
  rageWarn: false,
  dead: false,
  awaitRespawn: false,
  hasBanner: true,
  deathCause: 'none',
  fallWarn: false,
  invOpen: false,
  charOpen: false,
  skillOpen: false,
  catalogOpen: false,
  campOpen: null,
  nearbyCamp: null,
  nearbyCampPrompt: null,
  campMessage: null,
  travelNodes: [],
  worldMapNodes: [],
  miniMap: { zoneId: 'a01', marks: [], secretsClaimed: 0, secretsTotal: 0 },
  zoneAnnounce: null,
  shopStock: [],
  attrResetCost: 0,
  skillResetCost: 0,
  specResetCost: 0,
  nearbyLootName: null,
  nearbyLootCompare: null,
  nearbyLootTone: null,
  bag: [],
  bagCap: 40,
  materialsSell: { stacks: 0, units: 0, gold: 0 },
  commonGearSell: { stacks: 0, units: 0, gold: 0 },
  uncommonGearSell: { stacks: 0, units: 0, gold: 0 },
  rareGearSell: { stacks: 0, units: 0, gold: 0 },
  bagSlotsLeft: 20,
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
  specNodePickTier: null,
  specNodeOptions: [],
  levelUpOpen: false,
  levelUpGainAttr: 0,
  levelUpGainSkill: 0,
  specNodePicks: [],
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
  eliteAffixHints: [],
  ngPlusLevel: 0,
  canStartNgPlus: false,
  challengeActive: false,
  challengeT: 0,
  challengeFloor: 0,
  challengeBestFloor: 0,
  challengeRunAffixes: [],
  challengeAffixHints: [],
  legendaryCatalog: [],
  nearbySecretPrompt: null,
  levelToast: null,
  settingsOpen: false,
  tutorialHint: null,
  potionReady: true,
  lifePotionReady: true,
  manaPotionReady: false,
  potionCd: 0,
  potionCdMax: 1.2,
  potionCount: 5,
  lifePotionCount: 5,
  manaPotionCount: 0,
  lowHp: false,
  potionUrge: false,
  lowResource: false,
  manaPotionUrge: false,
  levelGapWarn: null,
  lootBagPulse: false,
  qaActive: false,
  qaGod: false,
  audio: { bgm: 0.85, sfx: 0.9, muted: false },
  gameplay: {
    showDamageNumbers: true,
    autoSortBagOnOpen: true,
    autoPickupConsumables: true,
  },
};

type BootMode =
  | { kind: 'menu' }
  | { kind: 'new'; classId: PlayerClassId }
  | { kind: 'continue' };

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [vitals, setVitals] = useState<HudSnapshot>(START_VITALS);
  const [saveExists, setSaveExists] = useState(() => hasSave());
  const [boot, setBoot] = useState<BootMode>({ kind: 'menu' });

  const backToClassSelect = (): void => {
    setSaveExists(hasSave());
    setBoot({ kind: 'menu' });
  };

  useEffect(() => {
    if (boot.kind === 'menu') {
      return undefined;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const game =
      boot.kind === 'continue'
        ? new Game(canvas, setVitals, { loadSave: true })
        : new Game(canvas, setVitals, { classId: boot.classId, loadSave: false });
    gameRef.current = game;
    game.start();
    canvas.focus();
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [boot]);

  const playing = boot.kind !== 'menu';

  return (
    <div className="app-shell">
      <div className="game-stage">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          tabIndex={0}
          style={{ visibility: playing ? 'visible' : 'hidden' }}
        />
        {playing ? (
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
            onLearnSkill={(id) => gameRef.current?.learnPlayerSkill(id)}
            onAssignSkillBar={(id, slot) => gameRef.current?.assignPlayerSkillBar(id, slot)}
            onBuy={(defId, qty) => gameRef.current?.buyItem(defId, qty)}
            onSell={(uid) => gameRef.current?.sellItem(uid)}
            onSellMaterials={() => gameRef.current?.sellMaterials()}
            onSellCommonGear={() => gameRef.current?.sellCommonGear()}
            onSellUncommonGear={() => gameRef.current?.sellUncommonGear()}
            onSellRareGear={() => gameRef.current?.sellRareGear()}
            onEnhance={() => gameRef.current?.enhance()}
            onRepair={() => gameRef.current?.repair()}
            onDismantle={(uid) => gameRef.current?.dismantleItem(uid)}
            onResetAttrs={() => gameRef.current?.resetAttrsAtTrainer()}
            onResetSkills={() => gameRef.current?.resetSkillsAtTrainer()}
            onResetSpec={() => gameRef.current?.resetSpecAtTrainer()}
            onPickSpec={(id) => gameRef.current?.pickSpec(id)}
            onPickSpecNode={(id) => gameRef.current?.pickSpecNode(id)}
            onDismissLevelUp={() => gameRef.current?.dismissLevelUpPrompt()}
            onLevelUpAttrs={() => gameRef.current?.openAttrsFromLevelUpPrompt()}
            onLevelUpSkills={() => gameRef.current?.openSkillsFromLevelUpPrompt()}
            onTeleport={(nodeId) => gameRef.current?.teleport(nodeId)}
            onStartNgPlus={() => gameRef.current?.beginNgPlus()}
            onStartChallenge={() => gameRef.current?.beginChallenge()}
            onSave={() => gameRef.current?.save()}
            onLoad={() => gameRef.current?.load()}
            onBackToClassSelect={backToClassSelect}
            onUsePotion={(uid) => gameRef.current?.useBagPotion(uid)}
            onSetAudio={(patch) => gameRef.current?.setAudio(patch)}
            onSetGameplay={(patch) => gameRef.current?.setGameplay(patch)}
            onSortBag={() => gameRef.current?.sortPlayerBag()}
            onClosePause={() => gameRef.current?.closePauseMenu()}
            onPauseOpenChar={() => gameRef.current?.openCharFromPause()}
            onPauseOpenSkills={() => gameRef.current?.openSkillsFromPause()}
          />
        ) : (
          <ClassSelect
            hasSave={saveExists}
            onSelect={(classId) => setBoot({ kind: 'new', classId })}
            onContinue={() => setBoot({ kind: 'continue' })}
          />
        )}
      </div>
    </div>
  );
}
