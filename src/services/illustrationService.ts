import { Card } from '../types';

class IllustrationService {
  private readonly BASE_PATH = import.meta.env.BASE_URL;
  private readonly DEFAULT_ILLUSTRATION = 'default.webp';
  private imageCache: Map<string, string> = new Map();

  // 统一获取立绘
  async getIllustration(id: string): Promise<string> {
    const cacheKey = `illustration_${id}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      const path = `${this.BASE_PATH}illustrations/${id}.webp`;
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
      const path = `${this.BASE_PATH}illustrations/${illustrationId}.webp`;
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