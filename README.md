# 烬营远征 (Ember Camp)

横版打怪升级。React 18 + TypeScript + Three.js。

## 文档

- [游戏设计](docs/GAME_DESIGN.md)
- [视觉标准](docs/VISUAL_BIBLE.md)
- [资产清单](docs/ASSET_LIST.md)

## 当前阶段

**阶段 7 封版（进行中）**：已修回营复活真换区、中段传送落点、死亡面板层级、超宽 16:9 补黑、铁匠强化反馈。下步以真人节奏通关冒烟为主。

需要 Node 18+（本机若用 nvm：`nvm use`，`.nvmrc` 为 20.19.1）：

```bash
nvm use
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。点击画面后再操作。

| 键 | 动作 |
| --- | --- |
| A / D | 移动 |
| Space / W | 跳跃（点按短跳） |
| Shift | 翻滚 |
| 鼠标左键 / J | 攻击腐狼 / 树精 |
| Q / E | 猛击 / 盾击 |
| F | 拾取 / 与营地 NPC 交互 |
| I | 打开 / 关闭背包 |
| L | 橙装图鉴 |
| R | 喝药 |
| O | 设置（音量） |
| C | 属性加点（可预览） |
| K | 技能升级 |
| 1 / 2 | 死亡后：回旗帜 / 回营 |

营地：靠近传送阵 / 训练师（旗旁）/ 铁匠 / 商人后按 `F`。HUD 可存档读档（刷新后自动读档）。
