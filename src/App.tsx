import { GameContainer } from './components/GameContainer';
import './App.css';
import { TargetPanel } from './components/combat/TargetPanel';
import { useEffect, useState } from 'react';

function App() {
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [targetPanelCallback, setTargetPanelCallback] = useState<((targetId: string) => void) | null>(null);

  useEffect(() => {
    const handleShowPanel = (event: CustomEvent) => {
      const { onSelect } = event.detail;
      setTargetPanelCallback(() => onSelect);
      setShowTargetPanel(true);
    };

    window.addEventListener('showTargetPanel', handleShowPanel as EventListener);
    return () => {
      window.removeEventListener('showTargetPanel', handleShowPanel as EventListener);
    };
  }, []);

  return (
    <>
      {/* 竖屏提示遮罩 */}
      <div className="portrait-mask">
        请旋转设备至横屏模式以获得最佳体验
      </div>
      
      {/* 固定比例容器 */}
      <div className="aspect-container">
        <div className="game-content">
          <GameContainer />
        </div>
      </div>
      {showTargetPanel && (
        <TargetPanel 
          onClose={() => setShowTargetPanel(false)}
          onSelect={targetPanelCallback}
        />
      )}
    </>
  );
}

export default App;