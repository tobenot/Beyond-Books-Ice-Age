import { tagService } from './tagService';
import { characterService } from './characterService';

export const effectService = {
  applyEffect(effect: string) {
    if (!effect) return;

    if (effect.endsWith('.empty')) {
      const tagPath = effect.slice(0, -6);
      characterService.updatePlayerTag(tagPath, '');
    } else {
      const match = effect.match(/^(.+)\.(-?\d+)$/);
      if (match && !effect.includes('.', effect.lastIndexOf('.') + 1)) {
        const [, tagPath, valueStr] = match;
        const value = parseInt(valueStr);
        if (!isNaN(value)) {
          characterService.updatePlayerTag(tagPath, value);
        }
      }
    }
  }
}; 