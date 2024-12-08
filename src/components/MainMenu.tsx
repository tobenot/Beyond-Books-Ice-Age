import React, { useState } from 'react';
import { SaveLoadMenu } from './SaveLoadMenu';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLoadGame }) => {
  const [showModal, setShowModal] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [showCardList, setShowCardList] = React.useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  const mainMenuButtons = {
    creator: `
      <p>一直想详细解释心灵世界相关的内容和概念，让大家了解一下心界的伟岸一角。<strong>《不止于纸上的故事：幻灭篇》</strong>就是一次尝试。"幻灭"意味着希望之火虚妄，即便如此，圣人，也即战士们，也会一直向前，一直战斗。</p>
      <p>本作是一个抽卡做选择的游戏，需要构筑各种方法论来尽可能在最终的高考取得更好的成绩。也许像Rougelike。</p>
      <p>我会尽力把游戏性做的好玩。同时本作偏向于严肃游戏类型，也力求对于高三生有用。</p>
      <p><strong>鸣谢与我交流本作的玩家们：</strong>诗学者 半夏 shangui</p>
      <p><strong>致谢与我交流心界的朋友们：</strong>Cecilia 共鸣者 诗学者 段</p>
      <p><strong>敬谢大自然：</strong>心界三角海 无垠草地 银色星空</p>
      <p><strong>作者：</strong>苏敬峰/tobenot</p>
    `,
    changelog: `
      <p>只有比较大的更新在这里展示</p>
      <p><strong>2024年7月30日</strong> 做了基础卡包的平常日程部分。</p>
      <p><strong>2024年7月28日</strong> 做了主菜单，基本做好了基础机制，做了基础卡包里面的上课部分。你可以靠着一路崩溃考过去。</p>
      <p><strong>2024年7月25日</strong> 抽卡和数值框架搭好</p>
      <p><strong>2024年7月23日</strong> 开坑！</p>
    `,
    attribution: `
      <p><strong>素材致谢：</strong></p>
      <p>- <a href="https://www.flaticon.com/free-icons/ice-cubes" title="ice cubes icons">Ice cubes icons created by Freepik - Flaticon</a></p>
    `,
  };

  const cardPacks = [
    { name: "基础卡包（完善中）", description: "所有人的高三都是这样的……<br><br>含开局介绍卡，日常的所有课程，基本的可决策的时机，在几个特定的时间点会有大考验，最终以高考结束游戏。" },
    { name: "方法论中毒卡包（制作中）", description: "有很多人会热衷于寻找方法论，就好像玩文明5的时候先点科技再出兵。<br><br>解锁学乎APP，里面有一大堆各种各样的方法论，可以在实践中慢慢养成。" },
    { name: "自学卡包（制作中）", description: "如果你问我为什么，我只会说，我需要更多的时间……<br><br>初始解锁自学方法论，如果有'方法论中毒'卡包，可以解锁学乎APP中自学相关的方法论。" },
    { name: "心界开拓卡包（制作中）", description: "生而为神，自诩圣人。<br><br>需要'方法论中毒'卡包，有'记忆宫殿'方法论之后，可以在学乎APP上刷到'漫游想象世界'，以开启心灵世界事件链。<br><br>包含心界开拓初期到心棱域军队时期之前的全部历史事件。" },
    { name: "飞雁一中的同学卡包（制作中）", description: "小心情伤。<br><br>包含同桌克里琴思、前桌艾琳，前斜桌雷思丽三位同学的日常和感情线。<br><br><i>至于为什么他们的名字是英文译名，请期待《不止于纸上的故事：童年篇》。</i>" },
  ];

  const handleShowModal = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-blue text-white">
      {!showCardList ? (
        <>
          <h1 className="text-4xl font-bold mb-4">不止于纸上的故事</h1>
          <h2 className="text-2xl mb-4">Beyond Books</h2>
          <h3 className="text-3xl mb-4">冰河篇</h3>
          <h4 className="text-xl mb-8">Ice Age</h4>

          正在做正在做，你现在看到的其实是 
          <a href="https://tobenot.top/Beyond-Books/" className="text-sky-blue hover:text-opacity-80 mr-4">
          幻灭篇
          </a>

          <div className="space-y-4">
            <button
              onClick={() => handleShowModal(mainMenuButtons.creator)}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              制作者的话
            </button>
            <button
              onClick={onStartGame}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              开始游戏
            </button>
            <button
              onClick={() => setShowSaveMenu(true)}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              读取存档
            </button>
            <button
              onClick={() => handleShowModal(mainMenuButtons.changelog)}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              更新日志 24.07.30
            </button>
            <button
              onClick={() => handleShowModal(mainMenuButtons.attribution)}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              素材致谢
            </button>
            <button
              onClick={() => setShowCardList(true)}
              className="w-48 p-3 bg-sky-blue hover:bg-opacity-80 rounded"
            >
              卡包列表
            </button>
          </div>

          <footer className="mt-8 text-sm">
            <a href="https://tobenot.top/Beyond-Books/" className="text-sky-blue hover:text-opacity-80 mr-4">
              同作者的异能战斗游戏
            </a>
            <a href="https://qm.qq.com/q/pvKkFCvCFO" className="text-sky-blue hover:text-opacity-80 mr-4">
              加群水群
            </a>
            <a href="https://space.bilibili.com/23122362" className="text-sky-blue hover:text-opacity-80">
              关注B站
            </a>
          </footer>
        </>
      ) : (
        <div className="w-full max-w-2xl p-4">
          <button
            onClick={() => setShowCardList(false)}
            className="mb-4 p-2 bg-sky-blue hover:bg-opacity-80 rounded"
          >
            返回主菜单
          </button>
          <div className="space-y-4">
            {cardPacks.map((pack, index) => (
              <button
                key={index}
                onClick={() => handleShowModal(pack.description)}
                className="w-full p-3 bg-sky-blue hover:bg-opacity-80 rounded text-left"
              >
                {pack.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
        <SaveLoadMenu
          onClose={() => setShowSaveMenu(false)}
          isLoading={false}
          onLoad={onLoadGame}
          saveEnabled={false}
        />
      )}
    </div>
  );
}; 