import { Character, CharacterTags } from '../types';
import { createDefaultTags } from '../utils/defaultTags';

class CharacterService {
  private readonly PLAYER_ID = 'player';
  private characters: Record<string, Character> = {};
  private characterTags: Record<string, CharacterTags> = {};

  async loadCharacterData(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/characters.json');
      const data = await response.json();
      
      console.log('Raw character data loaded:', data);
      
      // 深拷贝数据以避免引用问题
      this.characters = JSON.parse(JSON.stringify(data));
      this.characterTags = {};
      
      // 初始化每个角色的tags
      Object.keys(this.characters).forEach(charId => {
        const character = this.characters[charId];
        console.log(`Initializing tags for character ${charId}:`, character);
        
        // 确保tags对象存在
        if (!character.tags) {
          character.tags = createDefaultTags();
        }
        
        // 深拷贝tags
        this.characterTags[charId] = JSON.parse(JSON.stringify(character.tags));
        
        // 确保位置标签存在
        if (!this.characterTags[charId].位置) {
          this.characterTags[charId].位置 = {
            当前地点: "复苏队基地", // 设置默认位置
            目标地点: ""
          };
        }
        
        console.log(`Final tags for ${charId}:`, this.characterTags[charId]);
      });
      
      console.log('Final characterTags state:', this.characterTags);
    } catch (error) {
      console.error('Error loading characters:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    }
  }

  getCharacter(characterId: string): Character | null {
    return this.characters[characterId] || null;
  }

  getAllCharacters(): Character[] {
    return Object.values(this.characters);
  }

  getCharactersAtLocation(location: string): Character[] {
    return Object.values(this.characters).filter(char => {
      const charLocation = this.getCharacterTagValue(char.id, '位置.当前地点');
      return charLocation === location;
    });
  }

  updateCharacterTag(characterId: string, tagPath: string, value: number | string): void {
    // 确保 characterTags 存在且有正确的结构
    if (!this.characterTags[characterId]) {
      this.characterTags[characterId] = createDefaultTags();
    }

    const keys = tagPath.split('.');
    let current: any = this.characterTags[characterId];
    
    // 如果值是 'empty'，则删除该标签
    if (value === 'empty') {
      // 遍历到倒数第二层
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) return;
        current = current[key];
      }
      
      // 删除最后一层的键
      const lastKey = keys[keys.length - 1];
      if (current[lastKey] !== undefined) {
        console.log(`删除标签 ${tagPath} (${characterId})`);
        delete current[lastKey];
      }
      return;
    }

    // 正常设置值的逻辑保持不变...
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (i === 0 && !current[key]) {
        if (!['状态', '位置', '装备', '物品', '技能', '对话', '记忆', '目标'].includes(key)) {
          console.warn(`Creating new top-level tag category: ${key}`);
        }
        current[key] = {};
      }
      else if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    const currentValue = current[lastKey];
    
    if (typeof value === 'number' && typeof currentValue === 'number') {
      current[lastKey] = currentValue + value;
    } else {
      current[lastKey] = value;
    }

    console.log(`更新标签 ${tagPath} (${characterId}):`, {
      path: tagPath,
      value: current[lastKey],
      fullPath: this.getCharacterTagValue(characterId, tagPath)
    });
  }

  getCharacterTagValue(characterId: string, tagPath: string): number | string {
    if (!this.characterTags[characterId]) {
      console.warn(`No tags found for character ${characterId}`);
      return '';
    }

    const keys = tagPath.split('.');
    let current: any = this.characterTags[characterId];
    
    // 遍历到最后一个键之前的所有键
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current || typeof current !== 'object') {
        console.warn(`Invalid path ${tagPath} for character ${characterId}, stopped at ${key}, current:`, current);
        return '';
      }
      if (!(key in current)) {
        console.warn(`Missing key ${key} in path ${tagPath} for character ${characterId}`);
        return '';
      }
      current = current[key];
    }

    // 处理最后一个键
    const lastKey = keys[keys.length - 1];
    
    // 如果 current 不是对象，说明我们遇到了叶子节点（数字或字符串值）
    if (typeof current !== 'object') {
      console.warn(`Trying to access property ${lastKey} of non-object value:`, current);
      return '';
    }
    
    if (!(lastKey in current)) {
      console.warn(`Missing final key ${lastKey} in path ${tagPath} for character ${characterId}`);
      return '';
    }

    return current[lastKey];
  }

  getCharacterTags(characterId: string): CharacterTags {
    return this.characterTags[characterId];
  }

  setCharacterLocation(characterId: string, location: string): void {
    this.updateCharacterTag(characterId, '位置.当前地点', location);
  }

  getCharacterRelationship(fromCharId: string, toCharId: string): {好感度: number; 信任度: number; 立场: string} | null {
    const character = this.characters[fromCharId];
    if (!character || !character.relationships[toCharId]) {
      return null;
    }
    return character.relationships[toCharId];
  }

  updateCharacterRelationship(
    fromCharId: string, 
    toCharId: string, 
    changes: {
      好感度?: number;
      信任度?: number;
      立场?: string;
    }
  ): void {
    const character = this.characters[fromCharId];
    if (!character) return;

    if (!character.relationships[toCharId]) {
      character.relationships[toCharId] = {
        好感度: 0,
        信任度: 0,
        立场: "中立"
      };
    }

    const relationship = character.relationships[toCharId];
    
    if (typeof changes.好感度 === 'number') {
      relationship.好感度 += changes.好感度;
    }
    if (typeof changes.信任度 === 'number') {
      relationship.信任度 += changes.信任度;
    }
    if (changes.立场) {
      relationship.立场 = changes.立场;
    }

    // 根据好感度自动调整立场
    if (relationship.好感度 >= 50) {
      relationship.立场 = "友好";
    } else if (relationship.好感度 <= -50) {
      relationship.立场 = "敌对";
    }
  }

  // 获取指定地点所有人物之间的关系
  getRelationshipsAtLocation(location: string): Array<{
    from: Character;
    to: Character;
    relationship: {
      好感度: number;
      信任度: number;
      立场: string;
    };
  }> {
    const charactersAtLocation = this.getCharactersAtLocation(location);
    const relationships = [];

    for (const char1 of charactersAtLocation) {
      for (const char2 of charactersAtLocation) {
        if (char1.id !== char2.id) {
          const relationship = this.getCharacterRelationship(char1.id, char2.id);
          if (relationship) {
            relationships.push({
              from: char1,
              to: char2,
              relationship
            });
          }
        }
      }
    }

    return relationships;
  }

  isPlayer(characterId: string): boolean {
    return characterId === this.PLAYER_ID;
  }

  getPlayer(): Character | null {
    return this.getCharacter(this.PLAYER_ID);
  }

  updatePlayerTag(tagPath: string, value: number | string): void {
    this.updateCharacterTag(this.PLAYER_ID, tagPath, value);
  }

  getPlayerTagValue(tagPath: string): number | string {
    return this.getCharacterTagValue(this.PLAYER_ID, tagPath);
  }

  // 获取玩家与其他角色的关系
  getPlayerRelationships(): Array<{
    character: Character;
    playerToChar: {
      好感度: number;
      信任度: number;
      立场: string;
    };
    charToPlayer: {
      好感度: number;
      信任度: number;
      立场: string;
    };
  }> {
    const player = this.getPlayer();
    if (!player) return [];

    return Object.values(this.characters)
      .filter(char => !this.isPlayer(char.id))
      .map(character => ({
        character,
        playerToChar: this.getCharacterRelationship(this.PLAYER_ID, character.id) || {
          好感度: 0,
          信任度: 0,
          立场: "中立"
        },
        charToPlayer: this.getCharacterRelationship(character.id, this.PLAYER_ID) || {
          好感度: 0,
          信任度: 0,
          立场: "中立"
        }
      }));
  }
}

export const characterService = new CharacterService(); 