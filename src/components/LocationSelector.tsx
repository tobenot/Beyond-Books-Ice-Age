import React from 'react';
import { characterService } from '../services/characterService';
import { illustrationService } from '../services/illustrationService';
import { cardService } from '../services/cardService';
import { effectService } from '../services/effectService';

interface Location {
  name: string;
  description: string;
  connections: string[];
  tags: {
    [key: string]: number;
  };
}

interface LocationSelectorProps {
  locations: Record<string, Location>;
  onSkipCard: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  locations, 
  onSkipCard 
}) => {
  // 检查是否解锁
  const isPanelUnlocked = characterService.getPlayerTagValue('系统.地点面板') === '已解锁';
  
  if (!isPanelUnlocked) {
    return null;
  }
  
  const currentLocation = characterService.getPlayerTagValue('位置.当前地点');
  const targetLocation = characterService.getPlayerTagValue('位置.目标地点');
  const [locationIllustrations, setLocationIllustrations] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadIllustrations = async () => {
      const illustrations: Record<string, string> = {};
      for (const locationId of Object.keys(locations)) {
        illustrations[locationId] = await illustrationService.getIllustration(`loc_${locationId}`);
      }
      setLocationIllustrations(illustrations);
    };
    loadIllustrations();
  }, [locations]);

  const handleLocationSelect = (locationName: string) => {
    if (locationName !== currentLocation) {
      characterService.updatePlayerTag('位置.目标地点', locationName);
      
      // 检查当前卡是否是观察卡
      const currentCard = cardService.getCurrentCard();
      if (currentCard?.id.startsWith('observe_')) {
        // 如果是观察卡,直接跳过
        onSkipCard();
      }
    }
  };

  return (
    <div className="location-selector bg-charcoal p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-2">地点</h3>
      <div className="space-y-2">
        {Object.entries(locations).map(([key, location]) => {
          const isCurrentLocation = currentLocation === key;
          const isTargetLocation = targetLocation === key;
          const isAccessible = (locations[currentLocation as string]?.connections || []).includes(key);
          
          return (
            <div
              key={key}
              className={`w-full rounded overflow-hidden ${
                isCurrentLocation 
                  ? 'ring-2 ring-moss-green'
                  : isTargetLocation
                    ? 'ring-2 ring-rose-quartz'
                    : ''
              }`}
            >
              {/* 地点立绘 */}
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={locationIllustrations[key]}
                  alt={location.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* 状态标签 */}
                {isCurrentLocation && (
                  <div className="absolute top-2 right-2 bg-moss-green px-2 py-1 rounded text-xs">
                    当前位置
                  </div>
                )}
                {isTargetLocation && (
                  <div className="absolute top-2 right-2 bg-rose-quartz px-2 py-1 rounded text-xs">
                    目标位置
                  </div>
                )}
              </div>
              
              {/* 地点信息 */}
              <div className="p-2">
                <div className="font-bold">{location.name}</div>
                <div className="text-sm opacity-80">{location.description}</div>
                
                {/* 地点状态 */}
                <div className="mt-1 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>熵减程度:</span>
                    <span>{location.tags.熵减程度 || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>复苏程度:</span>
                    <span>{location.tags.复苏程度 || 0}%</span>
                  </div>
                </div>
                
                {/* 前往按钮 */}
                <button
                  onClick={() => handleLocationSelect(key)}
                  disabled={isCurrentLocation || (!isAccessible && !isCurrentLocation)}
                  className={`w-full mt-2 p-1 rounded text-sm ${
                    isCurrentLocation 
                      ? 'bg-moss-green cursor-default'
                      : isAccessible
                        ? 'bg-sky-blue hover:bg-opacity-80'
                        : 'bg-charcoal opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isCurrentLocation ? '当前位置' : isAccessible ? '前往' : '无法到达'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 