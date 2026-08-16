import { bgm } from '../audio/bgm';
import { Keyboard } from '../input/keyboard';
import { GameRenderer } from '../render/game-renderer';
import { ITEM_DEFS } from './data/item-defs';
import { FIXED_DT, MAX_FRAME_STEPS } from './config';
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
import { equipMainhand, discardItem, BAG_CAPACITY, applyGearStats, usePotion } from './systems/inventory';
import { chooseRespawn } from './systems/respawn';
import { stepPlayer } from './systems/player-controller';
import {
  CAMP_NPCS,
  SHOP_STOCK,
  buyShopItem,
  canEnhanceWeapon,
  countEnhanceMaterials,
  enhanceGoldCost,
  enhanceWeapon,
  resetAttributes,
  resetSkills,
  resetSpecAtCamp,
  sellBagItem,
  teleportTo,
} from './systems/camp';
import { hasSave, loadWorld, saveWorld, autoSaveWorld } from './systems/save';
import {
  SKILL_DEFS,
  canUpgradeSkill,
  upgradeCost,
  upgradeSkill,
  type SkillId,
} from './systems/skills';
import {
  WARRIOR_SPECS,
  needsSpecPick,
  pickSpecialization,
  specDef,
  type WarriorSpecId,
} from './systems/specialization';
import { activeBoss, bossCastLabel } from './systems/boss';
import { eliteAffixTags } from './systems/elite-affixes';
import { canStartNgPlus, startNgPlus } from './systems/ng-plus';
import { startChallenge, stepChallenge, sanitizeChallengeOnLoad } from './systems/challenge';
import { listLegendaryCatalog } from './systems/legendary';
import { secretPromptLabel } from './systems/secrets';
import { listTravelNodes } from './systems/zone-travel';
import { tutorialHint, bootTutorialToast } from './systems/tutorial';
import { getAudioPrefs, setAudioPrefs } from '../audio/prefs';
import { ZONES } from './data/zones';
import type { AttrKey, HudSnapshot, RespawnChoice, World } from './types';
import { createWorld } from './world';

export class Game {
  private readonly world: World;
  private readonly input = new Keyboard();
  private readonly view: GameRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly onHud?: (snap: HudSnapshot) => void;
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

  constructor(canvas: HTMLCanvasElement, onHud?: (snap: HudSnapshot) => void) {
    this.canvas = canvas;
    this.onHud = onHud;
    this.world = createWorld();
    this.view = new GameRenderer(canvas);
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    void this.boot();
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

  discardBagItem(uid: number): void {
    if (discardItem(this.world, uid)) {
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

  buyItem(defId: string): void {
    this.world.campMessage = buyShopItem(this.world, defId);
    this.bumpHud();
  }

  sellItem(uid: number): void {
    this.world.campMessage = sellBagItem(this.world, uid);
    this.bumpHud();
  }

  enhance(): void {
    this.world.campMessage = enhanceWeapon(this.world);
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
    if (pickSpecialization(this.world, id as WarriorSpecId)) {
      this.bumpHud();
    }
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
    const prevZone = this.world.zoneId;
    if (!startNgPlus(this.world)) {
      this.bumpHud();
      return;
    }
    applyGearStats(this.world.player, this.world);
    if (this.world.zoneId !== prevZone) {
      this.view.rebuildZone(this.world);
      bgm.setTheme(this.world.kitTheme);
    } else {
      this.view.rebuildZone(this.world);
    }
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
    saveWorld(this.world);
    this.bumpHud();
  }

  load(): void {
    if (loadWorld(this.world)) {
      sanitizeChallengeOnLoad(this.world);
      this.view.rebuildZone(this.world);
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
    if (hasSave()) {
      loadWorld(this.world);
      sanitizeChallengeOnLoad(this.world);
      this.view.rebuildZone(this.world);
      bgm.setTheme(this.world.kitTheme);
    } else {
      bootTutorialToast(this.world);
    }
    this.input.attach();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.unlockAudio);
    this.canvas.addEventListener('mousedown', this.onMouse);
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
    this.canvas.removeEventListener('mousedown', this.onMouse);
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
    this.acc += elapsed;
    const willStep = this.acc >= FIXED_DT;
    const input = this.input.sample(willStep);
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < MAX_FRAME_STEPS) {
      const zoneBefore = this.world.zoneId;
      stepPlayer(this.world, input, FIXED_DT);
      stepChallenge(this.world, FIXED_DT);
      if (this.world.zoneId !== zoneBefore) {
        this.view.rebuildZone(this.world);
        bgm.setTheme(this.world.kitTheme);
        autoSaveWorld(this.world);
      }
      this.acc -= FIXED_DT;
      steps += 1;
    }
    const bossNow = activeBoss(this.world);
    bgm.setCombat(Boolean(bossNow) || this.world.player.combatT > 0);
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
    const boss = activeBoss(w);
    const nearbyElite =
      w.dummies.find(
        (d) =>
          d.elite &&
          !d.boss &&
          d.hp > 0 &&
          Math.abs(d.x - p.x) < 10 &&
          Math.abs(d.y - p.y) < 2.5,
      ) ?? null;
    const key = `${p.hp}:${Math.floor(p.rage)}:${p.awaitRespawn ? 1 : 0}:${Math.ceil(p.slamCd * 10)}:${Math.ceil(p.bashCd * 10)}:${p.rageWarnT > 0 ? 1 : 0}:${w.gold}:${w.invOpen ? 1 : 0}:${w.charOpen ? 1 : 0}:${w.skillOpen ? 1 : 0}:${w.catalogOpen ? 1 : 0}:${w.settingsOpen ? 1 : 0}:${w.specPickOpen ? 1 : 0}:${w.specId ?? ''}:${w.campOpen ?? ''}:${w.nearbyCamp ?? ''}:${w.nearbyHubPortal ? 1 : 0}:${w.campMessage}:${w.nearbyLootName ?? ''}:${w.nearbySecretId ?? ''}:${w.mainhandUid}:${bagKey}:${p.atk}:${p.level}:${p.xp}:${p.unspentAttr}:${p.unspentSkill}:${p.weaponEnhance}:${draftKey}:${skillKey}:${boss ? `${boss.hp}:${boss.castId}:${boss.castT.toFixed(1)}` : ''}:${nearbyElite ? `${nearbyElite.id}:${nearbyElite.hp}:${nearbyElite.affixes.join(',')}` : ''}:${w.ngPlusLevel}:${canStartNgPlus(w) ? 1 : 0}:${w.challengeActive ? 1 : 0}:${Math.ceil(w.challengeT)}:${w.discoveredLegendaries.join(',')}:${w.levelToastT > 0 ? w.levelToastText : ''}:${w.tutorialStep}:${tutorialHint(w) ?? ''}:${JSON.stringify(getAudioPrefs())}:${w.zoneId}:${w.unlockedZones.join(',')}:${w.lootFlies.length > 0 ? 1 : 0}`;
    if (key === this.lastHud) {
      return;
    }
    this.lastHud = key;
    const nearbyNpc = CAMP_NPCS.find((n) => n.id === w.nearbyCamp);
    const zone = ZONES[w.zoneId];
    const travelNodes = listTravelNodes(w);
    const attrResetCost =
      p.attrResetCount === 0 ? 0 : 20 * p.level * p.attrResetCount;
    const skillResetCost =
      p.skillResetCount === 0 ? 0 : 20 * p.level * p.skillResetCount;
    const specResetCost =
      p.specResetCount === 0 ? 0 : 20 * p.level * p.specResetCount;
    const currentSpec = specDef(w.specId as WarriorSpecId | null);
    this.onHud?.({
      hp: p.hp,
      maxHp: p.maxHp,
      rage: Math.floor(p.rage),
      maxRage: p.maxRage,
      atk: p.atk,
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
      canEnhance: canEnhanceWeapon(w),
      slamCd: p.slamCd,
      bashCd: p.bashCd,
      rageWarn: p.rageWarnT > 0,
      dead: p.hp <= 0,
      awaitRespawn: p.awaitRespawn,
      hasBanner: p.hasBanner,
      invOpen: w.invOpen,
      charOpen: w.charOpen,
      skillOpen: w.skillOpen,
      catalogOpen: w.catalogOpen,
      settingsOpen: w.settingsOpen,
      campOpen: w.campOpen,
      nearbyCamp: w.nearbyCamp,
      nearbyCampPrompt: nearbyNpc
        ? nearbyNpc.name
        : w.nearbyHubPortal
          ? '回营传送'
          : null,
      campMessage: w.campMessage || null,
      travelNodes: travelNodes.map((n) => ({ id: n.id, label: n.label })),
      shopStock: SHOP_STOCK.map((s) => ({
        defId: s.defId,
        name: ITEM_DEFS[s.defId]?.name ?? s.defId,
        price: s.price,
      })),
      attrResetCost,
      skillResetCost,
      specResetCost,
      nearbyLootName: w.nearbyLootName,
      nearbySecretPrompt: secretPromptLabel(w),
      bag: w.bag.map((it) => {
        const def = ITEM_DEFS[it.defId];
        const canUse = def?.kind === 'potion' && (def.heal ?? 0) > 0;
        let desc: string | null = def?.effectDesc ?? null;
        if (!desc && def?.kind === 'potion' && def.heal) {
          const pct = def.heal >= 220 ? 50 : def.heal >= 140 ? 35 : 22;
          desc = `回复约 ${pct}% 最大生命（至少 ${def.heal}）· 按 R 或背包使用`;
        }
        if (!desc && def?.kind === 'material') {
          desc = '材料 · 可用于铁匠强化或营地出售';
        }
        return {
          uid: it.uid,
          name: def?.name ?? it.defId,
          qty: it.qty,
          quality: def?.quality ?? 'common',
          equipped: w.mainhandUid === it.uid,
          canEquip: def?.slot === 'mainhand',
          canUse,
          desc,
        };
      }),
      bagCap: BAG_CAPACITY,
      attrs: attrPanelRows(w),
      previewAtk: preview.next.atk,
      previewDef: preview.next.def,
      previewHp: preview.next.maxHp,
      previewCrit: Math.round(preview.next.critChance * 1000) / 10,
      draftLeft: p.unspentAttr - draft,
      skills: (Object.keys(SKILL_DEFS) as SkillId[]).map((id) => {
        const def = SKILL_DEFS[id];
        const level = w.skills[id] ?? 0;
        return {
          id,
          name: def.name,
          level,
          desc: def.desc,
          canUpgrade: canUpgradeSkill(w, id),
          cost: upgradeCost(level),
        };
      }),
      specs: WARRIOR_SPECS.map((s) => ({
        id: s.id,
        name: s.name,
        tag: s.tag,
        effects: [...s.effects],
      })),
      specId: w.specId,
      specName: currentSpec?.name ?? null,
      needsSpec: needsSpecPick(w),
      specPickOpen: w.specPickOpen,
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
      ngPlusLevel: w.ngPlusLevel,
      canStartNgPlus: canStartNgPlus(w),
      challengeActive: w.challengeActive,
      challengeT: w.challengeT,
      legendaryCatalog: listLegendaryCatalog(w),
      levelToast: w.levelToastT > 0 ? w.levelToastText : null,
      tutorialHint: tutorialHint(w),
      potionReady: w.bag.some((it) => {
        const d = ITEM_DEFS[it.defId];
        return d?.kind === 'potion' && (d.heal ?? 0) > 0;
      }),
      lootBagPulse: w.lootFlies.length > 0,
      audio: { ...getAudioPrefs() },
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
