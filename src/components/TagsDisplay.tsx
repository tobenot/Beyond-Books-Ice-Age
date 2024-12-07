import React from 'react';
import { Tag } from '../types';

interface TagsDisplayProps {
  tags: Record<string, Record<string, Tag>>;
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags }) => {
  return (
    <div className="tags-display bg-charcoal p-4 rounded-lg">
      {Object.entries(tags).map(([category, categoryTags]) => (
        <div key={category} className="mb-4">
          <h3 className="text-lg font-bold mb-2">{category}</h3>
          {Object.entries(categoryTags).map(([name, tag]) => (
            <div 
              key={name}
              className="flex justify-between"
              style={{ color: tag.color }}
            >
              <span>{name}:</span>
              <span>{tag.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}; 