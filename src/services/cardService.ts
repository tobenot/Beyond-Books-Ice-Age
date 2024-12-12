import { Card } from '../types';
import { characterService } from '../services/characterService';
import { dateService } from './dateService';

class CardService {
  private cardPool: Card[] = [];
  private recentDrawnCards: string[] = [];
  private consumedCards: string[] = [];
  private currentCard: Card | null = null;
  private activeCardSets: Set<string> = new Set(['base','recoveryTeam','glacier']);

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
    console.log(`Checking if card ${card.id} can be drawn...`);

    // 检查日期限制
    if (card.dateRestrictions) {
      const currentDate = dateService.getCurrentDate();
      
      if (card.dateRestrictions.after) {
        const afterDate = new Date(card.dateRestrictions.after);
        if (currentDate < afterDate) {
          return false;
        }
      }
      
      if (card.dateRestrictions.before) {
        const beforeDate = new Date(card.dateRestrictions.before);
        if (currentDate > beforeDate) {
          return false;
        }
      }
      
      if (card.dateRestrictions.between) {
        const [startDate, endDate] = card.dateRestrictions.between.map(date => new Date(date));
        if (currentDate < startDate || currentDate > endDate) {
          return false;
        }
      }
    }

    // 检查标签要求
    if (card.requireTags) {
      for (const [tag, condition] of Object.entries(card.requireTags)) {
        const tagValue = characterService.getPlayerTagValue(tag);
        console.log(`Checking tag ${tag}: value = ${tagValue}, condition = ${condition}`);
        if (!this.evaluateCondition(tagValue, condition)) {
          console.log(`Card ${card.id} rejected: tag ${tag} does not meet condition ${condition}`);
          return false;
        }
      }
    }

    console.log(`Card ${card.id} is available to draw`);
    return true;
  }

  private evaluateCondition(value: number | string, condition: string): boolean {
    if (condition === '!empty') {
      return value !== '';
    }
    
    if (condition === 'empty') {
      return value === '';
    }

    // 检查角色属性
    if (typeof value === 'string' && value) {
      const targetCharId = value;
      const character = characterService.getCharacter(targetCharId);
      if (character) {
        // 如果是检查阵营
        if (condition.startsWith('faction:')) {
          return character.faction === condition.split(':')[1];
        }
        // 如果是检查态度
        if (condition.startsWith('attitude:')) {
          const relationship = characterService.getCharacterRelationship(character.id, 'player');
          return relationship?.立场 === condition.split(':')[1];
        }
      }
    }

    // 原有的数值比较逻辑
    if (typeof value === 'string') {
      return value === condition;
    }

    const operator = condition.charAt(0);
    const threshold = parseFloat(condition.slice(1));
    
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '=':
        return value === threshold;
      default:
        return false;
    }
  }

  private updateRecentDrawnCards(cardId: string) {
    if (this.recentDrawnCards.length >= 3) {
      this.recentDrawnCards.shift();
    }
    this.recentDrawnCards.push(cardId);
  }

  drawCard(): Card | null {
    console.log('开始抽卡');
    this.removeConsumedCardsFromPool();
    console.log('当前卡池大小:', this.cardPool.length);

    const availableCards = this.cardPool
      .filter(card => {
        const canDraw = this.canDrawCard(card);
        console.log(`检查卡片 ${card.id} 是否可抽:`, canDraw);
        return canDraw;
      })
      .map(card => {
        let weight = card.baseWeight || 1;
        console.log(`计算卡片 ${card.id} 权重, 基础权重:`, weight);
        return { card, weight };
      });

    console.log('可用卡片数量:', availableCards.length);

    if (availableCards.length === 0) {
      console.log('没有可用卡片');
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
      console.log('发现必抽卡片:', mustDrawCards.map(c => ({
        id: c.card.id,
        priority: c.card.priority,
        weight: c.weight
      })));
      this.currentCard = mustDrawCards[0].card;
      return this.currentCard;
    }

    // 根据权重随机抽取
    const totalWeight = availableCards.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    console.log('总权重:', totalWeight, '随机值:', random);

    for (const { card, weight } of availableCards) {
      if (random < weight) {
        this.updateRecentDrawnCards(card.id);
        this.currentCard = card;
        console.log('抽到卡片:', card.id);
        return card;
      }
      random -= weight;
    }

    console.log('未抽到卡片');
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