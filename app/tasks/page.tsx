'use client';

import { TaskList } from '@/components/tasks/TaskList';
import { Navbar } from '@/components/navbar';

export default function TasksPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <TaskList />
      </main>
    </>
  );
}
