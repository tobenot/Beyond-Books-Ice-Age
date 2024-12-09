import { GameContainer } from './components/GameContainer';
import './App.css';

function App() {
  return (
    <>
      {/* 竖屏提示遮罩 */}
      <div className="portrait-mask">
        请旋转设备至横屏模式以获得最佳体验
      </div>
      
      {/* 主游戏容器 */}
      <div className="landscape-container bg-navy-blue text-white">
        <GameContainer />
      </div>
    </>
  );
}

export default App;