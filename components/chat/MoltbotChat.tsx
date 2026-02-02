'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Send, Square, Volume2, VolumeX, RefreshCw, Settings } from 'lucide-react';
import { createMoltbotClient, MoltbotClient, ChatEvent, MoltbotMessage } from '@/lib/moltbot/moltbot-client';

interface MoltbotChatProps {
  gatewayUrl?: string;
  token?: string;
  sessionKey?: string;
  onBack?: () => void;
}

export function MoltbotChat({ 
  gatewayUrl = 'ws://localhost:18789', 
  token,
  sessionKey 
}: MoltbotChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MoltbotMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customGatewayUrl, setCustomGatewayUrl] = useState(gatewayUrl);
  const [customToken, setCustomToken] = useState(token || '');
  
  const clientRef = useRef<MoltbotClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Moltbot client
  useEffect(() => {
    const client = createMoltbotClient({
      gatewayUrl: customGatewayUrl,
      token: customToken || undefined,
      sessionKey,
    });

    clientRef.current = client;

    // Connect to Gateway
    connectToGateway();

    // Register event handlers
    client.onMessage(handleChatEvent);
    client.onStatus(handleStatusChange);
    client.onHistory((historyMessages) => {
      if (historyMessages.length > 0) {
        setMessages(historyMessages);
      }
    });

    return () => {
      client.disconnect();
    };
  }, [customGatewayUrl, customToken, sessionKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const connectToGateway = async () => {
    try {
      await clientRef.current?.connect();
    } catch (error) {
      console.error('Failed to connect to Moltbot Gateway:', error);
      setStatus('error');
    }
  };

  const handleChatEvent = (event: ChatEvent) => {
    if (event.type === 'delta' && event.content) {
      setCurrentResponse(prev => prev + event.content!);
    } else if (event.type === 'done') {
      // Save the complete response
      if (currentResponse) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: currentResponse,
          timestamp: new Date(),
        }]);
      }
      setCurrentResponse('');
      setIsLoading(false);
    } else if (event.type === 'error') {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${event.error}`,
        timestamp: new Date(),
      }]);
      setCurrentResponse('');
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: 'connected' | 'disconnected' | 'connecting' | 'error') => {
    setStatus(newStatus);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !clientRef.current?.isConnected()) return;

    const userMessage: MoltbotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');

    try {
      await clientRef.current.sendMessage(userMessage.content);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to send message. Please check your connection.',
        timestamp: new Date(),
      }]);
    }
  };

  const abortMessage = async () => {
    try {
      await clientRef.current?.abort();
      setCurrentResponse('');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to abort:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const applySettings = () => {
    setCustomGatewayUrl(customGatewayUrl);
    setCustomToken(customToken);
    setShowSettings(false);
    
    // Reconnect with new settings
    clientRef.current?.disconnect();
    setTimeout(() => {
      connectToGateway();
    }, 500);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <span className="text-green-500 flex items-center gap-1">🟢 已连接</span>;
      case 'connecting':
        return <span className="text-yellow-500 flex items-center gap-1">🟡 连接中...</span>;
      case 'error':
        return <span className="text-red-500 flex items-center gap-1">🔴 连接失败</span>;
      default:
        return <span className="text-gray-500 flex items-center gap-1">⚪ 未连接</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Jarvis</h1>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={connectToGateway}
            disabled={status === 'connecting'}
            title="重新连接"
          >
            <RefreshCw className={`h-4 w-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Moltbot Gateway 设置</h3>
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">Gateway URL</label>
              <Input
                value={customGatewayUrl}
                onChange={(e) => setCustomGatewayUrl(e.target.value)}
                placeholder="ws://localhost:18789"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Token (可选)</label>
              <Input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="Gateway认证令牌"
              />
            </div>
            <Button onClick={applySettings}>应用设置</Button>
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-y-auto space-y-4">
          {messages.length === 0 && !currentResponse ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">👋 你好！我是Jarvis</p>
                <p className="text-sm">连接到Moltbot Gateway后就可以开始对话了</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <p className="whitespace-pre-wrap">{currentResponse}</p>
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息与Jarvis对话..."
            disabled={isLoading || status !== 'connected'}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || status !== 'connected'}
            size="icon"
          >
            {isLoading ? (
              <Square className="h-4 w-4" onClick={(e) => {
                e.stopPropagation();
                abortMessage();
              }} />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground px-2 flex justify-between">
          <span>Powered by Moltbot Gateway</span>
          {status === 'connected' && (
            <span className="text-green-600">实时连接中</span>
          )}
        </div>
      </div>
    </div>
  );
}
