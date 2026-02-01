'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNoteStore } from '@/stores/note-store';
import { Plus, Search, FileText, Tag, Clock, Trash2, Edit2, X } from 'lucide-react';
import { Note } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function NoteList() {
  const {
    filteredNotes,
    isLoading,
    searchQuery,
    selectedNote,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    setSelectedNote,
    setSearchQuery,
  } = useNoteStore();

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingNote) {
      await updateNote(editingNote.id, formData);
      setEditingNote(null);
    } else {
      await addNote(formData);
    }

    setFormData({ title: '', content: '', tags: [] });
    setShowForm(false);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', tags: [] });
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.trim()],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const notes = filteredNotes();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">笔记</h1>
          <p className="text-muted-foreground">快速记录和知识库</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          新建笔记
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Note Form */}
        {(showForm || selectedNote) && (
          <Card className="border-primary md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingNote ? '编辑笔记' : selectedNote ? selectedNote.title : '新建笔记'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="笔记标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />

                <textarea
                  placeholder="开始写下您的想法..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">标签</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="添加标签"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingNote ? '更新' : '保存'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">笔记列表 ({notes.length})</h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : notes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无笔记</p>
                <p className="text-sm mt-2">点击"新建笔记"创建您的第一条笔记</p>
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card
                key={note.id}
                className={`hover:shadow-md transition-all cursor-pointer ${
                  selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-1">{note.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(note);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(note.updatedAt), 'MM月dd日 HH:mm')}
                    </div>

                    {note.tags.length > 0 && (
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Note Preview */}
        {selectedNote && !showForm && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="line-clamp-2">{selectedNote.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none mb-4 whitespace-pre-wrap">
                {selectedNote.content}
              </div>

              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  创建于 {format(new Date(selectedNote.createdAt), 'yyyy年MM月dd日 HH:mm')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
