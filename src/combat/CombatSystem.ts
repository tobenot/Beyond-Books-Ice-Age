import { CombatantManager } from './CombatantManager';
import { characterService } from '../services/characterService';
import { 
  CombatConfig, 
  EntityConfig, 
  EntityData,
  Combatant,
  TurnState,
  FactionRelation,
  CombatAction
} from './types';

export class CombatSystem {
  private combatantManager: CombatantManager;
  private currentCombatId: string | null = null;
  private currentActor: Combatant | null = null;
  private turnState: TurnState = {
    currentRound: 0,
    turnOrder: [],
    currentTurnIndex: -1
  };

  // 阵营关系配置
  private factionRelations: FactionRelation[] = [
    { faction1: '玩家', faction2: '复苏队', relation: 'friendly' },
    { faction1: '玩家', faction2: '晶体生物', relation: 'hostile' },
    { faction1: '玩家', faction2: '冰河派', relation: 'hostile' },
    { faction1: '复苏队', faction2: '晶体生物', relation: 'hostile' },
    { faction1: '复苏队', faction2: '冰河派', relation: 'hostile' },
    { faction1: '晶体生物', faction2: '冰河派', relation: 'hostile' }
  ];

  constructor() {
    this.combatantManager = new CombatantManager();
  }

  // 检查两个阵营的关系
  private getFactionRelation(faction1: string, faction2: string): 'friendly' | 'hostile' | 'neutral' {
    console.log(`Checking relation between ${faction1} and ${faction2}`);
    
    // 同阵营一定是友好的
    if (faction1 === faction2) {
      console.log('Same faction - friendly');
      return 'friendly';
    }

    const relation = this.factionRelations.find(
      r => (r.faction1 === faction1 && r.faction2 === faction2) ||
           (r.faction1 === faction2 && r.faction2 === faction1)
    );

    console.log('Found relation:', relation);
    return relation?.relation || 'neutral';
  }

  // 计算先攻值
  private calculateInitiative(combatant: Combatant): number {
    const baseInit = combatant.stats.baseInitiative;
    const randomFactor = Math.floor(Math.random() * 6) + 1; // 1d6
    return baseInit + randomFactor;
  }

  // 确定回合顺序
  private determineTurnOrder(): void {
    const combatants = this.combatantManager.getAllCombatants();
    
    // 计算每个战斗者的先攻值
    combatants.forEach(combatant => {
      combatant.stats.initiative = this.calculateInitiative(combatant);
    });

    // 按先攻值排序
    this.turnState.turnOrder = combatants
      .sort((a, b) => b.stats.initiative - a.stats.initiative)
      .map(c => c.id);
      
    this.turnState.currentTurnIndex = 0;
    this.turnState.currentRound++;
  }

  // 获取下一个行动者
  private getNextActor(): Combatant | null {
    if (this.turnState.turnOrder.length === 0) {
      this.determineTurnOrder();
    }

    const currentId = this.turnState.turnOrder[this.turnState.currentTurnIndex];
    const actor = this.combatantManager.getCombatant(currentId);

    if (!actor) {
      // 如果当前行动者不存在(可能已死亡),跳到下一个
      this.turnState.currentTurnIndex++;
      if (this.turnState.currentTurnIndex >= this.turnState.turnOrder.length) {
        this.turnState.currentTurnIndex = 0;
        return this.getNextActor();
      }
      return this.getNextActor();
    }

    return actor;
  }

  // 检查战斗是否结束
  private checkCombatEnd(): boolean {
    const combatants = this.combatantManager.getAllCombatants();
    
    // 检查玩家是否死亡
    const player = combatants.find(c => c.id === 'player');
    if (!player || player.stats.hp <= 0) {
      return true;
    }

    // 按阵营分组检查
    const factionGroups = new Map<string, Combatant[]>();
    combatants.forEach(c => {
      if (!factionGroups.has(c.faction)) {
        factionGroups.set(c.faction, []);
      }
      if (c.stats.hp > 0) { // 只统计存活的单位
        factionGroups.get(c.faction)!.push(c);
      }
    });

    // 检查是否只剩下友好阵营
    let hasHostile = false;
    factionGroups.forEach((members, faction1) => {
      if (members.length > 0) {
        factionGroups.forEach((_, faction2) => {
          if (this.getFactionRelation(faction1, faction2) === 'hostile') {
            hasHostile = true;
          }
        });
      }
    });

    return !hasHostile;
  }

  // 处理回合
  async processTurn(): Promise<void> {
    console.log('开始处理回合');
    
    if (this.checkCombatEnd()) {
      console.log('战斗结束,进入结算');
      characterService.updatePlayerTag('战斗.状态', '结算');
      return;
    }

    const actor = this.getNextActor();
    if (!actor) {
      console.log('没有可行动的角色,开始新回合');
      await this.startNewRound();
      return;
    }

    console.log(`当前行动者: ${actor.name} (${actor.id})`);
    this.currentActor = actor;

    if (actor.id === 'player') {
      console.log('玩家回合 - 等待玩家输入');
      characterService.updatePlayerTag('战斗.当前行动者', 'player');
    } else {
      console.log('AI回合 - 等待玩家确认');
      // 设置当前行动者,触发AI选择卡
      characterService.updatePlayerTag('战斗.当前行动者', actor.id);
      characterService.updatePlayerTag('战斗.行动状态', 'thinking');
    }
  }

  // 执行 AI 行动
  public async executeAIAction(): Promise<void> {
    const actorId = characterService.getPlayerTagValue('战斗.当前行动者') as string;
    if (!actorId || actorId === 'empty') {
      console.error('No current actor ID');
      return;
    }

    const actor = this.combatantManager.getCombatant(actorId);
    if (!actor) {
      console.error(`No actor found for ID: ${actorId}`);
      return;
    }

    // 如果是玩家角色或没有AI配置，跳过AI执行
    if (actor.faction === '玩家' || !actor.ai) {
      console.log(`Skipping AI execution for ${actor.name} (${actorId})`);
      // 直接进入下一回合
      this.turnState.currentTurnIndex++;
      if (this.turnState.currentTurnIndex >= this.turnState.turnOrder.length) {
        this.turnState.currentTurnIndex = 0;
      }
      await this.processTurn();
      return;
    }

    try {
      // 1. 获取 AI 决策
      console.log(`${actor.name} 正在决策...`);
      const action = await actor.ai.decideAction();
      console.log(`${actor.name} 决定执行: ${action.type}`);

      // 2. 更新行动状态
      characterService.updatePlayerTag('战斗.行动状态', 'executing');
      characterService.updatePlayerTag('战斗.行动类型', action.type);
      characterService.updatePlayerTag('战斗.行动目标', action.targetId || '');

      // 3. 执行行动
      await this.executeAction(actor, action);

      // 4. 更新行动结果标签,这会触发结果展示卡
      let resultDesc = '';
      switch (action.type) {
        case 'attack':
          const target = this.getCombatant(action.targetId!);
          resultDesc = `${actor.name} 对 ${target?.name || '???'} 发起攻击！`;
          break;
        case 'defend':
          resultDesc = `${actor.name} 进入防御姿态。`;
          break;
        case 'skill':
          resultDesc = `${actor.name} 使用了 ${action.skillId || '???'} 技能！`;
          break;
        case 'item':
          resultDesc = `${actor.name} 使用了 ${action.itemId || '???'}！`;
          break;
      }
      characterService.updatePlayerTag('战斗.行动结果', resultDesc);

      // 注意:不需要在这里调用 processTurn
      // 而是在结果卡的 nextCombatTurn 机制中处理

    } catch (error) {
      console.error('AI action execution failed:', error);
      // 出错时清理状态
      characterService.updatePlayerTag('战斗.行动状态', 'empty');
      characterService.updatePlayerTag('战斗.当前行动者', 'empty');
    }
  }

  // 添加具体的攻击实现
  private async executeAttack(attacker: Combatant, target: Combatant): Promise<void> {
    // 基础伤害计算
    const baseDamage = Math.floor(attacker.stats.strength * 1.5);
    
    // 防御减伤
    let finalDamage = baseDamage;
    if (target.status.isDefending) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }

    // 应用伤害并更新目标状态
    const newHp = Math.max(0, target.stats.hp - finalDamage);
    this.combatantManager.updateCombatant(target.id, {
      stats: {
        ...target.stats,
        hp: newHp
      }
    });

    // 检查目标是否死亡
    if (newHp <= 0) {
      // 从回合顺序中移除
      this.turnState.turnOrder = this.turnState.turnOrder.filter(id => id !== target.id);
      
      // 如果是玩家死亡,设置相应标记
      if (target.id === 'player') {
        characterService.updatePlayerTag('状态.死亡', '1');
      }
    }

    // 更新战斗结果描述
    const resultDesc = target.status.isDefending 
      ? `${attacker.name} 攻击了正在防御的 ${target.name}，造成了 ${finalDamage} 点伤害！(剩余生命值:${newHp})`
      : `${attacker.name} 攻击了 ${target.name}，造成了 ${finalDamage} 点伤害！(剩余生命值:${newHp})`;
    
    characterService.updatePlayerTag('战斗.行动结果', resultDesc);
  }

  // 修改 executeAction 方法
  public async executeAction(actor: Combatant, action: CombatAction): Promise<void> {
    console.log(`执行行动: ${actor.name} 使用 ${action.type}`);
    
    switch (action.type) {
      case 'attack':
        if (action.targetId) {
            console.log(`攻击目标ID: ${action.targetId}`);
            const target = this.getCombatant(action.targetId);
            if (target) {
                console.log(`找到目标: ${target}`);
                await this.executeAttack(actor, target);
            } else {
                console.log('未找到目标');
            }
        } else {
            console.log('没有指定目标');
        }
        break;
      case 'defend':
        actor.status.isDefending = true;
        characterService.updatePlayerTag('战斗.行动结果', 
          `${actor.name} 进入防御姿态，将减少受到的伤害！`);
        break;
      case 'skill':
        // TODO: 实现技能逻辑
        break;
      case 'item':
        // TODO: 实现道具逻辑
        break;
    }
  }

  // 初始化战斗
  async initCombat(combatId: string, locationId: string): Promise<void> {
    try {
      console.log(`初始化战斗: combatId=${combatId}, locationId=${locationId}`);
      
      // 1. 加载战斗配置
      const combatConfig = await this.loadCombatConfig(combatId);
      if (!combatConfig) throw new Error(`Combat config ${combatId} not found`);
      console.log(`战斗配置加载成功: ${combatConfig}`);

      // 2. 清空之前的战斗单位
      this.combatantManager.clear();
      console.log('清空之前的战斗单位');

      // 3. 添加玩家到战斗
      this.combatantManager.createFromCharacter('player');
      console.log('玩家已添加到战斗');

      // 4. 添加当前地点的友方角色到战斗
      const locationCharacters = characterService.getCharactersAtLocation(locationId)
        .filter(char => char.faction === '复苏队' && !characterService.isPlayer(char.id));
      console.log(`当前地点的友方角色: ${locationCharacters.map(char => char.id).join(', ')}`);
      
      for (const char of locationCharacters) {
        this.combatantManager.createFromCharacter(char.id);
        console.log(`友方角色 ${char.id} 已添加到战斗`);
      }

      // 5. 创建战斗实体
      for (const entity of combatConfig.entities) {
        for (let i = 0; i < entity.count; i++) {
          const entityId = `${entity.id}_${i}`;
          await this.createCombatEntity(entityId, entity);
          console.log(`战斗实体 ${entityId} 已创建`);
        }
      }

      this.currentCombatId = combatId;
      console.log(`战斗初始化完成: currentCombatId=${this.currentCombatId}`);

      // 设置战斗状态为进行中
      characterService.updatePlayerTag('战斗.状态', '进行中');
      
      // 开始第一个回合
      console.log('开始第一个回合');
      await this.startNewRound();

    } catch (error) {
      console.error('Failed to initialize combat:', error);
      this.endCombat();
      throw error;
    }
  }

  // 加载战斗配置
  private async loadCombatConfig(combatId: string): Promise<CombatConfig | null> {
    try {
      console.log(`加载战斗配置: combatId=${combatId}`);
      const response = await fetch(`${import.meta.env.BASE_URL}config/combats/crystal_encounters.json`);
      if (!response.ok) return null;
      const configs = await response.json() as CombatConfig[];
      const config = configs.find(config => config.id === combatId) || null;
      console.log(`战斗配置加载结果: ${config}`);
      return config;
    } catch (error) {
      console.error('Failed to load combat config:', error);
      return null;
    }
  }

  // 改名并重构创建实体的方法
  private async createCombatEntity(entityId: string, config: EntityConfig): Promise<void> {
    try {
      console.log(`创建战斗实体: entityId=${entityId}, config=${JSON.stringify(config)}`);
      const response = await fetch(`${import.meta.env.BASE_URL}config/entities/combat_entities.json`);
      if (!response.ok) throw new Error('Failed to load entity data');
      
      const entities = await response.json();
      const entityData = entities.find((e: EntityData) => e.id === config.id);
      
      if (!entityData) throw new Error(`Entity ${config.id} not found`);
      console.log(`实体数据加载成功: ${entityData.name}`);

      // 根据等级计算实际属性
      const stats = { ...entityData.baseStats };
      const levelDiff = config.level - 1;

      if (levelDiff > 0) {
        for (const [key, value] of Object.entries(entityData.levelGrowth)) {
          if (key in stats) {
            const growthValue = value as number;
            (stats[key as keyof typeof stats] as number) += growthValue * levelDiff;
          }
        }
      }
      console.log(`实体 ${entityId} 的属性计算完成: ${JSON.stringify(stats)}`);
      
      this.combatantManager.createFromEntity({
        id: entityId,
        name: entityData.name,
        faction: entityData.faction,
        stats,
        skills: entityData.skills,
        status: {
          isDefending: false,
          buffs: [],
          debuffs: []
        },
        ai: entityData.ai
      });
    } catch (error) {
      console.error(`Failed to create entity ${entityId}:`, error);
      throw error;
    }
  }

  // 结束战斗
  private endCombat(): void {
    console.log('结束战斗');
    characterService.updatePlayerTag('战斗.状态', 'empty');
    characterService.updatePlayerTag('战斗.ID', 'empty');
    characterService.updatePlayerTag('战斗.类型', 'empty');
    this.combatantManager.clear();
    this.currentCombatId = null;
    console.log('战斗已清除');
  }

  // 添加获取战斗��位的方法
  getCombatants(): Combatant[] {
    return this.combatantManager.getAllCombatants();
  }

  // 获取当前行动者
  getCurrentActor(): Combatant | null {
    return this.currentActor;
  }

  // 获取战斗描述
  getDescription(): string {
    const allCombatants = this.combatantManager.getAllCombatants();
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
      description += `${this.getFactionDisplayName(faction)}:\n`;
      
      // 描述每个战斗单位的状态
      combatants.forEach(combatant => {
        description += this.getCombatantStatusDescription(combatant) + '\n';
      });
      description += '\n';
    });

    return description;
  }

  // 获取当前行动者描述
  getActorDescription(): string {
    if (!this.currentActor) return '';
    
    let desc = `当前行动角色: ${this.currentActor.name}\n`;
    desc += `生命值: ${this.currentActor.stats.hp}/${this.currentActor.stats.maxHp}\n`;
    desc += `魔法值: ${this.currentActor.stats.mp}/${this.currentActor.stats.maxMp}\n`;
    desc += `体力值: ${this.currentActor.stats.sp}/${this.currentActor.stats.maxSp}\n`;
    
    if (this.currentActor.status.isDefending) {
      desc += '状态: 防御中\n';
    }
    if (this.currentActor.status.buffs.length > 0) {
      desc += `增益效果: ${this.currentActor.status.buffs.map(b => b.type).join(', ')}\n`;
    }
    if (this.currentActor.status.debuffs.length > 0) {
      desc += `减益效果: ${this.currentActor.status.debuffs.map(b => b.type).join(', ')}\n`;
    }
    
    return desc;
  }

  // 获取目标列表描述
  getTargetListDescription(actionType: string): string {
    const actor = this.currentActor;
    if (!actor) return '';

    const targets = this.getPossibleTargets(actionType);
    return targets.map(target => 
      `${target.name} - ${this.getCombatantStatusDescription(target)}`
    ).join('\n');
  }

  // 修改 getPossibleTargets 方法
  public getPossibleTargets(actionType: string): Combatant[] {
    console.log('Getting possible targets for action type:', actionType);
    
    const actor = this.currentActor;
    if (!actor) {
      console.log('No current actor found');
      return [];
    }

    const allCombatants = this.combatantManager.getAllCombatants();
    console.log('All combatants:', allCombatants.map(c => ({
      id: c.id,
      name: c.name,
      faction: c.faction,
      hp: c.stats.hp,
      maxHp: c.stats.maxHp
    })));
    
    switch (actionType) {
      case 'attack':
        // 攻击只能选择敌对阵营的存活单位
        const hostileTargets = allCombatants.filter(target => 
          target.id !== actor.id && // 不能选择自己
          target.stats.hp > 0 && // 只能选择存活的目标
          this.getFactionRelation(actor.faction, target.faction) === 'hostile'
        );
        console.log('Hostile targets:', hostileTargets.map(t => t.name));
        return hostileTargets;

      case 'heal':
        // 治疗只能选择友好阵营的存活单位
        const friendlyTargets = allCombatants.filter(target =>
          target.stats.hp > 0 &&
          (target.id === actor.id || // 可以选择自己
          this.getFactionRelation(actor.faction, target.faction) === 'friendly')
        );
        console.log('Friendly targets:', friendlyTargets);
        return friendlyTargets;

      case 'skill':
        // TODO: 根据技能类型返回不同的目标列表
        return allCombatants.filter(t => t.stats.hp > 0);

      case 'item':
        // TODO: 根据道具类型返回不同的目标列表
        return allCombatants.filter(t => t.stats.hp > 0);

      default:
        console.log('Unknown action type:', actionType);
        return [];
    }
  }

  // 获取战斗单位状态描述
  private getCombatantStatusDescription(combatant: Combatant): string {
    let desc = `${combatant.name} - `;
    
    // 生命值描述
    const hpPercent = (combatant.stats.hp / combatant.stats.maxHp) * 100;
    if (hpPercent > 80) {
      desc += '状态完好';
    } else if (hpPercent > 50) {
      desc += '受了一些伤';
    } else if (hpPercent > 20) {
      desc += '伤势严重';
    } else {
      desc += '命悬一线';
    }
    
    // 特殊状态描述
    if (combatant.status.isDefending) {
      desc += '，正在防御';
    }
    if (combatant.status.buffs.length > 0) {
      desc += `，获得${combatant.status.buffs.map(b => b.type).join('、')}增益`;
    }
    if (combatant.status.debuffs.length > 0) {
      desc += `，受到${combatant.status.debuffs.map(b => b.type).join('、')}影响`;
    }
    
    return desc;
  }

  // 获取阵营显示名称
  private getFactionDisplayName(faction: string): string {
    switch (faction) {
      case '玩家':
        return '你的队伍';
      case '复苏队':
        return '复苏队成员';
      case '晶体生物':
        return '晶体生物群';
      case '冰河派':
        return '冰河派成员';
      default:
        return faction;
    }
  }

  // 获取战斗结果描述
  getResultDescription(): string {
    const player = this.combatantManager.getCombatant('player');
    if (!player || player.stats.hp <= 0) {
      return '战斗失败...\n你被击败了。';
    }

    // TODO: 根据战斗配置返回具体的战利品信息
    return '战斗胜利！\n敌人被击败了。';
  }

  // 添加开始新回合的方法
  public async startNewRound(): Promise<void> {
    console.log(`开始第 ${this.turnState.currentRound + 1} 回合`);
    
    // 确定行动顺序
    this.determineTurnOrder();
    console.log('行动顺序:', this.turnState.turnOrder);
    
    // 开始第一个角色的回合
    await this.processTurn();
  }

  // 添加 getCombatant 方法
  public getCombatant(id: string): Combatant | undefined {
    return this.combatantManager.getCombatant(id);
  }

  public getTurnState(): TurnState {
    return this.turnState;
  }
}

// 创建单例
export const combatSystem = new CombatSystem(); 