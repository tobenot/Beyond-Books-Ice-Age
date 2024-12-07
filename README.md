我来帮你编写一个详细的 README.md 文件，包含项目启动说明：

```markdown:README.md
# 不止于纸上的故事 (Beyond Books)

一个关于高三逆袭的文字冒险游戏。

## 开发环境要求

- Node.js 18+
- npm 或 yarn

## 安装依赖

```bash
npm install
# 或
yarn
```

## 开发模式启动

```bash
npm run dev
# 或
yarn dev
```

然后在浏览器中打开 http://localhost:5173

## 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

## 使用 PowerShell 脚本启动（可选）

如果你想使用 PowerShell 脚本启动一个简单的 HTTP 服务器来运行构建后的游戏：

1. 首先构建项目：
```bash
npm run build
```

2. 运行 PowerShell 脚本：
```powershell
./start_game.ps1
```

这将在 http://localhost:8000 启动游戏。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS

## 目录结构

- `/src` - 源代码目录
  - `/components` - React 组件
  - `/config` - 配置文件
- `/public` - 静态资源
  - `/config` - 游戏配置文件（卡牌数据等）
- `/card-editor` - 卡牌编辑器（Python）

## 许可证

MIT License
```

这个 README 文件包含了项目的基本信息、安装说明、启动方法以及项目结构说明。我参考了以下文件来编写这个内容：


````1:28:README.md
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

````



```6:11:package.json
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    },
```



```1:69:start_game.ps1
# 确认执行策略允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# 设置端口
$Port = 8000

function Start-HttpServer {
    param ($Port, $currentDir)
    Write-Host "Starting HTTP server on port $Port"
    
    # 启动Python的HTTP服务器作为后台任务
    $job = Start-Job -ScriptBlock {
        param ($Port, $currentDir)
        
        try {
            Set-Location $currentDir
            python -m http.server $Port
        } catch {
            $_ | Write-Host
        }
    } -ArgumentList $Port, $currentDir
    
    Start-Sleep -Seconds 1 # 等待服务器启动

    # 打开默认浏览器并跳转到本地服务器网址
    Start-Process "http://localhost:$Port"

    return $job
}

# 切换到当前目录
try {
    $currentDir = Get-Location
    Write-Host "Current Directory: $currentDir"
} catch {
    Write-Host "Failed to get current directory"
    exit
}

# 启动初始的HTTP服务器
$job = Start-HttpServer -Port $Port -currentDir $currentDir

# 使用用户输入来停止或重启服务器
Write-Host "Press 'q' to stop the server or 'r' to restart the server..."
while ($true) {
    $input = Read-Host
    if ($input -eq 'q') {
        Write-Host "Stopping HTTP server..."
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
        Write-Host "HTTP server stopped."
        break
    } elseif ($input -eq 'r') {
        Write-Host "Executing encrypt_files.ps1 script..."
        try {
            # 执行加密文件的脚本
            .\dev-tool\encrypt_files.ps1
            Write-Host "Script executed successfully."
        } catch {
            Write-Host "Failed to execute script."
            continue
        }
        
        Write-Host "Restarting HTTP server..."
        Stop-Job -Id $job.Id
        Remove-Job -Id $job.Id
        $job = Start-HttpServer -Port $Port -currentDir $currentDir
    }
}
```

