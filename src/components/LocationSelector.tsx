import React from 'react';
import { tagService } from '../services/tagService';

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
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ locations }) => {
  const currentLocation = tagService.getTagValue('位置.当前地点');
  const targetLocation = tagService.getTagValue('位置.目标地点');

  const handleLocationSelect = (locationName: string) => {
    if (locationName !== currentLocation) {
      tagService.updateTag('位置.目标地点', locationName);
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
            <button
              key={key}
              onClick={() => handleLocationSelect(key)}
              disabled={isCurrentLocation || (!isAccessible && !isCurrentLocation)}
              className={`w-full p-2 rounded text-left ${
                isCurrentLocation 
                  ? 'bg-moss-green'
                  : isTargetLocation
                    ? 'bg-rose-quartz'
                    : isAccessible
                      ? 'bg-charcoal hover:bg-opacity-80'
                      : 'bg-charcoal opacity-50'
              }`}
            >
              <div className="font-bold">{location.name}</div>
              <div className="text-sm">{location.description}</div>
              {isCurrentLocation && <div className="text-xs mt-1">(当前位置)</div>}
              {isTargetLocation && <div className="text-xs mt-1">(目标位置)</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}; 