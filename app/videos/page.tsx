'use client';

import { VideoSummarizer } from '@/components/videos/VideoSummarizer';
import { Navbar } from '@/components/navbar';

export default function VideosPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <VideoSummarizer />
      </main>
    </>
  );
}
