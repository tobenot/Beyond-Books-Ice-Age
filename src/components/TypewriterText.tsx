import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  enabled: boolean;
  onComplete?: () => void;
  className?: string;
  isHtml?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  enabled,
  onComplete,
  className = '',
  isHtml = false
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(!enabled);
  
  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const plainText = isHtml ? text.replace(/<[^>]*>/g, '') : text;
    setDisplayText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    const speed = 30; // 打字速度(ms)
    
    const timer = setInterval(() => {
      if (currentIndex >= plainText.length) {
        clearInterval(timer);
        setDisplayText(text); // 完成时显示原始文本(包含HTML)
        setIsComplete(true);
        onComplete?.();
        return;
      }
      
      if (isHtml) {
        // HTML模式下，累积显示原始文本直到当前索引
        setDisplayText(text.slice(0, currentIndex + 1));
      } else {
        // 普通文本模式下，直接添加新字符
        setDisplayText(prev => plainText.slice(0, currentIndex + 1));
      }
      currentIndex++;
    }, speed);

    return () => clearInterval(timer);
  }, [text, enabled]);

  const handleClick = () => {
    if (!isComplete) {
      setDisplayText(text);
      setIsComplete(true);
      onComplete?.();
    }
  };

  return (
    <div 
      className={`${className} ${!isComplete ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {isHtml ? (
        <div dangerouslySetInnerHTML={{ __html: displayText }} />
      ) : (
        displayText
      )}
    </div>
  );
}; 