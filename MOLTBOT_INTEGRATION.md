# Moltbot Gateway Integration

本项目已集成Moltbot Gateway，支持通过WebSocket连接到Moltbot进行AI对话。

## 功能特性

- ✅ 实时WebSocket连接
- ✅ 流式响应显示
- ✅ 历史消息记录
- ✅ 自动重连机制
- ✅ 消息中断功能
- ✅ 可配置的Gateway地址和Token

## 配置

### 1. 环境变量

在 `.env.local` 文件中添加以下配置：

```bash
# Moltbot Gateway URL
NEXT_PUBLIC_MOLTBOT_GATEWAY_URL=ws://your-moltbot-server:18789

# Moltbot Gateway Token (可选，如果启用了认证)
NEXT_PUBLIC_MOLTBOT_TOKEN=your_token_here
```

### 2. Gateway配置

确保你的Moltbot Gateway已正确配置：

```json5
{
  gateway: {
    port: 18789,
    bind: "0.0.0.0",
    auth: {
      mode: "token",
      token: "your-secret-token"
    }
  }
}
```

## 使用方法

### 在聊天界面切换

1. 访问 `/chat` 页面
2. 点击 "WebSocket (Moltbot Gateway)" 选项卡
3. 确认连接状态显示 "🟢 已连接"
4. 开始对话！

### 配置自定义Gateway

1. 在聊天界面点击设置图标 (⚙️)
2. 输入你的Gateway URL（支持 `ws://` 和 `wss://` 协议）
3. 输入Token（如果需要）
4. 点击"应用设置"

## 技术细节

### 客户端架构

- **文件位置**: `lib/moltbot/moltbot-client.ts`
- **WebSocket协议**: Moltbot Gateway Protocol v3
- **自动重连**: 最多5次，延迟递增

### 消息流程

```
用户输入 → WebSocket.send() → Moltbot Gateway → AI模型 
    ↓
WebSocket事件 ← ← ← ← ← 流式响应 ← ← ← ← ← 
    ↓
UI实时更新
```

### API端点

- `connect`: 握手认证
- `chat.send`: 发送消息
- `chat.history`: 获取历史
- `chat.abort`: 中断生成

## 生产环境部署

### Zeabur部署

1. 在Zeabur项目中添加环境变量：
   ```
   NEXT_PUBLIC_MOLTBOT_GATEWAY_URL=wss://your-gateway-domain.com
   NEXT_PUBLIC_MOLTBOT_TOKEN=your_token
   ```

2. 确保Moltbot Gateway：
   - 使用HTTPS/WSS协议
   - 已配置正确的CORS策略
   - Token已正确设置

### 安全建议

- ✅ 生产环境使用 `wss://` (WebSocket Secure)
- ✅ 启用Token认证
- ✅ 使用Tailscale或VPN保护Gateway
- ❌ 不要将Token提交到Git仓库

## 故障排查

### 连接失败

1. 检查Gateway URL是否正确
2. 确认Gateway服务正在运行
3. 检查网络连接和防火墙设置
4. 验证Token是否正确（如果启用）

### 无法发送消息

1. 确认连接状态为"已连接"
2. 检查浏览器控制台错误信息
3. 验证Gateway配置

### 响应中断

1. 点击停止按钮可中断正在生成的回复
2. 检查Gateway日志了解中断原因

## 开发

### 本地开发

```bash
# 启动Moltbot Gateway
moltbot gateway

# 启动PWA开发服务器
npm run dev
```

### 测试WebSocket连接

使用浏览器控制台：

```javascript
const ws = new WebSocket('ws://localhost:18789');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

## 许可证

MIT License
