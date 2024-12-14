import { Combatant, CombatStats, CombatStatus, CombatAI } from './types';
import { characterService } from '../services/characterService';

export class CombatantManager {
  private combatants: Map<string, Combatant> = new Map();

  // 从角色创建战斗单位
  createFromCharacter(characterId: string): Combatant {
    const character = characterService.getCharacter(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);

    // 从角色标签中获取战斗属性
    const stats: CombatStats = {
      hp: Number(characterService.getCharacterTagValue(characterId, '状态.生命值')) || 100,
      maxHp: Number(characterService.getCharacterTagValue(characterId, '状态.生命值上限')) || 100,
      mp: Number(characterService.getCharacterTagValue(characterId, '状态.魔力值')) || 100,
      maxMp: Number(characterService.getCharacterTagValue(characterId, '状态.魔力值上限')) || 100,
      sp: Number(characterService.getCharacterTagValue(characterId, '状态.体力值')) || 100,
      maxSp: Number(characterService.getCharacterTagValue(characterId, '状态.体力值上限')) || 100,
      strength: Number(characterService.getCharacterTagValue(characterId, '属性.力量')) || 10,
      agility: Number(characterService.getCharacterTagValue(characterId, '属性.敏捷')) || 10,
      intelligence: Number(characterService.getCharacterTagValue(characterId, '属性.智力')) || 10,
      constitution: Number(characterService.getCharacterTagValue(characterId, '属性.体质')) || 10,
      wisdom: Number(characterService.getCharacterTagValue(characterId, '属性.感知')) || 10,
      charisma: Number(characterService.getCharacterTagValue(characterId, '属性.魅力')) || 10,
      baseInitiative: 0,
      initiative: 0
    };

    // 计算先攻值
    stats.baseInitiative = Math.floor(stats.agility * 1.5);
    stats.initiative = stats.baseInitiative;

    // 获取技能列表
    const skills = Object.entries(character.tags.技能 || {})
      .filter(([_, value]) => value > 0)
      .map(([skill]) => skill);

    // 根据角色阵营设置默认 AI
    let ai: CombatAI | undefined;
    if (character.faction !== '玩家') {
      if (character.faction === '复苏队') {
        ai = {
          type: 'support',
          decideAction: async () => {
            // 复苏队 AI 倾向于支援和防御
            const rand = Math.random();
            if (rand < 0.4) {
              return {
                type: 'defend'
              };
            } else if (rand < 0.7) {
              return {
                type: 'skill',
                skillId: 'heal',
                targetId: 'player'
              };
            } else {
              return {
                type: 'attack',
                targetId: 'enemy'
              };
            }
          }
        };
      } else if (character.faction === '冰河派') {
        ai = {
          type: 'aggressive',
          decideAction: async () => {
            return {
              type: 'attack',
              targetId: 'player'
            };
          }
        };
      }
    }

    const combatant: Combatant = {
      id: characterId,
      name: character.name,
      faction: character.faction,
      stats,
      skills,
      status: {
        isDefending: false,
        buffs: [],
        debuffs: []
      },
      ai
    };

    this.combatants.set(characterId, combatant);
    return combatant;
  }

  // 从敌人配置创建战斗单位
  createFromEntity(config: {
    id: string;
    name: string;
    faction: string;
    stats: CombatStats & { baseInitiative?: number };
    skills: string[];
    status: CombatStatus;
    ai?: {
      type: string;
      params?: Record<string, any>;
    };
  }): Combatant {
    const stats = {
      ...config.stats,
      baseInitiative: config.stats.baseInitiative || Math.floor(config.stats.agility * 1.5),
      initiative: 0
    };

    const combatant: Combatant = {
      id: config.id,
      name: config.name,
      faction: config.faction,
      stats,
      skills: config.skills,
      status: config.status,
      ai: config.ai ? this.createAI(config.ai) : undefined
    };

    this.combatants.set(config.id, combatant);
    return combatant;
  }

  // 添加 AI 创建方法
  private createAI(aiConfig: { type: string; params?: Record<string, any> }): CombatAI {
    return {
      type: aiConfig.type as 'aggressive' | 'defensive' | 'support' | 'random',
      decideAction: async () => {
        // 根据 AI 类型决定行动
        switch (aiConfig.type) {
          case 'aggressive':
            return {
              type: 'attack',
              targetId: 'player'
            };
          case 'defensive':
            return {
              type: 'defend'
            };
          case 'support':
            // TODO: 实现支援 AI 逻辑
            return {
              type: 'skill',
              skillId: 'heal',
              targetId: 'player'
            };
          default:
            return {
              type: 'attack',
              targetId: 'player'
            };
        }
      }
    };
  }

  // 获取战斗单位
  getCombatant(id: string): Combatant | undefined {
    return this.combatants.get(id);
  }

  // 更新战斗单位状态
  updateCombatant(id: string, updates: Partial<Combatant>): void {
    const combatant = this.combatants.get(id);
    if (combatant) {
      Object.assign(combatant, updates);
      this.combatants.set(id, combatant);
    }
  }

  // 移除战斗单位
  removeCombatant(id: string): void {
    this.combatants.delete(id);
  }

  // 获取所有战斗单位
  getAllCombatants(): Combatant[] {
    return Array.from(this.combatants.values());
  }

  // 获取指定阵营的战斗单位
  getCombatantsByFaction(faction: string): Combatant[] {
    return this.getAllCombatants().filter(c => c.faction === faction);
  }

  // 清空所有战斗单位
  clear(): void {
    this.combatants.clear();
  }
} 