import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../types';
import { specialMechanismService } from '../services/specialMechanismService';
import { dateService } from '../services/dateService';
import { effectService } from '../services/effectService';
import { cardService } from '../services/cardService';
import { illustrationService } from '../services/illustrationService';
import { characterService } from '../services/characterService';
import { TypewriterText } from './TypewriterText';

interface CardProps {
  card: CardType;
  onChoice: (choice: Choice) => Promise<void>;
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
  const [isReady, setIsReady] = useState(false);
  const [typewriterEnabled, setTypewriterEnabled] = useState(true);

  useEffect(() => {
    setSelectedChoice(null);
    setResultText('');
    setShowContinueButton(false);
    setIsReady(false);
    setProcessedDescription(specialMechanismService.replacePlaceholders(card.description));

    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, [card.id]);

  useEffect(() => {
    if (isReady && card.autoSelect && card.choices.length > 0) {
      handleChoice(card.choices[0]);
    }
  }, [isReady]);

  useEffect(() => {
    const loadIllustration = async () => {
      const illPath = await illustrationService.getCardIllustration(card);
      setIllustration(illPath);
    };
    loadIllustration();
  }, [card]);

  const handleChoice = async (choice: Choice) => {
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
    let text = `<div><i>${choice.text}</i><p>${choice.description}</p></div>`;
    const processedText = specialMechanismService.replacePlaceholders(text);
    setResultText(processedText);
    
    // 等待特殊机制处理完成后再清空当前卡牌
    if (choice.specialMechanism) {
      console.log('开始处理特殊机制:', choice.specialMechanism);
      try {
        await specialMechanismService.handleSpecialMechanism(
          choice.specialMechanism,
          choice,
          card
        );
        console.log('特殊机制处理完成');
      } catch (error) {
        console.error('特殊机制处理失败:', error);
        return;
      }
    }

    // 特殊机制处理完成后再清空当前卡牌
    console.log('清空当前卡片');
    cardService.setCurrentCard(null);
    
    setShowContinueButton(true);
    console.log('选择选项完成');
  };

  const handleContinue = async () => {
    console.log('点击继续按钮');
    if (selectedChoice) {
      console.log('处理选择后续:', selectedChoice.text);
      
      // 重置组件状态
      setSelectedChoice(null);
      setResultText('');
      setShowContinueButton(false);
      
      console.log('调用onChoice回调');
      try {
        // 等待选择处理完成
        await onChoice(selectedChoice);
        console.log('选择处理完成');
      } catch (error) {
        console.error('选择处理失败:', error);
      }
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
      {(!isImageLoaded || !isReady) && (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 主要内容区域 */}
      <div className={`
        flex flex-col
        ${(isImageLoaded && isReady) ? 'opacity-100' : 'opacity-0'}
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

        {/* 标题和打字机控制按钮 */}
        <div className="flex justify-between items-center mb-[0.5vh]">
          <h2 className="text-[1.8vh] font-bold">{card.name}</h2>
          <button
            onClick={() => setTypewriterEnabled(!typewriterEnabled)}
            className="w-[2.4vh] h-[2.4vh] flex items-center justify-center hover:bg-navy-blue hover:bg-opacity-80 rounded-full transition-colors"
            title={`${typewriterEnabled ? '关闭' : '开启'}打字效果`}
          >
            {typewriterEnabled ? '✍️' : '📃'}
          </button>
        </div>

        {/* 下半部分左右分栏 */}
        <div className="flex gap-[0.8vh] h-[30vh]">
          {/* 左侧文字内容 */}
          <div className="flex-1 overflow-y-auto">
            {!selectedChoice ? (
              <TypewriterText
                text={processedDescription}
                enabled={typewriterEnabled && isReady}
                className="text-[1.6vh] whitespace-pre-line"
              />
            ) : (
              <TypewriterText
                text={resultText}
                enabled={typewriterEnabled}
                className="result-text whitespace-pre-line text-[1.6vh]"
                isHtml={true}
              />
            )}
          </div>

          {/* 右侧选项列表 */}
          <div className="w-[40%] flex flex-col">
            {!selectedChoice ? (
              <div className="choices space-y-[0.5vh] overflow-y-auto">
                {renderChoices()}
              </div>
            ) : (
              showContinueButton && (
                <button
                  onClick={handleContinue}
                  className="w-full p-[0.8vh] text-[1.6vh] bg-moss-green hover:bg-opacity-80 rounded mt-auto"
                >
                  {dateService.getCardTimeConsumption(card) > 0 
                    ? `过了${dateService.getCardTimeConsumption(card)}时间` 
                    : '继续'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 