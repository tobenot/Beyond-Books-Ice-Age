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
      const targetCharId = characterService.getPlayerTagValue('目标.交互角色');
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
    const targetCharId = characterService.getPlayerTagValue('目标.交互角色');
    console.log('目标交互角色:', targetCharId);
    
    if (!targetCharId) {
      console.log('没有目标交互角色,退出');
      return;
    }

    // 设置交谈角色标签,这样就能触发相关的交谈卡
    console.log('设置交谈角色:', targetCharId);
    characterService.updatePlayerTag('目标.交谈角色', targetCharId);
    
    // 清除交互角色标签
    console.log('清除交互角色标签');
    characterService.updatePlayerTag('目标.交互角色', '');
  }

  characterAttack(_choice: Choice, _card: Card): void {
    const targetCharacter = characterService.getPlayerTagValue('目标.交互角色');
    
    if (targetCharacter === "suYuQing") {
      characterService.updatePlayerTag('结局.冰河派', '1');
    } else if (targetCharacter === "shuangYin") {
      characterService.updatePlayerTag('结局.复苏队', '1');
    }
    
    characterService.updatePlayerTag('目标.交互角色', 'empty');
    characterService.updatePlayerTag('目标.交谈角色', 'empty');
  }

  // 添加gameOver机制处理
  gameOver(_choice: Choice, _card: Card): void {
    window.dispatchEvent(new CustomEvent('gameEnd', { 
      detail: { 
        type: 'normal',
        message: '游戏结束'
      }
    }));
  }
}

export const specialMechanismService = new SpecialMechanismService(); 