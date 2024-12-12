import React, { useState, useEffect } from 'react';
import { SaveLoadMenu } from './SaveLoadMenu';
import { illustrationService } from '../services/illustrationService';
import { cardService } from '../services/cardService';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
}

// 添加卡包类型定义
interface CardCategory {
  id: string;
  name: string;
  description: string;
  cardSets: {
    id: string;
    name: string;
    description: string;
    path: string;
    required: boolean;
  }[];
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLoadGame }) => {
  const [showModal, setShowModal] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [showCardList, setShowCardList] = React.useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [leftIllustration, setLeftIllustration] = useState('');
  const [rightIllustration, setRightIllustration] = useState('');
  const [cardCategories, setCardCategories] = useState<CardCategory[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadIllustrations = async () => {
      // 加载左右两侧的立绘
      const leftPath = await illustrationService.getIllustration('robotShow');
      const rightPath = await illustrationService.getIllustration('IceShow');
      setLeftIllustration(leftPath);
      setRightIllustration(rightPath);
    };
    loadIllustrations();
  }, []);

  useEffect(() => {
    // 加载卡包分类配置
    const loadCardCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}config/cardSetCategories.json`);
        const categories = await response.json();
        setCardCategories(categories);
        
        // 获取当前启用的卡包
        const activeSets = cardService.getActiveCardSets();
        setActiveCategories(new Set(activeSets));
      } catch (error) {
        console.error('Error loading card categories:', error);
      }
    };

    loadCardCategories();
  }, []);

  // 切换卡包启用状态
  const toggleCategory = async (categoryId: string) => {
    const newActiveCategories = new Set(activeCategories);
    
    if (activeCategories.has(categoryId)) {
      // 检查是否是必需卡包
      const category = cardCategories.find(c => c.id === categoryId);
      if (category?.cardSets.some(set => set.required)) {
        return; // 不允许禁用必需卡包
      }
      newActiveCategories.delete(categoryId);
      cardService.disableCardSet(categoryId);
    } else {
      newActiveCategories.add(categoryId);
      cardService.enableCardSet(categoryId);
    }
    
    setActiveCategories(newActiveCategories);
    await cardService.loadCardData(); // 重新加载卡池
  };

  const mainMenuButtons = {
    creator: `
      <p>这是一个发生在后启示录世界的故事。在方格神的熵减打击之后，地球几乎毁灭。你作为一名幸存者从冬眠中被唤醒，发现自己置身于一个充满结晶和方块的废土世界。</p>
      <p>在这个世界中，你需要探索被熵减影响的废墟，与（众多的）人们互动，并最终决定自己的命运。</p>
      <p>你可以不站任何人的立场，你是真正的人类。</p>
      <p>本作是一个文字冒险游戏，你的每个选择都可能影响故事的走向和最终结局。</p>
      <p><strong>作者：</strong>[tobenot 苏敬峰]</p>
    `,
    changelog: `
      <p>只有比较大的更新在这里展示</p>
      <p><strong>2024年12月9日</strong> 开坑，从幻灭篇那里拷了抽卡和标签系统过来重构了一下</p>
      <p><strong>2024年12月10日</strong> 最小Demo，实现基础游戏系统（地点，存档，物品，人物），美术概念生成，初版美术资源</p>
    `,
    attribution: `
      <p><strong>素材致谢：</strong></p>
      <p>- 游戏中使用的图片素材来源</p>
      <p>- 所有立绘、场景图使用 Stable Diffusion 生成</p>
      <p>- 网页图标：<a href="https://www.flaticon.com/free-icons/ice-cubes" title="ice cubes icons">Ice cubes icons created by Freepik - Flaticon</a></p>
    `,
  };

  const handleShowModal = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  // 修改卡包列表渲染部分
  const renderCardList = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="w-full max-w-2xl backdrop-blur-sm bg-navy-blue/80 p-8 rounded-lg z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ice-blue">可用卡包</h2>
          <button
            onClick={() => setShowCardList(false)}
            className="px-4 py-2 bg-sky-blue hover:bg-opacity-80 rounded transition-colors"
          >
            返回主菜单
          </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {cardCategories.map((category) => {
            const isRequired = category.cardSets.some(set => set.required);
            return (
              <div 
                key={category.id}
                className={`
                  bg-charcoal/90 p-4 rounded-lg transition-all
                  ${isRequired 
                    ? 'cursor-default' 
                    : 'hover:bg-opacity-70 cursor-pointer hover:transform hover:scale-[1.02]'}
                `}
                onClick={() => !isRequired && toggleCategory(category.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-ice-blue">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    {isRequired && (
                      <span className="text-xs text-coral px-2 py-1 bg-coral/20 rounded">必需</span>
                    )}
                    <div className={`
                      w-4 h-4 rounded-full transition-colors
                      ${activeCategories.has(category.id) ? 'bg-moss-green' : 'bg-coral'}
                      ${isRequired ? 'opacity-50' : 'opacity-100'}
                    `}/>
                  </div>
                </div>
                <p className="text-sm text-slate-blue">{category.description}</p>
                <div className="mt-2 text-xs text-sky-blue">
                  {category.cardSets.map(set => set.name).join(' • ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="aspect-container">
      {/* 背景 */}
      <div className="main-menu-bg">
        <img 
          src={`${import.meta.env.BASE_URL}illustrations/loc_ice_faction.webp`}
          alt="Background"
        />
      </div>

      {/* 左侧立绘 */}
      <div className="main-menu-illustration left">
        <img 
          src={leftIllustration}
          alt="Left Character"
          className="h-full w-full object-contain"
        />
      </div>

      {/* 右侧立绘 */}
      <div className="main-menu-illustration right">
        <img 
          src={rightIllustration}
          alt="Right Character"
          className="h-full w-full object-contain"
        />
      </div>

      {/* 主菜单容器 */}
      <div className="main-menu-container">
        {!showCardList ? (
          <div className="main-menu-content">
            {/* 标题 */}
            <div className="main-menu-titles">
              <h1 className="text-7xl font-bold mb-8">不止于纸上的故事</h1>
              <h2 className="text-4xl mb-6">Beyond Books</h2>
              <h3 className="text-5xl mb-6">冰河篇</h3>
              <h4 className="text-3xl">Ice Age</h4>
            </div>

            {/* 按钮 */}
            <div className="main-menu-buttons">
              <button
                onClick={() => handleShowModal(mainMenuButtons.creator)}
                className="main-menu-button"
              >
                制作者的话
              </button>
              <button
                onClick={onStartGame}
                className="main-menu-button"
              >
                开始游戏
              </button>
              <button
                onClick={() => setShowSaveMenu(true)}
                className="main-menu-button"
              >
                读取存档
              </button>
              <button
                onClick={() => handleShowModal(mainMenuButtons.changelog)}
                className="main-menu-button"
              >
                更新日志
              </button>
              <button
                onClick={() => handleShowModal(mainMenuButtons.attribution)}
                className="main-menu-button"
              >
                素材致谢
              </button>
              <button
                onClick={() => setShowCardList(true)}
                className="main-menu-button"
              >
                卡包列表
              </button>
            </div>

            {/* 页脚 */}
            <footer className="main-menu-footer">
              <a href="https://bb.tobenot.top/vue/" className="text-sky-blue hover:text-opacity-80 mr-4">
                同作者的异能战斗游戏
              </a>
              <a href="https://qm.qq.com/q/pvKkFCvCFO" className="text-sky-blue hover:text-opacity-80 mr-4">
                加群水群（母港）
              </a>
              <a href="https://space.bilibili.com/23122362" className="text-sky-blue hover:text-opacity-80">
                关注B站
              </a>
            </footer>
          </div>
        ) : renderCardList()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-navy-blue p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showSaveMenu && (
        <div className="z-50">
          <SaveLoadMenu
            onClose={() => setShowSaveMenu(false)}
            isLoading={false}
            onLoad={onLoadGame}
            saveEnabled={false}
          />
        </div>
      )}
    </div>
  );
}; 