import { Card } from '../types';
import { characterService } from './characterService';
import { combatSystem } from '../combat/CombatSystem';

class IllustrationService {
  private readonly BASE_PATH = import.meta.env.BASE_URL;
  private readonly DEFAULT_ILLUSTRATION = 'default.webp';
  private imageCache: Map<string, string> = new Map();

  // 新增: 直接获取战斗立绘
  private async getCombatIllustration(type: 'actor' | 'target'): Promise<string> {
    // 获取对应的战斗单位
    const unitId = type === 'actor' 
      ? characterService.getPlayerTagValue('战斗.当前行动者')
      : characterService.getPlayerTagValue('战斗.行动目标');
    
    console.log(`获取${type === 'actor' ? '行动者' : '目标'}立绘, ID:`, unitId);
    
    if (!unitId || unitId === 'empty') {
      console.log('- 无效ID,使用默认立绘');
      return this.DEFAULT_ILLUSTRATION;
    }

    // 如果是玩家角色,直接返回角色立绘
    if (unitId === 'player') {
      console.log('- 是玩家角色');
      return 'player';
    }

    // 如果是其他角色(如NPC),使用角色立绘
    const character = characterService.getCharacter(unitId as string);
    if (character) {
      console.log('- 是NPC角色:', character.name);
      return unitId as string;
    }

    // 获取战斗实体的立绘
    const combatant = combatSystem.getCombatant(unitId as string);
    if (!combatant) {
      console.log('- 未找到战斗单位,使用默认立绘');
      return this.DEFAULT_ILLUSTRATION;
    }

    console.log('- 是战斗实体:', combatant.name);
    console.log('- 立绘配置:', combatant.illustration);
    return combatant.illustration || this.DEFAULT_ILLUSTRATION;
  }

  // 修改: 通配符处理,使用新的战斗立绘获取方法
  private async resolveWildcard(id: string): Promise<string> {
    // 处理角色通配符
    if (id === '{{charIllustration}}') {
      const targetCharId = characterService.getPlayerTagValue('目标.交互角色');
      return targetCharId as string || this.DEFAULT_ILLUSTRATION;
    }
    
    // 处理地点通配符
    if (id === '{{locationIllustration}}') {
      const targetLocation = characterService.getPlayerTagValue('位置.目标地点');
      return targetLocation ? `loc_${targetLocation}` : this.DEFAULT_ILLUSTRATION;
    }

    // 使用新方法处理战斗立绘
    if (id === '{{actorIllustration}}') {
      return await this.getCombatIllustration('actor');
    }

    if (id === '{{targetIllustration}}') {
      return await this.getCombatIllustration('target');
    }

    return id;
  }

  // 修改: 统一获取立绘,添加动态标识
  async getIllustration(id: string): Promise<string> {
    // 检查是否是动态通配符
    const isDynamic = id.startsWith('{{') && id.endsWith('}}');
    
    // 如果不是动态内容且已缓存,直接返回
    const cacheKey = `illustration_${id}`;
    if (!isDynamic && this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      const resolvedId = await this.resolveWildcard(id);
      const path = `${this.BASE_PATH}illustrations/${resolvedId}.webp`;
      await this.checkImageExists(path);
      
      // 只缓存非动态内容
      if (!isDynamic) {
        this.imageCache.set(cacheKey, path);
      }
      
      return path;
    } catch {
      const defaultPath = `${this.BASE_PATH}illustrations/${this.DEFAULT_ILLUSTRATION}`;
      // 只缓存非动态内容
      if (!isDynamic) {
        this.imageCache.set(cacheKey, defaultPath);
      }
      return defaultPath;
    }
  }

  private async checkImageExists(path: string): Promise<void> {
    const response = await fetch(path, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Image not found');
    }
  }

  // 同样修改 getCardIllustration 方法
  async getCardIllustration(card: Card): Promise<string> {
    const illustrationId = card.illustration || card.id;
    const isDynamic = illustrationId.startsWith('{{') && illustrationId.endsWith('}}');
    
    const cacheKey = `card_${card.id}`;
    if (!isDynamic && this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      const resolvedId = await this.resolveWildcard(illustrationId);
      const path = `${this.BASE_PATH}illustrations/${resolvedId}.webp`;
      await this.checkImageExists(path);
      
      // 只缓存非动态内容
      if (!isDynamic) {
        this.imageCache.set(cacheKey, path);
      }
      
      return path;
    } catch {
      const defaultPath = `${this.BASE_PATH}illustrations/${this.DEFAULT_ILLUSTRATION}`;
      // 只缓存非动态内容
      if (!isDynamic) {
        this.imageCache.set(cacheKey, defaultPath);
      }
      return defaultPath;
    }
  }
}

export const illustrationService = new IllustrationService(); 