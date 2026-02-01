'use client';

import { Reminders } from '@/components/reminders/Reminders';
import { Navbar } from '@/components/navbar';

export default function RemindersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <Reminders />
      </main>
    </>
  );
}
