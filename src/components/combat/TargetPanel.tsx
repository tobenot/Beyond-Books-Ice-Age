import React, { useEffect, useState } from 'react';
import { characterService } from '../../services/characterService';
import { combatSystem } from '../../combat/CombatSystem';
import { Combatant } from '../../combat/types';

interface TargetPanelProps {
  onClose: () => void;
  onSelect: ((targetId: string) => void) | null;
}

export const TargetPanel: React.FC<TargetPanelProps> = ({ onClose, onSelect }) => {
  const [targets, setTargets] = useState<Combatant[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>('');

  useEffect(() => {
    // 直接从战斗系统获取数据
    const type = characterService.getPlayerTagValue('战斗.选择.类型') as string;
    setActionType(type);
    
    const possibleTargets = combatSystem.getPossibleTargets(type);
    console.log('Possible targets:', possibleTargets);
    setTargets(possibleTargets);
  }, []);

  const handleConfirm = async () => {
    if (!selectedTarget) return;

    // 设置目标
    characterService.updatePlayerTag('战斗.选择.目标', selectedTarget);
    
    // 获取当前行动者
    const actor = combatSystem.getCurrentActor();
    if (!actor) return;

    try {
      // 如果有回调函数,先执行回调
      if (onSelect) {
        await onSelect(selectedTarget);
      } else {
        // 否则执行默认的战斗行动
        await combatSystem.executeAction(actor, {
          type: actionType as 'attack' | 'defend' | 'skill' | 'item',
          targetId: selectedTarget
        });
      }
      onClose();
    } catch (error) {
      console.error('Error executing target selection:', error);
    }
  };

  const getStatusText = (target: Combatant) => {
    const parts = [];
    if (target.status.isDefending) parts.push('防御中');
    if (target.status.buffs.length > 0) {
      parts.push(`增益: ${target.status.buffs.map(b => b.type).join(', ')}`);
    }
    if (target.status.debuffs.length > 0) {
      parts.push(`减益: ${target.status.debuffs.map(b => b.type).join(', ')}`);
    }
    return parts.join(' | ');
  };

  // 按阵营分组显示目标
  const groupedTargets = targets.reduce((groups, target) => {
    const faction = target.faction;
    if (!groups[faction]) {
      groups[faction] = [];
    }
    groups[faction].push(target);
    return groups;
  }, {} as Record<string, Combatant[]>);

  console.log('Grouped targets:', groupedTargets);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white">
          选择{actionType === 'attack' ? '攻击' : actionType}目标
        </h2>
        
        {Object.entries(groupedTargets).length === 0 ? (
          <div className="text-white">没有可选择的目标</div>
        ) : (
          Object.entries(groupedTargets).map(([faction, factionTargets]) => (
            <div key={faction} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">
                {faction === '玩家' ? '我方' : 
                 faction === '复苏队' ? '复苏队' :
                 faction === '晶体生物' ? '晶体生物' :
                 faction === '冰河派' ? '冰河派' : faction}
              </h3>
              <div className="space-y-2">
                {factionTargets.map(target => (
                  <div
                    key={target.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedTarget === target.id
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedTarget(target.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{target.name}</span>
                      <span className="text-gray-300">
                        HP: {target.stats.hp}/{target.stats.maxHp}
                      </span>
                    </div>
                    {target.status && (
                      <div className="text-sm text-gray-400 mt-1">
                        {getStatusText(target)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="flex justify-end space-x-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={onClose}
          >
            返回
          </button>
          <button
            className={`px-4 py-2 rounded ${
              selectedTarget
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
            onClick={handleConfirm}
            disabled={!selectedTarget}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}; 