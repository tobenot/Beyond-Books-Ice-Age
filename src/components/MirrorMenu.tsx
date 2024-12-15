import React from 'react';
import { characterService } from '../services/characterService';
import { illustrationService } from '../services/illustrationService';

// 定义可用的镜子外观
const MIRROR_VARIANTS = [
    { id: 'default', name: '原初', description: '这真的就是我原本的样子吗？还是已经改变过了？' },
    { id: 'female_demolitionist', name: '地雷系', description: '感觉就是原初的反转。' },
    { id: 'male_demolitionist', name: '地雷系', description: '更加稳定向这个方向的话，诶，我更不清楚哪个是原初了。我是谁？' },
    
    // 战士类 - 女性
    { id: 'armored_female_1', name: '覆甲战士·壹', description: '它能保护我免受伤害吗？' },
    { id: 'armored_female_2', name: '覆甲战士·贰', description: '晶化装甲...这是科技的产物还是某种神秘力量？' },
    { id: 'armored_female_3', name: '覆甲战士·叁', description: '有点不习惯这种形态呢。' },

    // 战士类 - 男性
    { id: 'male_rescue', name: '救援队员', description: '救援他人就是拯救自己吗？这身装备承载着怎样的使命？' },
    { id: 'male_thug', name: '帮派打手', description: '这种力量是用来保护还是破坏？我该如何选择？' },
    
    // 学者/专家类 - 女性
    { id: 'female_mystic', name: '奇术师', description: '神秘学的奥秘有尽头吗？我是在追寻真理还是迷失自我？' },
    { id: 'female_engineer', name: '工程师', description: '机械与人性能够真正融合吗？我在创造还是在改变？' },
    { id: 'female_explorer', name: '遗迹探索者', description: '探索未知遗迹，我是在寻找过去还是未来？' },
    { id: 'female_ecologist', name: '生态学者', description: '研究环境的意义是什么？我能为这个世界带来改变吗？' },
    
    // 学者/专家类 - 男性
    { id: 'male_scientist', name: '科学家', description: '科学的尽头是什么？我的研究会带来希望还是灾难？' },
    { id: 'male_mystic', name: '术士', description: '掌握这些力量值得吗？代价会是什么？' },
    { id: 'male_explorer', name: '探索者', description: '每一次探索都是未知的，我准备好面对一切了吗？' },
    { id: 'male_ecologist', name: '生态学家', description: '我能真正理解这个世界的平衡吗？还是只是在自欺欺人？' },
    
    // 特殊形态
    { id: 'male_glacier_youth', name: '冰河青年', description: '加入冰河派是命运还是选择？我能找到属于自己的道路吗？' },
    { id: 'male_demon', name: '恶魔化身', description: '这种力量值得被追求吗？我还能保持本心吗？' },
    { id: 'male_cyber_ascended', name: '机械飞升', description: '彻底的机械化是进化还是毁灭？我还是我吗？' },
    { id: 'male_cyborg', name: '机械义体', description: '人机结合的代价是什么？我还能找回纯粹的自我吗？' },
    { id: 'ice_queen', name: '冰河女王', description: '这种力量会改变我吗？' },
    { id: 'male_gang_leader', name: '帮派首领', description: '还有哪些人要挑战我？' },
        
    
    // 年长者
    { id: 'female_elder_hero', name: '迟暮英雌', description: '这些沧桑是财富还是负担？时光带走了什么又给予了什么？' },
    { id: 'male_elder_hero', name: '迟暮英雄', description: '年华逝去，但英雄气概犹在，这就是生命的意义吗？' }
];

interface MirrorMenuProps {
  onClose: () => void;
}

export const MirrorMenu: React.FC<MirrorMenuProps> = ({ onClose }) => {
  const [selectedVariant, setSelectedVariant] = React.useState<string>('');
  const [previewVariant, setPreviewVariant] = React.useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [currentIllustration, setCurrentIllustration] = React.useState<string>('');

  // 获取当前选择的变体
  React.useEffect(() => {
    const current = characterService.getPlayerTagValue('镜子.变化.外观') as string || 'default';
    setSelectedVariant(current);
    setPreviewVariant(current);
  }, []);

  // 加载立绘预览
  React.useEffect(() => {
    const loadIllustration = async () => {
      if (!previewVariant) return;
      const illPath = await illustrationService.getIllustration(`player_${previewVariant}`);
      setCurrentIllustration(illPath);
    };
    loadIllustration();
  }, [previewVariant]);

  const handleVariantPreview = (variantId: string) => {
    setPreviewVariant(variantId);
  };

  const handleConfirm = () => {
    setSelectedVariant(previewVariant);
    characterService.updatePlayerTag('镜子.变化.外观', previewVariant);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-navy-blue p-6 rounded-lg max-w-4xl w-full max-h-[80vh] flex gap-6">
        {/* 左侧立绘预览 */}
        <div className="w-1/3 flex flex-col">
          <div className="relative w-full h-[500px] bg-charcoal rounded-lg overflow-hidden">
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-ice-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {currentIllustration && (
              <img
                src={currentIllustration}
                alt="Mirror preview"
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setIsImageLoaded(true)}
              />
            )}
          </div>
          {/* 确认按钮 */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleConfirm}
              className={`flex-1 p-2 rounded ${
                previewVariant !== selectedVariant
                  ? 'bg-moss-green hover:bg-opacity-80'
                  : 'bg-charcoal cursor-not-allowed'
              }`}
              disabled={previewVariant === selectedVariant}
            >
              确认变化
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-2 bg-rose-quartz hover:bg-opacity-80 rounded"
            >
              取消
            </button>
          </div>
        </div>

        {/* 右侧选项列表 */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h2 className="text-2xl font-bold text-ice-blue sticky top-0 bg-navy-blue py-2 mb-4">
            镜子形态
          </h2>

          <div className="space-y-4">
            {MIRROR_VARIANTS.map(variant => (
              <div
                key={variant.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  previewVariant === variant.id
                    ? 'bg-sky-blue'
                    : 'bg-charcoal hover:bg-navy-blue'
                }`}
                onClick={() => handleVariantPreview(variant.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{variant.name}</h3>
                  {variant.id === selectedVariant && (
                    <span className="text-sm text-slate-blue">当前形态</span>
                  )}
                </div>
                <p className="text-sm text-slate-blue mt-1">{variant.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 