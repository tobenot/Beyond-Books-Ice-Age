import { TagsConfig, Tag } from '../types';

class TagService {
  private tags: TagsConfig = {};

  async loadTagsConfig(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/tagsConfig.json');
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

  updateTag(path: string, value: number | string): void {
    const tag = this.findTag(path);
    if (tag) {
      if (typeof value === 'string') {
        tag.value = value;
      } else {
        tag.value = (typeof tag.value === 'number' ? tag.value : 0) + value;
      }
      this.saveTags();
    }
  }

  getTagValue(path: string): number | string {
    const keys = path.split('.');
    let current: Tag | TagsConfig = this.tags;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return '';
      }
      current = current[key];
    }
    
    if ('value' in current && (typeof current.value === 'string' || typeof current.value === 'number')) {
      return current.value;
    }
    return '';
  }

  getTags(): TagsConfig {
    return this.tags;
  }

  private saveTags(): void {
    try {
      localStorage.setItem('tags', JSON.stringify(this.tags));
    } catch (error) {
      console.error('Error saving tags to localStorage:', error);
    }
  }

  async loadTagsFromSave(savedTags: TagsConfig): Promise<void> {
    this.tags = savedTags;
  }
}

export const tagService = new TagService(); 