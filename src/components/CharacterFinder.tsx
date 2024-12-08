import React from 'react';
import { Character } from '../types';
import { characterService } from '../services/characterService';

interface CharacterFinderProps {
  onClose: () => void;
}

export const CharacterFinder: React.FC<CharacterFinderProps> = ({ onClose }) => {
  const currentLocation = characterService.getPlayerTagValue('位置.当前地点') as string;
  const characters = characterService.getCharactersAtLocation(currentLocation)
    .filter(char => !characterService.isPlayer(char.id));

  const handleCharacterSelect = (characterId: string) => {
    characterService.updatePlayerTag('目标.寻找角色', characterId);
    onClose();
  };

  return (
    <div className="bg-charcoal p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">寻找角色</h3>
        <button
          onClick={onClose}
          className="p-2 bg-rose-quartz rounded hover:bg-opacity-80"
        >
          关闭
        </button>
      </div>
      
      <div className="space-y-2">
        {characters.map(character => (
          <button
            key={character.id}
            onClick={() => handleCharacterSelect(character.id)}
            className="w-full p-2 bg-navy-blue hover:bg-opacity-80 rounded text-left"
          >
            <div className="font-bold">{character.name}</div>
            <div className="text-sm opacity-80">{character.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}; 