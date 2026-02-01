'use client';

import { CalendarView } from '@/components/calendar/CalendarView';
import { Navbar } from '@/components/navbar';

export default function CalendarPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <CalendarView />
      </main>
    </>
  );
}
