import { tagService } from './tagService';

class ItemService {
  // 获取物品数量
  getItemCount(itemName: string): number {
    return characterService.getPlayerTagValue(`物品.${itemName}`) as number || 0;
  }

  // 添加物品
  addItem(itemName: string, amount: number = 1): void {
    const currentAmount = this.getItemCount(itemName);
    console.log(`Adding ${amount} ${itemName}(s). Current amount: ${currentAmount}`);
    characterService.updatePlayerTag(`物品.${itemName}`, amount);
    console.log(`New amount: ${this.getItemCount(itemName)}`);
  }

  // 移除物品
  removeItem(itemName: string, amount: number = 1): boolean {
    const currentAmount = this.getItemCount(itemName);
    console.log(`Removing ${amount} ${itemName}(s). Current amount: ${currentAmount}`);
    if (currentAmount >= amount) {
      characterService.updatePlayerTag(`物品.${itemName}`, -amount);
      console.log(`New amount: ${this.getItemCount(itemName)}`);
      return true;
    }
    console.log('Remove failed - insufficient amount');
    return false;
  }

  // 使用消耗品
  useConsumable(itemName: string): boolean {
    const itemConfig = tagService.getTagConfig(`物品.${itemName}`);
    if (itemConfig && itemConfig.type === 'consumable' && this.getItemCount(itemName) > 0) {
      // 应用物品效果
      if (itemConfig.effects) {
        if (Array.isArray(itemConfig.effects)) {
          itemConfig.effects.forEach(effect => {
            const [tag, value] = effect.split('.');
            characterService.updatePlayerTag(tag, parseInt(value));
          });
        }
      }
      // 消耗物品
      return this.removeItem(itemName);
    }
    return false;
  }

  // 装备物品
  equipItem(itemName: string): boolean {
    console.log(`Attempting to equip item: ${itemName}`);
    const itemConfig = tagService.getTagConfig(`物品.${itemName}`);
    console.log('Item config:', itemConfig);
    
    if (itemConfig && itemConfig.type === 'equipment' && this.getItemCount(itemName) > 0) {
      console.log(`Current item count: ${this.getItemCount(itemName)}`);
      
      const slot = itemConfig.slot as string;
      if (!slot) {
        console.error('Invalid slot configuration for item:', itemName);
        return false;
      }

      // 先卸下当前装备
      const currentEquipped = characterService.getPlayerTagValue(`装备.${slot}`);
      console.log(`Current equipped item in slot ${slot}:`, currentEquipped);
      if (currentEquipped) {
        this.unequipItem(slot);
      }
      
      // 装备新物品
      console.log(`Equipping ${itemName} to slot ${slot}`);
      characterService.updatePlayerTag(`装备.${slot}`, itemName);
      
      // 应用装备效果
      if (itemConfig.effects) {
        console.log('Applying equipment effects:', itemConfig.effects);
        Object.entries(itemConfig.effects).forEach(([tag, value]) => {
          characterService.updatePlayerTag(tag, value as number);
        });
      }
      
      // 从物品栏移除一个该物品
      console.log(`Removing 1 ${itemName} from inventory`);
      const removeResult = this.removeItem(itemName, 1);
      console.log(`Remove result: ${removeResult}`);
      
      return true;
    }
    console.log('Failed to equip item - conditions not met');
    return false;
  }

  // 卸下装备
  unequipItem(slot: string): boolean {
    const equippedItem = characterService.getPlayerTagValue(`装备.${slot}`);
    if (equippedItem) {
      const itemConfig = tagService.getTagConfig(`物品.${equippedItem}`);
      
      // 移除装备效果
      if (itemConfig && itemConfig.effects) {
        Object.entries(itemConfig.effects).forEach(([tag, value]) => {
          characterService.updatePlayerTag(tag, -(value as number));
        });
      }
      
      // 将物品返还到物品栏
      this.addItem(equippedItem as string, 1);
      
      // 清空装备槽
      characterService.updatePlayerTag(`装备.${slot}`, '');
      return true;
    }
    return false;
  }

  // 获取已装备物品列表
  getEquippedItems(): Record<string, string> {
    const equipped: Record<string, string> = {};
    ['头部', '身体', '武器'].forEach(slot => {
      const item = characterService.getPlayerTagValue(`装备.${slot}`);
      if (item) {
        equipped[slot] = item as string;
      }
    });
    return equipped;
  }
}

export const itemService = new ItemService(); 