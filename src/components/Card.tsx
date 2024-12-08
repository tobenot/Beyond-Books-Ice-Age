import React, { useState, useEffect } from 'react';
import { Card as CardType, Choice } from '../types';
import { specialMechanismService } from '../services/specialMechanismService';
import { dateService } from '../services/dateService';
import { characterService } from '../services/characterService';
import { effectService } from '../services/effectService';
import { cardService } from '../services/cardService';

interface CardProps {
  card: CardType;
  onChoice: (choice: Choice) => void;
}

export const Card: React.FC<CardProps> = ({ card, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [processedDescription, setProcessedDescription] = useState<string>('');

  useEffect(() => {
    setSelectedChoice(null);
    setResultText('');
    setShowContinueButton(false);
    setProcessedDescription(specialMechanismService.replacePlaceholders(card.description));
  }, [card.id]);

  const handleChoice = (choice: Choice) => {
    setSelectedChoice(choice);
    
    // 先应用effects更新标签值
    choice.effects.forEach(effect => {
      effectService.applyEffect(effect);
    });
    
    // 如果需要消耗卡片，立即消耗
    if (choice.consumeCard) {
      cardService.consumeCard(card);
    }
    
    // 构建结果文本
    let text = `
      <div>
        <br><i>${choice.text}</i>
        <p>${choice.description}</p>
      </div>
    `;
    
    // 使用specialMechanismService处理占位符
    const processedText = specialMechanismService.replacePlaceholders(text);
    setResultText(processedText);
    setShowContinueButton(true);

    // 选择完就立即清空当前卡牌
    cardService.setCurrentCard(null);
  };

  const handleContinue = () => {
    if (selectedChoice) {
      onChoice(selectedChoice);
    }
  };

  return (
    <div className="card bg-charcoal rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-2">{card.name}</h2>
      <p className="mb-4">{processedDescription}</p>
      
      {!selectedChoice ? (
        <div className="choices space-y-2">
          {card.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoice(choice)}
              className="w-full p-2 bg-moss-green hover:bg-opacity-80 rounded"
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div 
            className="result-text mb-4"
            dangerouslySetInnerHTML={{ __html: resultText }}
          />
          {showContinueButton && (
            <button
              onClick={handleContinue}
              className="w-full p-2 bg-moss-green hover:bg-opacity-80 rounded"
            >
              {dateService.getCardTimeConsumption(card) > 0 
                ? `过了${dateService.getCardTimeConsumption(card)}天` 
                : '继续'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 