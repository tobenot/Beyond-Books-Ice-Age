import { characterService } from '../services/characterService';
import { TagsConfig, PlayerTags, TagConfig, CharacterTags } from '../types';
import { createDefaultTags } from '../utils/defaultTags';

class TagService {
  private tagsConfig: TagsConfig = {
    状态: {},
    位置: {},
    物品: {},
    装备: {}
  };

  async loadTagsConfig(): Promise<void> {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${import.meta.env.BASE_URL}config/tags.json?t=${timestamp}`);
      const data = await response.json();
      this.tagsConfig = data;
      console.log('Tags config loaded');
    } catch (error) {
      console.error('Error loading tags config:', error);
    }
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
    return characterService.getPlayerTagValue(path);
  }

  updateTag(path: string, value: number | string): void {
    if (value === 'empty') {
      console.log(`删除标签: ${path}`);
    } else {
      console.log(`更新标签: ${path} = ${value}`);
    }
    characterService.updatePlayerTag(path, value);
  }

  getTags(): PlayerTags {
    const player = characterService.getPlayer();
    return player?.tags || createDefaultTags();
  }

  getTagsConfig(): TagsConfig {
    return this.tagsConfig;
  }

  async loadTagsFromSave(savedTags: PlayerTags): Promise<void> {
    const player = characterService.getPlayer();
    if (player) {
      const characterTags: CharacterTags = {
        状态: savedTags.状态 || {},
        位置: savedTags.位置 || {
          当前地点: "复苏队基地",
          目标地点: ""
        },
        装备: savedTags.装备 || {},
        物品: savedTags.物品 || {},
        属性: savedTags.属性 || {},
        技能: savedTags.技能 || {}
      };
      player.tags = characterTags;
    }
  }
}

export const tagService = new TagService(); 