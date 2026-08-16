/** 与 docs/VISUAL_BIBLE.md 同步，禁止在场景里另写颜色。 */
export const PALETTE = {
  void: 0x12181e,
  fog: 0x1a242c,
  daySky: 0x8fa4ae,
  dayFog: 0x9aada8,
  skyDayTop: 0x4a7ea8,
  skyDayBottom: 0xf4f6f5,
  skyNightTop: 0x1a1f24,
  skyNightBottom: 0xb4babd,
  sun: 0xf0d08a,
  moss: 0x3d4a42,
  mossDark: 0x2c3338,
  ember: 0xc45c3e,
  gold: 0xd4a574,
  moonlight: 0xc9d4d8,
  mage: 0x6e9c9a,
  hunter: 0x8b6a4a,
  rogue: 0x5a5360,
  dummy: 0x6b7a72,
} as const;

export const QUALITY_COLOR = {
  common: 0xc9d4d8,
  uncommon: 0x7cb87c,
  rare: 0x5b8fd4,
  epic: 0xb57ad4,
  legendary: 0xe29a46,
} as const;
