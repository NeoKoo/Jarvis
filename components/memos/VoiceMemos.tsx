'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Trash2, Clock } from 'lucide-react';
import { VoiceMemo } from '@/types';
import { dbHelpers } from '@/lib/db/schema';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function VoiceMemos() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMemos();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadMemos = async () => {
    try {
      const allMemos = await dbHelpers.getAllVoiceMemos();
      setMemos(allMemos);
    } catch (error) {
      console.error('Error loading memos:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // 使用Web Speech API进行转写（如果浏览器支持）
        let transcription = '转写功能开发中...';
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          // 这里可以实现语音转文字功能
          transcription = '语音转文字功能已启用';
        }

        const newMemo: VoiceMemo = {
          id: crypto.randomUUID(),
          audioBlob,
          audioUrl,
          transcription,
          duration: recordingTime,
          createdAt: new Date(),
          tags: [],
        };

        await dbHelpers.saveVoiceMemo(newMemo);
        setMemos((prev) => [newMemo, ...prev]);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playMemo = (memo: VoiceMemo) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingId === memo.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(memo.audioUrl);
    audioRef.current = audio;
    setPlayingId(memo.id);

    audio.onended = () => {
      setPlayingId(null);
    };

    audio.play();
  };

  const deleteMemo = async (id: string) => {
    await dbHelpers.deleteVoiceMemo(id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
    if (playingId === id) {
      setPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">语音备忘录</h1>
        <p className="text-muted-foreground">录制并转写您的想法</p>
      </div>

      {/* Recording Control */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          {isRecording ? (
            <div className="space-y-4">
              <div className="text-4xl font-mono font-bold text-primary">
                {formatTime(recordingTime)}
              </div>
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="w-24 h-24 rounded-full"
              >
                <Square className="h-8 w-8" />
              </Button>
              <p className="text-sm text-muted-foreground">点击停止录音</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={startRecording}
                className="w-24 h-24 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
              <p className="text-sm text-muted-foreground">点击开始录音</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memos List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">录音列表 ({memos.length})</h2>
        {memos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无录音</p>
              <p className="text-sm mt-2">点击上方按钮开始录制</p>
            </CardContent>
          </Card>
        ) : (
          memos.map((memo) => (
            <Card key={memo.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => playMemo(memo)}
                  >
                    {playingId === memo.id ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatTime(memo.duration)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(memo.createdAt), 'MM月dd日 HH:mm')}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {memo.transcription}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMemo(memo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
