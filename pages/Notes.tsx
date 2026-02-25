import React, { useEffect, useRef, useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { enhanceNote } from '../services/geminiService';
import { Plus, Wand2, Trash2, ChevronDown } from 'lucide-react';
import { Note } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const Notes: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, memory, apiKey } = useMemory();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find(n => n.id === selectedNoteId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setIsAiMenuOpen(false);
      }
    };

    if (isAiMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAiMenuOpen]);

  const handleCreate = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Ghi chú mới',
      subject: 'Chung',
      content: '',
      tags: [],
      lastEdited: Date.now()
    };
    addNote(newNote);
    setSelectedNoteId(newNote.id);
  };

  const handleEnhance = async (action: 'summarize' | 'simplify' | 'quiz') => {
    if (!activeNote || !apiKey) return;
    setIsAiMenuOpen(false);
    setIsEnhancing(true);
    const result = await enhanceNote(activeNote.content, action, memory);
    const newContent = activeNote.content + `\n\n--- AI ${action.toUpperCase()} ---\n${result}`;
    updateNote(activeNote.id, { content: newContent });
    setIsEnhancing(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in relative">
      
      {/* Sidebar List */}
      <div className="w-1/3 bg-white rounded-3xl border border-cream-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-cream-100 flex justify-between items-center">
          <h3 className="font-serif text-xl font-bold text-slate-800">Sổ ghi chú</h3>
          <button onClick={handleCreate} className="p-2 bg-slate-800 text-cream-50 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notes.length === 0 && <p className="text-center text-slate-400 mt-10">Chưa có ghi chú nào.</p>}
          {notes.map(note => (
            <div 
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedNoteId === note.id ? 'bg-cream-100 border-cream-300' : 'bg-transparent border-transparent hover:bg-cream-50'}`}
            >
              <h4 className="font-bold text-slate-800 truncate">{note.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{new Date(note.lastEdited).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="w-2/3 bg-white rounded-3xl border border-cream-200 overflow-hidden flex flex-col shadow-sm">
        {activeNote ? (
          <>
            <div className="p-6 border-b border-cream-100 flex justify-between items-center bg-cream-50/50">
              <input 
                value={activeNote.title}
                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                className="bg-transparent text-xl font-serif font-bold text-slate-900 focus:outline-none w-full"
                placeholder="Tiêu đề"
              />
              <div className="flex gap-2">
                <div ref={aiMenuRef} className="relative">
                   <button
                     onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                     disabled={isEnhancing || !apiKey}
                     className="flex items-center gap-2 px-3 py-1.5 bg-sage-100 text-sage-700 rounded-lg text-sm font-medium hover:bg-sage-200 transition-colors disabled:opacity-50"
                   >
                     <Wand2 size={16} /> Công cụ AI <ChevronDown size={14} />
                   </button>
                   {isAiMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-cream-200 p-2 z-50">
                       <button 
                         onClick={() => handleEnhance('summarize')} 
                         className="w-full text-left px-4 py-2.5 hover:bg-cream-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                       >
                         Tóm tắt
                       </button>
                       <button 
                         onClick={() => handleEnhance('simplify')} 
                         className="w-full text-left px-4 py-2.5 hover:bg-cream-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                       >
                         Đơn giản hóa
                       </button>
                       <button 
                         onClick={() => handleEnhance('quiz')} 
                         className="w-full text-left px-4 py-2.5 hover:bg-cream-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                       >
                         Tạo trắc nghiệm
                       </button>
                     </div>
                   )}
                </div>
                <button onClick={() => deleteNote(activeNote.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2">
              <textarea 
                className="h-full p-8 resize-none focus:outline-none text-slate-700 leading-relaxed font-sans border-b xl:border-b-0 xl:border-r border-cream-100"
                value={activeNote.content}
                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                placeholder="Bắt đầu viết... (hỗ trợ Markdown, ví dụ **đậm**, *nghiêng*, `code`, $x^2$)"
              />
              <div className="h-full overflow-y-auto p-8 bg-cream-50/30">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-4">
                  Xem trước định dạng
                </p>
                {activeNote.content.trim() ? (
                  <MarkdownRenderer
                    content={activeNote.content}
                  />
                ) : (
                  <p className="text-slate-400">Nội dung markdown sẽ hiển thị tại đây.</p>
                )}
              </div>
            </div>
            {isEnhancing && (
               <div className="absolute bottom-4 right-4 bg-slate-800 text-cream-50 px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-pulse">
                 <Wand2 size={14} /> AI đang suy nghĩ...
               </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Wand2 className="w-16 h-16 mb-4 opacity-50" />
            <p>Chọn hoặc tạo mới ghi chú.</p>
          </div>
        )}
      </div>
    </div>
  );
};
