import React, { useState, useEffect } from 'react';
import { Card as CardType, Choice } from '../types';
import { specialMechanismService } from '../services/specialMechanismService';
import { dateService } from '../services/dateService';
import { effectService } from '../services/effectService';
import { cardService } from '../services/cardService';
import { illustrationService } from '../services/illustrationService';

interface CardProps {
  card: CardType;
  onChoice: (choice: Choice) => void;
}

export const Card: React.FC<CardProps> = ({ card, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [processedDescription, setProcessedDescription] = useState<string>('');
  const [illustration, setIllustration] = useState<string>('');

  useEffect(() => {
    setSelectedChoice(null);
    setResultText('');
    setShowContinueButton(false);
    setProcessedDescription(specialMechanismService.replacePlaceholders(card.description));
  }, [card.id]);

  useEffect(() => {
    const loadIllustration = async () => {
      const illPath = await illustrationService.getCardIllustration(card);
      setIllustration(illPath);
    };
    loadIllustration();
  }, [card]);

  const handleChoice = (choice: Choice) => {
    console.log('选择选项开始:', choice.text);
    setSelectedChoice(choice);
    
    // 先应用effects更新标签值
    console.log('应用效果前:', choice.effects);
    choice.effects.forEach(effect => {
      effectService.applyEffect(effect);
    });
    console.log('应用效果后');
    
    // 如果需要消耗卡片，立即消耗
    if (choice.consumeCard) {
      console.log('消耗卡片:', card.id);
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
    console.log('清空当前卡片');
    cardService.setCurrentCard(null);
    
    console.log('选择选项完成');
  };

  const handleContinue = () => {
    console.log('点击继续按钮');
    if (selectedChoice) {
      console.log('处理选择后续:', selectedChoice.text);
      
      // 重置组件状态
      setSelectedChoice(null);
      setResultText('');
      setShowContinueButton(false);
      
      console.log('调用onChoice回调');
      onChoice(selectedChoice);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="card bg-charcoal rounded-lg p-4 shadow-lg">
      <div className="mb-4 relative h-96 overflow-hidden rounded-lg">
        <img 
          src={illustration}
          alt={card.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      
      <h2 className="text-xl font-bold mb-2">{card.name}</h2>
      <p className="mb-4 whitespace-pre-line">{processedDescription}</p>
      
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
            className="result-text mb-4 whitespace-pre-line"
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