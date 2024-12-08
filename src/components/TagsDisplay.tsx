import React, { useState, useMemo } from 'react';
import { TagsConfig, PlayerTags } from '../types';
import { tagService } from '../services/tagService';
import { CharacterTags } from '../types';

interface TagsDisplayProps {
  playerTags: PlayerTags | undefined;
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ playerTags }) => {
  if (!playerTags) return null;
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['状态']));
  const tagsConfig = tagService.getTagsConfig();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const renderTagValue = (category: string, tagName: string) => {
    const value = playerTags[category as keyof CharacterTags]?.[tagName];
    const config = tagsConfig[category as keyof TagsConfig]?.[tagName];
    
    if (!config) return null;

    return (
      <div 
        key={tagName}
        className="ml-4 flex justify-between items-center py-1"
        style={{ color: config.color }}
      >
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: config.color }}/>
          <span>{tagName}</span>
          {config.description && (
            <span className="ml-2 text-xs opacity-60">
              ({config.description})
            </span>
          )}
        </span>
        <span>{value}</span>
      </div>
    );
  };

  const renderCategory = (category: string) => {
    const isExpanded = expandedCategories.has(category);
    const hasContent = playerTags[category as keyof CharacterTags] && 
      Object.keys(playerTags[category as keyof CharacterTags] || {}).length > 0;

    if (!hasContent) return null;

    return (
      <div key={category} className="mb-2">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between p-2 bg-charcoal hover:bg-opacity-80 rounded"
        >
          <span className="font-bold">{category}</span>
          <span>{isExpanded ? '▼' : '▶'}</span>
        </button>
        
        {isExpanded && (
          <div className="mt-1">
            {Object.keys(playerTags[category as keyof CharacterTags] || {}).map(tagName => 
              renderTagValue(category, tagName)
            )}
          </div>
        )}
      </div>
    );
  };

  const filterAttitudeTags = (tags: PlayerTags): PlayerTags => {
    const filteredTags = { ...tags };
    const anyTags = filteredTags as any;
    if (anyTags.态度) {
      delete anyTags.态度;
    }
    return filteredTags;
  };

  const tagsToDisplay = useMemo(() => 
    filterAttitudeTags(playerTags || {}),
    [playerTags]
  );

  return (
    <div className="tags-display bg-navy-blue p-[2vh] rounded-lg max-h-[80vh]">
      <div className="ml-[2vh] flex justify-between items-center py-[1vh]">
        {Object.keys(tagsToDisplay).map(category => renderCategory(category))}
      </div>
      <span className="text-[1.6vh]">{/* ... */}</span>
    </div>
  );
}; 