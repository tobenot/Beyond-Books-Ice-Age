import React, { useEffect, useState } from 'react';
import { Card as CardType, Choice, TagsConfig } from '../types';
import { Card } from './Card';
import { TagsDisplay } from './TagsDisplay';
import { DateDisplay } from './DateDisplay';
import { cardService } from '../services/cardService';
import { tagService } from '../services/tagService';
import { dateService } from '../services/dateService';
import { specialMechanismService } from '../services/specialMechanismService';
import { MainMenu } from './MainMenu';
import { LocationSelector } from './LocationSelector';
import { effectService } from '../services/effectService';
import { SaveLoadMenu } from './SaveLoadMenu';

export const GameContainer: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [tags, setTags] = useState<TagsConfig>({});
  const [currentDate, setCurrentDate] = useState<Date>(dateService.getCurrentDate());
  const [countdowns, setCountdowns] = useState(dateService.getCountdowns());
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [endingType, setEndingType] = useState<string>('');
  const [endingMessage, setEndingMessage] = useState<string>('');
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [locations, setLocations] = useState({});
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      await Promise.all([
        cardService.loadCardData(),
        tagService.loadTagsConfig()
      ]);
      setTags(tagService.getTags());
    };

    initGame();
  }, []);

  useEffect(() => {
    const handleGameEnd = (event: CustomEvent) => {
      setEndingType(event.detail.type);
      setGameEnded(true);
      if (event.detail.message) {
        setEndingMessage(event.detail.message);
      }
    };

    window.addEventListener('gameEnd', handleGameEnd as EventListener);
    return () => {
      window.removeEventListener('gameEnd', handleGameEnd as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'config/locations.json');
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    };
    
    loadLocations();
  }, []);

  const drawNewCard = () => {
    const card = cardService.drawCard();
    if (card === null) {
      // 如果没有可用卡牌，可能是到了游戏结束时间
      const currentDate = dateService.getCurrentDate();
      const endDate = new Date('2020-07-07'); // 高考日期
      
      if (currentDate >= endDate) {
        setEndingType('gaokao');
        setGameEnded(true);
      } else {
        // 如果还没到结束时间但没有可用卡牌，可以选择：
        // 1. 跳过一天
        dateService.updateDate(1);
        setCurrentDate(dateService.getCurrentDate());
        drawNewCard(); // 递归尝试再次抽卡
        // 或者
        // 2. 显示一个"无事发生"的卡牌
        setCurrentCard({
          id: 'empty',
          name: '平静的一天',
          type: 'event',
          cardSet: '基础',
          description: '今天什么特别的事情都没有发生。',
          baseWeight: 1,
          choices: [{
            text: '继续',
            effects: [],
            description: '生活继续前进。'
          }]
        });
      }
    } else {
      setCurrentCard(card);
    }
  };

  const handleChoice = (choice: Choice) => {
    if (!currentCard) return;

    // 更新标签显示
    setTags(tagService.getTags());

    // 处理特殊机制
    if (choice.specialMechanism) {
      specialMechanismService.handleSpecialMechanism(
        choice.specialMechanism,
        choice,
        currentCard
      );
    }

    // 更新时间
    const timeConsumption = dateService.getCardTimeConsumption(currentCard);
    if (timeConsumption > 0) {
      dateService.updateDate(timeConsumption);
      setCurrentDate(dateService.getCurrentDate());
      setCountdowns(dateService.getCountdowns());
    }

    // 抽新卡并更新状态
    const newCard = cardService.drawCard();
    setCurrentCard(newCard);
    
    checkGameEnd();
  };

  const checkGameEnd = () => {
    const health = tagService.getTagValue('状态.生命值');
    
    if (typeof health === 'number' && health <= 0) {
      setEndingType('death');
      setEndingMessage('你死了...');
      setGameEnded(true);
      return;
    }

    // 保留原有的其他结局检查
    const happiness = tagService.getTagValue('状态.快乐');
    const energy = tagService.getTagValue('状态.精力');
    
    if (typeof happiness === 'number' && happiness <= 0) {
      setEndingType('bad_happiness');
      setGameEnded(true);
    } else if (typeof energy === 'number' && energy <= 0) {
      setEndingType('bad_energy');
      setGameEnded(true);
    }
  };

  const handleStartGame = async () => {
    await cardService.resetCardPool(); // 重置卡池
    setShowMainMenu(false);
    dateService.addCountdown("高考倒计时", "2020-07-07");
    setCountdowns(dateService.getCountdowns());
    drawNewCard();
  };

  const handleReturnToMainMenu = () => {
    window.location.reload(); // 重新加载页面以重置游戏状态
  };

  const restoreGameState = () => {
    console.log('Starting restore game state');
    
    const newTags = tagService.getTags();
    console.log('Loading tags:', newTags);
    setTags(newTags);
    
    const newDate = dateService.getCurrentDate();
    console.log('Loading date:', newDate);
    setCurrentDate(newDate);
    
    const newCountdowns = dateService.getCountdowns();
    console.log('Loading countdowns:', newCountdowns);
    setCountdowns(newCountdowns);
    
    const savedCard = cardService.getCurrentCard();
    console.log('Loading current card:', savedCard?.name);
    
    if (savedCard) {
      setCurrentCard(savedCard);
    } else {
      console.log('No saved card found, drawing new card');
      const newCard = cardService.drawCard();
      setCurrentCard(newCard);
    }
    
    console.log('Game state restored');
  };

  const handleLoadGame = () => {
    setShowMainMenu(false);
    restoreGameState();
  };

  if (showMainMenu) {
    return (
      <MainMenu 
        onStartGame={handleStartGame} 
        onLoadGame={handleLoadGame}
      />
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-3">
        <TagsDisplay tags={tags} />
        <div className="mt-4">
          <LocationSelector locations={locations} />
        </div>
        <div className="mt-4">
          <button
            onClick={() => setShowSaveMenu(true)}
            className="w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
          >
            存档/读档
          </button>
        </div>
      </div>
      <div className="col-span-6">
        {gameEnded ? (
          <div className="bg-charcoal p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">游戏结束</h2>
            {endingType === 'death' && (
              <p>你死了！<br/>{endingMessage}</p>
            )}
            {endingType === 'bad_happiness' && (
              <p>你失败了！<br/>快乐归零，道心破碎</p>
            )}
            {endingType === 'bad_energy' && (
              <p>你失败了！<br/>精力耗尽，疲惫不堪</p>
            )}
            {endingType === 'gaokao' && (
              <div dangerouslySetInnerHTML={{ __html: endingMessage }} />
            )}
            <button
              onClick={handleReturnToMainMenu}
              className="mt-4 w-full p-2 bg-moss-green hover:bg-opacity-80 rounded"
            >
              返回主菜单
            </button>
          </div>
        ) : (
          currentCard && <Card card={currentCard} onChoice={handleChoice} />
        )}
      </div>
      <div className="col-span-3">
        <DateDisplay 
          currentDate={currentDate}
          countdowns={countdowns}
        />
      </div>
      {showSaveMenu && (
        <SaveLoadMenu
          onClose={() => setShowSaveMenu(false)}
          isLoading={false}
          onLoad={() => {
            restoreGameState();
            setShowSaveMenu(false);
          }}
          saveEnabled={true}
        />
      )}
    </div>
  );
}; 