import { tagService } from './tagService';
import { TagModifierConfig } from '../types';

class DateService {
  private currentDate: Date;
  private endDate: Date;
  private daysPassed: number;
  private countdowns: Array<{ name: string; date: Date }> = [];
  private readonly triggerTagModifierInterval = 3;
  private readonly defaultTimeConsumption = 3;

  constructor() {
    this.currentDate = new Date(2019, 7, 12, 10, 0, 0); // August 12, 2019
    this.endDate = new Date(2020, 6, 7, 10, 0, 0); // July 7, 2020
    this.daysPassed = 0;
  }

  getCurrentDate(): Date {
    return this.currentDate;
  }

  updateDate(days: number): void {
    // 计算新日期
    let newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + days);

    // 确保日期不超过结束日期
    if (newDate > this.endDate) {
      newDate = new Date(this.endDate);
    }

    // 更新经过的天数
    this.daysPassed += days;

    // 每3天触发一次特殊函数
    while (this.daysPassed >= this.triggerTagModifierInterval) {
      this.applyTagModifier();
      this.daysPassed -= this.triggerTagModifierInterval;
    }

    this.currentDate = newDate;
  }

  private applyTagModifier(): void {
    const playerTags = tagService.getTags();
    if (playerTags.变化) {
      this.traverseAndUpdate(playerTags.变化);
    }
  }

  private traverseAndUpdate(modifiers: Record<string, any>, basePath: string = ''): void {
    for (const [key, value] of Object.entries(modifiers)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      
      if (typeof value === 'number') {
        // 如果值是数字，直接应用修改
        tagService.updateTag(currentPath, value);
      } else if (typeof value === 'object' && value !== null) {
        // 如果值是对象，递归处理
        this.traverseAndUpdate(value, currentPath);
      }
    }
  }

  addCountdown(name: string, date: string): void {
    this.countdowns.push({
      name,
      date: new Date(date)
    });
  }

  removeCountdown(name: string): void {
    this.countdowns = this.countdowns.filter(
      countdown => countdown.name !== name
    );
  }

  getCountdowns(): Array<{ name: string; date: Date }> {
    return this.countdowns;
  }

  getCardTimeConsumption(card: any): number {
    return card.timeConsumption ?? this.defaultTimeConsumption;
  }

  setDate(date: Date): void {
    this.currentDate = date;
  }

  setCountdowns(countdowns: Array<{name: string, date: Date}>): void {
    this.countdowns = countdowns.map(c => ({
      ...c,
      date: new Date(c.date)
    }));
  }
}

export const dateService = new DateService(); 