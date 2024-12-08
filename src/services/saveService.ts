import { tagService } from './tagService';
import { dateService } from './dateService';
import { cardService } from './cardService';
import { Card } from '../types';
import { characterService } from '../services/characterService';

interface SaveData {
  tags: any;
  date: Date;
  countdowns: Array<{name: string, date: Date}>;
  currentCard: Card | null;
  consumedCards: string[]; // 存储已消耗的卡牌ID
  characters: any;
}

class SaveService {
  private readonly SAVE_KEY_PREFIX = 'apocalypse_save_';
  
  async saveGame(slotId: number): Promise<void> {
    const saveData: SaveData = {
      tags: characterService.getPlayer()?.tags,
      date: dateService.getCurrentDate(),
      countdowns: dateService.getCountdowns(),
      currentCard: cardService.getCurrentCard(),
      consumedCards: cardService.getConsumedCards(),
      characters: characterService.getAllCharacters()
    };
    
    console.log('Saving game state with character locations:', 
      Object.entries(saveData.characters).map(([id, char]: [string, any]) => 
        `${char.name}: ${characterService.getCharacterTagValue(id, '位置.当前地点')}`
      )
    );
    
    console.log('Saving game state:', {
      tags: saveData.tags,
      date: saveData.date,
      countdowns: saveData.countdowns,
      currentCard: saveData.currentCard?.name,
      consumedCards: saveData.consumedCards.length
    });
    
    try {
      localStorage.setItem(
        `${this.SAVE_KEY_PREFIX}${slotId}`, 
        JSON.stringify(saveData)
      );
      console.log(`Game saved to slot ${slotId}`);
    } catch (error) {
      console.error('Error saving game:', error);
      throw new Error('保存游戏失败');
    }
  }

  async loadGame(slotId: number): Promise<void> {
    try {
      const saveDataStr = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotId}`);
      if (!saveDataStr) {
        throw new Error('存档不存在');
      }

      const saveData: SaveData = JSON.parse(saveDataStr);
      console.log('Loading game state:', {
        tags: saveData.tags,
        date: saveData.date,
        countdowns: saveData.countdowns,
        currentCard: saveData.currentCard?.name,
        consumedCards: saveData.consumedCards.length
      });
      
      // 恢复所有状态
      await tagService.loadTagsFromSave(saveData.tags);
      dateService.setDate(new Date(saveData.date));
      dateService.setCountdowns(saveData.countdowns);
      cardService.setCurrentCard(saveData.currentCard);
      cardService.setConsumedCards(saveData.consumedCards);

      console.log('Game state after loading:', {
        tags: characterService.getPlayer()?.tags,
        date: dateService.getCurrentDate(),
        countdowns: dateService.getCountdowns(),
        currentCard: cardService.getCurrentCard()?.name,
        consumedCards: cardService.getConsumedCards().length
      });
    } catch (error) {
      console.error('Error loading game:', error);
      throw new Error('读取存档失败');
    }
  }

  getSaveSlots(): Array<{id: number, date: Date}> {
    const slots: Array<{id: number, date: Date}> = [];
    
    for(let i = 1; i <= 5; i++) {
      const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${i}`);
      if (saveData) {
        const data = JSON.parse(saveData);
        slots.push({
          id: i,
          date: new Date(data.date)
        });
      }
    }
    
    return slots;
  }

  deleteSave(slotId: number): void {
    localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slotId}`);
  }
}

export const saveService = new SaveService(); 