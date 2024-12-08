import { TagsConfig, PlayerTags, TagConfig } from '../types';

class TagService {
  private tagsConfig: TagsConfig = {};
  private playerTags: PlayerTags = {};

  async loadTagsConfig(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/tagsConfig.json');
      this.tagsConfig = await response.json();
      console.log('Tags config loaded');
      
      // 初始化玩家标签
      await this.initPlayerTags();
    } catch (error) {
      console.error('Error loading tags config:', error);
    }
  }

  private async initPlayerTags(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/playerTags.json');
      this.playerTags = await response.json();
    } catch (error) {
      // 如果没有playerTags.json,从tagsConfig创建默认值
      this.playerTags = this.createDefaultPlayerTags();
    }
  }

  private createDefaultPlayerTags(): PlayerTags {
    const defaultTags: PlayerTags = {};
    
    for (const [category, tags] of Object.entries(this.tagsConfig)) {
      defaultTags[category] = {};
      for (const [tagName, config] of Object.entries(tags)) {
        defaultTags[category][tagName] = config.defaultValue;
      }
    }
    
    return defaultTags;
  }

  getTagConfig(path: string): TagConfig | null {
    const keys = path.split('.');
    let current: any = this.tagsConfig;
    
    for (const key of keys) {
      if (!current[key]) return null;
      current = current[key];
    }
    
    return current;
  }

  getTagValue(path: string): number | string {
    const keys = path.split('.');
    let current: any = this.playerTags;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        const config = this.getTagConfig(path);
        return config?.defaultValue ?? '';
      }
      current = current[key];
    }
    
    return current;
  }

  updateTag(path: string, value: number | string): void {
    console.log(`Updating tag: ${path} with value:`, value);
    const keys = path.split('.');
    let current: any = this.playerTags;
    
    // 创建路径
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    const currentValue = current[lastKey];
    
    if (typeof value === 'number' && typeof currentValue === 'number') {
      current[lastKey] = currentValue + value;
      console.log(`Updated numeric tag ${path}: ${currentValue} -> ${current[lastKey]}`);
    } else {
      current[lastKey] = value;
      console.log(`Updated tag ${path}: ${currentValue} -> ${value}`);
    }
  }

  getTags(): PlayerTags {
    return this.playerTags;
  }

  getTagsConfig(): TagsConfig {
    return this.tagsConfig;
  }

  async loadTagsFromSave(savedTags: PlayerTags): Promise<void> {
    this.playerTags = savedTags;
  }
}

export const tagService = new TagService(); 