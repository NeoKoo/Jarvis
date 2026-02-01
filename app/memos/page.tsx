'use client';

import { VoiceMemos } from '@/components/memos/VoiceMemos';
import { Navbar } from '@/components/navbar';

export default function MemosPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <VoiceMemos />
      </main>
    </>
  );
}
