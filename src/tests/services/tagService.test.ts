import { describe, test, expect, beforeEach, vi } from 'vitest';
import { tagService } from '../../services/tagService';

describe('TagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Tag Operations', () => {
    test('should update numeric tag value correctly', () => {
      tagService.loadTagsFromSave({
        状态: { 生命值: { value: 100 } }
      });

      characterService.updatePlayerTag('状态.生命值', -30);
      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(70);
    });

    test('should update string tag value correctly', () => {
      tagService.loadTagsFromSave({
        位置: { 当前地点: { value: '' } }
      });

      characterService.updatePlayerTag('位置.当前地点', '冬眠中心');
      expect(characterService.getPlayerTagValue('位置.当前地点')).toBe('冬眠中心');
    });

    test('should handle non-existent tags', () => {
      expect(characterService.getPlayerTagValue('不存在.的路径')).toBe('');
    });

    test('should create missing tag categories', () => {
      characterService.updatePlayerTag('新类别.新标签', 100);
      expect(characterService.getPlayerTagValue('新类别.新标签')).toBe(100);
    });

    test('should accumulate numeric values', () => {
      tagService.loadTagsFromSave({
        状态: { 生命值: { value: 50 } }
      });

      characterService.updatePlayerTag('状态.生命值', 30);  // 50 + 30
      characterService.updatePlayerTag('状态.生命值', 20);  // 80 + 20

      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(100);
    });

    test('should handle multiple tag updates', () => {
      tagService.loadTagsFromSave({
        状态: { 
          生命值: { value: 100 },
          精力: { value: 50 }
        }
      });

      characterService.updatePlayerTag('状态.生命值', -20);
      characterService.updatePlayerTag('状态.精力', 30);

      expect(characterService.getPlayerTagValue('状态.生命值')).toBe(80);
      expect(characterService.getPlayerTagValue('状态.精力')).toBe(80);
    });
  });
});