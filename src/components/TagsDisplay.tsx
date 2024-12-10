import React, { useState, useMemo } from 'react';
import { TagsConfig, PlayerTags } from '../types';
import { tagService } from '../services/tagService';
import { CharacterTags } from '../types';

interface TagsDisplayProps {
  playerTags: PlayerTags | undefined;
}

interface TagNode {
  name: string;
  value?: number | string;
  color?: string;
  description?: string;
  children: Record<string, TagNode>;
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ playerTags }) => {
  if (!playerTags) return null;
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['状态']));
  const tagsConfig = tagService.getTagsConfig();

  // 构建标签树
  const buildTagTree = (tags: any, config: any, path: string = ''): TagNode => {
    const node: TagNode = { children: {} };
    
    for (const [key, value] of Object.entries(tags)) {
      const currentPath = path ? `${path}.${key}` : key;
      const configItem = config[key];
      
      if (typeof value === 'object' && value !== null) {
        node.children[key] = buildTagTree(value, configItem || {}, currentPath);
        node.children[key].name = key;
      } else {
        node.children[key] = {
          name: key,
          value: value as number | string,
          color: configItem?.color,
          description: configItem?.description,
          children: {}
        };
      }
    }
    
    return node;
  };

  const tagTree = useMemo(() => 
    buildTagTree(playerTags, tagsConfig),
    [playerTags, tagsConfig]
  );

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTagNode = (node: TagNode, path: string = '', level: number = 0) => {
    const isExpanded = expandedNodes.has(path);
    const hasChildren = Object.keys(node.children).length > 0;
    const indentation = level * 1.5; // 缩进量

    return (
      <div key={path} style={{ marginLeft: `${indentation}vh` }}>
        <div 
          className="flex items-center py-[0.5vh] cursor-pointer hover:bg-opacity-80"
          onClick={() => hasChildren && toggleNode(path)}
          style={{ color: node.color || 'inherit' }}
        >
          {hasChildren && (
            <span className="mr-[0.5vh] w-[1.2vh] inline-block">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && (
            <span className="mr-[0.5vh] w-[1.2vh] h-[1.2vh] inline-block rounded-full"
                  style={{ backgroundColor: node.color }} />
          )}
          <span className="flex-1">{node.name}</span>
          {node.value !== undefined && (
            <span className="ml-[1vh]">{node.value}</span>
          )}
        </div>
        
        {node.description && (
          <div className="text-xs opacity-60 ml-[2vh]">
            ({node.description})
          </div>
        )}
        
        {isExpanded && hasChildren && (
          <div className="mt-[0.5vh]">
            {Object.entries(node.children).map(([key, childNode]) => 
              renderTagNode(
                childNode,
                path ? `${path}.${key}` : key,
                level + 1
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // 过滤掉态度标签
  const filterAttitudeTags = (tags: PlayerTags): PlayerTags => {
    const filteredTags = { ...tags };
    const anyTags = filteredTags as any;
    if (anyTags.态度) {
      delete anyTags.态度;
    }
    return filteredTags;
  };

  const filteredTagTree = useMemo(() => 
    buildTagTree(filterAttitudeTags(playerTags), tagsConfig),
    [playerTags, tagsConfig]
  );

  return (
    <div className="tags-display bg-navy-blue p-[2vh] rounded-lg max-h-[80vh] overflow-y-auto">
      {Object.entries(filteredTagTree.children).map(([key, node]) => 
        renderTagNode(node, key)
      )}
    </div>
  );
}; 