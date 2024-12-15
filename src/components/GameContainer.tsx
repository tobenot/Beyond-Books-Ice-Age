import React, { useEffect, useState, useCallback } from 'react';
import { Card as CardType, Choice, PlayerTags } from '../types';
import { Card } from './Card';
import { TagsDisplay } from './TagsDisplay';
import { DateDisplay } from './DateDisplay';
import { cardService } from '../services/cardService';
import { dateService } from '../services/dateService';
import { specialMechanismService } from '../services/specialMechanismService';
import { MainMenu } from './MainMenu';
import { LocationSelector } from './LocationSelector';
import { SaveLoadMenu } from './SaveLoadMenu';
import { InventoryPanel } from './InventoryPanel';
import { CharacterPanel } from './CharacterPanel';
import { characterService } from '../services/characterService';
import { tagService } from '../services/tagService';
import { createDefaultTags } from '../utils/defaultTags';
import { MirrorMenu } from './MirrorMenu';


export const GameContainer: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [tags, setTags] = useState<PlayerTags>(createDefaultTags());
  const [currentDate, setCurrentDate] = useState<Date>(dateService.getCurrentDate());
  const [countdowns, setCountdowns] = useState(dateService.getCountdowns());
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [endingType, setEndingType] = useState<string>('');
  const [endingMessage, setEndingMessage] = useState<string>('');
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [locations, setLocations] = useState({});
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showMirrorMenu, setShowMirrorMenu] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      await Promise.all([
        cardService.loadCardData(),
        tagService.loadTagsConfig(),
        characterService.loadCharacterData()
      ]);
      setTags(characterService.getPlayer()?.tags || tags);
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
        const timestamp = new Date().getTime();
        const response = await fetch(`${import.meta.env.BASE_URL}config/locations.json?t=${timestamp}`);
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

  const handleChoice = async (choice: Choice) => {
    console.log('GameContainer处理选择开始:', choice);
    if (!currentCard) return;

    // 更新标签显示
    setTags(characterService.getPlayer()?.tags || tags);

    // 更新时间
    const timeConsumption = dateService.getCardTimeConsumption(currentCard);
    if (timeConsumption > 0) {
      console.log('更新时间:', timeConsumption, '天');
      dateService.updateDate(timeConsumption);
      setCurrentDate(dateService.getCurrentDate());
      setCountdowns(dateService.getCountdowns());
    }

    // 清空当前卡牌状态
    console.log('清空当前卡牌状态');
    setCurrentCard(null);

    // 抽新卡并更新状态
    console.log('准备抽取新卡');
    const newCard = cardService.drawCard();
    console.log('抽取到新卡:', newCard?.id);
    setCurrentCard(newCard);
    
    checkGameEnd();
    console.log('GameContainer处理选择完成');
  };

  const checkGameEnd = () => {
    const health = characterService.getPlayerTagValue('状态.生命值');
    
    if (typeof health === 'number' && health <= 0) {
      setEndingType('death');
      setEndingMessage('你死了...');
      setGameEnded(true);
      return;
    }

    // 保留原有的其他结局检查
    const happiness = characterService.getPlayerTagValue('状态.快乐');
    const energy = characterService.getPlayerTagValue('状态.精力');
    
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
    dateService.addCountdown("不知道是什么的倒计时", "2020-07-07");
    setCountdowns(dateService.getCountdowns());
    drawNewCard();
  };

  const handleReturnToMainMenu = () => {
    window.location.reload(); // 重新加载页面以重置游戏状态
  };

  const restoreGameState = () => {
    const newTags = characterService.getPlayer()?.tags || createDefaultTags();
    setTags(newTags);
    
    const newDate = dateService.getCurrentDate();
    setCurrentDate(newDate);
    
    const newCountdowns = dateService.getCountdowns();
    setCountdowns(newCountdowns);
    
    const savedCard = cardService.getCurrentCard();
    
    if (savedCard) {
      setCurrentCard(savedCard);
    } else {
      const newCard = cardService.drawCard();
      setCurrentCard(newCard);
    }
  };

  const handleLoadGame = () => {
    setShowMainMenu(false);
    restoreGameState();
  };

  // 使用 useCallback 优化更新函数
  const updateTags = useCallback(() => {
    const newTags = characterService.getPlayer()?.tags;
    if (JSON.stringify(tags) !== JSON.stringify(newTags)) {
      setTags(newTags || createDefaultTags());
    }
  }, [tags]);

  // 使用 useEffect 控制标签更新的时机
  useEffect(() => {
    const intervalId = setInterval(updateTags, 1000); // 每秒更新一次
    return () => clearInterval(intervalId);
  }, [updateTags]);

  // 添加一个跳过当前卡的函数
  const skipCurrentCard = () => {
    console.log('跳过当前卡片');
    setCurrentCard(null);
    const newCard = cardService.drawCard();
    setCurrentCard(newCard);
  };

  // 添加处理照镜子的函数
  const handleMirrorClick = () => {
    characterService.updatePlayerTag('目标.照镜子', '1');
    
    // 检查当前卡是否是观察卡
    const currentCard = cardService.getCurrentCard();
    if (currentCard?.id.startsWith('observe_')) {
      // 如果是观察卡,直接跳过
      skipCurrentCard();
    }
  };

  // 添加事件监听
  useEffect(() => {
    const handleShowMirrorMenu = (event: CustomEvent) => {
      setShowMirrorMenu(true);
    };

    window.addEventListener('showMirrorMenu', handleShowMirrorMenu as EventListener);
    return () => {
      window.removeEventListener('showMirrorMenu', handleShowMirrorMenu as EventListener);
    };
  }, []);

  if (showMainMenu) {
    return (
      <MainMenu 
        onStartGame={handleStartGame} 
        onLoadGame={handleLoadGame}
      />
    );
  }

  return (
    <>
      {/* 左侧面板 */}
      <div className="panel-container">
        <div className="panel-content">
          <div className="mb-4">
            <button
              onClick={() => setShowInventory(true)}
              className="w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              📦 物品/装备
            </button>
          </div>
          <div className="mb-4">
            <button
              onClick={handleMirrorClick}
              className="w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              🧊 照镜子
            </button>
          </div>
          <div className="mb-4">
            <button
              onClick={() => setShowSaveMenu(true)}
              className="w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              💾 存档/读档
            </button>
          </div>
          
          <LocationSelector locations={locations} onSkipCard={skipCurrentCard} />
        </div>
      </div>

      {/* 中间内容 */}
      <div className="panel-container">
        <div className="panel-content">
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
      </div>

      {/* 右侧面板 */}
      <div className="panel-container">
        <div className="panel-content">
          <TagsDisplay playerTags={characterService.getPlayer()?.tags} />
          <div className="mt-4">
            <DateDisplay 
              currentDate={currentDate}
              countdowns={countdowns}
            />
          </div>
          <div className="mt-4">
            <CharacterPanel onSkipCard={skipCurrentCard} />
          </div>
        </div>
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
      {showInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-navy-blue p-4 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">物品与装备</h2>
              <button
                onClick={() => setShowInventory(false)}
                className="p-2 bg-charcoal rounded hover:bg-opacity-80"
              >
                关闭
              </button>
            </div>
            <InventoryPanel />
          </div>
        </div>
      )}
      {showMirrorMenu && (
        <MirrorMenu onClose={() => setShowMirrorMenu(false)} />
      )}
    </>
  );
}; 