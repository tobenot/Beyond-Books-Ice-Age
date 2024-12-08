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

      tagService.updateTag('状态.生命值', -30);
      expect(tagService.getTagValue('状态.生命值')).toBe(70);
    });

    test('should update string tag value correctly', () => {
      tagService.loadTagsFromSave({
        位置: { 当前地点: { value: '' } }
      });

      tagService.updateTag('位置.当前地点', '冬眠中心');
      expect(tagService.getTagValue('位置.当前地点')).toBe('冬眠中心');
    });

    test('should handle non-existent tags', () => {
      expect(tagService.getTagValue('不存在.的路径')).toBe('');
    });

    test('should create missing tag categories', () => {
      tagService.updateTag('新类别.新标签', 100);
      expect(tagService.getTagValue('新类别.新标签')).toBe(100);
    });

    test('should accumulate numeric values', () => {
      tagService.loadTagsFromSave({
        状态: { 生命值: { value: 50 } }
      });

      tagService.updateTag('状态.生命值', 30);  // 50 + 30
      tagService.updateTag('状态.生命值', 20);  // 80 + 20

      expect(tagService.getTagValue('状态.生命值')).toBe(100);
    });

    test('should handle multiple tag updates', () => {
      tagService.loadTagsFromSave({
        状态: { 
          生命值: { value: 100 },
          精力: { value: 50 }
        }
      });

      tagService.updateTag('状态.生命值', -20);
      tagService.updateTag('状态.精力', 30);

      expect(tagService.getTagValue('状态.生命值')).toBe(80);
      expect(tagService.getTagValue('状态.精力')).toBe(80);
    });
  });
});