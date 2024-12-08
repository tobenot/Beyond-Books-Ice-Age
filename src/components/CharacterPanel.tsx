import React from 'react';
import { Character } from '../types';
import { characterService } from '../services/characterService';

export const CharacterPanel: React.FC = () => {
  const currentLocation = characterService.getPlayerTagValue('位置.当前地点') as string;
  console.log('Player current location:', currentLocation);
  
  const characters = characterService.getCharactersAtLocation(currentLocation)
    .filter(char => !characterService.isPlayer(char.id));
  console.log('Characters at location:', characters.map(c => c.name));
  
  const playerRelationships = characterService.getPlayerRelationships()
    .filter(rel => characterService.getCharacterTagValue(rel.character.id, '位置.当前地点') === currentLocation);

  const handleFindCharacter = (characterId: string) => {
    characterService.updatePlayerTag('目标.寻找角色', characterId);
  };

  const renderCharacterStats = (character: Character) => (
    <>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <h5 className="font-bold text-sm">状态</h5>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>生命值:</span>
              <span>{characterService.getCharacterTagValue(character.id, '状态.生命值')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>熵减抗性:</span>
              <span>{characterService.getCharacterTagValue(character.id, '状态.熵减抗性')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>精力:</span>
              <span>{characterService.getCharacterTagValue(character.id, '状态.精力')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>快乐:</span>
              <span>{characterService.getCharacterTagValue(character.id, '状态.快乐')}</span>
            </div>
          </div>
        </div>
        <div>
          <h5 className="font-bold text-sm">装备</h5>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>头部:</span>
              <span>{characterService.getCharacterTagValue(character.id, '装备.头部') || '无'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>身体:</span>
              <span>{characterService.getCharacterTagValue(character.id, '装备.身体') || '无'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>武器:</span>
              <span>{characterService.getCharacterTagValue(character.id, '装备.武器') || '无'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <h5 className="font-bold text-sm">物品</h5>
        <div className="text-sm">
          {Object.entries(character.tags.物品 || {}).map(([item, count]: [string, number]) => (
            <div key={item} className="flex justify-between">
              <span>{item}:</span>
              <span>x{count}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (characters.length === 0) {
    return (
      <div className="bg-charcoal p-4 rounded-lg">
        <p>这里没有其他人。</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">在场人物</h3>
      <div className="space-y-4">
        {characters.map(character => (
          <div key={character.id} className="border border-gray-700 p-3 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{character.name}</h4>
                <p className="text-sm opacity-80">{character.title}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                character.faction === '复苏队' ? 'bg-sky-blue' : 'bg-rose-quartz'
              }`}>
                {character.faction}
              </span>
            </div>
            <p className="mt-2 text-sm">{character.description}</p>
            
            {renderCharacterStats(character)}
            
            {/* 只显示NPC对玩家的态度 */}
            {playerRelationships
              .filter(rel => rel.character.id === character.id)
              .map(({charToPlayer}) => (
                <div key={`player-${character.id}`} className="mt-2 text-sm border-t border-gray-700 pt-2">
                  <div className="mb-2">
                    <p className="font-bold">对你的态度:</p>
                    <div className="flex justify-between">
                      <span>好感度:</span>
                      <span>{charToPlayer.好感度}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>信任度:</span>
                      <span>{charToPlayer.信任度}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>立场:</span>
                      <span>{charToPlayer.立场}</span>
                    </div>
                  </div>
                </div>
              ))}
            <button
              onClick={() => handleFindCharacter(character.id)}
              className="mt-2 px-2 py-1 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              寻找
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 