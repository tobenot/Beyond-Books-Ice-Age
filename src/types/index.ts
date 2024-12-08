export interface Card {
  id: string;
  name: string;
  type: string;
  cardSet: string;
  description: string;
  requireTags?: {
    [key: string]: string;
  };
  baseWeight: number;
  weightMultipliers?: {
    [key: string]: number;
  };
  mustDraw?: boolean;
  priority?: number;
  timeConsumption?: number;
  dateRestrictions?: {
    after?: string;
    before?: string;
    between?: [string, string];
  };
  choices: Choice[];
}

export interface Choice {
  text: string;
  requireTags?: {
    [key: string]: string;
  };
  effects: string[];
  specialMechanism?: string;
  consumeCard?: boolean;
  description: string;
}

export interface Tag {
  value?: number;
  priority?: number;
  color?: string;
  [key: string]: any;
}

export interface TagConfig {
  color?: string;
  priority?: number;
  description?: string;
  type?: string;
  defaultValue: number | string;
  effects?: string[] | Record<string, number>;
  slot?: string;
}

interface ItemConfig extends TagConfig {
  type: 'consumable' | 'equipment';
  slot?: '头部' | '身体' | '武器';
  effects?: Record<string, number> | string[];
  description?: string;
}

export interface TagsConfig {
  状态: Record<string, TagConfig>;
  位置: Record<string, TagConfig>;
  物品: Record<string, ItemConfig>;
  装备: Record<string, TagConfig>;
}

export interface PlayerTags {
  [category: string]: {
    [tagName: string]: number | string;
  };
}

export interface Countdown {
  name: string;
  date: Date;
}

export interface TagModifier {
  value: number;
}

export interface TagModifierConfig {
  [key: string]: TagModifier | TagModifierConfig;
}

export interface SpecialMechanism {
  [key: string]: (choice: Choice, card: Card) => void;
} 