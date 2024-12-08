import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tagService } from '../../services/tagService';
import { characterService } from '../../services/characterService';
import { createDefaultTags } from '../../utils/defaultTags';

describe('TagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTagsFromSave', () => {
    it('should load tags from save data', () => {
      const tags = createDefaultTags();
      tags.状态.生命值 = 100;
      
      tagService.loadTagsFromSave(tags);
      characterService.updatePlayerTag('状态.生命值', -30);
      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(70);
    });

    it('should handle numeric tag updates', () => {
      const tags = createDefaultTags();
      tags.状态.生命值 = 50;
      
      tagService.loadTagsFromSave(tags);
      characterService.updatePlayerTag('状态.生命值', 30);
      characterService.updatePlayerTag('状态.生命值', 20);
      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(100);
    });

    it('should handle multiple tag updates', () => {
      const tags = createDefaultTags();
      tags.状态.生命值 = 100;
      tags.状态.精力 = 50;
      
      tagService.loadTagsFromSave(tags);
      characterService.updatePlayerTag('状态.生命值', -20);
      characterService.updatePlayerTag('状态.精力', 30);
      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(80);
      expect(characterService.getPlayerTagValue('状态.精力')).toBe(80);
    });
  });

  describe('createDefaultTags', () => {
    it('should create default tags with correct initial values', () => {
      const tags = createDefaultTags();
      expect(tags.状态.生命值).toBe(100);
      expect(tags.状态.熵减抗性).toBe(0);
      expect(tags.状态.精力).toBe(100);
      expect(tags.状态.快乐).toBe(50);
    });

    it('should maintain all required tag categories', () => {
      const tags = createDefaultTags();
      expect(tags).toHaveProperty('状态');
      expect(tags).toHaveProperty('位置');
      expect(tags).toHaveProperty('装备');
      expect(tags).toHaveProperty('物品');
      expect(tags).toHaveProperty('属性');
      expect(tags).toHaveProperty('技能');
    });
  });
});