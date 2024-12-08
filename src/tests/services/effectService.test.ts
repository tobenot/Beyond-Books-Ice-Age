import { describe, it, expect, beforeEach, vi } from 'vitest';
import { effectService } from '../../services/effectService';
import { characterService } from '../../services/characterService';

vi.mock('../../services/characterService', () => ({
  characterService: {
    updatePlayerTag: vi.fn(),
    getPlayerTagValue: vi.fn()
  }
}));

describe('EffectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('applyEffect', () => {
    it('should not apply effect if condition is not met', () => {
      (characterService.getPlayerTagValue as ReturnType<typeof vi.fn>).mockReturnValue(0);
      
      effectService.applyEffect('if 状态.生命值 > 50 then 状态.生命值 += 10');
      
      expect(characterService.updatePlayerTag).not.toHaveBeenCalled();
    });

    it('should apply effect if condition is met', () => {
      (characterService.getPlayerTagValue as ReturnType<typeof vi.fn>).mockReturnValue(60);
      
      effectService.applyEffect('if 状态.生命值 > 50 then 状态.生命值 += 10');
      
      expect(characterService.updatePlayerTag).toHaveBeenCalledWith('状态.生命值', 10);
    });
  });
});