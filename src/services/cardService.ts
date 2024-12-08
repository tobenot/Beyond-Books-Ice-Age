import { Card } from '../types';
import { tagService } from './tagService';
import { dateService } from './dateService';

class CardService {
  private cardPool: Card[] = [];
  private recentDrawnCards: string[] = [];
  private consumedCards: string[] = [];
  private currentCard: Card | null = null;

  async loadCardData(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/cards.json');
      const data = await response.json();
      this.cardPool = data;
      console.log('Card pool loaded with', this.cardPool.length, 'cards');
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  }

  private canDrawCard(card: Card): boolean {
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
        const tagValue = tagService.getTagValue(tag);
        if (!this.evaluateCondition(tagValue, condition)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(value: number | string, condition: string): boolean {
    if (condition === '!empty') {
      return value !== '';
    }
    
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
    this.removeConsumedCardsFromPool();

    const availableCards = this.cardPool
      .filter(card => this.canDrawCard(card))
      .map(card => {
        let weight = card.baseWeight || 1;
        
        // 应用标签权重
        if (card.weightMultipliers) {
          for (const [tag, multiplier] of Object.entries(card.weightMultipliers)) {
            const tagValue = tagService.getTagValue(tag);
            if (typeof tagValue === 'number') {
              weight *= Math.pow(multiplier, tagValue);
            }
          }
        }

        // 降低最近抽到的卡的权重
        if (this.recentDrawnCards.includes(card.id)) {
          weight *= 0.2;
        }

        return { card, weight };
      });

    if (availableCards.length === 0) {
      console.log('No available cards to draw');
      this.currentCard = null;
      return null;
    }

    // 检查必抽卡牌
    const mustDrawCards = availableCards
      .filter(({ card }) => card.mustDraw)
      .sort((a, b) => (b.card.priority || 0) - (a.card.priority || 0));

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
        console.log('Drew card:', card.name);
        return card;
      }
      random -= weight;
    }

    // 如果没有卡可抽，返回 null
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