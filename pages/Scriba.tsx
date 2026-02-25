import React, { useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { chatWithScriba } from '../services/geminiService';
import { Upload, Send, Brain, Plus, Trash2, MessageSquare, FileText } from 'lucide-react';
import { ChatSession } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const Scriba: React.FC = () => {
  const { memory, apiKey, chatSessions, addChatSession, updateChatSession, deleteChatSession } = useMemory();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);

  // Derive active session
  const activeSession = chatSessions.find(s => s.id === selectedSessionId);

  // --- Handlers ---
  const handleCreateSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Cuộc hội thoại mới',
      fileName: undefined,
      documentContext: '',
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    addChatSession(newSession);
    setSelectedSessionId(newSession.id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSession) return;
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Simulate PDF Extraction
      const simulatedContext = `[Giả lập nội dung của ${selectedFile.name}]: Tài liệu này bao gồm các kiến thức cơ bản về... (Trong thực tế sẽ dùng pdf.js để trích xuất text)`;
      
      const initialMessage = { 
        id: Date.now().toString(),
        role: 'model' as const, 
        text: `Đã đọc xong file **${selectedFile.name}**. \n\nBạn có câu hỏi gì không?`,
        timestamp: Date.now()
      };

      updateChatSession(activeSession.id, {
        title: selectedFile.name,
        fileName: selectedFile.name,
        documentContext: simulatedContext,
        messages: [initialMessage]
      });
    }
  };

  const handleSend = async () => {
    if (!activeSession || !input.trim() || !apiKey) return;

    const userMsg = { 
      id: Date.now().toString(),
      role: 'user' as const, 
      text: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    
    // Optimistic Update
    updateChatSession(activeSession.id, { messages: updatedMessages });
    setInput('');
    setProcessing(true);

    // Format history for Gemini
    const geminiHistory = updatedMessages.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const responseText = await chatWithScriba(input, geminiHistory, activeSession.documentContext, memory);
    
    const modelMsg = {
      id: (Date.now() + 1).toString(),
      role: 'model' as const,
      text: responseText,
      timestamp: Date.now()
    };

    updateChatSession(activeSession.id, { messages: [...updatedMessages, modelMsg] });
    setProcessing(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteChatSession(id);
    if (selectedSessionId === id) setSelectedSessionId(null);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in relative">

      {/* Sidebar: Session List */}
      <div className="w-1/3 bg-white rounded-3xl border border-cream-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-cream-100 flex justify-between items-center bg-cream-50/30">
          <h3 className="font-serif text-xl font-bold text-slate-800">Scriba Chat</h3>
          <button 
            onClick={handleCreateSession} 
            className="p-2 bg-slate-800 text-cream-50 rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20"
            title="Tạo hội thoại mới"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatSessions.length === 0 && (
            <div className="text-center text-slate-400 mt-10 p-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Chưa có cuộc trò chuyện nào.</p>
            </div>
          )}
          
          {chatSessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${
                selectedSessionId === session.id 
                  ? 'bg-sage-50 border-sage-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-cream-50'
              }`}
            >
              <div className="flex items-start gap-3">
                 <div className={`p-2 rounded-lg ${session.fileName ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                   {session.fileName ? <FileText size={20} /> : <MessageSquare size={20} />}
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <h4 className={`font-bold truncate ${selectedSessionId === session.id ? 'text-slate-900' : 'text-slate-700'}`}>
                     {session.title}
                   </h4>
                   <p className="text-xs text-slate-400 mt-1 truncate">
                     {session.lastUpdated ? new Date(session.lastUpdated).toLocaleString('vi-VN') : 'Mới tạo'}
                   </p>
                 </div>
              </div>
              <button 
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Chat Interface */}
      <div className="w-2/3 bg-white rounded-3xl border border-cream-200 overflow-hidden flex flex-col shadow-sm relative">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-cream-100 bg-cream-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-sage-600" />
                <input 
                  className="bg-transparent font-bold text-slate-800 focus:outline-none focus:border-b border-slate-300"
                  value={activeSession.title}
                  onChange={(e) => updateChatSession(activeSession.id, { title: e.target.value })}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-white rounded border border-cream-200">
                   {activeSession.fileName || 'Chưa có tài liệu'}
                 </span>
            </div>

            {/* Chat Content or File Upload */}
            {!activeSession.documentContext ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 m-4 rounded-2xl border-2 border-dashed border-slate-200 bg-cream-50/30">
                 <Upload className="w-16 h-16 mb-4 text-sage-400" />
                 <h3 className="text-xl font-bold text-slate-700 mb-2">Bắt đầu phiên học mới</h3>
                 <p className="mb-6 text-center max-w-md">Tải lên tài liệu PDF để Scriba phân tích và hỗ trợ bạn trả lời các câu hỏi.</p>
                 <label className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full cursor-pointer transition-all font-bold shadow-lg shadow-slate-800/20 flex items-center gap-2">
                   <Plus size={18} /> Chọn tài liệu PDF
                   <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                 </label>
               </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cream-50/30 scroll-smooth">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-slate-800 text-cream-50 rounded-br-none' 
                        : 'bg-white text-slate-800 rounded-bl-none border border-cream-100'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <MarkdownRenderer
                          content={msg.text}
                          className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-bold prose-headings:text-slate-900 prose-strong:text-slate-900 prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-code:bg-cream-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-cream-50 prose-pre:p-2 prose-pre:rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))}
                {processing && (
                  <div className="flex justify-start">
                     <div className="bg-white border border-cream-100 px-4 py-3 rounded-2xl rounded-bl-none flex gap-2">
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                     </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            {activeSession.documentContext && (
              <div className="p-4 bg-white border-t border-cream-100">
                 <div className="relative">
                   <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     placeholder="Hỏi Scriba về nội dung tài liệu..."
                     className="w-full pl-6 pr-14 py-4 bg-cream-50 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all font-medium"
                   />
                   <button 
                     onClick={handleSend}
                     disabled={!input || processing}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50 disabled:hover:bg-slate-800"
                   >
                     <Send className="w-5 h-5" />
                   </button>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Brain className="w-20 h-20 mb-6 opacity-20" />
            <p className="text-lg font-medium">Chọn một cuộc hội thoại để bắt đầu</p>
            <button onClick={handleCreateSession} className="mt-4 text-sage-600 font-bold hover:underline">
              Hoặc tạo mới ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
