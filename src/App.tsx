import { GameContainer } from './components/GameContainer';
import './App.css';

function App() {
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
    </>
  );
}

export default App;