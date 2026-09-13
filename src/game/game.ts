import { bgm } from '../audio/bgm';
import { Keyboard } from '../input/keyboard';
import { GameRenderer } from '../render/game-renderer';
import { CLASS_DEFS, type PlayerClassId } from './data/classes';
import { ITEM_DEFS } from './data/item-defs';
import { FIXED_DT, HUD_FEEDBACK, MAX_FRAME_STEPS, PLAYER, POTION } from './config';
import {
  addAttrDraft,
  applyAttrDraft,
  attrPanelRows,
  clearAttrDraft,
  combatPreview,
  draftTotal,
  fillRecommendDraft,
  removeAttrDraft,
} from './systems/attributes';
import { equipMainhand, discardItem, BAG_CAPACITY, applyGearStats, usePotion, sortBag } from './systems/inventory';
import { chooseRespawn } from './systems/respawn';
import { stepPlayer } from './systems/player-controller';
import {
  CAMP_NPCS,
  shopStockFor,
  buyShopItem,
  shopBuyMax,
  bagOwnedQty,
  canEnhanceWeapon,
  countEnhanceMaterials,
  enhanceGoldCost,
  enhanceSuccessPct,
  enhanceWeapon,
  canRepairWeapon,
  repairWeapon,
  repairQuote,
  dismantleBagItem,
  resetAttributes,
  resetSkills,
  resetSpecAtCamp,
  sellBagItem,
  sellAllMaterials,
  materialsSellPreview,
  sellAllCommonGear,
  commonGearSellPreview,
  sellAllUncommonGear,
  uncommonGearSellPreview,
  sellAllRareGear,
  rareGearSellPreview,
  sellPrice,
  teleportTo,
} from './systems/camp';
import {
  GEAR_MAX_DURABILITY,
  gearDurability,
  isGearBroken,
} from './systems/gear-durability';
import { hasSave, loadWorld, saveWorld, autoSaveWorld } from './systems/save';
import {
  SKILL_DEFS,
  canLearnSkill,
  canUpgradeSkill,
  learnSkill,
  placeSkillOnBar,
  skillBarLabelOf,
  skillBarSlotOf,
  skillCompareLines,
  skillsForClass,
  upgradeCost,
  upgradeSkill,
  type SkillId,
} from './systems/skills';
import {
  needsSpecPick,
  pickSpecialization,
  pickSpecNode,
  specDef,
  specsForClass,
} from './systems/specialization';
import { nodesForSpecTier, specNodeDef } from './data/talents';
import { eliteAffixHintsOf, eliteAffixLabel } from './data/elite-affixes';
import { activeBoss, bossCastLabel } from './systems/boss';
import { eliteAffixHints, eliteAffixTags } from './systems/elite-affixes';
import { canStartNgPlus, startNgPlus } from './systems/ng-plus';
import { startChallenge, stepChallenge, sanitizeChallengeOnLoad } from './systems/challenge';
import { stepBossEncounter, engagedBossForHud } from './systems/boss-encounter';
import {
  formatItemSummary,
  gearCompareLines,
  itemDetailText,
  itemStatLines,
  itemTraitsOf,
} from './systems/item-detail';
import { listLegendaryCatalog } from './systems/legendary';
import { secretPromptLabel } from './systems/secrets';
import { listTravelNodes, listWorldMapNodes } from './systems/zone-travel';
import { zoneLevelGap } from './systems/level-gap';
import { buildMiniMap, stepExploreTrail } from './systems/minimap';
import {
  dismissLevelUp,
  openAttrsFromLevelUp,
  openSkillsFromLevelUp,
} from './systems/level-up-prompt';
import { isAnyPanelOpen, closeAllPanels } from './systems/ui-panels';
import { tutorialHint, bootTutorialToast, stepTutorialExplore } from './systems/tutorial';
import { isQaGod, isQaSessionOn, stepQa } from './systems/debug-qa';
import { getAudioPrefs, setAudioPrefs } from '../audio/prefs';
import { getGameplayPrefs, setGameplayPrefs } from './prefs/gameplay-prefs';
import { ZONES, START_ZONE_ID } from './data/zones';
import type { AttrKey, HudSnapshot, RespawnChoice, World } from './types';
import { createWorld } from './world';

export type GameBootOptions = {
  classId?: PlayerClassId;
  /** 是否尝试读取存档（继续游戏）。 */
  loadSave?: boolean;
};

export class Game {
  private readonly world: World;
  private readonly input = new Keyboard();
  private readonly view: GameRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly onHud?: (snap: HudSnapshot) => void;
  private readonly preferLoadSave: boolean;
  private lastHud = '';
  private raf = 0;
  private running = false;
  private lastMs = 0;
  private acc = 0;
  private readonly onResize = (): void => {
    this.fitCanvas();
  };
  private readonly onMouse = (): void => {
    this.input.noteMouseDown();
    bgm.start();
  };
  private readonly unlockAudio = (): void => {
    bgm.start();
  };
  private readonly onContext = (e: Event): void => {
    e.preventDefault();
  };

  constructor(
    canvas: HTMLCanvasElement,
    onHud?: (snap: HudSnapshot) => void,
    opts?: GameBootOptions,
  ) {
    this.canvas = canvas;
    this.onHud = onHud;
    this.preferLoadSave = opts?.loadSave ?? true;
    this.world = createWorld(START_ZONE_ID, opts?.classId ?? 'warrior');
    this.view = new GameRenderer(canvas);
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    void this.boot();
  }

  /** Touch pad / UI injects virtual input through this Keyboard. */
  getKeyboard(): Keyboard {
    return this.input;
  }

  respawn(choice: RespawnChoice): void {
    const prevZone = this.world.zoneId;
    chooseRespawn(this.world, choice);
    if (this.world.zoneId !== prevZone) {
      this.view.rebuildZone(this.world);
      bgm.setTheme(this.world.kitTheme);
    }
    autoSaveWorld(this.world);
    this.bumpHud();
  }

  equipItem(uid: number): void {
    if (equipMainhand(this.world, uid)) {
      this.bumpHud();
    }
  }

  discardBagItem(uid: number, qty?: number): void {
    if (discardItem(this.world, uid, qty)) {
      this.bumpHud();
    }
  }

  useBagPotion(uid?: number): void {
    if (usePotion(this.world, uid)) {
      this.bumpHud();
    }
  }

  setAudio(patch: { bgm?: number; sfx?: number; muted?: boolean }): void {
    setAudioPrefs(patch);
    this.bumpHud();
  }

  setGameplay(patch: {
    showDamageNumbers?: boolean;
    autoSortBagOnOpen?: boolean;
    autoPickupConsumables?: boolean;
  }): void {
    setGameplayPrefs(patch);
    this.bumpHud();
  }

  sortPlayerBag(): void {
    sortBag(this.world);
    this.bumpHud();
  }

  closePauseMenu(): void {
    if (this.world.settingsOpen) {
      this.world.settingsOpen = false;
      this.bumpHud();
    }
  }

  closeHudPanel(): void {
    if (closeAllPanels(this.world)) {
      this.bumpHud();
    }
  }

  openCharFromPause(): void {
    this.world.settingsOpen = false;
    this.world.invOpen = false;
    this.world.skillOpen = false;
    this.world.catalogOpen = false;
    this.world.campOpen = null;
    this.world.charOpen = true;
    this.bumpHud();
  }

  openSkillsFromPause(): void {
    this.world.settingsOpen = false;
    this.world.invOpen = false;
    this.world.charOpen = false;
    this.world.catalogOpen = false;
    this.world.campOpen = null;
    this.world.skillOpen = true;
    this.bumpHud();
  }

  draftAttr(key: AttrKey, delta: 1 | -1): void {
    const ok = delta > 0 ? addAttrDraft(this.world, key) : removeAttrDraft(this.world, key);
    if (ok) {
      this.bumpHud();
    }
  }

  recommendAttrs(): void {
    fillRecommendDraft(this.world);
    this.bumpHud();
  }

  clearDraft(): void {
    clearAttrDraft(this.world);
    this.bumpHud();
  }

  applyAttrs(): void {
    if (applyAttrDraft(this.world)) {
      this.bumpHud();
    }
  }

  upgradePlayerSkill(id: string): void {
    if (upgradeSkill(this.world, id as SkillId)) {
      this.bumpHud();
    }
  }

  learnPlayerSkill(id: string): void {
    if (learnSkill(this.world, id as SkillId)) {
      this.world.levelToastT = 1.4;
      this.world.levelToastText = `学会 ${SKILL_DEFS[id as SkillId]?.name ?? id}`;
      this.bumpHud();
    }
  }

  assignPlayerSkillBar(id: string, slot: number): void {
    if (placeSkillOnBar(this.world, id as SkillId, slot)) {
      const label = skillBarLabelOf(slot);
      this.world.levelToastT = 1.2;
      this.world.levelToastText = `${SKILL_DEFS[id as SkillId]?.name ?? id} → ${label}`;
      this.bumpHud();
    }
  }

  buyItem(defId: string, qty = 1): void {
    this.world.campMessage = buyShopItem(this.world, defId, qty);
    this.bumpHud();
  }

  sellItem(uid: number, qty = 1): void {
    this.world.campMessage = sellBagItem(this.world, uid, qty);
    this.bumpHud();
  }

  sellMaterials(): void {
    this.world.campMessage = sellAllMaterials(this.world);
    this.bumpHud();
  }

  sellCommonGear(): void {
    this.world.campMessage = sellAllCommonGear(this.world);
    this.bumpHud();
  }

  sellUncommonGear(): void {
    this.world.campMessage = sellAllUncommonGear(this.world);
    this.bumpHud();
  }

  sellRareGear(): void {
    this.world.campMessage = sellAllRareGear(this.world);
    this.bumpHud();
  }

  enhance(): void {
    this.world.campMessage = enhanceWeapon(this.world);
    this.bumpHud();
  }

  repair(): void {
    this.world.campMessage = repairWeapon(this.world);
    this.bumpHud();
  }

  dismantleItem(uid: number): void {
    const msg = dismantleBagItem(this.world, uid);
    this.world.levelToastT = 1.4;
    this.world.levelToastText = msg;
    this.bumpHud();
  }

  resetAttrsAtTrainer(): void {
    this.world.campMessage = resetAttributes(this.world);
    this.bumpHud();
  }

  resetSkillsAtTrainer(): void {
    this.world.campMessage = resetSkills(this.world);
    this.bumpHud();
  }

  resetSpecAtTrainer(): void {
    this.world.campMessage = resetSpecAtCamp(this.world);
    this.bumpHud();
  }

  pickSpec(id: string): void {
    if (pickSpecialization(this.world, id)) {
      this.bumpHud();
    }
  }

  pickSpecNode(id: string): void {
    if (pickSpecNode(this.world, id)) {
      this.bumpHud();
    }
  }

  dismissLevelUpPrompt(): void {
    dismissLevelUp(this.world);
    this.bumpHud();
  }

  openAttrsFromLevelUpPrompt(): void {
    openAttrsFromLevelUp(this.world);
    this.bumpHud();
  }

  openSkillsFromLevelUpPrompt(): void {
    openSkillsFromLevelUp(this.world);
    this.bumpHud();
  }

  teleport(nodeId: string): void {
    const prevZone = this.world.zoneId;
    this.world.campMessage = teleportTo(this.world, nodeId);
    if (this.world.zoneId !== prevZone) {
      this.view.rebuildZone(this.world);
      bgm.setTheme(this.world.kitTheme);
      autoSaveWorld(this.world);
    }
    this.bumpHud();
  }

  beginNgPlus(): void {
    if (!startNgPlus(this.world)) {
      this.bumpHud();
      return;
    }
    applyGearStats(this.world.player, this.world);
    this.view.rebuildZone(this.world);
    bgm.setTheme(this.world.kitTheme);
    autoSaveWorld(this.world);
    this.bumpHud();
  }

  beginChallenge(): void {
    if (!startChallenge(this.world)) {
      this.bumpHud();
      return;
    }
    this.view.rebuildZone(this.world);
    bgm.setTheme(this.world.kitTheme);
    this.bumpHud();
  }

  save(): void {
    if (this.world.player.hp <= 0 || this.world.player.awaitRespawn) {
      this.world.levelToastT = 1.4;
      this.world.levelToastText = '倒下时无法存档 · 请先复活';
      this.bumpHud();
      return;
    }
    saveWorld(this.world);
    this.bumpHud();
  }

  load(): void {
    if (this.world.player.hp <= 0 || this.world.player.awaitRespawn) {
      this.world.levelToastT = 1.4;
      this.world.levelToastText = '倒下时无法读档 · 请先复活';
      this.bumpHud();
      return;
    }
    if (loadWorld(this.world)) {
      sanitizeChallengeOnLoad(this.world);
      this.view.rebuildZone(this.world);
      this.view.setPlayerClass(this.world.player.classId);
      bgm.setTheme(this.world.kitTheme);
      this.bumpHud();
    }
  }

  private bumpHud(): void {
    this.lastHud = '';
    this.pushHud();
  }

  private async boot(): Promise<void> {
    try {
      await this.view.load();
    } catch (err) {
      console.error('load assets failed', err);
      this.running = false;
      return;
    }
    if (!this.running) {
      return;
    }
    this.view.buildWorld(this.world);
    bgm.setTheme(this.world.kitTheme);
    if (this.preferLoadSave && hasSave()) {
      loadWorld(this.world);
      sanitizeChallengeOnLoad(this.world);
      this.view.rebuildZone(this.world);
      this.view.setPlayerClass(this.world.player.classId);
      bgm.setTheme(this.world.kitTheme);
    } else {
      this.view.setPlayerClass(this.world.player.classId);
      bootTutorialToast(this.world);
      const startZone = ZONES[this.world.zoneId];
      if (startZone) {
        this.world.zoneAnnounceT = 3.4;
        this.world.zoneAnnounceName = startZone.name;
        this.world.zoneAnnounceSub = `推荐等级 ${startZone.levelMin}–${startZone.levelMax}`;
      }
    }
    this.input.attach();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.unlockAudio);
    this.canvas.addEventListener('pointerdown', this.onMouse);
    this.canvas.addEventListener('contextmenu', this.onContext);
    this.fitCanvas();
    this.lastMs = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.unlockAudio);
    this.canvas.removeEventListener('pointerdown', this.onMouse);
    this.canvas.removeEventListener('contextmenu', this.onContext);
    bgm.stop();
    this.view.dispose();
  }

  private readonly frame = (now: number): void => {
    if (!this.running) {
      return;
    }
    const elapsed = Math.min(0.05, (now - this.lastMs) / 1000);
    this.lastMs = now;
    if (this.world.slowMoT > 0) {
      this.world.slowMoT = Math.max(0, this.world.slowMoT - elapsed);
      if (this.world.slowMoT > 0) {
        this.world.shake = Math.max(this.world.shake, 0.4);
      }
    }
    const simScale = this.world.slowMoT > 0 ? 0.35 : 1;
    this.acc += elapsed * simScale;
    const willStep = this.acc >= FIXED_DT;
    const input = this.input.sample(willStep);
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < MAX_FRAME_STEPS) {
      const zoneBefore = this.world.zoneId;
      const zoneChangedByQa = stepQa(this.world, {
        toggleSession: input.qaToggle,
        heal: input.qaHeal,
        syncLevel: input.qaSyncLevel,
        clearFoes: input.qaClearFoes,
        warpBoss: input.qaWarpBoss,
        unlockAll: input.qaUnlockAll,
        nextZone: input.qaNextZone,
        supply: input.qaSupply,
        toggleGod: input.qaGod,
      });
      stepPlayer(this.world, input, FIXED_DT);
      const paused = isAnyPanelOpen(this.world) || this.world.player.awaitRespawn;
      if (!paused) {
        stepExploreTrail(this.world);
        stepTutorialExplore(this.world);
        stepBossEncounter(this.world);
        const challengeFloorUp = stepChallenge(this.world, FIXED_DT);
        if (zoneChangedByQa || this.world.zoneId !== zoneBefore || challengeFloorUp) {
          this.view.rebuildZone(this.world);
          bgm.setTheme(this.world.kitTheme);
          autoSaveWorld(this.world);
        }
      } else if (zoneChangedByQa || this.world.zoneId !== zoneBefore) {
        this.view.rebuildZone(this.world);
        bgm.setTheme(this.world.kitTheme);
        autoSaveWorld(this.world);
      }
      this.acc -= FIXED_DT;
      steps += 1;
    }
    const bossNow = activeBoss(this.world);
    const inCampSafe =
      !bossNow &&
      this.world.player.combatT <= 0 &&
      (this.world.zoneId === 'a01' ||
        Boolean(this.world.nearbyCamp) ||
        this.world.nearbyHubPortal);
    if (bossNow) {
      bgm.setMood('boss');
    } else if (this.world.player.combatT > 0) {
      bgm.setMood('combat');
    } else if (inCampSafe) {
      bgm.setMood('camp');
    } else {
      bgm.setMood('explore');
    }
    const alpha = this.acc / FIXED_DT;
    this.view.render(this.world, alpha, elapsed);
    this.pushHud();
    this.raf = requestAnimationFrame(this.frame);
  };

  private pushHud(): void {
    const p = this.world.player;
    const w = this.world;
    const draft = draftTotal(w);
    const preview = combatPreview(w);
    const bagKey = w.bag.map((it) => `${it.uid}:${it.qty}`).join(',');
    const draftKey = `${w.attrDraft.str}${w.attrDraft.agi}${w.attrDraft.int}${w.attrDraft.vit}${w.attrDraft.spi}`;
    const skillKey = Object.entries(w.skills)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    const boss = engagedBossForHud(w);
    let nearbyElite: (typeof w.dummies)[number] | null = null;
    let nearbyEliteDist = Number.POSITIVE_INFINITY;
    for (const d of w.dummies) {
      if (!d.elite || d.boss || d.hp <= 0) {
        continue;
      }
      const dx = Math.abs(d.x - p.x);
      const dy = Math.abs(d.y - p.y);
      if (dx >= 10 || dy >= 2.5) {
        continue;
      }
      const dist = dx * dx + dy * dy;
      if (dist < nearbyEliteDist) {
        nearbyEliteDist = dist;
        nearbyElite = d;
      }
    }
    const key = `${p.classId}:${Math.floor(p.x * 4)}:${Math.floor(p.y * 4)}:${p.hp}:${Math.floor(p.rage)}:${p.comboPoints}:${p.awaitRespawn ? 1 : 0}:${Math.ceil(p.slamCd * 10)}:${Math.ceil(p.bashCd * 10)}:${Math.ceil(p.skillCd2 * 10)}:${Math.ceil(p.skillCd3 * 10)}:${Math.ceil(p.potionCd * 10)}:${w.skillBar.join(',')}:${p.rageWarnT > 0 ? 1 : 0}:${w.gold}:${w.invOpen ? 1 : 0}:${w.charOpen ? 1 : 0}:${w.skillOpen ? 1 : 0}:${w.catalogOpen ? 1 : 0}:${w.settingsOpen ? 1 : 0}:${w.levelUpOpen ? 1 : 0}:${w.specPickOpen ? 1 : 0}:${w.specNodePickTier ?? ''}:${JSON.stringify(w.specNodes ?? {})}:${w.specId ?? ''}:${w.campOpen ?? ''}:${w.nearbyCamp ?? ''}:${w.nearbyHubPortal ? 1 : 0}:${w.campMessage}:${w.nearbyLootName ?? ''}:${w.nearbyLootCompare ?? ''}:${w.nearbyLootTone ?? ''}:${w.nearbySecretId ?? ''}:${w.mainhandUid}:${bagKey}:${p.atk}:${p.sp}:${p.level}:${p.xp}:${p.unspentAttr}:${p.unspentSkill}:${p.weaponEnhance}:${draftKey}:${skillKey}:${boss ? `${boss.hp}:${boss.castId}:${boss.castT.toFixed(1)}` : ''}:${nearbyElite ? `${nearbyElite.id}:${nearbyElite.hp}:${nearbyElite.affixes.join(',')}` : ''}:${w.ngPlusLevel}:${canStartNgPlus(w) ? 1 : 0}:${w.challengeActive ? 1 : 0}:${Math.ceil(w.challengeT)}:${w.challengeFloor}:${w.challengeBestFloor}:${w.challengeRunAffixes.join(',')}:${w.discoveredLegendaries.join(',')}:${w.levelToastT > 0 ? w.levelToastText : ''}:${w.tutorialStep}:${tutorialHint(w) ?? ''}:${JSON.stringify(getAudioPrefs())}:${w.zoneId}:${w.unlockedZones.join(',')}:${w.loots
      .filter((l) => l.kind === 'item' && ITEM_DEFS[l.defId ?? '']?.kind === 'gear')
      .slice(0, 12)
      .map((l) => `${l.id}:${Math.floor(l.x * 2)}`)
      .join(',')}:${w.lootFlies.length > 0 ? 1 : 0}:${isQaSessionOn() ? 1 : 0}:${isQaGod() ? 1 : 0}`;
    if (key === this.lastHud) {
      return;
    }
    this.lastHud = key;
    const nearbyNpc = CAMP_NPCS.find((n) => n.id === w.nearbyCamp);
    const zone = ZONES[w.zoneId];
    const travelNodes = listTravelNodes(w);
    const worldMapNodes = listWorldMapNodes(w);
    const miniMap = buildMiniMap(w);
    const attrResetCost =
      p.attrResetCount === 0 ? 0 : 20 * p.level * p.attrResetCount;
    const skillResetCost =
      p.skillResetCount === 0 ? 0 : 20 * p.level * p.skillResetCount;
    const specResetCost =
      p.specResetCount === 0 ? 0 : 20 * p.level * p.specResetCount;
    const currentSpec = specDef(w.specId);
    const cls = CLASS_DEFS[p.classId];
    const bar0 = w.skillBar[0];
    const bar1 = w.skillBar[1];
    const bar2 = w.skillBar[2];
    const bar3 = w.skillBar[3];
    const skillName = (id: string | null | undefined): string => {
      if (!id || !(id in SKILL_DEFS)) {
        return '空';
      }
      return SKILL_DEFS[id as SkillId].name;
    };
    const costOf = (id: string | null | undefined): number => {
      if (id === 'fireball') {
        return PLAYER.fireballCost;
      }
      if (id === 'frost-nova') {
        return PLAYER.frostNovaCost;
      }
      if (id === 'arcane-missiles') {
        return PLAYER.arcaneMissilesCost;
      }
      if (id === 'blink') {
        return PLAYER.blinkCost;
      }
      if (id === 'aimed-shot') {
        return PLAYER.aimedShotCost;
      }
      if (id === 'disengage') {
        return PLAYER.disengageCost;
      }
      if (id === 'multi-shot') {
        return PLAYER.multiShotCost;
      }
      if (id === 'trap') {
        return PLAYER.trapCost;
      }
      if (id === 'explosive-trap') {
        return PLAYER.explosiveTrapCost;
      }
      if (id === 'ice-lance') {
        return PLAYER.iceLanceCost;
      }
      if (id === 'concussive-shot') {
        return PLAYER.concussiveCost;
      }
      if (id === 'mana-shield') {
        return PLAYER.manaShieldCost;
      }
      if (id === 'serpent-sting') {
        return PLAYER.serpentStingCost;
      }
      if (id === 'charge') {
        return PLAYER.chargeCost;
      }
      if (id === 'whirlwind') {
        return PLAYER.whirlwindCost;
      }
      if (id === 'execute') {
        return PLAYER.executeCost;
      }
      if (id === 'battle-shout') {
        return PLAYER.battleShoutCost;
      }
      if (id === 'sunder') {
        return PLAYER.sunderCost;
      }
      if (id === 'cleave') {
        return PLAYER.cleaveCost;
      }
      if (id === 'kidney-shot') {
        return PLAYER.kidneyShotCost;
      }
      if (id === 'slice-and-dice') {
        return PLAYER.sliceAndDiceCost;
      }
      if (id === 'fan-of-knives') {
        return PLAYER.fanOfKnivesCost;
      }
      if (id === 'shadow-strike') {
        return PLAYER.shadowStrikeCost;
      }
      if (id === 'eviscerate') {
        return PLAYER.eviscerateCost;
      }
      if (id === 'poison-blade') {
        return PLAYER.poisonBladeCost;
      }
      if (id === 'sprint') {
        return PLAYER.sprintCost;
      }
      if (id === 'vanish') {
        return PLAYER.vanishCost;
      }
      if (id === 'blizzard') {
        return PLAYER.blizzardCost;
      }
      if (id === 'rapid-fire') {
        return PLAYER.rapidFireCost;
      }
      if (id === 'pyroblast') {
        return PLAYER.pyroblastCost;
      }
      if (id === 'bash') {
        return PLAYER.bashCost;
      }
      return 0;
    };
    const cdMaxOf = (id: string | null | undefined, fallback: number): number => {
      if (id === 'fireball') {
        return PLAYER.fireballCooldown;
      }
      if (id === 'frost-nova') {
        return PLAYER.frostNovaCooldown;
      }
      if (id === 'arcane-missiles') {
        return PLAYER.arcaneMissilesCooldown;
      }
      if (id === 'blink') {
        return PLAYER.blinkCooldown;
      }
      if (id === 'aimed-shot') {
        return PLAYER.aimedShotCooldown;
      }
      if (id === 'disengage') {
        return PLAYER.disengageCooldown;
      }
      if (id === 'multi-shot') {
        return PLAYER.multiShotCooldown;
      }
      if (id === 'trap') {
        return PLAYER.trapCooldown;
      }
      if (id === 'explosive-trap') {
        return PLAYER.explosiveTrapCooldown;
      }
      if (id === 'ice-lance') {
        return PLAYER.iceLanceCooldown;
      }
      if (id === 'concussive-shot') {
        return PLAYER.concussiveCooldown;
      }
      if (id === 'mana-shield') {
        return PLAYER.manaShieldCooldown;
      }
      if (id === 'serpent-sting') {
        return PLAYER.serpentStingCooldown;
      }
      if (id === 'charge') {
        return PLAYER.chargeCooldown;
      }
      if (id === 'whirlwind') {
        return PLAYER.whirlwindCooldown;
      }
      if (id === 'execute') {
        return PLAYER.executeCooldown;
      }
      if (id === 'battle-shout') {
        return PLAYER.battleShoutCooldown;
      }
      if (id === 'sunder') {
        return PLAYER.sunderCooldown;
      }
      if (id === 'cleave') {
        return PLAYER.cleaveCooldown;
      }
      if (id === 'kidney-shot') {
        return PLAYER.kidneyShotCooldown;
      }
      if (id === 'slice-and-dice') {
        return PLAYER.sliceAndDiceCooldown;
      }
      if (id === 'fan-of-knives') {
        return PLAYER.fanOfKnivesCooldown;
      }
      if (id === 'shadow-strike') {
        return PLAYER.shadowStrikeCooldown;
      }
      if (id === 'eviscerate') {
        return PLAYER.eviscerateCooldown;
      }
      if (id === 'poison-blade') {
        return PLAYER.poisonBladeCooldown;
      }
      if (id === 'sprint') {
        return PLAYER.sprintCooldown;
      }
      if (id === 'vanish') {
        return PLAYER.vanishCooldown;
      }
      if (id === 'blizzard') {
        return PLAYER.blizzardCooldown;
      }
      if (id === 'rapid-fire') {
        return PLAYER.rapidFireCooldown;
      }
      if (id === 'pyroblast') {
        return PLAYER.pyroblastCooldown;
      }
      if (id === 'slam') {
        return PLAYER.slamCooldown;
      }
      if (id === 'bash') {
        return PLAYER.bashCooldown;
      }
      return fallback;
    };
    this.onHud?.({
      hp: p.hp,
      maxHp: p.maxHp,
      rage: Math.floor(p.rage),
      maxRage: p.maxRage,
      atk: p.atk,
      sp: p.sp,
      def: p.def,
      critPct: Math.round(p.critChance * 1000) / 10,
      gold: w.gold,
      level: p.level,
      xp: p.xp,
      xpToNext: p.xpToNext,
      unspentAttr: p.unspentAttr,
      unspentSkill: p.unspentSkill,
      weaponEnhance: p.weaponEnhance,
      enhanceCost: enhanceGoldCost(p.weaponEnhance),
      enhanceMats: countEnhanceMaterials(w),
      enhanceSuccessPct: enhanceSuccessPct(p.weaponEnhance),
      canEnhance: canEnhanceWeapon(w),
      weaponDur: (() => {
        const eq = w.bag.find((it) => it.uid === w.mainhandUid);
        return eq ? gearDurability(eq) : null;
      })(),
      weaponMaxDur: GEAR_MAX_DURABILITY,
      ...(() => {
        const rq = repairQuote(w);
        return {
          repairCost: rq?.cost ?? 0,
          repairCostFull: rq?.fullCost ?? 0,
          repairUsesMat: rq?.useMat ?? false,
        };
      })(),
      canRepair: canRepairWeapon(w),
      slamCd: p.slamCd,
      bashCd: p.bashCd,
      skillCd2: p.skillCd2,
      skillCd3: p.skillCd3,
      skillQName: skillName(bar0),
      skillEName: skillName(bar1),
      skill3Name: skillName(bar2),
      skill4Name: skillName(bar3),
      skillQId: (bar0 as SkillId | null) ?? null,
      skillEId: (bar1 as SkillId | null) ?? null,
      skill3Id: (bar2 as SkillId | null) ?? null,
      skill4Id: (bar3 as SkillId | null) ?? null,
      skillQCost: costOf(bar0),
      skillECost: costOf(bar1),
      skill3Cost: costOf(bar2),
      skill4Cost: costOf(bar3),
      skillQCdMax: cdMaxOf(bar0, PLAYER.slamCooldown),
      skillECdMax: cdMaxOf(bar1, PLAYER.bashCooldown),
      skill3CdMax: cdMaxOf(bar2, 1),
      skill4CdMax: cdMaxOf(bar3, 1),
      classId: p.classId,
      className: cls.name,
      resourceLabel: cls.resourceLabel,
      comboPoints: p.comboPoints ?? 0,
      manaShieldOn: p.manaShieldOn ?? false,
      manaShieldHp: Math.round(p.manaShieldHp ?? 0),
      rageWarn: p.rageWarnT > 0,
      dead: p.hp <= 0,
      awaitRespawn: p.awaitRespawn,
      hasBanner: p.hasBanner,
      deathCause: p.deathCause ?? 'none',
      fallWarn: (p.fallWarnT ?? 0) > 0 && p.hp > 0,
      invOpen: w.invOpen,
      charOpen: w.charOpen,
      skillOpen: w.skillOpen,
      catalogOpen: w.catalogOpen,
      settingsOpen: w.settingsOpen,
      levelUpOpen: w.levelUpOpen,
      levelUpGainAttr: w.levelUpGainAttr,
      levelUpGainSkill: w.levelUpGainSkill,
      campOpen: w.campOpen,
      nearbyCamp: w.nearbyCamp,
      nearbyCampPrompt: nearbyNpc
        ? `${nearbyNpc.prompt} · ${nearbyNpc.name}`
        : w.nearbyHubPortal
          ? '打开传送 · 回营'
          : null,
      campMessage: w.campMessage || null,
      travelNodes: travelNodes.map((n) => ({ id: n.id, label: n.label })),
      worldMapNodes: worldMapNodes.map((n) => ({ ...n })),
      miniMap: {
        zoneId: miniMap.zoneId,
        marks: miniMap.marks.map((m) => ({ ...m })),
        secretsClaimed: miniMap.secretsClaimed,
        secretsTotal: miniMap.secretsTotal,
      },
      zoneAnnounce:
        w.zoneAnnounceT > 0
          ? { name: w.zoneAnnounceName, sub: w.zoneAnnounceSub }
          : null,
      shopStock: (() => {
        const equippedItem = w.bag.find((it) => it.uid === w.mainhandUid);
        const equippedDef = equippedItem ? ITEM_DEFS[equippedItem.defId] ?? null : null;
        const equippedBonus = equippedItem?.powerBonus ?? 0;
        const equippedName = equippedDef?.name ?? null;
        return shopStockFor(w).map((s) => {
          const def = ITEM_DEFS[s.defId];
          const ownedQty = bagOwnedQty(w, s.defId);
          if (!def) {
            return {
              defId: s.defId,
              name: s.defId,
              price: s.price,
              quality: 'common' as const,
              kind: 'material' as const,
              canBuyBulk: false,
              buyMax: shopBuyMax(w, s.defId, s.price),
              ownedQty,
              detail: null,
              stats: [],
              traits: [],
              flavor: null,
              compare: [],
            };
          }
          return {
            defId: s.defId,
            name: def.name,
            price: s.price,
            quality: def.quality,
            kind: def.kind,
            canBuyBulk: def.kind === 'potion' || def.kind === 'material',
            buyMax: shopBuyMax(w, s.defId, s.price),
            ownedQty,
            detail: formatItemSummary(def),
            stats: itemStatLines(def),
            traits: itemTraitsOf(def),
            flavor: itemDetailText(def),
            compare: gearCompareLines({
              candidate: def,
              candidateBonus: 0,
              equipped: false,
              equippedDef,
              equippedBonus,
              equippedName,
              weaponEnhance: w.player.weaponEnhance,
              ngPlusLevel: w.ngPlusLevel,
              equippedBroken: equippedItem ? isGearBroken(equippedItem) : false,
            }),
          };
        });
      })(),
      attrResetCost,
      skillResetCost,
      specResetCost,
      nearbyLootName: w.nearbyLootName,
      nearbyLootCompare: w.nearbyLootCompare,
      nearbyLootTone: w.nearbyLootTone,
      nearbySecretPrompt: secretPromptLabel(w),
      bag: (() => {
        const equippedItem = w.bag.find((it) => it.uid === w.mainhandUid);
        const equippedDef = equippedItem ? ITEM_DEFS[equippedItem.defId] ?? null : null;
        const equippedBonus = equippedItem?.powerBonus ?? 0;
        const equippedName = equippedDef?.name ?? null;
        return w.bag.map((it) => {
          const def = ITEM_DEFS[it.defId];
          const canUse =
            def?.kind === 'potion' && ((def.heal ?? 0) > 0 || (def.mana ?? 0) > 0);
          if (!def) {
            return {
              uid: it.uid,
              defId: it.defId,
              name: it.defId,
              qty: it.qty,
              quality: 'common' as const,
              equipped: w.mainhandUid === it.uid,
              canEquip: false,
              canUse: false,
              desc: null,
              stats: [],
              traits: [],
              detail: null,
              compare: [],
              sellPrice: sellPrice(it),
              kind: 'material' as const,
              dur: null,
              maxDur: null,
              canDismantle: false,
            };
          }
          const bonus = it.powerBonus ?? 0;
          const equipped = w.mainhandUid === it.uid;
          const dur = def.kind === 'gear' ? gearDurability(it) : null;
          const stats = itemStatLines(def, bonus, dur);
          const traits = itemTraitsOf(def);
          const detail = itemDetailText(def);
          const desc =
            bonus > 0
              ? `${formatItemSummary(def)} · 周目淬炼 +${bonus}`
              : formatItemSummary(def);
          const compare = gearCompareLines({
            candidate: def,
            candidateBonus: bonus,
            equipped,
            equippedDef,
            equippedBonus,
            equippedName,
            weaponEnhance: w.player.weaponEnhance,
            ngPlusLevel: w.ngPlusLevel,
            equippedBroken: equippedItem ? isGearBroken(equippedItem) : false,
          });
          return {
            uid: it.uid,
            defId: def.id,
            name: def.name,
            qty: it.qty,
            quality: def.quality,
            equipped,
            canEquip: def.slot === 'mainhand',
            canUse,
            desc,
            stats,
            traits,
            detail,
            compare,
            sellPrice: sellPrice(it),
            kind: def.kind,
            dur,
            maxDur: def.kind === 'gear' ? GEAR_MAX_DURABILITY : null,
            canDismantle: def.kind === 'gear' && !equipped,
          };
        });
      })(),
      bagCap: BAG_CAPACITY,
      materialsSell: materialsSellPreview(w),
      commonGearSell: commonGearSellPreview(w),
      uncommonGearSell: uncommonGearSellPreview(w),
      rareGearSell: rareGearSellPreview(w),
      bagSlotsLeft: Math.max(0, BAG_CAPACITY - w.bag.length),
      attrs: attrPanelRows(w),
      previewAtk: preview.next.atk,
      previewDef: preview.next.def,
      previewHp: preview.next.maxHp,
      previewCrit: Math.round(preview.next.critChance * 1000) / 10,
      draftLeft: p.unspentAttr - draft,
      skills: skillsForClass(p.classId).map((id) => {
        const def = SKILL_DEFS[id];
        const level = w.skills[id] ?? 0;
        const learned = level > 0;
        const barSlot = skillBarSlotOf(w, id);
        return {
          id,
          name: def.name,
          level,
          desc: def.desc,
          reqLevel: def.reqLevel,
          learned,
          canLearn: canLearnSkill(w, id),
          canUpgrade: canUpgradeSkill(w, id),
          upcoming: !def.implemented,
          cost: upgradeCost(level),
          learnCost: 1,
          barSlot,
          barLabel: barSlot >= 0 ? skillBarLabelOf(barSlot) : null,
          compare: learned ? skillCompareLines(w, id, 0) : [],
        };
      }),
      specs: specsForClass(p.classId).map((s) => ({
        id: s.id,
        name: s.name,
        tag: s.tag,
        effects: [...s.effects],
      })),
      specId: w.specId,
      specName: currentSpec?.name ?? null,
      needsSpec: needsSpecPick(w),
      specPickOpen: w.specPickOpen,
      specNodePickTier: w.specNodePickTier,
      specNodeOptions:
        w.specNodePickTier !== null && w.specId
          ? nodesForSpecTier(w.specId, w.specNodePickTier).map((n) => ({
              id: n.id,
              name: n.name,
              desc: n.desc,
            }))
          : [],
      specNodePicks: Object.entries(w.specNodes ?? {})
        .map(([tier, id]) => {
          const def = specNodeDef(id);
          return def
            ? { tier: Number(tier), name: def.name, desc: def.desc }
            : null;
        })
        .filter((x): x is { tier: number; name: string; desc: string } => Boolean(x))
        .sort((a, b) => a.tier - b.tier),
      zoneName: zone?.name ?? w.zoneId,
      bossName: boss?.name ?? null,
      bossHp: boss?.hp ?? 0,
      bossMaxHp: boss?.maxHp ?? 0,
      bossCast: bossCastLabel(boss?.castId ?? null),
      bossCastRatio:
        boss && boss.castMax > 0 ? 1 - boss.castT / boss.castMax : 0,
      eliteName: nearbyElite?.name ?? null,
      eliteHp: nearbyElite?.hp ?? 0,
      eliteMaxHp: nearbyElite?.maxHp ?? 0,
      eliteAffixes: nearbyElite ? eliteAffixTags(nearbyElite) : [],
      eliteAffixHints: nearbyElite ? eliteAffixHints(nearbyElite) : [],
      ngPlusLevel: w.ngPlusLevel,
      canStartNgPlus: canStartNgPlus(w),
      challengeActive: w.challengeActive,
      challengeT: w.challengeT,
      challengeFloor: w.challengeFloor,
      challengeBestFloor: w.challengeBestFloor,
      challengeRunAffixes: w.challengeRunAffixes.map((id) => eliteAffixLabel(id)),
      challengeAffixHints: eliteAffixHintsOf(w.challengeRunAffixes),
      legendaryCatalog: listLegendaryCatalog(w),
      levelToast: w.levelToastT > 0 ? w.levelToastText : null,
      tutorialHint: tutorialHint(w),
      potionReady:
        p.potionCd <= 0 &&
        p.drinkT <= 0 &&
        w.bag.some((it) => {
          const d = ITEM_DEFS[it.defId];
          if (d?.kind !== 'potion') {
            return false;
          }
          if ((d.heal ?? 0) > 0 && p.hp < p.maxHp) {
            return true;
          }
          if ((d.mana ?? 0) > 0 && (d.heal ?? 0) <= 0 && p.rage < p.maxRage) {
            return true;
          }
          return false;
        }),
      lifePotionReady:
        p.potionCd <= 0 &&
        p.drinkT <= 0 &&
        p.hp < p.maxHp &&
        w.bag.some((it) => {
          const d = ITEM_DEFS[it.defId];
          return d?.kind === 'potion' && (d.heal ?? 0) > 0 && it.qty > 0;
        }),
      manaPotionReady:
        p.potionCd <= 0 &&
        p.drinkT <= 0 &&
        p.rage < p.maxRage &&
        w.bag.some((it) => {
          const d = ITEM_DEFS[it.defId];
          return d?.kind === 'potion' && (d.mana ?? 0) > 0 && (d.heal ?? 0) <= 0 && it.qty > 0;
        }),
      potionCd: p.potionCd,
      potionCdMax: POTION.sharedCd,
      potionCount: w.bag.reduce((sum, it) => {
        const d = ITEM_DEFS[it.defId];
        if (d?.kind !== 'potion') {
          return sum;
        }
        if ((d.heal ?? 0) > 0 || (d.mana ?? 0) > 0) {
          return sum + it.qty;
        }
        return sum;
      }, 0),
      lifePotionCount: w.bag.reduce((sum, it) => {
        const d = ITEM_DEFS[it.defId];
        if (d?.kind === 'potion' && (d.heal ?? 0) > 0) {
          return sum + it.qty;
        }
        return sum;
      }, 0),
      manaPotionCount: w.bag.reduce((sum, it) => {
        const d = ITEM_DEFS[it.defId];
        if (d?.kind === 'potion' && (d.mana ?? 0) > 0 && (d.heal ?? 0) <= 0) {
          return sum + it.qty;
        }
        return sum;
      }, 0),
      lowHp:
        !p.awaitRespawn &&
        p.hp > 0 &&
        p.maxHp > 0 &&
        p.hp / p.maxHp <= HUD_FEEDBACK.lowHpRatio,
      potionUrge:
        !p.awaitRespawn &&
        p.hp > 0 &&
        p.maxHp > 0 &&
        p.hp / p.maxHp <= HUD_FEEDBACK.lowHpRatio &&
        p.hp < p.maxHp &&
        w.bag.some((it) => {
          const d = ITEM_DEFS[it.defId];
          return d?.kind === 'potion' && (d.heal ?? 0) > 0 && it.qty > 0;
        }),
      lowResource:
        !p.awaitRespawn &&
        p.hp > 0 &&
        p.maxRage > 0 &&
        p.rage / p.maxRage <= HUD_FEEDBACK.lowResourceRatio &&
        (p.classId === 'mage' ||
          w.bag.some((it) => {
            const d = ITEM_DEFS[it.defId];
            return d?.kind === 'potion' && (d.mana ?? 0) > 0 && it.qty > 0;
          })),
      manaPotionUrge:
        !p.awaitRespawn &&
        p.hp > 0 &&
        p.maxRage > 0 &&
        p.rage < p.maxRage &&
        p.rage / p.maxRage <= HUD_FEEDBACK.lowResourceRatio &&
        w.bag.some((it) => {
          const d = ITEM_DEFS[it.defId];
          return d?.kind === 'potion' && (d.mana ?? 0) > 0 && it.qty > 0;
        }),
      levelGapWarn: (() => {
        if (p.awaitRespawn || w.zoneId === 'a01' || w.zoneId === 'challenge') {
          return null;
        }
        const gap = zoneLevelGap(w);
        if (gap < 5) {
          return null;
        }
        return `越级约 ${Math.floor(gap)} 级 · 命中与输出下降 · 受伤增加`;
      })(),
      lootBagPulse: w.lootFlies.length > 0,
      qaActive: isQaSessionOn(),
      qaGod: isQaGod(),
      audio: { ...getAudioPrefs() },
      gameplay: { ...getGameplayPrefs() },
    });
  }

  private fitCanvas(): void {
    const parent = this.canvas.parentElement ?? document.body;
    const rect = parent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.view.resize(rect.width, rect.height);
  }
}
