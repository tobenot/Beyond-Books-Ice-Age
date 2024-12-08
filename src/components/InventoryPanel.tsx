import React, { useState } from 'react';
import { characterService } from '../services/characterService';
import { itemService } from '../services/itemService';

export const InventoryPanel: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'items' | 'equipment'>('items');
  const [showEquipDialog, setShowEquipDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');

  const playerTags = characterService.getPlayer()?.tags;
  const tagsConfig = tagService.getTagsConfig();

  const renderItems = () => {
    const items = playerTags.物品 || {};
    return (
      <div className="space-y-2">
        {Object.entries(items).map(([itemName, count]) => {
          if (!count) return null;
          const itemConfig = tagsConfig.物品?.[itemName];
          if (!itemConfig) return null;
          
          return (
            <div 
              key={itemName}
              className="flex justify-between items-center p-2 bg-charcoal rounded hover:bg-opacity-80 cursor-pointer"
              onClick={() => handleItemClick(itemName)}
            >
              <div>
                <span className="font-bold" style={{ color: itemConfig.color }}>
                  {itemName}
                </span>
                <span className="text-sm ml-2 opacity-60">
                  {itemConfig.description}
                </span>
              </div>
              <span>x{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEquipment = () => {
    const equipment = playerTags.装备 || {};
    const slots = {
      "头部": { color: "gray", name: "头部" },
      "身体": { color: "gray", name: "身体" },
      "武器": { color: "gray", name: "武器" }
    };

    return (
      <div className="space-y-2">
        {Object.entries(equipment).map(([slot, equippedItem]) => {
          const slotInfo = slots[slot as keyof typeof slots];
          if (!slotInfo) return null;

          // 如果有装备的物品，获取物品的颜色
          const itemConfig = equippedItem ? tagsConfig.物品?.[equippedItem] : null;
          const displayColor = itemConfig?.color || slotInfo.color;

          return (
            <div 
              key={slot}
              className="flex justify-between items-center p-2 bg-charcoal rounded"
            >
              <span className="font-bold" style={{ color: displayColor }}>
                {slotInfo.name}
              </span>
              <div className="flex items-center">
                <span>{equippedItem || '空'}</span>
                {equippedItem && (
                  <button
                    onClick={() => handleUnequip(slot)}
                    className="ml-2 px-2 py-1 bg-rose-quartz rounded hover:bg-opacity-80"
                  >
                    卸下
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleItemClick = (itemName: string) => {
    const itemConfig = tagsConfig.物品?.[itemName];
    if (!itemConfig) return;

    if (itemConfig.type === 'consumable') {
      itemService.useConsumable(itemName);
    } else if (itemConfig.type === 'equipment') {
      setSelectedItem(itemName);
      setShowEquipDialog(true);
    }
  };

  const handleEquip = () => {
    if (selectedItem) {
      itemService.equipItem(selectedItem);
      setShowEquipDialog(false);
      setSelectedItem('');
    }
  };

  const handleUnequip = (slot: string) => {
    itemService.unequipItem(slot);
  };

  return (
    <div className="bg-navy-blue p-4 rounded-lg">
      <div className="flex mb-4">
        <button
          className={`flex-1 p-2 ${selectedTab === 'items' ? 'bg-moss-green' : 'bg-charcoal'} rounded-l`}
          onClick={() => setSelectedTab('items')}
        >
          物品
        </button>
        <button
          className={`flex-1 p-2 ${selectedTab === 'equipment' ? 'bg-moss-green' : 'bg-charcoal'} rounded-r`}
          onClick={() => setSelectedTab('equipment')}
        >
          装备
        </button>
      </div>

      {selectedTab === 'items' ? renderItems() : renderEquipment()}

      {showEquipDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-navy-blue p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">装备 {selectedItem}?</h3>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEquip}
                className="px-4 py-2 bg-moss-green rounded hover:bg-opacity-80"
              >
                确认
              </button>
              <button
                onClick={() => setShowEquipDialog(false)}
                className="px-4 py-2 bg-charcoal rounded hover:bg-opacity-80"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 