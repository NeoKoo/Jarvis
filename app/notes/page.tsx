'use client';

import { NoteList } from '@/components/notes/NoteList';
import { Navbar } from '@/components/navbar';

export default function NotesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <NoteList />
      </main>
    </>
  );
}
