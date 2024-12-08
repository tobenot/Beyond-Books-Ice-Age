import { CharacterTags } from '../types';

export function createDefaultTags(): CharacterTags {
  return {
    状态: {
      生命值: 100,
      熵减抗性: 0,
      精力: 100,
      快乐: 50
    },
    位置: {
      当前地点: "复苏队基地",
      目标地点: ""
    },
    装备: {
      头部: "",
      身体: "",
      武器: ""
    },
    物品: {},
    属性: {},
    技能: {}
  };
} 