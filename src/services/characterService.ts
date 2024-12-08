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
    console.log('Looking for characters at location:', location);
    console.log('Current characterTags state:', this.characterTags);
    
    const characters = Object.values(this.characters).filter(char => {
      const charLocation = this.getCharacterTagValue(char.id, '位置.当前地点');
      console.log(`Character ${char.name}(${char.id}) location check:`, {
        charTags: this.characterTags[char.id],
        locationValue: charLocation
      });
      return charLocation === location;
    });
    
    console.log('Found characters:', characters.map(c => ({
      name: c.name,
      id: c.id,
      tags: this.characterTags[c.id]
    })));
    return characters;
  }

  updateCharacterTag(characterId: string, tagPath: string, value: number | string): void {
    const keys = tagPath.split('.');
    let current: any = this.characterTags[characterId];
    
    // 创建路径
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
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
  }

  getCharacterTagValue(characterId: string, tagPath: string): number | string {
    if (!this.characterTags[characterId]) {
      console.warn(`No tags found for character ${characterId}`);
      return '';
    }

    const keys = tagPath.split('.');
    let current: any = this.characterTags[characterId];
    
    console.log(`Getting tag value for ${characterId}, path: ${tagPath}`, {
      characterId,
      tagPath,
      initialValue: current,
      allTags: this.characterTags
    });
    
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        console.warn(`Invalid path ${tagPath} for character ${characterId} at key ${key}`, {
          current,
          isObject: typeof current === 'object',
          hasKey: current ? key in current : false
        });
        return '';
      }
      current = current[key];
    }
    
    return current;
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