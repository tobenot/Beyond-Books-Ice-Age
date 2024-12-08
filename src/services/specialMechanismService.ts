import { Choice, Card } from '../types';
import { rankService } from './rankService';
import { characterService } from '../services/characterService';

class SpecialMechanismService {
  private placeholderHandlers = {
    tagValue: (path: string) => {
      const value = characterService.getPlayerTagValue(path);
      return String(value);
    },
    charName: () => {
      // 获取目标角色ID
      const targetCharId = characterService.getPlayerTagValue('目标.寻找角色');
      if (!targetCharId) return '';
      
      // 获取角色信息
      const character = characterService.getCharacter(targetCharId as string);
      return character ? character.name : '';
    },
    exam100: (path: string) => {
      const value = characterService.getPlayerTagValue(path);
      return this.exam100(typeof value === 'number' ? value : 0);
    },
    exam150: (path: string) => {
      const value = characterService.getPlayerTagValue(path);
      return this.exam150(typeof value === 'number' ? value : 0);
    },
    examAll: () => this.examAll()
  };

  replacePlaceholders(template: string): string {
    console.log('Template before replacement:', template);
    return template.replace(/\{\{(.*?)\}\}/g, (_, placeholder) => {
      console.log('Found placeholder:', placeholder);
      const [type, path] = placeholder.split(":");
      console.log('Split into type:', type, 'path:', path);
      const handler = this.placeholderHandlers[type as keyof typeof this.placeholderHandlers];
      console.log('Handler found:', !!handler);
      const result = handler ? String(handler(path)) : `{{${placeholder}}}`;
      console.log('Replacement result:', result);
      return result;
    });
  }

  private examTest(value: number, maxScore: number): number {
    const a = 10000;
    const b = 400;
    let shiftValue = value - 800;
    if (shiftValue < 0) shiftValue = 0;

    let score = maxScore * (1 - Math.exp(-shiftValue / a) * (1 - shiftValue / (shiftValue + b)));
    return Math.round(Math.min(score, maxScore));
  }

  private exam100(value: number): number {
    return this.examTest(value, 100);
  }

  private exam150(value: number): number {
    return this.examTest(value, 150);
  }

  private examAll(): number {
    const getNumericValue = (path: string) => {
      const value = characterService.getPlayerTagValue(path);
      return typeof value === 'number' ? value : 0;
    };

    const chinese = this.exam150(getNumericValue("技能.语文"));
    const math = this.exam150(getNumericValue("技能.数学"));
    const english = this.exam150(getNumericValue("技能.英语"));
    const physics = this.exam100(getNumericValue("技能.物理"));
    const chemistry = this.exam100(getNumericValue("技能.化学"));
    const biology = this.exam100(getNumericValue("技能.生物"));

    return chinese + math + english + physics + chemistry + biology;
  }

  // 处理特殊机制
  handleSpecialMechanism(mechanismName: string, choice: Choice, card: Card): void {
    const handler = this[mechanismName as keyof this];
    if (typeof handler === 'function') {
      handler.call(this, choice, card);
    }
  }

  private getNumericValue(path: string): number {
    const value = characterService.getPlayerTagValue(path);
    return typeof value === 'number' ? value : 0;
  }

  // 添加gaokao特殊机制处理函数
  async gaokao(_choice: Choice, _card: Card): Promise<void> {
    const totalScore = this.examAll();
    const rank = await rankService.queryRank(totalScore);
    
    const resultText = `
      <div>
        高考成绩：<br>
        语文${this.exam150(this.getNumericValue("技能.语文"))}，
        数学${this.exam150(this.getNumericValue("技能.数学"))}，
        英语${this.exam150(this.getNumericValue("技能.英语"))}，
        物理${this.exam100(this.getNumericValue("技能.物理"))}，
        化学${this.exam100(this.getNumericValue("技能.化学"))}，
        生物${this.exam100(this.getNumericValue("技能.生物"))}。<br>
        总分：<b>${totalScore}</b><br>
        排名：<b>${rank}</b><br>
        ${totalScore >= 524 ? '达到高分优先投档批' : totalScore >= 410 ? '达到本科批' : '未达到本科批'}
      </div>
    `;

    console.log('Before replacePlaceholders:', resultText);
    const processedText = this.replacePlaceholders(resultText);
    console.log('After replacePlaceholders:', processedText);

    window.dispatchEvent(new CustomEvent('gameEnd', { 
      detail: { 
        type: 'gaokao',
        message: processedText
      }
    }));
  }

  moveToLocation(_choice: Choice, _card: Card): void {
    const targetLocation = characterService.getPlayerTagValue('位置.目标地点');
    if (targetLocation) {
      console.log('Moving player to:', targetLocation);
      characterService.updatePlayerTag('位置.当前地点', targetLocation);
      characterService.updatePlayerTag('位置.目标地点', '');
    }
  }

  characterInteraction(_choice: Choice, _card: Card): void {
    const targetCharId = characterService.getPlayerTagValue('目标.寻找角色');
    if (!targetCharId) return;

    const character = characterService.getCharacter(targetCharId as string);
    if (!character) return;

    // 保存当前交互的角色ID,用于后续显示
    this.currentInteractionCharId = targetCharId as string;

    // 根据角色特征和关系生成不同的交互选项
    const relationship = characterService.getCharacterRelationship(character.id, 'player');
    const attitude = relationship?.立场 || '中立';
    
    let interactionOptions = [];
    
    // 基础选项
    interactionOptions.push({
      text: '闲聊',
      effects: [
        // 不要立即清空目标角色,而是在交互完成后清空
        // '目标.寻找角色.empty'
        '状态.精力.-5'
      ],
      description: '进行一些日常对话。'
    });

    // 根据角色阵营添加选项
    if (character.faction === '复苏队') {
      interactionOptions.push({
        text: '询问复苏队的情况',
        effects: ['状态.精力.-10'],
        description: '了解复苏队的近况。'
      });
    } else if (character.faction === '冰河派') {
      interactionOptions.push({
        text: '打探冰河派的消息',
        effects: ['状态.精力.-10'],
        description: '小心地询问冰河派的动向。'
      });
    }

    // 根据态度添加选项
    if (attitude === '友好') {
      interactionOptions.push({
        text: '请求帮助',
        effects: ['状态.精力.-15'],
        description: '寻求一些援助。'
      });
    }

    // 添加结束交谈选项
    interactionOptions.push({
      text: '结束交谈',
      effects: [
        '目标.寻找角色.empty'  // 只在结束交谈时清空目标角色
      ],
      description: '结束当前对话。'
    });

    // 触发交互选项事件
    window.dispatchEvent(new CustomEvent('showInteractionOptions', {
      detail: {
        character,
        options: interactionOptions
      }
    }));
  }
}

export const specialMechanismService = new SpecialMechanismService(); 