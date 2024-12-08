import { describe, test, expect, beforeEach, vi } from 'vitest';
import { effectService } from '../../services/effectService';
import { tagService } from '../../services/tagService';

// Mock tagService
vi.mock('../../services/tagService', () => ({
  tagService: {
    updateTag: vi.fn()
  }
}));

describe('EffectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should handle empty tag effect', () => {
    effectService.applyEffect('状态.生命值.empty');
    
    expect(tagService.updateTag).toHaveBeenCalledWith('状态.生命值', '');
  });

  test('should handle positive number effect', () => {
    effectService.applyEffect('状态.生命值.50');
    
    expect(tagService.updateTag).toHaveBeenCalledWith('状态.生命值', 50);
  });

  test('should handle negative number effect', () => {
    effectService.applyEffect('状态.生命值.-30');
    
    expect(tagService.updateTag).toHaveBeenCalledWith('状态.生命值', -30);
  });

  test('should ignore invalid effect format', () => {
    effectService.applyEffect('invalid.effect.format');
    
    expect(tagService.updateTag).not.toHaveBeenCalled();
  });

  test('should handle decimal numbers as invalid format', () => {
    effectService.applyEffect('状态.生命值.10.5');
    
    expect(tagService.updateTag).not.toHaveBeenCalledWith('状态.生命值', 10.5);
  });

  test('should handle empty string', () => {
    effectService.applyEffect('');
    
    expect(tagService.updateTag).not.toHaveBeenCalled();
  });

  test('should only accept integer numbers', () => {
    effectService.applyEffect('状态.生命值.10');
    
    expect(tagService.updateTag).toHaveBeenCalledWith('状态.生命值', 10);
  });
});