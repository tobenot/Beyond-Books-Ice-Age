import { Choice, Card } from '../types';
import { tagService } from './tagService';
import { rankService } from './rankService';

class SpecialMechanismService {
  private placeholderHandlers = {
    tagValue: (path: string) => tagService.getTagValue(path),
    exam100: (path: string) => this.exam100(tagService.getTagValue(path)),
    exam150: (path: string) => this.exam150(tagService.getTagValue(path)),
    examAll: () => this.examAll()
  };

  replacePlaceholders(template: string): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, placeholder) => {
      const [type, path] = placeholder.split(":");
      const handler = this.placeholderHandlers[type as keyof typeof this.placeholderHandlers];
      return handler ? String(handler(path)) : `{{${placeholder}}}`;
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
    const chinese = this.exam150(tagService.getTagValue("技能.语文"));
    const math = this.exam150(tagService.getTagValue("技能.数学"));
    const english = this.exam150(tagService.getTagValue("技能.英语"));
    const physics = this.exam100(tagService.getTagValue("技能.物理"));
    const chemistry = this.exam100(tagService.getTagValue("技能.化学"));
    const biology = this.exam100(tagService.getTagValue("技能.生物"));

    return chinese + math + english + physics + chemistry + biology;
  }

  // 处理特殊机制
  handleSpecialMechanism(mechanismName: string, choice: Choice, card: Card): void {
    const handler = this[mechanismName as keyof this];
    if (typeof handler === 'function') {
      handler.call(this, choice, card);
    }
  }

  // 添加gaokao特殊机制处理函数
  async gaokao(_choice: Choice, _card: Card): Promise<void> {
    const totalScore = this.examAll();
    const rank = await rankService.queryRank(totalScore);
    
    const resultText = `
      <div>
        高考成绩：<br>
        语文${this.exam150(tagService.getTagValue("技能.语文"))}，
        数学${this.exam150(tagService.getTagValue("技能.数学"))}，
        英语${this.exam150(tagService.getTagValue("技能.英语"))}，
        物理${this.exam100(tagService.getTagValue("技能.物理"))}，
        化学${this.exam100(tagService.getTagValue("技能.化学"))}，
        生物${this.exam100(tagService.getTagValue("技能.生物"))}。<br>
        总分：<b>${totalScore}</b><br>
        排名：<b>${rank}</b><br>
        ${totalScore >= 524 ? '达到高分优先投档批' : totalScore >= 410 ? '达到本科批' : '未达到本科批'}
      </div>
    `;

    window.dispatchEvent(new CustomEvent('gameEnd', { 
      detail: { 
        type: 'gaokao',
        message: this.replacePlaceholders(resultText)
      }
    }));
  }
}

export const specialMechanismService = new SpecialMechanismService(); 