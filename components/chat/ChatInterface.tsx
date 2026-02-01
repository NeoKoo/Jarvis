'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/stores/chat-store';
import { usePersonalityStore } from '@/stores/personality-store';
import { speechRecognition } from '@/lib/speech/recognition';
import { speechSynthesis } from '@/lib/speech/synthesis';
import { Mic, MicOff, Send, Square, Volume2, VolumeX } from 'lucide-react';
import { Message } from '@/types';
import { PersonalitySelector } from './PersonalitySelector';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    currentSession,
    isLoading,
    isStreaming,
    currentStreamContent,
    createNewSession,
    loadSessions,
    addMessage,
    setLoading,
    setStreaming,
    clearCurrentStream,
  } = useChatStore();

  const { currentPersonality } = usePersonalityStore();

  // Initialize
  useEffect(() => {
    loadSessions();
    if (!currentSession) {
      createNewSession();
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, currentStreamContent]);

  // Handle speech recognition results
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      return;
    }

    speechRecognition.onResult((transcript, isFinal) => {
      if (isFinal) {
        setInput(prev => prev + transcript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(transcript);
      }
    });

    speechRecognition.onError((error) => {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      speechRecognition.stop();
    });
  }, []);

  // Toggle voice recognition
  const toggleListening = useCallback(() => {
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      const started = speechRecognition.start();
      if (started) {
        setIsListening(true);
      }
    }
  }, [isListening]);

  // Send message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content: messageText.trim(),
    };

    // Add user message
    addMessage(userMessage);
    setInput('');
    setInterimTranscript('');

    // Stop listening if active
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }

    // Start loading
    setLoading(true);
    setStreaming(true, '');

    // Prepare messages for API
    const apiMessages = [...(currentSession?.messages || []), {
      ...userMessage,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }];

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
          personality: currentPersonality,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data:[DONE]') continue;

          if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.slice(5).trim();
              const data = JSON.parse(jsonStr);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                fullContent += data.content;
                setStreaming(true, fullContent);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: fullContent,
      });

      clearCurrentStream();
      setLoading(false);
      setStreaming(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        addMessage({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        });
      }
      clearCurrentStream();
      setLoading(false);
      setStreaming(false);
    }
  }, [currentSession, isLoading, isListening, addMessage, setLoading, setStreaming, clearCurrentStream]);

  // Speak the last assistant message
  const speakLastMessage = useCallback(() => {
    const lastAssistantMessage = [...(currentSession?.messages || [])]
      .reverse()
      .find(msg => msg.role === 'assistant');

    if (lastAssistantMessage && !isSpeaking) {
      speechSynthesis.speak(lastAssistantMessage.content, {
        lang: 'zh-CN',
        rate: 1,
        pitch: 1,
        volume: 1,
      });
      setIsSpeaking(true);

      // Reset isSpeaking when done
      const checkSpeaking = setInterval(() => {
        if (!speechSynthesis.isActive()) {
          setIsSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 100);
    } else if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentSession?.messages, isSpeaking]);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 gap-4">
      {/* Personality Selector - Collapsible */}
      {showPersonalitySelector && (
        <div className="flex-shrink-0">
          <PersonalitySelector />
        </div>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-y-auto space-y-4">
          {currentSession?.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>开始与Jarvis对话...</p>
            </div>
          ) : (
            currentSession?.messages.map((message) => (
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
          {isStreaming && currentStreamContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <p className="whitespace-pre-wrap">{currentStreamContent}</p>
                <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input area */}
      <div className="space-y-2">
        {/* Voice input transcript */}
        {isListening && interimTranscript && (
          <div className="text-sm text-muted-foreground px-2">
            正在听取: {interimTranscript}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
            title="切换AI人格"
          >
            🎭
          </Button>

          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleListening}
            disabled={!speechRecognition.isSupported()}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入或说出您的消息..."
            disabled={isLoading}
            className="flex-1"
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={speakLastMessage}
            disabled={!currentSession?.messages.length || !speechSynthesis.isSupported()}
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Model info */}
        {(currentSession?.messages && currentSession.messages.length > 0) && (
          <div className="text-xs text-muted-foreground px-2">
            由千问和GLM智能驱动 · 当前人格: {currentPersonality}
          </div>
        )}
      </div>
    </div>
  );
}
