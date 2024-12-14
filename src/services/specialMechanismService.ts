import { Choice, Card } from '../types';
import { rankService } from './rankService';
import { characterService } from '../services/characterService';
import { combatSystem } from '../combat/CombatSystem';
import { CombatAction, Combatant } from '../combat/types';

class SpecialMechanismService {
  private placeholderHandlers = {
    tagValue: (path: string) => {
      const value = characterService.getPlayerTagValue(path);
      return String(value);
    },
    charName: () => {
      const targetCharId = characterService.getPlayerTagValue('目标.交互角色');
      if (!targetCharId) return '';
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
    examAll: () => this.examAll(),
    combatDescription: () => combatSystem.getDescription(),
    actorDescription: () => combatSystem.getActorDescription(),
    targetList: () => {
      const actionType = characterService.getPlayerTagValue('战斗.选择.类型');
      return combatSystem.getTargetListDescription(actionType as string);
    },
    actionType: () => {
      const type = characterService.getPlayerTagValue('战斗.选择.类型');
      switch (type) {
        case 'attack': return '攻击';
        case 'skill': return '技能';
        case 'item': return '道具';
        default: return type || '';
      }
    },
    actionName: () => {
      const type = characterService.getPlayerTagValue('战斗.选择.类型');
      const skillId = characterService.getPlayerTagValue('战斗.选择.技能');
      const itemId = characterService.getPlayerTagValue('战斗.选择.道具');
      
      if (type === 'attack') return '普通攻击';
      if (skillId) return skillId; // TODO: 获取技能名称
      if (itemId) return itemId;  // TODO: 获取道具名称
      return '';
    },
    targetName: () => {
      const targets = combatSystem.getPossibleTargets(
        characterService.getPlayerTagValue('战斗.选择.类型') as string
      );
      return targets.map(t => t.name).join('|');
    },
    combatResult: () => combatSystem.getResultDescription(),
    rewardItems: () => {
      // TODO: 实现战利品显示
      return '暂无物品';
    },
    rewardExp: () => {
      // TODO: 实现经验值显示
      return '0';
    },
    actionDescription: () => {
      const actionType = characterService.getPlayerTagValue('战斗.行动类型');
      const targetId = characterService.getPlayerTagValue('战斗.行动目标');
      const actor = combatSystem.getCurrentActor();
      const target = combatSystem.getCombatant(targetId as string);
      
      if (!actor || !actionType) return '';
      
      switch (actionType) {
        case 'attack':
          return `${actor.name} 对 ${target?.name || '???'} 发起攻击！`;
        case 'defend':
          return `${actor.name} 进入防御姿态。`;
        case 'skill':
          const skillId = characterService.getPlayerTagValue('战斗.选择.技能');
          return `${actor.name} 使用了 ${skillId || '???'} 技能！`;
        case 'item':
          const itemId = characterService.getPlayerTagValue('战斗.选择.道具');
          return `${actor.name} 使用了 ${itemId || '???'}！`;
        default:
          return `${actor.name} 正在行动...`;
      }
    },
    aiActionChoice: () => {
      const actor = combatSystem.getCurrentActor();
      if (!actor || !actor.ai) return '思考中...';
      
      // 根据AI类型返回不同的选择描述
      switch (actor.ai.type) {
        case 'aggressive':
          return '选择进行攻击';
        case 'defensive':
          return '选择进行防御';
        case 'support':
          return '选择使用技能';
        default:
          return '正在决策...';
      }
    },
    targetId: () => {
      const targets = combatSystem.getPossibleTargets(
        characterService.getPlayerTagValue('战斗.选择.类型') as string
      );
      return targets.map(t => t.id).join('|');
    },
    actionResult: () => {
      const actionType = characterService.getPlayerTagValue('战斗.行动类型');
      const targetId = characterService.getPlayerTagValue('战斗.行动目标');
      const actor = combatSystem.getCurrentActor();
      const target = combatSystem.getCombatant(targetId as string);
      
      if (!actor || !actionType) return '';
      
      switch (actionType) {
        case 'attack':
          return `${actor.name} 对 ${target?.name || '???'} 发起攻击！`;
        case 'defend':
          return `${actor.name} 进入防御姿态。`;
        case 'skill':
          const skillId = characterService.getPlayerTagValue('战斗.选择.技能');
          return `${actor.name} 使用了 ${skillId || '???'} 技能！`;
        case 'item':
          const itemId = characterService.getPlayerTagValue('战斗.选择.道具');
          return `${actor.name} 使用了 ${itemId || '???'}！`;
        default:
          return `${actor.name} 正在行动...`;
      }
    },
    targetStatus: () => {
      const targetId = characterService.getPlayerTagValue('战斗.行动目标');
      const target = combatSystem.getCombatant(targetId as string);
      if (!target) return '';

      let status = `${target.name} - HP: ${target.stats.hp}/${target.stats.maxHp}\n`;
      
      if (target.status.isDefending) {
        status += '处于防御状态\n';
      }
      if (target.status.buffs.length > 0) {
        status += `增益效果: ${target.status.buffs.map(b => b.type).join(', ')}\n`;
      }
      if (target.status.debuffs.length > 0) {
        status += `减益效果: ${target.status.debuffs.map(b => b.type).join(', ')}\n`;
      }

      return status;
    },
    targetIllustration: () => {
      const targetId = characterService.getPlayerTagValue('战斗.行动目标');
      const target = combatSystem.getCombatant(targetId as string);
      return target ? `combat_${target.id}` : 'default_combat';
    },
    actorIllustration: () => {
      const actor = combatSystem.getCurrentActor();
      return actor ? `combat_${actor.id}` : 'default_combat';
    }
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
  async handleSpecialMechanism(mechanismName: string, choice: Choice, card: Card): Promise<void> {
    const handler = this[mechanismName as keyof this];
    if (typeof handler === 'function') {
      await handler.call(this, choice, card);
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

  unlockLocationPanel(_choice: Choice, _card: Card): void {
    characterService.updatePlayerTag('系统.地点面板', '已解锁');
  }

  unlockCharacterPanel(_choice: Choice, _card: Card): void {
    characterService.updatePlayerTag('系统.角色面板', '已解锁');
  }

  unlockAllPanel(_choice: Choice, _card: Card): void {
    characterService.updatePlayerTag('系统.地点面板', '已解锁');
    characterService.updatePlayerTag('系统.角色面板', '已解锁');
  }

  // 添加startCombat机制处理
  async startCombat(_choice: Choice, _card: Card): Promise<void> {
    const combatId = characterService.getPlayerTagValue('战斗.ID');
    const locationId = characterService.getPlayerTagValue('位置.当前地点');
    
    if (!combatId) {
      console.error('No combat ID specified');
      return;
    }

    try {
      console.log('Starting combat initialization...');
      // 等待战斗初始化完成
      await combatSystem.initCombat(combatId as string, locationId as string);
      // 设置战斗相关标签
      characterService.updatePlayerTag('战斗.状态', '进行中');
      console.log(`Combat ${combatId} initialized successfully`);
    } catch (error) {
      console.error('Failed to start combat:', error);
      characterService.updatePlayerTag('战斗.状态', 'empty');
      throw error; // 重新抛出错误，让调用者知道发生了错误
    }
  }

  // 获取战斗描述
  private getCombatDescription(): string {
    if (!combatSystem) return '';

    const allCombatants = combatSystem.getCombatants();
    let description = '';

    // 分阵营显示战斗单位
    const factions = new Map<string, Combatant[]>();
    allCombatants.forEach(combatant => {
      if (!factions.has(combatant.faction)) {
        factions.set(combatant.faction, []);
      }
      factions.get(combatant.faction)!.push(combatant);
    });

    // 先描述环境
    const locationId = characterService.getPlayerTagValue('位置.当前地点') as string;
    switch (locationId) {
      case 'wasteland':
        description += '在这片荒芜的废土上，蓝色的晶体在阳光下闪烁着诡异的光芒。空气中弥漫着金属的味道。\n\n';
        break;
      case 'ice_faction':
        description += '冰河派据点内，蓝色的晶体从墙壁上生长出来，在微光中投下奇异的影子。\n\n';
        break;
      case 'revival_base':
        description += '复苏队基地的能量护盾将熵减的影响阻挡在外，这里的空气清新而温暖。\n\n';
        break;
      default:
        description += '战斗在这片被熵减影响的土地上展开。\n\n';
    }

    // 描述各方势力
    factions.forEach((combatants, faction) => {
      switch (faction) {
        case '玩家':
          description += '你:\n';
          break;
        case '复苏队':
          description += '复苏队成员:\n';
          break;
        case '晶体生物':
          description += '晶体生物群:\n';
          break;
        case '冰河派':
          description += '冰河派成员:\n';
          break;
        default:
          description += `${faction}:\n`;
      }

      // 描述每个战斗单位的状态
      combatants.forEach(combatant => {
        let unitDesc = `${combatant.name} - `;
        
        // 生命值描述
        const hpPercent = (combatant.stats.hp / combatant.stats.maxHp) * 100;
        if (hpPercent > 80) {
          unitDesc += '状态完好';
        } else if (hpPercent > 50) {
          unitDesc += '受了一些伤';
        } else if (hpPercent > 20) {
          unitDesc += '伤势严重';
        } else {
          unitDesc += '命悬一线';
        }
        
        // 特殊状态描述
        if (combatant.status.isDefending) {
          unitDesc += '，正在防御';
        }
        if (combatant.status.buffs.length > 0) {
          unitDesc += `，获得${combatant.status.buffs.map(b => b.type).join('、')}增益`;
        }
        if (combatant.status.debuffs.length > 0) {
          unitDesc += `，受到${combatant.status.debuffs.map(b => b.type).join('、')}影响`;
        }
        
        description += unitDesc + '\n';
      });
      description += '\n';
    });

    return description;
  }

  // 获取当前行动者
  private getCurrentActor(): Combatant | null {
    return combatSystem?.getCurrentActor() || null;
  }

  // 修改 executeCombatAction 机制处理
  async executeCombatAction(_choice: Choice, _card: Card): Promise<void> {
    const actor = combatSystem.getCurrentActor();
    if (!actor) return;

    try {
      // 1. 获取行动信息
      const actionType = characterService.getPlayerTagValue('战斗.选择.类型');
      const targetId = characterService.getPlayerTagValue('战斗.选择.目标');
      const skillId = characterService.getPlayerTagValue('战斗.选择.技能');
      const itemId = characterService.getPlayerTagValue('战斗.选择.道具');
      
      const action: CombatAction = {
        type: actionType as 'attack' | 'defend' | 'skill' | 'item',
        targetId: targetId as string,
        skillId: skillId as string,
        itemId: itemId as string
      };

      // 2. 执行战斗行动
      await combatSystem.executeAction(actor, action);

      // 3. 清除选择状态
      characterService.updatePlayerTag('战斗.选择.类型', 'empty');
      characterService.updatePlayerTag('战斗.选择.目标', 'empty');
      characterService.updatePlayerTag('战斗.选择.目标范围', 'empty');
      characterService.updatePlayerTag('战斗.选择.技能', 'empty');
      characterService.updatePlayerTag('战斗.选择.道具', 'empty');

      // 4. 设置行动结果标签,触发结果展示卡
      // 注意:这个标签会在结果卡的"继续"选项中被清除
      characterService.updatePlayerTag('战斗.行动结果', 'waiting');

      // 注意:不在这里调用 processTurn
      // 而是在结果卡的 nextCombatTurn 机制中处理
    } catch (error) {
      console.error('Combat action execution failed:', error);
      // 出错时清理状态
      characterService.updatePlayerTag('战斗.选择.类型', 'empty');
      characterService.updatePlayerTag('战斗.选择.目标', 'empty');
      characterService.updatePlayerTag('战斗.选择.目标范围', 'empty');
      characterService.updatePlayerTag('战斗.选择.技能', 'empty');
      characterService.updatePlayerTag('战斗.选择.道具', 'empty');
      characterService.updatePlayerTag('战斗.行动结果', 'empty');
    }
  }

  // 添加 executeCombatAIAction 机制处理
  async executeCombatAIAction(_choice: Choice, _card: Card): Promise<void> {
    await combatSystem.executeAIAction();
  }

  // 修改 nextCombatTurn 机制处理
  async nextCombatTurn(_choice: Choice, _card: Card): Promise<void> {
    console.log('nextCombatTurn - 准备进入下一回合');
    
    // 清除当前回合的行动结果
    characterService.updatePlayerTag('战斗.行动结果', 'empty');
    console.log('nextCombatTurn - 已清除行动结果');

    // 更新回合状态
    const turnState = combatSystem.getTurnState(); // 需要添加这个getter方法
    turnState.currentTurnIndex++;

    // 如果所有角色都行动完了,开始新回合
    if (turnState.currentTurnIndex >= turnState.turnOrder.length) {
      console.log('所有角色行动完毕,开始新回合');
      await combatSystem.startNewRound();
    } else {
      // 否则进入下一个角色的回合
      console.log('进入下一个角色的回合');
      await combatSystem.processTurn();
    }
  }

  // 修改 showTargetPanel 机制处理
  async showTargetPanel(_choice: Choice, _card: Card): Promise<void> {
    console.log('showTargetPanel mechanism started');
    const actionType = characterService.getPlayerTagValue('战斗.选择.类型');
    console.log('Action type:', actionType);
    
    if (!actionType) {
      console.log('No action type found');
      return;
    }

    // 获取可选目标
    const targets = combatSystem.getPossibleTargets(actionType as string);
    console.log('Got possible targets:', targets);

    // 创建一个 Promise 来等待玩家选择
    return new Promise<void>((resolve, reject) => {
      console.log('Dispatching showTargetPanel event');
      
      // 创建一个函数来处理选择完成
      const handleTargetSelect = async (targetId: string) => {
        try {
          console.log('Target selected:', targetId);
          characterService.updatePlayerTag('战斗.选择.目标', targetId);
          await combatSystem.executeAction(combatSystem.getCurrentActor()!, {
            type: actionType as 'attack' | 'defend' | 'skill' | 'item',
            targetId: targetId
          });
          resolve(); // 选择完成后解析 Promise
        } catch (error) {
          console.error('Error in target selection:', error);
          reject(error);
        }
      };

      // 发送事件，传递回调函数
      window.dispatchEvent(new CustomEvent('showTargetPanel', { 
        detail: { 
          onSelect: handleTargetSelect
        }
      }));
      console.log('ShowTargetPanel event dispatched');
    });
  }

  // 同样添加技能和道具面板的处理
  async showSkillPanel(_choice: Choice, _card: Card): Promise<void> {
    const actor = combatSystem.getCurrentActor();
    if (!actor) return;

    window.dispatchEvent(new CustomEvent('showSkillPanel', {
      detail: {
        skills: actor.skills,
        onSelect: (skillId: string) => {
          characterService.updatePlayerTag('战斗.选择.技能', skillId);
          // 根据技能类型决定是否需要选择目标
          // TODO: 实现技能目标选择逻辑
        }
      }
    }));
  }

  async showItemPanel(_choice: Choice, _card: Card): Promise<void> {
    // TODO: 实现道具选择面板
  }
}

export const specialMechanismService = new SpecialMechanismService(); 
