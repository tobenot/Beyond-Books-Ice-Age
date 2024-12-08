import { tagService } from './tagService';

export const effectService = {
  applyEffect(effect: string) {
    if (effect.endsWith('.empty')) {
      const tagPath = effect.slice(0, -6);
      tagService.updateTag(tagPath, '');
    } else {
      const match = effect.match(/^(.+)\.(-?\d+)$/);
      if (match) {
        const [, tagPath, valueStr] = match;
        const value = parseInt(valueStr);
        tagService.updateTag(tagPath, value);
      }
    }
  }
}; 