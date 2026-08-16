/** 暂停菜单操作键位一览（与 README 对齐，不含 QA）。 */
export type ControlHelpRow = {
  keys: string;
  action: string;
};

export const CONTROL_HELP: ControlHelpRow[] = [
  { keys: 'A / D', action: '移动' },
  { keys: 'Space / W', action: '跳跃' },
  { keys: 'Shift', action: '翻滚' },
  { keys: '鼠标左键 / J', action: '普攻' },
  { keys: 'Q / E / 1 / 2', action: '技能栏' },
  { keys: 'F', action: '拾取 / 营地交互' },
  { keys: 'R', action: '红药（生命）' },
  { keys: 'T', action: '蓝药（法力）' },
  { keys: 'I', action: '背包' },
  { keys: 'C', action: '属性加点' },
  { keys: 'K', action: '技能 / 专精' },
  { keys: 'L', action: '橙装图鉴' },
  { keys: 'Esc / O', action: '暂停 / 关闭面板' },
  { keys: '倒下 1 / 2', action: '回旗帜 / 回营' },
];
