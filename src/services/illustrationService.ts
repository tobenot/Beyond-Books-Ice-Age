import { Card } from '../types';
import { characterService } from './characterService';

class IllustrationService {
  private readonly BASE_PATH = import.meta.env.BASE_URL;
  private readonly DEFAULT_ILLUSTRATION = 'default.webp';
  private imageCache: Map<string, string> = new Map();

  // 处理通配符
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

    return id;
  }

  // 统一获取立绘
  async getIllustration(id: string): Promise<string> {
    const resolvedId = await this.resolveWildcard(id);
    const cacheKey = `illustration_${resolvedId}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      const path = `${this.BASE_PATH}illustrations/${resolvedId}.webp`;
      await this.checkImageExists(path);
      this.imageCache.set(cacheKey, path);
      return path;
    } catch {
      const defaultPath = `${this.BASE_PATH}illustrations/${this.DEFAULT_ILLUSTRATION}`;
      this.imageCache.set(cacheKey, defaultPath);
      return defaultPath;
    }
  }

  private async checkImageExists(path: string): Promise<void> {
    const response = await fetch(path, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Image not found');
    }
  }

  async getCardIllustration(card: Card): Promise<string> {
    const cacheKey = `card_${card.id}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      // 如果配置了illustration，使用配置的立绘
      const illustrationId = card.illustration || card.id;
      const resolvedId = await this.resolveWildcard(illustrationId);
      const path = `${this.BASE_PATH}illustrations/${resolvedId}.webp`;
      await this.checkImageExists(path);
      this.imageCache.set(cacheKey, path);
      return path;
    } catch {
      const defaultPath = `${this.BASE_PATH}illustrations/${this.DEFAULT_ILLUSTRATION}`;
      this.imageCache.set(cacheKey, defaultPath);
      return defaultPath;
    }
  }
}

export const illustrationService = new IllustrationService(); 