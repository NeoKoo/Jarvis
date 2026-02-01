'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Navbar } from '@/components/navbar';

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <ChatInterface />
      </main>
    </>
  );
}
