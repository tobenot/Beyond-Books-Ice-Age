import { TagsConfig, Tag } from '../types';

class TagService {
  private tags: TagsConfig = {};

  async loadTagsConfig(): Promise<void> {
    try {
      const response = await fetch('/config/tagsConfig.json');
      const data = await response.json();
      this.tags = data;
      console.log('Tags config loaded');
    } catch (error) {
      console.error('Error loading tags config:', error);
    }
  }

  private findTag(path: string): any {
    const keys = path.split('.');
    let current = this.tags;
    
    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    return current;
  }

  updateTag(path: string, value: number): void {
    const tag = this.findTag(path);
    if (tag) {
      tag.value = (tag.value || 0) + value;
      this.saveTags();
    }
  }

  getTagValue(path: string): number {
    const keys = path.split('.');
    let current: Tag | TagsConfig = this.tags;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return 0;
      }
      current = current[key];
    }
    
    if ('value' in current && typeof current.value === 'number') {
      return current.value;
    }
    return 0;
  }

  getTags(): TagsConfig {
    return this.tags;
  }

  private saveTags(): void {
    localStorage.setItem('tags', JSON.stringify(this.tags));
  }
}

export const tagService = new TagService(); 