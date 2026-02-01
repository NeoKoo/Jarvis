'use client';

import { TimeCapsulePanel } from '@/components/timecapsule/TimeCapsule';
import { Navbar } from '@/components/navbar';

export default function TimeCapsulePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <TimeCapsulePanel />
        </div>
      </main>
    </>
  );
}
