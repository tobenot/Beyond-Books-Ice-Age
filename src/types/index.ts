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

export interface TagsConfig {
  [key: string]: Tag | TagsConfig;
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