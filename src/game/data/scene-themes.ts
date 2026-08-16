/** 场景主题：灯光 / 雾 / 色级 / BGM。新区只换 theme id。 */

export type SceneThemeId =
  | 'woodland'
  | 'mistnight'
  | 'quarry'
  | 'coast'
  | 'ashland'
  | 'mire'
  | 'frost'
  | 'dunes'
  | 'ruins'
  | 'abyss'
  | 'ridge'
  | 'void'
  | 'throne';

export type SceneTheme = {
  id: SceneThemeId;
  /** 关卡套件染色 */
  groundTint: number;
  ledgeTint: number;
  slopeTint: number;
  breakableTint: number;
  /** 雾与天空 */
  fogNight: number;
  fogDay: number;
  skyNight: number;
  skyDay: number;
  fogNear: number;
  fogFar: number;
  fogNearDayAdd: number;
  fogFarDayAdd: number;
  /** 光照倍率（乘在日夜曲线上） */
  sunMult: number;
  moonMult: number;
  hemiMult: number;
  ambientMult: number;
  frontMult: number;
  exposureBase: number;
  exposureDayAdd: number;
  /** BGM */
  bgmVolume: number;
  bgmDroneA: number;
  bgmDroneB: number;
  bgmWind: number;
  bgmTones: number[];
  bgmPhrase: number;
};

export const SCENE_THEMES: Record<SceneThemeId, SceneTheme> = {
  woodland: {
    id: 'woodland',
    groundTint: 0xd4d8cc,
    ledgeTint: 0xe8eee4,
    slopeTint: 0xc9d4c4,
    breakableTint: 0xdcc9a8,
    fogNight: 0x1a242c,
    fogDay: 0x9aada8,
    skyNight: 0x1a1f24,
    skyDay: 0x4a7ea8,
    fogNear: 18,
    fogFar: 68,
    fogNearDayAdd: 8,
    fogFarDayAdd: 14,
    sunMult: 1,
    moonMult: 1,
    hemiMult: 1,
    ambientMult: 1,
    frontMult: 1,
    exposureBase: 1.05,
    exposureDayAdd: 0.28,
    bgmVolume: 0.22,
    bgmDroneA: 110,
    bgmDroneB: 164.81,
    bgmWind: 0.045,
    bgmTones: [196, 220, 261.63, 293.66, 329.63],
    bgmPhrase: 14,
  },
  /** 更深雾林变体：证明换 theme 即可换氛围，无需改渲染代码 */
  mistnight: {
    id: 'mistnight',
    groundTint: 0xb8c0b4,
    ledgeTint: 0xcfd6cc,
    slopeTint: 0xa8b4a6,
    breakableTint: 0xbba88a,
    fogNight: 0x12181e,
    fogDay: 0x6e8480,
    skyNight: 0x10141a,
    skyDay: 0x3a5f78,
    fogNear: 12,
    fogFar: 52,
    fogNearDayAdd: 6,
    fogFarDayAdd: 10,
    sunMult: 0.72,
    moonMult: 1.25,
    hemiMult: 0.85,
    ambientMult: 0.9,
    frontMult: 0.88,
    exposureBase: 0.95,
    exposureDayAdd: 0.2,
    bgmVolume: 0.2,
    bgmDroneA: 98,
    bgmDroneB: 146.83,
    bgmWind: 0.06,
    bgmTones: [174.61, 196, 233.08, 261.63, 311.13],
    bgmPhrase: 16,
  },
  /** 荒石矿坑：冷灰岩层、更紧的雾距与低沉 tonality */
  quarry: {
    id: 'quarry',
    groundTint: 0xa8a9a6,
    ledgeTint: 0xb8bbb4,
    slopeTint: 0x969890,
    breakableTint: 0x9a8f7a,
    fogNight: 0x141618,
    fogDay: 0x6a7070,
    skyNight: 0x121416,
    skyDay: 0x4a5558,
    fogNear: 10,
    fogFar: 46,
    fogNearDayAdd: 5,
    fogFarDayAdd: 8,
    sunMult: 0.65,
    moonMult: 1.15,
    hemiMult: 0.8,
    ambientMult: 0.85,
    frontMult: 0.9,
    exposureBase: 0.92,
    exposureDayAdd: 0.18,
    bgmVolume: 0.18,
    bgmDroneA: 82.41,
    bgmDroneB: 123.47,
    bgmWind: 0.08,
    bgmTones: [146.83, 164.81, 196, 220, 246.94],
    bgmPhrase: 18,
  },
  /** 潮汐海滩：暖沙、青空、更开阔雾距 */
  coast: {
    id: 'coast',
    groundTint: 0xd2c4a0,
    ledgeTint: 0xe0d4b4,
    slopeTint: 0xc4b690,
    breakableTint: 0xb89a78,
    fogNight: 0x1a2228,
    fogDay: 0x9eb8c0,
    skyNight: 0x182028,
    skyDay: 0x5a8fb0,
    fogNear: 16,
    fogFar: 62,
    fogNearDayAdd: 8,
    fogFarDayAdd: 12,
    sunMult: 1.05,
    moonMult: 0.95,
    hemiMult: 1.05,
    ambientMult: 1.05,
    frontMult: 1,
    exposureBase: 1.08,
    exposureDayAdd: 0.32,
    bgmVolume: 0.2,
    bgmDroneA: 130.81,
    bgmDroneB: 196,
    bgmWind: 0.055,
    bgmTones: [164.81, 196, 220, 261.63, 329.63],
    bgmPhrase: 15,
  },
  /** 焦土丘陵：干热赤土、低雾、偏暖 tonality */
  ashland: {
    id: 'ashland',
    groundTint: 0xb8906e,
    ledgeTint: 0xc9a078,
    slopeTint: 0xa87858,
    breakableTint: 0x9a7050,
    fogNight: 0x1c1412,
    fogDay: 0x8a7060,
    skyNight: 0x1a1210,
    skyDay: 0x6a4838,
    fogNear: 14,
    fogFar: 54,
    fogNearDayAdd: 6,
    fogFarDayAdd: 10,
    sunMult: 1.15,
    moonMult: 0.85,
    hemiMult: 0.95,
    ambientMult: 0.95,
    frontMult: 1.05,
    exposureBase: 1.02,
    exposureDayAdd: 0.26,
    bgmVolume: 0.19,
    bgmDroneA: 87.31,
    bgmDroneB: 130.81,
    bgmWind: 0.07,
    bgmTones: [155.56, 185, 220, 246.94, 293.66],
    bgmPhrase: 17,
  },
  /** 幽影沼泽：湿绿泥沼、浓雾、低沉潮湿音色 */
  mire: {
    id: 'mire',
    groundTint: 0x6e7a58,
    ledgeTint: 0x84906a,
    slopeTint: 0x5c6848,
    breakableTint: 0x6a5e48,
    fogNight: 0x121816,
    fogDay: 0x5a6e58,
    skyNight: 0x101814,
    skyDay: 0x3a5048,
    fogNear: 8,
    fogFar: 40,
    fogNearDayAdd: 4,
    fogFarDayAdd: 8,
    sunMult: 0.7,
    moonMult: 1.2,
    hemiMult: 0.85,
    ambientMult: 0.88,
    frontMult: 0.9,
    exposureBase: 0.9,
    exposureDayAdd: 0.16,
    bgmVolume: 0.17,
    bgmDroneA: 73.42,
    bgmDroneB: 110,
    bgmWind: 0.09,
    bgmTones: [130.81, 146.83, 174.61, 196, 233.08],
    bgmPhrase: 19,
  },
  /** 霜风雪原：冷白积雪、开阔寒雾 */
  frost: {
    id: 'frost',
    groundTint: 0xd8e0e8,
    ledgeTint: 0xe8eef4,
    slopeTint: 0xc4d0dc,
    breakableTint: 0xb0bcc8,
    fogNight: 0x141c24,
    fogDay: 0xa8b8c8,
    skyNight: 0x121820,
    skyDay: 0x6a8498,
    fogNear: 14,
    fogFar: 58,
    fogNearDayAdd: 7,
    fogFarDayAdd: 12,
    sunMult: 0.85,
    moonMult: 1.15,
    hemiMult: 0.95,
    ambientMult: 1,
    frontMult: 0.95,
    exposureBase: 1.05,
    exposureDayAdd: 0.22,
    bgmVolume: 0.18,
    bgmDroneA: 92.5,
    bgmDroneB: 138.59,
    bgmWind: 0.1,
    bgmTones: [146.83, 174.61, 196, 233.08, 277.18],
    bgmPhrase: 16,
  },
  /** 赤沙峡谷：干热黄沙、远雾偏橙 */
  dunes: {
    id: 'dunes',
    groundTint: 0xd4b484,
    ledgeTint: 0xe4c89a,
    slopeTint: 0xc4a070,
    breakableTint: 0xb89060,
    fogNight: 0x1c1610,
    fogDay: 0xb89870,
    skyNight: 0x181410,
    skyDay: 0x8a6840,
    fogNear: 12,
    fogFar: 50,
    fogNearDayAdd: 6,
    fogFarDayAdd: 10,
    sunMult: 1.2,
    moonMult: 0.8,
    hemiMult: 1.0,
    ambientMult: 1.0,
    frontMult: 1.05,
    exposureBase: 1.1,
    exposureDayAdd: 0.3,
    bgmVolume: 0.18,
    bgmDroneA: 98,
    bgmDroneB: 146.83,
    bgmWind: 0.085,
    bgmTones: [155.56, 185, 207.65, 246.94, 311.13],
    bgmPhrase: 17,
  },
  /** 坠星废墟：冷灰石材、星辉雾感 */
  ruins: {
    id: 'ruins',
    groundTint: 0x9aa0a6,
    ledgeTint: 0xb0b6bc,
    slopeTint: 0x888e94,
    breakableTint: 0x8a8070,
    fogNight: 0x12161c,
    fogDay: 0x6a7888,
    skyNight: 0x10141a,
    skyDay: 0x4a5a6e,
    fogNear: 11,
    fogFar: 48,
    fogNearDayAdd: 5,
    fogFarDayAdd: 9,
    sunMult: 0.75,
    moonMult: 1.25,
    hemiMult: 0.9,
    ambientMult: 0.92,
    frontMult: 0.95,
    exposureBase: 0.98,
    exposureDayAdd: 0.2,
    bgmVolume: 0.19,
    bgmDroneA: 82.41,
    bgmDroneB: 123.47,
    bgmWind: 0.05,
    bgmTones: [164.81, 196, 220, 261.63, 329.63],
    bgmPhrase: 18,
  },
  /** 暗潮地窟：深青石壁、浓湿雾 */
  abyss: {
    id: 'abyss',
    groundTint: 0x4a5858,
    ledgeTint: 0x5a6868,
    slopeTint: 0x3e4c4c,
    breakableTint: 0x4a4038,
    fogNight: 0x0c1014,
    fogDay: 0x3a4a4e,
    skyNight: 0x0a0e12,
    skyDay: 0x2a383c,
    fogNear: 7,
    fogFar: 36,
    fogNearDayAdd: 3,
    fogFarDayAdd: 6,
    sunMult: 0.55,
    moonMult: 1.3,
    hemiMult: 0.75,
    ambientMult: 0.8,
    frontMult: 0.85,
    exposureBase: 0.88,
    exposureDayAdd: 0.14,
    bgmVolume: 0.17,
    bgmDroneA: 65.41,
    bgmDroneB: 98,
    bgmWind: 0.04,
    bgmTones: [110, 130.81, 146.83, 164.81, 196],
    bgmPhrase: 20,
  },
  /** 龙脊山脉：冷灰岩脊、稀薄高空风 */
  ridge: {
    id: 'ridge',
    groundTint: 0x8a8680,
    ledgeTint: 0xa09a92,
    slopeTint: 0x78746c,
    breakableTint: 0x6e6458,
    fogNight: 0x141820,
    fogDay: 0x6a7888,
    skyNight: 0x10141c,
    skyDay: 0x5a6e82,
    fogNear: 12,
    fogFar: 52,
    fogNearDayAdd: 6,
    fogFarDayAdd: 10,
    sunMult: 0.9,
    moonMult: 1.15,
    hemiMult: 0.95,
    ambientMult: 0.95,
    frontMult: 1.0,
    exposureBase: 1.02,
    exposureDayAdd: 0.22,
    bgmVolume: 0.2,
    bgmDroneA: 87.31,
    bgmDroneB: 130.81,
    bgmWind: 0.08,
    bgmTones: [146.83, 174.61, 196, 220, 261.63],
    bgmPhrase: 16,
  },
  /** 虚空裂隙：暗靛岩面、低曝光厚雾 */
  void: {
    id: 'void',
    groundTint: 0x3a3848,
    ledgeTint: 0x4a4860,
    slopeTint: 0x2e2c3a,
    breakableTint: 0x3a3448,
    fogNight: 0x08060e,
    fogDay: 0x2a2438,
    skyNight: 0x060510,
    skyDay: 0x1a1628,
    fogNear: 6,
    fogFar: 32,
    fogNearDayAdd: 2,
    fogFarDayAdd: 5,
    sunMult: 0.45,
    moonMult: 1.35,
    hemiMult: 0.7,
    ambientMult: 0.75,
    frontMult: 0.8,
    exposureBase: 0.82,
    exposureDayAdd: 0.12,
    bgmVolume: 0.16,
    bgmDroneA: 55,
    bgmDroneB: 82.41,
    bgmWind: 0.03,
    bgmTones: [98, 110, 130.81, 146.83, 164.81],
    bgmPhrase: 22,
  },
  /** 终焉王座：暗金石阶、压迫感烛火 */
  throne: {
    id: 'throne',
    groundTint: 0x5a5048,
    ledgeTint: 0x6e6458,
    slopeTint: 0x4a423c,
    breakableTint: 0x5a4838,
    fogNight: 0x100c0a,
    fogDay: 0x3a322c,
    skyNight: 0x0c0a08,
    skyDay: 0x2a241e,
    fogNear: 8,
    fogFar: 38,
    fogNearDayAdd: 3,
    fogFarDayAdd: 6,
    sunMult: 0.6,
    moonMult: 1.2,
    hemiMult: 0.8,
    ambientMult: 0.85,
    frontMult: 0.9,
    exposureBase: 0.9,
    exposureDayAdd: 0.16,
    bgmVolume: 0.18,
    bgmDroneA: 73.42,
    bgmDroneB: 110,
    bgmWind: 0.035,
    bgmTones: [110, 130.81, 146.83, 164.81, 196],
    bgmPhrase: 19,
  },
};

export type KitThemeId = SceneThemeId;

export type KitTheme = Pick<
  SceneTheme,
  'id' | 'groundTint' | 'ledgeTint' | 'slopeTint' | 'breakableTint'
>;

export const KIT_THEMES: Record<KitThemeId, KitTheme> = {
  woodland: SCENE_THEMES.woodland,
  mistnight: SCENE_THEMES.mistnight,
  quarry: SCENE_THEMES.quarry,
  coast: SCENE_THEMES.coast,
  ashland: SCENE_THEMES.ashland,
  mire: SCENE_THEMES.mire,
  frost: SCENE_THEMES.frost,
  dunes: SCENE_THEMES.dunes,
  ruins: SCENE_THEMES.ruins,
  abyss: SCENE_THEMES.abyss,
  ridge: SCENE_THEMES.ridge,
  void: SCENE_THEMES.void,
  throne: SCENE_THEMES.throne,
};

export function sceneThemeOf(id: string | undefined | null): SceneTheme {
  if (id && id in SCENE_THEMES) {
    return SCENE_THEMES[id as SceneThemeId];
  }
  return SCENE_THEMES.woodland;
}
