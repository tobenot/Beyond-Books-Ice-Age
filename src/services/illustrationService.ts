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
    if (id === '{{interactCharIllustration}}') {
      const targetCharId = characterService.getPlayerTagValue('目标.交互角色');
      return this.getCharacterVariantId(targetCharId as string) || this.DEFAULT_ILLUSTRATION;
    }
    
    // 处理主角立绘通配符
    if (id === '{{playerIllustration}}') {
      return this.getCharacterVariantId('player');
    }
    
    // 处理地点通配符
    if (id === '{{locationIllustration}}') {
      const targetLocation = characterService.getPlayerTagValue('位置.目标地点');
      return targetLocation ? `loc_${targetLocation}` : this.DEFAULT_ILLUSTRATION;
    }

    // 使用新方法处理战斗立绘
    if (id === '{{actorIllustration}}') {
      const actorId = characterService.getPlayerTagValue('战斗.当前行动者');
      const variantId = this.getCharacterVariantId(actorId as string);
      // 只有当变体ID是默认立绘时,才尝试获取战斗立绘
      if (variantId === this.DEFAULT_ILLUSTRATION) {
        return await this.getCombatIllustration('actor');
      }
      return variantId;
    }

    if (id === '{{targetIllustration}}') {
      const targetId = characterService.getPlayerTagValue('战斗.行动目标');
      const variantId = this.getCharacterVariantId(targetId as string);
      // 只有当变体ID是默认立绘时,才尝试获取战斗立绘
      if (variantId === this.DEFAULT_ILLUSTRATION) {
        return await this.getCombatIllustration('target');
      }
      return variantId;
    }

    return id;
  }

  // 新增: 获取角色立绘变体ID
  private getCharacterVariantId(characterId: string | null): string {
    if (!characterId || characterId === 'empty') {
      return this.DEFAULT_ILLUSTRATION;
    }

    // 获取角色信息
    const character = characterService.getCharacter(characterId);
    if (!character) {
      return this.DEFAULT_ILLUSTRATION;
    }

    // 基础立绘ID
    let illustrationId = characterId;

    // 根据角色标签状态添加变体后缀
    const variants: string[] = [];

    // 检查镜子自选立绘变体
    const mirror = characterService.getCharacterTagValue(characterId, '镜子.变化.外观');
    if (mirror) {
      variants.push(mirror as string);
    }

    // 检查表情变体
    const emotion = characterService.getCharacterTagValue(characterId, '状态.表情');
    if (emotion) {
      variants.push(emotion as string);
    }

    // 检查服装变体
    const outfit = characterService.getCharacterTagValue(characterId, '装备.身体');
    if (outfit) {
      variants.push(outfit as string);
    }

    // 检查姿势变体
    const pose = characterService.getCharacterTagValue(characterId, '状态.姿势');
    if (pose) {
      variants.push(pose as string);
    }

    // 检查伤势变体
    const hp = characterService.getCharacterTagValue(characterId, '状态.生命值');
    const maxHp = characterService.getCharacterTagValue(characterId, '状态.生命值上限');
    if (typeof hp === 'number' && typeof maxHp === 'number') {
      const hpPercentage = hp / maxHp;
      if (hpPercentage <= 0.3) {
        variants.push('injured');
      }
    }

    // 检查特殊状态变体
    const specialState = characterService.getCharacterTagValue(characterId, '状态.特殊');
    if (specialState) {
      variants.push(specialState as string);
    }

    // 如果有变体,添加到ID中
    if (variants.length > 0) {
      illustrationId += '_' + variants.join('_');
    }

    console.log(`获取角色 ${characterId} 的立绘变体:`, illustrationId);
    return illustrationId;
  }

  // 修改: 统一获取立绘,添加动态标识和变体支持
  async getIllustration(id: string): Promise<string> {
    // 检查是否是动态通配符
    const isDynamic = id.startsWith('{{') && id.endsWith('}}');
    
    // 如果不是动态内容且已缓存,直接返回
    const cacheKey = `illustration_${id}`;
    if (!isDynamic && this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    console.log('获取立绘:', id);
    try {
      const resolvedId = await this.resolveWildcard(id);
      let path = `${this.BASE_PATH}illustrations/${resolvedId}.webp`;

      console.log('获取立绘:', path);
      // 尝试加载变体立绘
      try {
        await this.checkImageExists(path);
      } catch {
        // 如果变体立绘不存在,回退到基础立绘
        const baseId = resolvedId.split('_')[0];
        path = `${this.BASE_PATH}illustrations/${baseId}.webp`;
        await this.checkImageExists(path);
      }
      
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