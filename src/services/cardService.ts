import { Card } from '../types';
import { characterService } from '../services/characterService';
import { dateService } from './dateService';

class CardService {
  private cardPool: Card[] = [];
  private recentDrawnCards: string[] = [];
  private consumedCards: string[] = [];
  private currentCard: Card | null = null;
  private activeCardSets: Set<string> = new Set(import.meta.env.MODE === 'development' ? ['base','recoveryTeam','glacier','combat'] : ['base','start','recoveryTeam','glacier','combat']);

  async loadCardData(): Promise<void> {
    try {
      const timestamp = new Date().getTime();
      // 加载卡包分类配置
      const cardSetCategoriesResponse = await fetch(`${import.meta.env.BASE_URL}config/cardSetCategories.json?t=${timestamp}`);
      const categories = await cardSetCategoriesResponse.json();
      
      // 收集所有启用分类下的卡包
      const cardPromises: Promise<Card[]>[] = [];
      
      for (const category of categories) {
        if (this.activeCardSets.has(category.id)) {
          // 加载该分类下的所有卡包
          for (const cardSet of category.cardSets) {
            const cardPromise = fetch(`${import.meta.env.BASE_URL}config/cards/${category.id}/${cardSet.path}?t=${timestamp}`)
              .then(res => res.json())
              .catch(error => {
                console.error(`Error loading card set ${cardSet.path}:`, error);
                return [];
              });
            cardPromises.push(cardPromise);
          }
        }
      }
      
      const cardArrays = await Promise.all(cardPromises);
      this.cardPool = cardArrays.flat();
      
      // 打印加载的所有卡牌名字
      this.cardPool.forEach(card => {
        console.log('Loaded card:', card.name);
      });
      
      console.log('Card pool loaded with', this.cardPool.length, 'cards from', this.activeCardSets.size, 'categories');
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  }

  // 启用卡包
  enableCardSet(setId: string): void {
    this.activeCardSets.add(setId);
  }

  // 禁用卡包
  disableCardSet(setId: string): void {
    this.activeCardSets.delete(setId);
  }

  // 获取当前启用的卡包列表
  getActiveCardSets(): string[] {
    return Array.from(this.activeCardSets);
  }

  private canDrawCard(card: Card): boolean {
    const isDebug = card.debug === true;
    
    // 检查日期限制
    if (card.dateRestrictions) {
      const currentDate = dateService.getCurrentDate();
      
      if (card.dateRestrictions.after) {
        const afterDate = new Date(card.dateRestrictions.after);
        const result = currentDate >= afterDate;
        if (isDebug) {
          console.log(`[Debug ${card.id}] Date after ${afterDate}: ${result}`);
        }
        if (!result) return false;
      }
      
      if (card.dateRestrictions.before) {
        const beforeDate = new Date(card.dateRestrictions.before);
        const result = currentDate <= beforeDate;
        if (isDebug) {
          console.log(`[Debug ${card.id}] Date before ${beforeDate}: ${result}`);
        }
        if (!result) return false;
      }
      
      if (card.dateRestrictions.between) {
        const [startDate, endDate] = card.dateRestrictions.between.map(date => new Date(date));
        const result = currentDate >= startDate && currentDate <= endDate;
        if (isDebug) {
          console.log(`[Debug ${card.id}] Date between ${startDate} and ${endDate}: ${result}`);
        }
        if (!result) return false;
      }
    }

    // 检查标签要求
    if (card.requireTags) {
      for (const [tag, condition] of Object.entries(card.requireTags)) {
        const tagValue = characterService.getPlayerTagValue(tag);
        const result = this.evaluateCondition(tagValue, condition, isDebug ? card.id : undefined);
        if (!result) return false;
      }
    }

    return true;
  }

  private evaluateCondition(value: number | string, condition: string, debugCardId?: string): boolean {
    const debugLog = (message: string, result: boolean) => {
      if (debugCardId) {
        console.log(`[Debug ${debugCardId}] ${message}: ${result}`);
      }
    };

    if (condition === '!empty') {
      const result = value !== '';
      debugLog(`Check !empty for value "${value}"`, result);
      return result;
    }
    
    if (condition === 'empty') {
      const result = value === '';
      debugLog(`Check empty for value "${value}"`, result);
      return result;
    }

    // 添加对 NPC 标签的支持
    if (condition.startsWith('NPC.')) {
      const [, npcId, ...tagPath] = condition.split('.');
      const npcTagValue = characterService.getCharacterTagValue(npcId, tagPath.join('.'));
      
      // 如果是检查布尔值（比如死亡状态）
      if (value === 'true' || value === 'false') {
        const expectedValue = value === 'true';
        const result = npcTagValue === expectedValue;
        debugLog(`Check NPC ${npcId} ${tagPath.join('.')} is ${value}`, result);
        return result;
      }
      
      // 如果是数值比较
      if (typeof npcTagValue === 'number' && typeof value === 'string') {
        const operator = value.charAt(0);
        const threshold = parseFloat(value.slice(1));
        let result = false;
        
        switch (operator) {
          case '>': result = npcTagValue > threshold; break;
          case '<': result = npcTagValue < threshold; break;
          case '=': result = npcTagValue === threshold; break;
        }
        
        debugLog(`Check NPC ${npcId} ${tagPath.join('.')} ${operator} ${threshold}`, result);
        return result;
      }
      
      // 字符串比较
      const result = npcTagValue === value;
      debugLog(`Check NPC ${npcId} ${tagPath.join('.')} equals "${value}"`, result);
      return result;
    }

    // 检查角色属性
    if (typeof value === 'string' && value) {
      const targetCharId = value;
      const character = characterService.getCharacter(targetCharId);
      if (character) {
        if (condition.startsWith('faction:')) {
          const faction = condition.split(':')[1];
          const result = character.faction === faction;
          debugLog(`Check character ${targetCharId} faction: ${faction}`, result);
          return result;
        }
        if (condition.startsWith('attitude:')) {
          const relationship = characterService.getCharacterRelationship(character.id, 'player');
          const attitude = condition.split(':')[1];
          const result = relationship?.立场 === attitude;
          debugLog(`Check character ${targetCharId} attitude: ${attitude}`, result);
          return result;
        }
      }
    }

    // 原有的数值比较逻辑
    if (typeof value === 'string') {
      const result = value === condition;
      debugLog(`String comparison: "${value}" === "${condition}"`, result);
      return result;
    }

    const operator = condition.charAt(0);
    const threshold = parseFloat(condition.slice(1));
    let result = false;
    
    switch (operator) {
      case '>': result = value > threshold; break;
      case '<': result = value < threshold; break;
      case '=': result = value === threshold; break;
    }
    
    debugLog(`Numeric comparison: ${value} ${operator} ${threshold}`, result);
    return result;
  }

  private updateRecentDrawnCards(cardId: string) {
    if (this.recentDrawnCards.length >= 3) {
      this.recentDrawnCards.shift();
    }
    this.recentDrawnCards.push(cardId);
  }

  drawCard(): Card | null {
    this.removeConsumedCardsFromPool();

    const availableCards = this.cardPool
      .filter(card => this.canDrawCard(card))
      .map(card => {
        let weight = card.baseWeight || 1;
        return { card, weight };
      });

    console.log('可用卡片数量:', availableCards.length);

    if (availableCards.length === 0) {
      this.currentCard = null;
      return null;
    }

    // 检查必抽卡牌
    const mustDrawCards = availableCards
      .filter(({ card }) => card.mustDraw)
      .sort((a, b) => {
        // 首先按优先级排序
        const priorityDiff = (b.card.priority || 0) - (a.card.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        // 如果优先级相同,按权重排序
        return (b.weight || 1) - (a.weight || 1);
      });

    if (mustDrawCards.length > 0) {
      this.currentCard = mustDrawCards[0].card;
      return this.currentCard;
    }

    // 根据权重随机抽取
    const totalWeight = availableCards.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const { card, weight } of availableCards) {
      if (random < weight) {
        this.updateRecentDrawnCards(card.id);
        this.currentCard = card;
        return card;
      }
      random -= weight;
    }

    this.currentCard = null;
    return null;
  }

  consumeCard(card: Card): void {
    const index = this.cardPool.findIndex(c => c.id === card.id);
    if (index > -1) {
      this.cardPool.splice(index, 1);
      this.consumedCards.push(card.id);
      console.log(`Card ${card.name} has been consumed. Card pool size: ${this.cardPool.length}`);
    }
  }

  getCurrentCard(): Card | null {
    return this.currentCard;
  }

  setCurrentCard(card: Card | null): void {
    this.currentCard = card;
  }

  getConsumedCards(): string[] {
    return this.consumedCards;
  }

  setConsumedCards(cards: string[]): void {
    this.consumedCards = cards;
    this.removeConsumedCardsFromPool();
  }

  private removeConsumedCardsFromPool(): void {
    this.cardPool = this.cardPool.filter(card => 
      !this.consumedCards.includes(card.id)
    );
    console.log(`Card pool has ${this.cardPool.length} cards after removing consumed cards`);
  }

  async resetCardPool(): Promise<void> {
    this.consumedCards = [];
    this.recentDrawnCards = [];
    this.currentCard = null;
    await this.loadCardData();
  }

  getCardPoolSize(): number {
    return this.cardPool.length;
  }
}

export const cardService = new CardService(); 