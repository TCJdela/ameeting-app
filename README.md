# 自动会议纪要工具

一个智能的会议记录和转写工具，能够自动将会议录音转换为文字，并生成结构化的会议纪要。

## 功能特点

- 🎤 **智能录音**: 高质量录音，支持实时转写
- 📝 **AI转写**: 准确的语音转文字，支持中文
- 🤖 **智能生成**: 自动提取关键信息、行动项和决策点
- 📄 **多格式导出**: 支持PDF、Word、Markdown格式
- 📚 **历史管理**: 完整的会议记录管理和搜索功能

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **后端**: Express.js + Node.js + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: OpenAI API (Whisper + GPT)
- **部署**: Vercel (前端) + Railway (后端)

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件并添加以下配置：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. 启动开发服务器

```bash
# 同时启动前端和后端
pnpm run dev

# 仅启动前端
pnpm run dev:frontend

# 仅启动后端
pnpm run dev:backend
```

### 4. 构建生产版本

```bash
# 构建所有项目
pnpm run build

# 仅构建前端
pnpm run build:frontend

# 仅构建后端
pnpm run build:backend
```

## 项目结构

```
├── src/                    # 前端代码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具函数和配置
│   └── App.tsx            # 主应用组件
├── api/                    # 后端API代码
│   ├── routes/            # API路由
│   ├── app.ts             # Express应用配置
│   └── index.ts           # Vercel入口文件
├── supabase/              # Supabase配置和文档
└── vercel.json            # Vercel部署配置
```

## 核心功能

### 录音功能
- 实时录音和暂停/继续
- 音频文件上传支持
- 录音预览和播放

### 语音转文字
- 集成OpenAI Whisper API
- 实时转写进度显示
- 支持文本编辑和校正

### 智能纪要生成
- 自动提取关键信息
- 识别行动项和决策点
- 支持多种纪要模板

### 导出功能
- PDF格式导出
- Word文档导出
- Markdown格式导出

## API文档

详细的API文档请参考项目文档中的技术架构部分。

## 部署

### 前端部署 (Vercel)
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 后端部署 (Railway)
1. 连接GitHub仓库
2. 配置环境变量
3. 部署Express应用

### 数据库 (Supabase)
1. 创建Supabase项目
2. 运行数据库迁移脚本
3. 配置存储桶和权限

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License