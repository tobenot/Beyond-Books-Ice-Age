import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../types';
import { specialMechanismService } from '../services/specialMechanismService';
import { dateService } from '../services/dateService';
import { effectService } from '../services/effectService';
import { cardService } from '../services/cardService';
import { illustrationService } from '../services/illustrationService';
import { characterService } from '../services/characterService';

interface CardProps {
  card: CardType;
  onChoice: (choice: Choice) => void;
}

// 扩展基础的选项接口
interface Choice {
  text: string;
  effects: string[];
  description?: string;
  requireTags?: Record<string, string>;
  consumeCard?: boolean;
  specialMechanism?: string;
  disabledDisplay?: string;
}

export const Card: React.FC<CardProps> = ({ card, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [processedDescription, setProcessedDescription] = useState<string>('');
  const [illustration, setIllustration] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  const isChoiceAvailable = (choice: Choice): boolean => {
    if (!choice.requireTags) return true;

    for (const [tag, condition] of Object.entries(choice.requireTags)) {
      const tagValue = characterService.getPlayerTagValue(tag);
      
      if (condition === '!empty') {
        if (tagValue === '') return false;
      } else if (condition === 'empty') {
        if (tagValue !== '') return false;
      } else if (typeof tagValue === 'number') {
        const operator = condition.charAt(0);
        const threshold = parseFloat(condition.slice(1));
        
        switch (operator) {
          case '>':
            if (!(tagValue > threshold)) return false;
            break;
          case '<':
            if (!(tagValue < threshold)) return false;
            break;
          case '=':
            if (!(tagValue === threshold)) return false;
            break;
        }
      } else if (typeof tagValue === 'string') {
        if (tagValue !== condition) return false;
      }
    }

    return true;
  };

  const renderChoices = () => {
    return card.choices
      .filter(choice => isChoiceAvailable(choice) || choice.disabledDisplay)
      .map((choice, index) => {
        const available = isChoiceAvailable(choice);
        
        const getButtonColor = () => {
          if (!available) return 'bg-charcoal opacity-50';
          if (choice.consumeCard) return 'bg-coral hover:bg-opacity-80';
          if (choice.specialMechanism) return 'bg-amber hover:bg-opacity-80';
          const colors = ['bg-sage', 'bg-sky-blue', 'bg-royal-purple'];
          return `${colors[index % colors.length]} hover:bg-opacity-80`;
        };
        
        return (
          <div 
            key={index}
            className="relative group"
          >
            <button
              onClick={() => available && handleChoice(choice)}
              disabled={!available}
              className={`w-full p-[1vh] text-[1.6vh] ${getButtonColor()} rounded transition-colors duration-200`}
            >
              {choice.text}
            </button>
            {!available && choice.disabledDisplay && (
              <div className="absolute bottom-full left-0 w-full mb-[0.5vh] hidden group-hover:block z-10">
                <div className="bg-charcoal p-[1vh] rounded shadow-lg text-left text-[1.4vh]">
                  {choice.disabledDisplay}
                </div>
              </div>
            )}
          </div>
        );
      });
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  return (
    <div className="card bg-charcoal rounded-lg p-[0.8vh] shadow-lg">
      {/* 加载状态遮罩 */}
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 主要内容区域 - 使用固定的纵向布局 */}
      <div className={`
        flex flex-col
        ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-300
      `}>
        {/* 图片容器 - 固定高度和居中 */}
        <div className="w-full h-[28vh] max-h-[768px] mb-[0.8vh] relative overflow-hidden rounded-lg">
          <img 
            src={illustration}
            alt={card.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onLoad={handleImageLoad}
          />
        </div>

        {/* 文字内容容器 */}
        <div className="w-full flex flex-col">
          <h2 className="text-[1.8vh] font-bold mb-[0.5vh]">{card.name}</h2>
          <p className="text-[1.6vh] mb-[0.8vh] whitespace-pre-line flex-grow overflow-y-auto">
            {processedDescription}
          </p>
          
          {/* 选项区域 */}
          {!selectedChoice ? (
            <div className="choices space-y-[0.5vh]">
              {renderChoices()}
            </div>
          ) : (
            <div>
              <div 
                className="result-text mb-[0.8vh] whitespace-pre-line text-[1.6vh]"
                dangerouslySetInnerHTML={{ __html: resultText }}
              />
              {showContinueButton && (
                <button
                  onClick={handleContinue}
                  className="w-full p-[0.8vh] text-[1.6vh] bg-moss-green hover:bg-opacity-80 rounded"
                >
                  {dateService.getCardTimeConsumption(card) > 0 
                    ? `过了${dateService.getCardTimeConsumption(card)}时间` 
                    : '继续'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 