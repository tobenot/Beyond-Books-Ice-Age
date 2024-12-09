import React, { useState, useEffect } from 'react';
import { SaveLoadMenu } from './SaveLoadMenu';
import { illustrationService } from '../services/illustrationService';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLoadGame }) => {
  const [showModal, setShowModal] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [showCardList, setShowCardList] = React.useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [leftIllustration, setLeftIllustration] = useState('');
  const [rightIllustration, setRightIllustration] = useState('');

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

  const cardPacks = [
    { 
      name: "基础剧情包（完善中）", 
      description: "包含主要剧情线和基础互动。<br><br>从冬眠中醒来后的初始剧情，与复苏队和冰河派的初次接触，以及在废土世界中生存的基本选项。" 
    },
    { 
      name: "复苏队剧情包（制作中）", 
      description: "复苏队的专属剧情。<br><br>协助复苏队重建文明，对抗熵减威胁，探索方格神的奥秘。" 
    },
    { 
      name: "冰河派剧情包（制作中）", 
      description: "冰河派的专属剧情。<br><br>追随霜隐探索永生之道，研究熵减力量，寻找晶格神的踪迹。" 
    }
  ];

  const handleShowModal = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

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
        ) : (
          <div className="w-full max-w-2xl backdrop-blur-sm bg-navy-blue/30 p-8 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">可用卡包</h2>
              <button
                onClick={() => setShowCardList(false)}
                className="px-4 py-2 bg-sky-blue hover:bg-opacity-80 rounded"
              >
                返回主菜单
              </button>
            </div>
            <div className="space-y-4">
              {cardPacks.map((pack, index) => (
                <div 
                  key={index}
                  className="bg-charcoal p-4 rounded-lg hover:bg-opacity-80 cursor-pointer"
                  onClick={() => handleShowModal(pack.description)}
                >
                  <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                  <div 
                    className="text-sm opacity-80"
                    dangerouslySetInnerHTML={{ __html: pack.description.split('<br><br>')[0] }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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