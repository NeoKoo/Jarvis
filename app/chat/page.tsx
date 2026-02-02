'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { MoltbotChat } from '@/components/chat/MoltbotChat';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'http' | 'websocket'>('http');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-4">
          {/* Tab Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'http' ? 'default' : 'outline'}
              onClick={() => setActiveTab('http')}
              className="flex-1"
            >
              HTTP API (千问/GLM)
            </Button>
            <Button
              variant={activeTab === 'websocket' ? 'default' : 'outline'}
              onClick={() => setActiveTab('websocket')}
              className="flex-1"
            >
              WebSocket (Moltbot Gateway)
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'http' ? (
            <ChatInterface />
          ) : (
            <MoltbotChat
              gatewayUrl={process.env.NEXT_PUBLIC_MOLTBOT_GATEWAY_URL || 'ws://localhost:18789'}
              token={process.env.NEXT_PUBLIC_MOLTBOT_TOKEN}
            />
          )}
        </div>
      </main>
    </>
  );
}
