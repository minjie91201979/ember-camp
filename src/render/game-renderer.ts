import * as THREE from 'three';
import { CAMERA, DAY_NIGHT, PLAYER, attackDurationOf } from '../game/config';
import type { PlayerClassId } from '../game/data/classes';
import { ITEM_DEFS } from '../game/data/item-defs';
import { DUST_LIFE, LEVEL_POPUP_LIFE, POPUP_LIFE } from '../game/systems/combat';
import { LOOT_FLY_LIFE } from '../game/systems/loot';
import type { Dummy, GroundLoot, LootFly, Rect, World } from '../game/types';
import {
  createPlayerRig,
  createRotwolfRig,
  createTreantRig,
  flashWarrior,
  poseRotwolf,
  poseTreant,
  poseWarrior,
  applyVanishStealth,
  applyNgPlusCloak,
  type BeastRig,
  type WarriorRig,
} from './actor-rig';
import {
  createDamagePopupMesh,
  createDustMesh,
  createGoldPopupMesh,
  createHpBar,
  createInteractPromptMesh,
  createLevelUpPopupMesh,
  createMissPopupMesh,
  createXpPopupMesh,
  refreshDamagePopupMesh,
  refreshGoldPopupMesh,
  refreshXpPopupMesh,
  updateHpBar,
} from './combat-fx';
import { createBanner, type BannerView } from './banner';
import { createCampfire, type CampfireView } from './campfire';
import { createApothecaryStall, createForge, createStall, createTorch, createWeaponsmithStall, type PropView } from './camp-props';
import { createEndGate, createSecretChest, type SecretChestView } from './landmarks';
import { createBreakableMesh, placeKitDecor } from './level-kit-view';
import { createPalisade } from './palisade';
import { PALETTE, QUALITY_COLOR } from './palette';
import { skillCastFxOf } from './skill-cast-fx';
import { createRiver, tickRiver } from './river';
import { KIT_THEMES, type KitThemeId } from '../game/data/level-kit';
import { sceneThemeOf } from '../game/data/scene-themes';
import { ZONES, isZoneEndWall } from '../game/data/zones';
import { CAMP_NPCS } from '../game/systems/camp';
import {
  buildFarPeakRange,
  buildForestBelt,
  buildHillRange,
  buildHorizonRidge,
  buildMountainMist,
  buildMountainRange,
  buildSkyClouds,
  createCelestialGlow,
  createSkyGroup,
  scatterGroundDressing,
} from './scenery';
import { createTeleport, type TeleportView } from './teleport';
import { cloneRepeat, loadP0Textures, type P0Textures } from './textures';

type DummyView = {
  root: THREE.Group;
  rig: BeastRig;
  kind: Dummy['kind'];
  spark: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  hpRoot: THREE.Group;
  hpFill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};

type ScrollLayer = {
  obj: THREE.Object3D;
  followX: number;
  followY: number;
  offsetX: number;
  offsetY: number;
};

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera;
  private readonly camPos = new THREE.Vector3(2, 2, CAMERA.z);
  private readonly dummyViews = new Map<number, DummyView>();
  private readonly popupViews = new Map<
    number,
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly dustViews = new Map<
    number,
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly lootViews = new Map<number, THREE.Group>();
  private readonly lootFlyViews = new Map<
    number,
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly bagTarget = new THREE.Vector3();
  private readonly dustPool: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly damagePopupPool: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  >[] = [];
  private readonly lootFlyPool: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  >[] = [];
  private readonly banners: BannerView[] = [];
  private readonly scrollLayers: ScrollLayer[] = [];
  private readonly waterMats: THREE.ShaderMaterial[] = [];
  private playerMesh: THREE.Group | null = null;
  private warrior: WarriorRig | null = null;
  private playerClassId: PlayerClassId = 'warrior';
  private novaRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null = null;
  private attackArc: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null =
    null;
  private bashBurst: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null =
    null;
  private tex: P0Textures | null = null;
  private hemi: THREE.HemisphereLight | null = null;
  private ambient: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private moonLight: THREE.DirectionalLight | null = null;
  private sunPoint: THREE.PointLight | null = null;
  private moonPoint: THREE.PointLight | null = null;
  private playerLight: THREE.PointLight | null = null;
  private frontLight: THREE.DirectionalLight | null = null;
  private sunMesh: THREE.Mesh | null = null;
  private moonMesh: THREE.Mesh | null = null;
  private skyMat: THREE.ShaderMaterial | null = null;
  private moonLayer: ScrollLayer | null = null;
  private sunLayer: ScrollLayer | null = null;
  private mistLayer: ScrollLayer | null = null;
  private skyCloudLayer: ScrollLayer | null = null;
  private teleport: TeleportView | null = null;
  private campfire: CampfireView | null = null;
  private campProps: PropView[] = [];
  private secretChests: SecretChestView[] = [];
  private readonly breakableViews = new Map<
    string,
    THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>
  >();
  private interactPrompt: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  > | null = null;
  private interactPromptKey = '';
  private readonly hazardViews = new Map<
    number,
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly projectileViews = new Map<
    number,
    THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly trapViews = new Map<
    number,
    THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  >();
  private readonly blizzardViews = new Map<
    number,
    THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
  >();
  private fogColor = new THREE.Color(PALETTE.dayFog);
  private sceneTheme = sceneThemeOf('woodland');
  private zoneGroup: THREE.Group | null = null;
  private bossGate: THREE.Group | null = null;
  private width = 1;
  private height = 1;
  private clock = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.scene.background = new THREE.Color(PALETTE.skyDayTop);
    this.scene.fog = new THREE.Fog(this.fogColor, 22, 72);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(2, CAMERA.lookY, 0);

    this.addLights();
  }

  async load(): Promise<void> {
    this.tex = await loadP0Textures();
    this.addParallax();
    this.addCelestials();
    this.mountPlayerRig('warrior');
  }

  setPlayerClass(classId: PlayerClassId): void {
    if (this.playerClassId === classId && this.warrior) {
      return;
    }
    this.mountPlayerRig(classId);
  }

  private mountPlayerRig(classId: PlayerClassId): void {
    const tex = this.tex;
    if (!tex) {
      this.playerClassId = classId;
      return;
    }
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
      this.playerMesh = null;
      this.warrior = null;
      this.attackArc = null;
      this.bashBurst = null;
      this.novaRing = null;
    }
    this.playerClassId = classId;
    this.warrior = createPlayerRig(classId);
    this.playerMesh = this.warrior.root;
    const attack = this.makeAdditive(tex.slash, 1.7, 1.15);
    attack.position.set(0.85, 0.2, 0.3);
    attack.visible = false;
    this.attackArc = attack;
    const bash = this.makeAdditive(tex.hitSpark, 1.55, 1.55);
    bash.position.set(0.72, 0.22, 0.2);
    bash.visible = false;
    this.bashBurst = bash;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, PLAYER.frostNovaRadius * 0.95, 32),
      new THREE.MeshBasicMaterial({
        color: PALETTE.mage,
        transparent: true,
        opacity: 0.55,
        depthTest: false,
        fog: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.08, 0);
    ring.visible = false;
    this.novaRing = ring;
    this.playerMesh.add(attack, bash, ring);
    this.scene.add(this.playerMesh);
  }

  buildWorld(world: World): void {
    this.rebuildZone(world);
  }

  /** 跨区传送时清空并重建关卡几何 / 怪 / 地标。 */
  rebuildZone(world: World): void {
    const tex = this.requireTex();
    this.clearZone();
    this.sceneTheme = sceneThemeOf(world.kitTheme);
    const root = new THREE.Group();
    root.name = 'zone';
    this.zoneGroup = root;
    this.scene.add(root);
    this.addTerrain(world.platforms, world.rivers, tex);
    for (const dummy of world.dummies) {
      const view = this.createDummy(dummy, tex);
      root.add(view.root);
      this.dummyViews.set(dummy.id, view);
    }
    if (world.zoneId === 'a01') {
      this.addCampCorner(tex);
    } else {
      const zone = ZONES[world.zoneId];
      if (zone?.hubPortal) {
        this.teleport = createTeleport(tex, zone.hubPortal.x);
        root.add(this.teleport.group);
      }
      for (const point of zone?.banners ?? []) {
        const banner = createBanner(tex, point.x);
        root.add(banner.group);
        this.banners.push(banner);
      }
    }
    this.addKitProps(tex, world);
    const zone = ZONES[world.zoneId];
    if (zone) {
      root.add(placeKitDecor(zone.kit, (zone.theme as KitThemeId) ?? 'woodland', tex));
    }
    root.add(scatterGroundDressing(world.platforms, tex));
  }

  private clearZone(): void {
    for (const [, view] of this.dummyViews) {
      this.scene.remove(view.root);
      this.scene.remove(view.hpRoot);
    }
    this.dummyViews.clear();
    for (const [, mesh] of this.breakableViews) {
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
    }
    this.breakableViews.clear();
    for (const [, mesh] of this.hazardViews) {
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
    }
    this.hazardViews.clear();
    for (const [, mesh] of this.projectileViews) {
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
    }
    this.projectileViews.clear();
    for (const [, group] of this.lootViews) {
      this.scene.remove(group);
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material as THREE.Material;
          mat?.dispose();
        }
      });
    }
    this.lootViews.clear();
    for (const [, mesh] of this.lootFlyViews) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.lootFlyViews.clear();
    this.banners.length = 0;
    this.campProps.length = 0;
    this.secretChests.length = 0;
    this.waterMats.length = 0;
    this.teleport = null;
    this.campfire = null;
    if (this.zoneGroup) {
      this.scene.remove(this.zoneGroup);
      this.zoneGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) {
            for (const m of mat) {
              m.dispose();
            }
          } else if (mat) {
            mat.dispose();
          }
        }
      });
      this.zoneGroup = null;
    }
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / this.height;
    const h = CAMERA.frustum / 2;
    const w = h * aspect;
    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
  }

  render(world: World, alpha: number, dt: number): void {
    if (!this.playerMesh || !this.warrior || !this.attackArc || !this.bashBurst) {
      return;
    }
    this.clock += dt;
    const p = world.player;
    const x = p.prevX + (p.x - p.prevX) * alpha;
    const y = p.prevY + (p.y - p.prevY) * alpha;

    this.playerMesh.position.set(x, y + 0.68, 0);
    this.playerMesh.scale.set(p.facing, 1, 1);
    if (this.playerLight) {
      this.playerLight.position.set(x + p.facing * 0.35, y + 1.6, 7.2);
      const night = 0.5 - 0.5 * Math.cos((this.clock / DAY_NIGHT.period) * Math.PI * 2);
      const flicker = 0.88 + Math.sin(this.clock * 17) * 0.08 + Math.sin(this.clock * 31) * 0.05;
      const levelBoost = p.levelFxT > 0 ? 1.55 + Math.sin(this.clock * 22) * 0.25 : 1;
      this.playerLight.intensity = (3.6 + night * 2.8) * flicker * levelBoost;
      if (p.levelFxT > 0) {
        this.playerLight.color.setHex(PALETTE.gold);
      } else if (world.ngPlusLevel > 0) {
        this.playerLight.color.setHex(PALETTE.gold);
        this.playerLight.intensity *= 1.08;
      } else {
        this.playerLight.color.setHex(
          this.playerClassId === 'mage'
            ? PALETTE.mage
            : this.playerClassId === 'hunter'
              ? PALETTE.hunter
              : this.playerClassId === 'rogue'
                ? PALETTE.rogue
                : PALETTE.ember,
        );
      }
    }
    poseWarrior(this.warrior, p, this.clock);
    applyNgPlusCloak(this.warrior, world.ngPlusLevel);
    const swinging = p.state === 'attack';
    const swingU = swinging ? 1 - p.attackT / attackDurationOf(p.attackKind) : 0;
    const impact = swinging && swingU > 0.32 && swingU < 0.72;
    const fx = swinging ? skillCastFxOf(p.attackKind) : null;
    const mode = fx?.mode ?? 'none';

    this.attackArc.visible = swinging && mode === 'arc';
    if (this.attackArc.visible && fx) {
      const pulse = impact ? 1 + Math.sin(swingU * Math.PI * 2) * 0.12 : 0.85;
      this.attackArc.scale.set(fx.grow * pulse, fx.tall * pulse, 1);
      this.attackArc.rotation.z =
        fx.grow >= 1.4 ? -0.35 + swingU * 1.1 : -0.2 + swingU * 0.85;
      this.attackArc.material.opacity = impact ? 0.95 : 0.35 + swingU * 0.4;
      this.attackArc.material.color.setHex(fx.color);
    }

    this.bashBurst.visible = swinging && mode === 'burst';
    if (this.bashBurst.visible && fx) {
      const pulse = impact
        ? fx.grow + Math.sin(this.clock * 40) * 0.12
        : 0.7 + swingU * 0.5;
      this.bashBurst.scale.set(pulse, pulse, 1);
      this.bashBurst.material.opacity = impact ? 1 : 0.45;
      this.bashBurst.material.color.setHex(fx.color);
    }

    if (this.novaRing) {
      this.novaRing.visible = swinging && mode === 'ring';
      if (this.novaRing.visible && fx) {
        const pulse = (0.9 + swingU * 0.45) * fx.grow;
        this.novaRing.scale.setScalar(pulse);
        this.novaRing.material.opacity = impact ? 0.75 : 0.4;
        this.novaRing.material.color.setHex(fx.color);
      }
    }

    if (this.playerLight && impact && fx) {
      this.playerLight.intensity *= fx.lightBoost;
    }

    flashWarrior(
      this.warrior,
      p.state === 'hurt'
        ? 'hurt'
        : p.levelFxT > 0
          ? 'level'
          : p.iFrame > 0 && (p.vanishT ?? 0) <= 0
            ? 'iframe'
            : 'none',
    );
    applyVanishStealth(this.warrior, (p.vanishT ?? 0) > 0);

    const lookAheadX =
      p.facing * (CAMERA.lookAhead + Math.min(Math.abs(p.vx), 8) * CAMERA.lookAheadVel);
    const k = 1 - Math.exp(-CAMERA.damp * dt);
    this.camPos.x += (x + lookAheadX - this.camPos.x) * k;
    this.camPos.y += (y + CAMERA.lookY - this.camPos.y) * k;
    const shake = world.shake;
    const ox = shake > 0 ? Math.sin(this.clock * 78) * shake * 0.16 : 0;
    const oy = shake > 0 ? Math.cos(this.clock * 92) * shake * 0.11 : 0;
    this.camera.position.set(this.camPos.x + ox, this.camPos.y + oy, CAMERA.z);
    this.camera.lookAt(this.camPos.x + ox, this.camPos.y + oy, 0);
    if (this.frontLight) {
      this.frontLight.position.set(this.camPos.x, this.camPos.y + 2.4, 14);
      this.frontLight.target.position.set(this.camPos.x, this.camPos.y - 1.6, 0);
      this.frontLight.target.updateMatrixWorld();
    }

    this.updateDayNight(world.player.awaitRespawn || world.player.hp <= 0);
    if (this.mistLayer) {
      this.mistLayer.offsetX = 1.2 + Math.sin(this.clock * 0.06) * 1.35;
      for (const child of this.mistLayer.obj.children) {
        const baseY = Number(child.userData.baseY ?? child.position.y);
        child.position.y = baseY + Math.sin(this.clock * 0.28 + child.position.x * 0.35) * 0.16;
      }
    }
    if (this.skyCloudLayer) {
      this.skyCloudLayer.offsetX = 0.8 + Math.sin(this.clock * 0.03) * 2.2;
      for (const child of this.skyCloudLayer.obj.children) {
        const baseY = Number(child.userData.baseY ?? child.position.y);
        child.position.y = baseY + Math.sin(this.clock * 0.12 + child.position.x * 0.2) * 0.12;
      }
    }
    this.applyParallax();
    this.syncCelestialLights();

    for (const dummy of world.dummies) {
      let view = this.dummyViews.get(dummy.id);
      if (!view) {
        view = this.createDummy(dummy, this.requireTex());
        (this.zoneGroup ?? this.scene).add(view.root);
        this.dummyViews.set(dummy.id, view);
      }
      const alive = dummy.hp > 0;
      view.root.visible = alive || dummy.deadT < 0.55;
      const foot = (dummy.kind === 'treant' ? 0.7 : 0.5) * dummy.visualScale;
      const bossScale = dummy.visualScale;
      view.root.position.set(dummy.x, dummy.y + foot, 0);
      if (view.kind === 'treant') {
        poseTreant(view.rig, dummy, this.clock);
      } else {
        poseRotwolf(view.rig, dummy, this.clock);
      }
      view.spark.visible = dummy.flash > 0 || dummy.state === 'fuse' || dummy.castId === 'charge';
      const scale = (alive ? 1 : Math.max(0.15, 1 - dummy.deadT * 1.6)) * bossScale;
      view.root.scale.set(dummy.facing * scale, scale, scale);
      view.hpRoot.visible = alive;
      if (alive) {
        const head = (dummy.kind === 'treant' ? 2.35 : 1.85) * bossScale;
        view.hpRoot.position.set(dummy.x, dummy.y + head, 0.35);
        updateHpBar(view.hpFill, dummy.hp / dummy.maxHp);
      }
    }
    this.syncPopups(world);
    this.syncDust(world);
    this.syncLoot(world);
    this.syncLootFlies(world);
    this.syncHazards(world);
    this.syncProjectiles(world);
    this.syncTraps(world);
    this.syncBlizzards(world);
    this.syncBreakables(world);
    this.syncInteractPrompt(world);
    tickRiver(this.waterMats, this.clock);
    this.teleport?.tick(this.clock);
    this.campfire?.tick(this.clock);
    for (const banner of this.banners) {
      const lit =
        world.player.hasBanner && Math.abs(banner.x - world.player.bannerX) < 0.35;
      banner.setLit(lit);
      banner.tick(this.clock);
    }
    for (const prop of this.campProps) {
      prop.tick(this.clock);
    }
    for (const chest of this.secretChests) {
      chest.tick(this.clock, Boolean(world.secretsClaimed[chest.id]));
    }
    this.syncBossGate(world);

    this.renderer.render(this.scene, this.camera);
  }

  private syncBossGate(world: World): void {
    if (!this.bossGate) {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color: PALETTE.ember,
        transparent: true,
        opacity: 0.82,
        depthTest: false,
        fog: false,
      });
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), mat);
      postL.position.set(-0.22, 1.2, 0.2);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), mat.clone());
      postR.position.set(0.22, 1.2, 0.2);
      const barMat = mat.clone();
      barMat.color.setHex(PALETTE.gold);
      for (let i = 0; i < 4; i += 1) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), barMat.clone());
        bar.position.set(0, 0.45 + i * 0.48, 0.22);
        group.add(bar);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.2), barMat.clone());
      lintel.position.set(0, 2.35, 0.2);
      group.add(postL, postR, lintel);
      group.visible = false;
      this.scene.add(group);
      this.bossGate = group;
    }
    const closed = world.bossGateClosed;
    this.bossGate.visible = closed;
    if (closed) {
      this.bossGate.position.set(world.bossGateX, 0, 0.35);
      const pulse = 0.75 + Math.sin(this.clock * 6) * 0.12;
      this.bossGate.scale.set(1, pulse > 0.9 ? 1 : 0.98 + pulse * 0.02, 1);
    }
  }

  dispose(): void {
    this.renderer.dispose();
  }

  private requireTex(): P0Textures {
    if (!this.tex) {
      throw new Error('贴图尚未加载');
    }
    return this.tex;
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xd5e0e4, 0x7a7468, 1.35);
    this.scene.add(hemi);
    this.hemi = hemi;

    const ambient = new THREE.AmbientLight(PALETTE.moonlight, 0.85);
    this.scene.add(ambient);
    this.ambient = ambient;

    const front = new THREE.DirectionalLight(PALETTE.moonlight, 1.35);
    front.position.set(2, 4, 14);
    this.scene.add(front);
    this.scene.add(front.target);
    this.frontLight = front;

    const sun = new THREE.DirectionalLight(0xfff1c8, 1.55);
    sun.position.set(10, 16, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -10;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sunLight = sun;

    const moon = new THREE.DirectionalLight(0xc9d4d8, 0.15);
    moon.position.set(-10, 12, 8);
    this.scene.add(moon);
    this.scene.add(moon.target);
    this.moonLight = moon;

    const follow = new THREE.PointLight(PALETTE.ember, 4.8, 28, 0.85);
    follow.position.set(2, 2.4, 1.1);
    this.scene.add(follow);
    this.playerLight = follow;

  }

  private addScroll(
    obj: THREE.Object3D,
    followX: number,
    followY: number,
    offsetX: number,
    offsetY: number,
  ): ScrollLayer {
    const layer = { obj, followX, followY, offsetX, offsetY };
    this.scrollLayers.push(layer);
    return layer;
  }

  private applyParallax(): void {
    const cx = this.camPos.x;
    const cy = this.camPos.y;
    for (const layer of this.scrollLayers) {
      layer.obj.position.x = cx * layer.followX + layer.offsetX;
      layer.obj.position.y = cy * layer.followY + layer.offsetY;
    }
  }

  private syncCelestialLights(): void {
    const aimX = this.camPos.x;
    const aimY = this.camPos.y;
    if (this.sunMesh && this.sunLight) {
      this.sunMesh.getWorldPosition(this.sunLight.position);
      this.sunLight.target.position.set(aimX, aimY, 0);
      this.sunLight.target.updateMatrixWorld();
    }
    if (this.moonMesh && this.moonLight) {
      this.moonMesh.getWorldPosition(this.moonLight.position);
      this.moonLight.target.position.set(aimX, aimY, 0);
      this.moonLight.target.updateMatrixWorld();
    }
  }

  private addCelestials(): void {
    const moon = new THREE.Group();
    const moonGlow = createCelestialGlow(PALETTE.moonlight, 3.4, 7.5);
    const moonBeam = new THREE.PointLight(PALETTE.moonlight, 1.8, 32, 1.15);
    moon.add(moonGlow, moonBeam);
    this.moonPoint = moonBeam;
    moon.position.z = -52;
    this.scene.add(moon);
    this.moonMesh = moonGlow;
    this.moonLayer = this.addScroll(moon, 1, 0.96, 5.6, 3.55);

    const sun = new THREE.Group();
    const sunGlow = createCelestialGlow(PALETTE.sun, 2.8, 11);
    const sunBeam = new THREE.PointLight(PALETTE.sun, 3.2, 36, 1.1);
    sun.add(sunGlow, sunBeam);
    this.sunPoint = sunBeam;
    sun.position.z = -51;
    this.scene.add(sun);
    this.sunMesh = sunGlow;
    this.sunLayer = this.addScroll(sun, 1, 0.96, -6.2, 3.4);
  }

  private updateDayNight(dead = false): void {
    const theme = this.sceneTheme;
    const ang = (this.clock / DAY_NIGHT.period) * Math.PI * 2;
    const day = 0.5 + 0.5 * Math.cos(ang);
    const sunLift = 2.4 + Math.cos(ang) * 2.2;
    const moonLift = 2.4 - Math.cos(ang) * 2.2;
    if (this.sunLayer) {
      this.sunLayer.offsetY = sunLift;
      this.sunLayer.offsetX = -5.4 + Math.sin(ang) * 1.6;
    }
    if (this.moonLayer) {
      this.moonLayer.offsetY = moonLift;
      this.moonLayer.offsetX = 5.2 - Math.sin(ang) * 1.6;
    }
    if (this.sunMesh) {
      this.sunMesh.parent!.visible = sunLift > 1.2;
      const sunMat = this.sunMesh.material;
      if (sunMat instanceof THREE.ShaderMaterial) {
        sunMat.uniforms.uIntensity!.value = (0.7 + day * 0.65) * theme.sunMult;
      }
    }
    if (this.moonMesh) {
      this.moonMesh.parent!.visible = moonLift > 1.2;
      const moonMat = this.moonMesh.material;
      if (moonMat instanceof THREE.ShaderMaterial) {
        moonMat.uniforms.uIntensity!.value = (0.5 + (1 - day) * 0.7) * theme.moonMult;
      }
    }
    if (this.sunLight) {
      this.sunLight.intensity = (0.25 + day * 1.4) * theme.sunMult;
    }
    if (this.moonLight) {
      this.moonLight.intensity = (0.12 + (1 - day) * 0.75) * theme.moonMult;
    }
    if (this.sunPoint) {
      this.sunPoint.intensity = (0.5 + day * 3.2) * theme.sunMult;
    }
    if (this.moonPoint) {
      this.moonPoint.intensity = (0.25 + (1 - day) * 2.1) * theme.moonMult;
    }
    if (this.hemi) {
      this.hemi.intensity = (0.95 + day * 0.45) * theme.hemiMult;
    }
    if (this.ambient) {
      this.ambient.intensity = (0.72 + day * 0.28) * theme.ambientMult;
    }
    if (this.frontLight) {
      this.frontLight.intensity = (1.15 + day * 0.45) * theme.frontMult;
      this.frontLight.color.setHex(PALETTE.moonlight).lerp(new THREE.Color(0xfff1c8), day);
    }
    this.fogColor.setHex(theme.fogNight).lerp(new THREE.Color(theme.fogDay), day);
    if (dead) {
      this.fogColor.lerp(new THREE.Color(0x1a1c22), 0.55);
    }
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.near = theme.fogNear + day * theme.fogNearDayAdd;
      this.scene.fog.far = theme.fogFar + day * theme.fogFarDayAdd;
      if (dead) {
        this.scene.fog.near *= 0.72;
        this.scene.fog.far *= 0.78;
      }
    }
    this.scene.background = new THREE.Color(theme.skyNight).lerp(
      new THREE.Color(theme.skyDay),
      day,
    );
    if (dead) {
      (this.scene.background as THREE.Color).lerp(new THREE.Color(0x12141a), 0.4);
      this.renderer.toneMappingExposure =
        (theme.exposureBase + day * theme.exposureDayAdd) * 0.72;
    } else {
      this.renderer.toneMappingExposure = theme.exposureBase + day * theme.exposureDayAdd;
    }
    if (this.skyMat) {
      this.skyMat.uniforms.uDay!.value = day;
    }
  }

  private addParallax(): void {
    const tex = this.requireTex();
    const sky = createSkyGroup();
    sky.group.position.z = 0;
    this.scene.add(sky.group);
    this.skyMat = sky.material;
    this.addScroll(sky.group, 1, 1, 0, 1.2);

    const skyClouds = buildSkyClouds();
    skyClouds.position.z = -36;
    this.scene.add(skyClouds);
    this.skyCloudLayer = this.addScroll(skyClouds, 0.96, 0.02, 0.8, 4.1);

    const farPeaks = buildFarPeakRange(tex.rock);
    farPeaks.position.z = -40;
    farPeaks.scale.setScalar(0.52);
    this.scene.add(farPeaks);
    this.addScroll(farPeaks, 0.98, 0.02, 1.4, 0.2);

    const mountains = buildMountainRange(tex.rock);
    mountains.position.z = -15.2;
    this.scene.add(mountains);
    this.addScroll(mountains, 0.88, 0.04, 2, 0.7);

    const mist = buildMountainMist();
    mist.position.z = -13.4;
    this.scene.add(mist);
    this.mistLayer = this.addScroll(mist, 0.8, 0.05, 1.2, 0.55);

    const hills = buildHillRange(tex.rock);
    hills.position.z = -11.6;
    this.scene.add(hills);
    this.addScroll(hills, 0.73, 0.04, 0.4, 0.2);

    const horizon = buildHorizonRidge(tex.ground, tex.rock);
    horizon.position.z = -8;
    this.scene.add(horizon);
    this.addScroll(horizon, 0.7, 0.04, 0, 0);

    const forest = buildForestBelt(tex.bark, tex.leaf);
    forest.position.z = -6;
    this.scene.add(forest);
    this.addScroll(forest, 0.46, 0.04, 3, 1);
  }

  private zoneRoot(): THREE.Object3D {
    return this.zoneGroup ?? this.scene;
  }

  private addTerrain(platforms: Rect[], rivers: Rect[], tex: P0Textures): void {
    const root = this.zoneRoot();
    const grounds = platforms
      .filter((plat) => plat.y <= 0 && plat.h >= 0.8 && !isZoneEndWall(plat))
      .slice()
      .sort((a, b) => a.x - b.x);
    for (const ground of grounds) {
      this.addEarthSegment(ground.x, ground.w, tex);
    }
    for (const plat of platforms) {
      if (isZoneEndWall(plat)) {
        this.addEndBarrier(plat, tex);
      } else if (plat.y > 0.2) {
        this.addRaisedPlatform(plat, tex);
      }
    }
    for (let i = 0; i < grounds.length - 1; i += 1) {
      const left = grounds[i];
      const right = grounds[i + 1];
      if (!left || !right) {
        continue;
      }
      const gapX = left.x + left.w;
      const gapW = right.x - gapX;
      if (gapW <= 0.4) {
        continue;
      }
      const isRiver = rivers.some(
        (river) => Math.abs(river.x - gapX) < 0.2 && Math.abs(river.w - gapW) < 0.2,
      );
      if (isRiver) {
        const river = createRiver(gapX, gapW, tex);
        root.add(river.group);
        this.waterMats.push(...river.mats);
      } else {
        this.addPit(gapX, gapW, tex);
      }
    }
  }

  /** 关卡左右尽头石柱挡墙。 */
  private addEndBarrier(plat: Rect, tex: P0Textures): void {
    const root = this.zoneRoot();
    const cx = plat.x + plat.w / 2;
    const mat = new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.rock, 1, 3),
      color: this.sceneTheme.groundTint,
      roughness: 0.92,
    });
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(plat.w * 1.15, plat.h, 1.45),
      mat,
    );
    pillar.position.set(cx, plat.y + plat.h / 2, 0.15);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(plat.w * 1.45, 0.22, 1.65),
      new THREE.MeshStandardMaterial({
        map: cloneRepeat(tex.rock, 1, 1),
        color: PALETTE.gold,
        roughness: 0.85,
      }),
    );
    cap.position.set(cx, plat.y + plat.h + 0.05, 0.15);
    cap.castShadow = true;
    root.add(cap);
  }

  private addEarthSegment(x: number, w: number, tex: P0Textures): void {
    const root = this.zoneRoot();
    const tint = this.sceneTheme.groundTint;
    const cliffH = 20;
    const cx = x + w / 2;
    const dirt = new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.ground, Math.max(2, w / 4), 6),
      color: tint,
      roughness: 0.92,
      metalness: 0.02,
    });
    const frontDirt = dirt.clone();
    frontDirt.color.setHex(this.sceneTheme.ledgeTint);
    frontDirt.emissive = new THREE.Color(PALETTE.moss);
    frontDirt.emissiveIntensity = 0.12;
    const front = new THREE.Mesh(new THREE.BoxGeometry(w, cliffH, 4.2), frontDirt);
    front.position.set(cx, 1 - cliffH / 2, 3.5);
    root.add(front);

    const back = new THREE.Mesh(new THREE.BoxGeometry(w, cliffH, 3.2), dirt);
    back.position.set(cx, 1 - cliffH / 2, -2.6);
    back.receiveShadow = true;
    root.add(back);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.1, 2.4),
      new THREE.MeshStandardMaterial({
        map: cloneRepeat(tex.platform, Math.max(2, w / 3), 2),
        color: this.sceneTheme.ledgeTint,
        roughness: 0.72,
        metalness: 0.02,
        emissive: PALETTE.moss,
        emissiveIntensity: 0.04,
      }),
    );
    top.position.set(cx, 1.04, 0);
    top.receiveShadow = true;
    root.add(top);
  }

  private addPit(x: number, w: number, tex: P0Textures): void {
    const root = this.zoneRoot();
    const cx = x + w / 2;
    const wall = new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.bark, 1, 3),
      color: 0x3a3330,
      roughness: 0.95,
    });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6, 2.6), wall);
    left.position.set(x + 0.12, -2, 0.2);
    root.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6, 2.6), wall);
    right.position.set(x + w - 0.12, -2, 0.2);
    root.add(right);

    const voidFloor = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.2, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0c1012, roughness: 1 }),
    );
    voidFloor.position.set(cx, -4.6, 0.2);
    root.add(voidFloor);

    const stakeMat = new THREE.MeshStandardMaterial({
      map: cloneRepeat(tex.wood, 1, 1),
      color: 0x8a6a4a,
      roughness: 0.7,
    });
    const count = Math.max(3, Math.floor(w / 0.55));
    for (let i = 0; i < count; i += 1) {
      const stake = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 5), stakeMat);
      const u = count === 1 ? 0.5 : i / (count - 1);
      stake.position.set(x + 0.35 + u * (w - 0.7), -4.05, (i % 2) * 0.25 - 0.1);
      root.add(stake);
    }
  }

  private addCampCorner(tex: P0Textures): void {
    const root = this.zoneRoot();
    root.add(createPalisade(tex));
    this.teleport = createTeleport(tex);
    root.add(this.teleport.group);
    this.campfire = createCampfire(tex);
    root.add(this.campfire.group);
    for (const point of [{ x: 2.35 }, { x: 35.4 }]) {
      const banner = createBanner(tex, point.x);
      root.add(banner.group);
      this.banners.push(banner);
    }
    const forge = createForge(tex);
    const weapons = createWeaponsmithStall(tex);
    const stall = createStall(tex);
    const apothecary = createApothecaryStall(tex);
    root.add(forge.group, weapons.group, stall.group, apothecary.group);
    this.campProps.push(forge, weapons, stall, apothecary);
  }

  private addKitProps(tex: P0Textures, world: World): void {
    const root = this.zoneRoot();
    const zone = ZONES[world.zoneId];
    const torches =
      world.zoneId === 'a01'
        ? [3.5, 10.2, 18.4, 28.6, 41.2]
        : world.zoneId === 'a03'
          ? [3.4, 16.2, 29.0, 41.6]
          : world.zoneId === 'a04'
            ? [3.2, 15.4, 28.2, 40.8]
            : world.zoneId === 'a05'
              ? [3.3, 15.0, 27.6, 41.2]
              : world.zoneId === 'a06'
                ? [3.2, 15.2, 28.0, 41.0]
                : world.zoneId === 'a07'
                  ? [3.3, 15.0, 27.8, 41.2]
                  : world.zoneId === 'a08'
                    ? [3.2, 14.8, 27.6, 41.0]
                    : world.zoneId === 'a09'
                      ? [3.3, 14.6, 27.4, 41.2]
                      : world.zoneId === 'a10'
                        ? [3.2, 14.5, 27.2, 41.0]
                        : world.zoneId === 'a11'
                          ? [3.1, 14.4, 27.0, 40.8]
                          : world.zoneId === 'a12'
                            ? [3.0, 14.2, 26.8, 41.2]
                            : [3.2, 14.8, 27.2, 39.4];
    for (const tx of torches) {
      const torch = createTorch(tex, tx);
      root.add(torch.group);
      this.campProps.push(torch);
    }
    for (const secret of zone?.secrets ?? []) {
      const chest = createSecretChest(tex, secret.id, secret.x, secret.y);
      root.add(chest.group);
      this.secretChests.push(chest);
    }
    if (world.zoneId === 'a01') {
      const gate = createEndGate(tex);
      root.add(gate.group);
      this.campProps.push(gate);
    }
  }

  private createDummy(dummy: Dummy, tex: P0Textures): DummyView {
    const rig = dummy.kind === 'treant' ? createTreantRig() : createRotwolfRig();
    const spark = this.makeAdditive(tex.hitSpark, 1.1, 1.1);
    spark.visible = false;
    spark.position.z = 0.25;
    rig.root.add(spark);
    const bar = createHpBar();
    this.scene.add(bar.root);
    return {
      root: rig.root,
      rig,
      kind: dummy.kind,
      spark,
      hpRoot: bar.root,
      hpFill: bar.fill,
    };
  }

  private syncPopups(world: World): void {
    const seen = new Set<number>();
    for (const popup of world.popups) {
      seen.add(popup.id);
      let mesh = this.popupViews.get(popup.id);
      if (!mesh) {
        if (popup.kind === 'level') {
          mesh = createLevelUpPopupMesh(popup.value);
        } else if (popup.kind === 'gold') {
          mesh = createGoldPopupMesh(popup.value);
        } else if (popup.kind === 'xp') {
          mesh = createXpPopupMesh(popup.value);
        } else if (popup.kind === 'miss') {
          mesh = createMissPopupMesh();
        } else {
          mesh = this.damagePopupPool.pop() ?? createDamagePopupMesh(0, false, false);
          refreshDamagePopupMesh(mesh, popup.value, popup.lethal, popup.crit);
        }
        mesh.visible = true;
        this.scene.add(mesh);
        this.popupViews.set(popup.id, mesh);
      } else if (popup.kind === 'gold') {
        refreshGoldPopupMesh(mesh, popup.value);
      } else if (popup.kind === 'xp') {
        refreshXpPopupMesh(mesh, popup.value);
      }
      const life = popup.kind === 'level' ? LEVEL_POPUP_LIFE : POPUP_LIFE;
      const t = popup.age / life;
      const rise =
        popup.kind === 'level'
          ? 1.55
          : popup.kind === 'gold' || popup.kind === 'xp' || popup.kind === 'miss'
            ? 1.35
            : 1.15;
      mesh.position.set(popup.x, popup.y + t * rise, 1.4);
      mesh.material.opacity = 1 - t * t;
      const s =
        popup.kind === 'level'
          ? 1.15 + Math.sin(t * Math.PI) * 0.35
          : popup.kind === 'gold' || popup.kind === 'xp' || popup.kind === 'miss'
            ? 1.05 + t * 0.18
            : (popup.crit ? 1.25 : 1) + t * 0.22;
      mesh.scale.set(s, s, 1);
    }
    for (const [id, mesh] of this.popupViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.visible = false;
      const isLevel = mesh.geometry.parameters.width > 1.8;
      if (!isLevel && this.damagePopupPool.length < 40) {
        this.damagePopupPool.push(mesh);
      } else {
        mesh.material.map?.dispose();
        mesh.material.dispose();
        mesh.geometry.dispose();
      }
      this.popupViews.delete(id);
    }
  }

  private syncDust(world: World): void {
    const seen = new Set<number>();
    for (const dust of world.dusts) {
      seen.add(dust.id);
      let mesh = this.dustViews.get(dust.id);
      if (!mesh) {
        mesh = this.dustPool.pop() ?? createDustMesh();
        mesh.visible = true;
        this.scene.add(mesh);
        this.dustViews.set(dust.id, mesh);
      }
      const t = dust.age / DUST_LIFE;
      mesh.position.set(dust.x, dust.y + t * 0.25, 0.3);
      mesh.scale.set(1 + t * 1.4, 1 - t * 0.3, 1);
      mesh.material.opacity = 0.5 * (1 - t);
    }
    for (const [id, mesh] of this.dustViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.visible = false;
      if (this.dustPool.length < 48) {
        this.dustPool.push(mesh);
      } else {
        mesh.material.dispose();
        mesh.geometry.dispose();
      }
      this.dustViews.delete(id);
    }
  }

  private syncLoot(world: World): void {
    const seen = new Set<number>();
    for (const loot of world.loots) {
      seen.add(loot.id);
      let mesh = this.lootViews.get(loot.id);
      if (!mesh) {
        mesh = createLootMesh(loot);
        this.scene.add(mesh);
        this.lootViews.set(loot.id, mesh);
      }
      const bob = Math.sin(this.clock * 4 + loot.id) * 0.08;
      mesh.position.set(loot.x, loot.y + 0.35 + bob, 0.35);
      mesh.rotation.z = this.clock * 0.8;
      const beam = mesh.children[0];
      if (beam) {
        beam.rotation.z = -mesh.rotation.z;
      }
    }
    for (const [id, group] of this.lootViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(group);
      group.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          (m.material as THREE.Material)?.dispose();
        }
      });
      this.lootViews.delete(id);
    }
  }

  /** 拾取飞向 HUD 背包键位（左下角）。 */
  private syncLootFlies(world: World): void {
    this.bagTarget.set(
      this.camPos.x + this.camera.left * 0.72,
      this.camPos.y + this.camera.bottom * 0.78,
      0.55,
    );
    const seen = new Set<number>();
    for (const fly of world.lootFlies) {
      seen.add(fly.id);
      let mesh = this.lootFlyViews.get(fly.id);
      if (!mesh) {
        mesh = this.lootFlyPool.pop() ?? createLootFlyMesh();
        styleLootFlyMesh(mesh, fly);
        mesh.visible = true;
        this.scene.add(mesh);
        this.lootFlyViews.set(fly.id, mesh);
      }
      const u = Math.min(1, fly.age / LOOT_FLY_LIFE);
      const ease = 1 - (1 - u) * (1 - u) * (1 - u);
      const arc = Math.sin(u * Math.PI) * 1.15;
      const x = fly.startX + (this.bagTarget.x - fly.startX) * ease;
      const y = fly.startY + (this.bagTarget.y - fly.startY) * ease + arc;
      mesh.position.set(x, y, 0.55);
      const shrink = 1 - ease * 0.55;
      const base = (mesh.userData.flyBase as number | undefined) ?? 1;
      mesh.scale.set(base * shrink, base * shrink, 1);
      mesh.material.opacity = u < 0.75 ? 0.95 : 0.95 * (1 - (u - 0.75) / 0.25);
      mesh.rotation.z = this.clock * 6 + fly.id;
    }
    for (const [id, mesh] of this.lootFlyViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.visible = false;
      if (this.lootFlyPool.length < 32) {
        this.lootFlyPool.push(mesh);
      } else {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      this.lootFlyViews.delete(id);
    }
  }

  private syncInteractPrompt(world: World): void {
    const blocked =
      world.campOpen ||
      world.invOpen ||
      world.charOpen ||
      world.skillOpen ||
      world.player.hp <= 0;
    const npc =
      !blocked && world.nearbyCamp
        ? CAMP_NPCS.find((n) => n.id === world.nearbyCamp)
        : undefined;
    const zone = ZONES[world.zoneId];
    const hub =
      !blocked && !npc && world.nearbyHubPortal && zone?.hubPortal
        ? zone.hubPortal
        : undefined;
    const secret =
      !blocked && !npc && !hub && world.nearbySecretId
        ? zone?.secrets.find((s) => s.id === world.nearbySecretId)
        : undefined;

    let key = '';
    let label = '';
    let x = 0;
    let y = 0;
    if (npc) {
      key = `npc:${npc.id}`;
      label = `F ${npc.prompt}`;
      x = npc.x;
      y = npc.promptY;
    } else if (hub) {
      key = 'hub-portal';
      label = 'F 打开传送';
      x = hub.x;
      y = hub.promptY;
    } else if (secret) {
      key = `secret:${secret.id}`;
      label = 'F 开启宝箱';
      x = secret.x;
      y = secret.y + 1.35;
    } else {
      if (this.interactPrompt) {
        this.interactPrompt.visible = false;
      }
      return;
    }

    if (!this.interactPrompt || this.interactPromptKey !== key) {
      if (this.interactPrompt) {
        this.scene.remove(this.interactPrompt);
        this.interactPrompt.material.map?.dispose();
        this.interactPrompt.material.dispose();
        this.interactPrompt.geometry.dispose();
      }
      this.interactPrompt = createInteractPromptMesh(label);
      this.interactPromptKey = key;
      this.scene.add(this.interactPrompt);
    }
    const bob = Math.sin(this.clock * 3.2) * 0.07;
    this.interactPrompt.visible = true;
    this.interactPrompt.position.set(x, y + bob, 1.55);
  }

  private syncHazards(world: World): void {
    const seen = new Set<number>();
    for (const hz of world.hazards) {
      seen.add(hz.id);
      let mesh = this.hazardViews.get(hz.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({
            color: PALETTE.ember,
            transparent: true,
            depthTest: false,
            fog: false,
            opacity: 0.45,
          }),
        );
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.hazardViews.set(hz.id, mesh);
      }
      const wind = hz.age < hz.windup;
      const t = wind ? hz.age / Math.max(0.01, hz.windup) : 1;
      if (hz.kind === 'wave') {
        mesh.rotation.x = 0;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.75, 0.28);
        mesh.scale.set(hz.w * 1.05, 1.55, 1);
        mesh.material.opacity = wind ? 0.25 + t * 0.4 : 0.78;
        mesh.material.color.setHex(wind ? 0xa8d8e8 : 0x3a9cc8);
      } else if (hz.kind === 'fire') {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.08, 0.22);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.55), 1);
        mesh.material.opacity = wind ? 0.22 + t * 0.4 : 0.8;
        mesh.material.color.setHex(wind ? 0xe8a050 : PALETTE.ember);
      } else if (hz.kind === 'fog') {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.1, 0.24);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.75), 1);
        mesh.material.opacity = wind ? 0.18 + t * 0.35 : 0.62;
        mesh.material.color.setHex(wind ? 0x8aaa70 : 0x4a6a38);
      } else if (hz.kind === 'ice') {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.08, 0.22);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.55), 1);
        mesh.material.opacity = wind ? 0.22 + t * 0.4 : 0.78;
        mesh.material.color.setHex(wind ? 0xc8e0f0 : 0x6ab0d8);
      } else if (hz.kind === 'sand') {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.12, 0.26);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.9), 1);
        mesh.material.opacity = wind ? 0.2 + t * 0.35 : 0.58;
        mesh.material.color.setHex(wind ? 0xe8c898 : 0xc49a5a);
      } else if (hz.kind === 'laser') {
        mesh.rotation.x = 0;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 1.0, 0.3);
        mesh.scale.set(hz.w * 0.9, Math.max(hz.h, 1.6), 1);
        mesh.material.opacity = wind ? 0.25 + t * 0.45 : 0.85;
        mesh.material.color.setHex(wind ? 0xe8d8a8 : 0xd4b060);
      } else if (hz.kind === 'tentacle') {
        mesh.rotation.x = 0;
        mesh.position.set(hz.x + hz.w / 2, hz.y + Math.max(hz.h, 0.7) * 0.5, 0.28);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.9), 1);
        mesh.material.opacity = wind ? 0.22 + t * 0.4 : 0.72;
        mesh.material.color.setHex(wind ? 0x6a8a78 : 0x2a4a40);
      } else if (hz.kind === 'void') {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.1, 0.26);
        mesh.scale.set(hz.w, Math.max(hz.h, 0.9), 1);
        mesh.material.opacity = wind ? 0.2 + t * 0.4 : 0.78;
        mesh.material.color.setHex(wind ? 0x6a5888 : 0x2a1838);
      } else {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(hz.x + hz.w / 2, hz.y + 0.06, 0.2);
        mesh.scale.set(hz.w, hz.h, 1);
        mesh.material.opacity = wind ? 0.2 + t * 0.35 : 0.72;
        mesh.material.color.setHex(wind ? PALETTE.gold : PALETTE.ember);
      }
    }
    for (const [id, mesh] of this.hazardViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      this.hazardViews.delete(id);
    }
  }

  private syncProjectiles(world: World): void {
    const seen = new Set<number>();
    for (const shot of world.projectiles) {
      seen.add(shot.id);
      let mesh = this.projectileViews.get(shot.id);
      if (!mesh) {
        const isFireball = shot.visual === 'fireball';
        const isArcane = shot.visual === 'arcane';
        const isArrow = shot.visual === 'arrow' || shot.visual === 'arrow-fan';
        const isPyro = shot.visual === 'pyroblast';
        const isIce = shot.visual === 'ice-lance';
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(
            isPyro
              ? 0.3
              : isIce
                ? 0.14
                : isFireball
                  ? 0.22
                  : isArrow
                    ? 0.1
                    : isArcane
                      ? 0.16
                      : 0.18,
            8,
            8,
          ),
          new THREE.MeshBasicMaterial({
            color: isPyro
              ? 0xff6a3d
              : isIce
                ? 0xa8e8ff
                : isFireball
                  ? PALETTE.ember
                  : isArcane
                    ? 0x7ec8e3
                    : isArrow
                      ? PALETTE.gold
                      : PALETTE.mage,
            transparent: true,
            depthTest: false,
            fog: false,
            opacity: 0.92,
          }),
        );
        this.scene.add(mesh);
        this.projectileViews.set(shot.id, mesh);
      }
      mesh.position.set(shot.x, shot.y, 0.55);
      const pulse = 0.9 + Math.sin(this.clock * 18 + shot.id) * 0.15;
      mesh.scale.setScalar(
        pulse * (shot.visual === 'fireball' || shot.visual === 'pyroblast' ? 1.15 : 1),
      );
    }
    for (const [id, mesh] of this.projectileViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      this.projectileViews.delete(id);
    }
  }

  private syncTraps(world: World): void {
    const seen = new Set<number>();
    for (const trap of world.traps ?? []) {
      seen.add(trap.id);
      let mesh = this.trapViews.get(trap.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.28, 0.48, 16),
          new THREE.MeshBasicMaterial({
            color: trap.kind === 'explosive' ? PALETTE.ember : PALETTE.hunter,
            transparent: true,
            depthTest: false,
            fog: false,
            opacity: 0.75,
            side: THREE.DoubleSide,
          }),
        );
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.trapViews.set(trap.id, mesh);
      }
      mesh.material.color.setHex(trap.kind === 'explosive' ? PALETTE.ember : PALETTE.hunter);
      mesh.position.set(trap.x, trap.y + 0.04, 0.4);
      const fusePulse =
        trap.kind === 'explosive' && trap.fuse > 0
          ? 0.7 + Math.sin(this.clock * 14 + trap.id) * 0.25
          : 0.85 + Math.sin(this.clock * 6 + trap.id) * 0.1;
      mesh.scale.setScalar(fusePulse);
      mesh.material.opacity = 0.45 + Math.min(1, trap.life / 4) * 0.35;
    }
    for (const [id, mesh] of this.trapViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      this.trapViews.delete(id);
    }
  }

  private syncBlizzards(world: World): void {
    const seen = new Set<number>();
    for (const zone of world.blizzards ?? []) {
      seen.add(zone.id);
      let mesh = this.blizzardViews.get(zone.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.CircleGeometry(1, 28),
          new THREE.MeshBasicMaterial({
            color: PALETTE.mage,
            transparent: true,
            depthTest: false,
            fog: false,
            opacity: 0.35,
            side: THREE.DoubleSide,
          }),
        );
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.blizzardViews.set(zone.id, mesh);
      }
      mesh.position.set(zone.x, zone.y + 0.06, 0.35);
      const pulse = 0.92 + Math.sin(this.clock * 8 + zone.id) * 0.08;
      mesh.scale.setScalar(zone.radius * pulse);
      mesh.material.opacity = 0.22 + Math.min(1, zone.life / 3) * 0.28;
    }
    for (const [id, mesh] of this.blizzardViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      this.blizzardViews.delete(id);
    }
  }

  private syncBreakables(world: World): void {
    const tex = this.tex;
    if (!tex) {
      return;
    }
    const theme = KIT_THEMES[(world.kitTheme as KitThemeId) ?? 'woodland'] ?? KIT_THEMES.woodland;
    const seen = new Set<string>();
    for (const b of world.breakables) {
      seen.add(b.id);
      let mesh = this.breakableViews.get(b.id);
      if (!mesh) {
        const created = createBreakableMesh(tex, theme.breakableTint);
        created.castShadow = true;
        this.zoneRoot().add(created);
        this.breakableViews.set(b.id, created);
        mesh = created;
      }
      mesh.visible = !b.broken;
      if (b.broken) {
        continue;
      }
      mesh.position.set(b.x, b.y + b.h / 2, 0.08);
      mesh.scale.set(b.w, b.h, b.w);
      mesh.material.emissive.setHex(b.flash > 0 ? PALETTE.gold : 0x000000);
      mesh.material.emissiveIntensity = b.flash > 0 ? 0.35 : 0;
    }
    for (const [id, mesh] of this.breakableViews) {
      if (seen.has(id)) {
        continue;
      }
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      this.breakableViews.delete(id);
    }
  }

  private addRaisedPlatform(plat: Rect, tex: P0Textures): void {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(plat.w, plat.h, 1.6),
      new THREE.MeshStandardMaterial({
        map: cloneRepeat(tex.platform, Math.max(1, plat.w), 1),
        color: this.sceneTheme.ledgeTint,
        roughness: 0.74,
        emissive: new THREE.Color(PALETTE.moss),
        emissiveIntensity: 0.05,
      }),
    );
    top.position.set(plat.x + plat.w / 2, plat.y + plat.h / 2, 0);
    top.receiveShadow = true;
    top.castShadow = true;
    this.zoneRoot().add(top);
  }

  private makeAdditive(
    map: THREE.Texture,
    w: number,
    h: number,
  ): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
    const mat = new THREE.MeshBasicMaterial({
      map,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  }
}

function createLootMesh(loot: GroundLoot): THREE.Group {
  const quality =
    loot.kind === 'gold'
      ? 'legendary'
      : (ITEM_DEFS[loot.defId ?? '']?.quality ?? 'common');
  const color = loot.kind === 'gold' ? PALETTE.gold : QUALITY_COLOR[quality];
  const size = loot.kind === 'gold' ? 0.28 : 0.36;
  const beamH =
    quality === 'legendary'
      ? 1.85
      : quality === 'epic'
        ? 1.45
        : quality === 'rare'
          ? 1.15
          : quality === 'uncommon'
            ? 0.9
            : 0.55;
  const root = new THREE.Group();
  const gem = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthTest: false,
      fog: false,
      opacity: 0.95,
    }),
  );
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(quality === 'legendary' || quality === 'epic' ? 0.16 : 0.1, beamH),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthTest: false,
      fog: false,
      opacity: quality === 'common' ? 0.22 : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  beam.position.y = beamH * 0.45;
  root.add(beam);
  root.add(gem);
  return root;
}

function createLootFlyMesh(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.3),
    new THREE.MeshBasicMaterial({
      color: PALETTE.gold,
      transparent: true,
      depthTest: false,
      fog: false,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

function styleLootFlyMesh(
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,
  fly: LootFly,
): void {
  const color = fly.kind === 'gold' ? PALETTE.gold : QUALITY_COLOR[fly.quality];
  const size = fly.kind === 'gold' ? 0.26 : 0.32;
  mesh.material.color.setHex(color);
  mesh.userData.flyBase = size / 0.3;
}
