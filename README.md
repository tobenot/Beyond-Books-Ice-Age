# 不止于纸上的故事 (Beyond Books)

一个末世求生文字冒险游戏。

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

### github pages
```bash
npm run build
# 或
yarn build
```

### itch.io
```bash
npm run build:itch
```
取dist目录下的文件，上传到itch.io

## 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

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
