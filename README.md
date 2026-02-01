# Jarvis - 个人智能助手 PWA

一个渐进式Web应用(PWA)，作为您的个人智能助手，集成日程管理、任务追踪、语音交互和AI对话功能。

## ✨ 功能特点

### 🤖 智能AI对话
- **智能模型路由**：根据任务复杂度自动选择千问（快速）或GLM（强大）
- **流式响应**：实时显示AI回复
- **语音输入/输出**：支持语音转文字和文字转语音
- **对话历史**：本地持久化存储聊天记录

### 📅 日历和日程
- 月视图日历显示
- 创建、编辑、删除日程事件
- 按日期查看日程
- 时间显示和地点信息

### ✅ 任务管理
- 快速创建任务
- 优先级设置（高/中/低）
- 分类和截止日期
- 状态跟踪（待办/进行中/已完成）
- 任务筛选和排序

### 🎤 语音备忘录
- 录音功能
- 录音时长显示
- 回放和删除
- 本地存储

### 📝 笔记和知识库
- 快速记录笔记
- 标签系统
- 全文搜索
- 笔记预览和编辑

### 🔔 智能提醒
- 时间提醒
- 浏览器通知支持
- 提醒管理
- 即将推出：位置提醒

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Database**: IndexedDB (via Dexie.js)
- **PWA**: next-pwa
- **AI Models**:
  - Qwen (千问3) - Fast responses for simple tasks
  - GLM - Advanced reasoning for complex tasks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone and navigate to the project**:
```bash
cd /Users/neo/Documents/Project/Jarvis
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
QWEN_API_KEY=your_qwen_api_key
GLM_API_KEY=your_glm_api_key
```

### Getting API Keys

**Qwen (千问3)**:
1. Visit [DashScope Console](https://dashscope.console.aliyun.com/)
2. Sign up/login
3. Create an API key

**GLM**:
1. Visit [Zhipu AI Platform](https://open.bigmodel.cn/)
2. Sign up/login
3. Create an API key

### Running the App

**Development mode**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production build**:
```bash
npm run build
npm start
```

### Run Pre-Deployment Check

Before deploying, run the verification script:
```bash
./scripts/check-deployment.sh
```

## 🚀 Deployment

### Zeabur Deployment (Recommended)

Quick start guide available: [ZEABUR_QUICKSTART.md](./ZEABUR_QUICKSTART.md)

**Quick Steps**:
1. Run `./scripts/check-deployment.sh` to verify repository status
2. Go to [Zeabur Dashboard](https://dash.zeabur.com)
3. Import from Git → GitHub → `NeoKoo/Jarvis`
4. Select `main` branch
5. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js Version: `20.x`
6. Add environment variables (see `.env.local.example`)
7. Deploy! 🚀

**Note**: If you encounter "No Branches Found" error, see [ZEABUR_DEPLOYMENT.md](./ZEABUR_DEPLOYMENT.md) for troubleshooting.

**Deployment Files**:
- `Dockerfile` - Optimized container configuration
- `next.config.js` - Standalone output for Docker
- `.dockerignore` - Optimized build context
- `ZEABUR_DEPLOYMENT.md` - Full deployment guide
- `scripts/check-deployment.sh` - Pre-deployment verification

## Project Structure

```
jarvis/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   └── chat/           # Chat endpoint with streaming
│   ├── chat/               # Chat page
│   ├── calendar/           # Calendar page (to be implemented)
│   ├── tasks/              # Tasks page (to be implemented)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── chat/               # Chat interface
│   ├── calendar/           # Calendar components (to be implemented)
│   └── tasks/              # Task components (to be implemented)
├── lib/
│   ├── db/                 # IndexedDB setup (Dexie)
│   ├── llm/                # LLM clients & router
│   │   ├── qwen-client.ts
│   │   ├── glm-client.ts
│   │   └── router.ts
│   └── speech/             # Speech APIs
│       ├── recognition.ts   # STT
│       └── synthesis.ts     # TTS
├── stores/                 # Zustand state management
│   └── chat-store.ts
├── types/                  # TypeScript types
└── public/                 # Static assets
    └── manifest.json       # PWA manifest
```

## Usage

### AI Chat

1. Navigate to the **AI Chat** section
2. Type or use voice input (microphone button)
3. Jarvis automatically routes your request:
   - **Simple questions** → Qwen (fast)
   - **Complex tasks** → GLM (advanced)
4. Enable voice output with the speaker button

### Voice Commands

- Click the microphone button to start voice input
- Speak your message
- Click again to stop listening

### PWA Installation

**Desktop**:
- Chrome/Edge: Click install icon in address bar
- Safari: No native support (add to home screen manually)

**Mobile**:
- iOS Safari: Tap Share → Add to Home Screen
- Android Chrome: Tap menu → Install App

## 📊 开发状态

### ✅ 已完成功能
- [x] 项目初始化和设置
- [x] PWA配置和Service Worker
- [x] IndexedDB数据库架构
- [x] LLM路由系统（千问/GLM）
- [x] 聊天界面（支持流式响应）
- [x] 语音识别和合成
- [x] 仪表板和快捷操作
- [x] 状态管理（Zustand）
- [x] 任务管理系统
- [x] 日历视图
- [x] 笔记和知识库
- [x] 语音备忘录
- [x] 智能提醒系统

### 🚧 未来计划
- [ ] 日历周/日视图
- [ ] 语音转文字功能
- [ ] 地理位置提醒
- [ ] 数据同步功能
- [ ] 主题切换（深色/浅色）

## Browser Support

### Speech Recognition
- Chrome/Edge (full support)
- Safari (partial support)
- Firefox (no support)

### Speech Synthesis
- All modern browsers

### PWA Features
- Chrome/Edge (full support)
- Safari (iOS: limited, macOS: partial)
- Firefox (partial support)

## Troubleshooting

### Voice input not working
- Ensure you're using Chrome or Edge
- Check microphone permissions
- HTTPS required (except localhost)

### API errors
- Verify API keys in `.env.local`
- Check API quota limits
- Ensure internet connection

### PWA not installing
- Clear browser cache
- Check manifest.json is accessible
- Ensure service worker is registered

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## Acknowledgments

- Qwen API by Alibaba Cloud
- GLM API by Zhipu AI
- shadcn/ui for beautiful components
- Next.js team for the amazing framework
