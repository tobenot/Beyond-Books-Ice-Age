import { characterService } from './characterService';

export const effectService = {
  applyEffect(effect: string) {
    if (!effect) return;

    if (effect.endsWith('.empty')) {
      const tagPath = effect.slice(0, -6);
      characterService.updatePlayerTag(tagPath, '');
    } else {
      const match = effect.match(/^(.+)\.(-?\d+|[^.]+)$/);
      if (match) {
        const [, tagPath, valueStr] = match;
        // 如果是数字
        if (/^-?\d+$/.test(valueStr)) {
          const value = parseInt(valueStr);
          if (!isNaN(value)) {
            characterService.updatePlayerTag(tagPath, value);
          }
        } else {
          // 如果是字符串值
          characterService.updatePlayerTag(tagPath, valueStr);
        }
      }
    }
  }
}; 