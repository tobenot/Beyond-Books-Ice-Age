export interface CombatStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  strength: number;
  agility: number;
  intelligence: number;
  constitution: number;
  wisdom: number;
  charisma: number;
  initiative: number;
  baseInitiative: number;
}

export interface Combatant {
  id: string;
  name: string;
  faction: string;
  stats: CombatStats;
  skills: string[];
  status: CombatStatus;
  illustration?: string;
  ai?: CombatAI;
}

export interface CombatStatus {
  isDefending: boolean;
  buffs: StatusEffect[];
  debuffs: StatusEffect[];
}

export interface StatusEffect {
  type: string;
  duration: number;
  value: number;
}

export interface CombatAI {
  type: 'aggressive' | 'defensive' | 'support' | 'random';
  decideAction(): Promise<CombatAction>;
}

export interface CombatAction {
  type: 'attack' | 'defend' | 'skill' | 'item';
  targetId?: string;
  skillId?: string;
  itemId?: string;
}

export interface DamageResult {
  damage: number;
  type: string;
  isCritical: boolean;
  effects: StatusEffect[];
}

export interface CombatResult {
  winner: string;
  rewards: {
    items: { id: string; amount: number; }[];
    exp: number;
  };
}

// 战斗配置
export interface CombatConfig {
  id: string;
  name: string;
  description: string;
  entities: EntityConfig[];
  rewards?: {
    exp: number;
    items?: { id: string; chance: number; amount: number; }[];
  };
}

// 实体配置
export interface EntityConfig {
  id: string;
  level: number;
  count: number;
}

// 战斗初始化参数
export interface CombatInitParams {
  combatId: string; // 战斗配置ID
  locationId: string; // 当前地点ID
  triggerType: 'story' | 'random' | 'boss'; // 触发类型
}

// 实体数据
export interface EntityData {
  id: string;
  name: string;
  faction: string;
  baseStats: CombatStats;
  levelGrowth: Record<keyof CombatStats, number>;
  skills: string[];
  illustration: string;
  illustrationVariants?: number; // 添加立绘变体数量配置
  ai?: {
    type: string;
    params?: Record<string, any>;
  };
}

// 添加阵营相关的类型定义
export interface FactionRelation {
  faction1: string;
  faction2: string;
  relation: 'friendly' | 'hostile' | 'neutral';
}

// 添加回合状态相关的类型
export interface TurnState {
  currentRound: number;
  turnOrder: string[];    // 存储combatantId的数组
  currentTurnIndex: number;
}