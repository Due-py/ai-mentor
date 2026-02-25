import React from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { ViewState } from '../types';
import { GraduationCap, ArrowRight, Brain, Clock, ShieldCheck, Zap } from 'lucide-react';

export const Landing: React.FC = () => {
  const { setView } = useMemory();

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <nav className="p-6 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-sage-200 p-2 rounded-xl">
             <GraduationCap className="w-6 h-6 text-slate-800" />
          </div>
          <span className="font-serif font-bold text-xl text-slate-900">AI Mentor</span>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setView(ViewState.AUTH)} className="text-slate-600 font-medium hover:text-slate-900">Đăng nhập</button>
           <button onClick={() => setView(ViewState.AUTH)} className="bg-slate-800 text-cream-50 px-5 py-2 rounded-full font-medium hover:bg-slate-700 transition-colors">
             Đăng ký
           </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-cream-200 shadow-sm mb-8 animate-fade-in-up">
           <span className="w-2 h-2 rounded-full bg-sage-500"></span>
           <span className="text-sm font-medium text-slate-600">Được hỗ trợ bởi Gemini 2.0</span>
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight max-w-4xl mx-auto">
          Trợ lý học tập <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-sage-600">Thông minh & Bền bỉ</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI Mentor thích ứng với phong cách học tập của bạn, tạo lộ trình cá nhân hóa 
          và giúp bạn chinh phục kiến thức với trí nhớ AI dài hạn.
        </p>

        <div className="mb-16">
           <button 
             onClick={() => setView(ViewState.AUTH)}
             className="px-8 py-4 bg-sage-300 text-slate-900 rounded-full font-bold hover:bg-sage-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sage-200 mx-auto"
           >
             Bắt đầu học ngay <ArrowRight className="w-5 h-5" />
           </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
           <div className="bg-white p-8 rounded-3xl border border-cream-200 text-left hover:border-sage-200 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-3">Trí nhớ Thích ứng</h3>
              <p className="text-slate-500 leading-relaxed">AI Mentor ghi nhớ những điểm yếu của bạn và điều chỉnh kế hoạch học tập để cải thiện nhanh chóng.</p>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-cream-200 text-left hover:border-sage-200 transition-colors">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-3">Lập kế hoạch Thông minh</h3>
              <p className="text-slate-500 leading-relaxed">Tạo lộ trình chi tiết từng ngày dựa trên mục tiêu và thời gian biểu của bạn.</p>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-cream-200 text-left hover:border-sage-200 transition-colors">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-3">Scriba AI</h3>
              <p className="text-slate-500 leading-relaxed">Tải lên PDF và trò chuyện cùng tài liệu. Scriba hiểu ngữ cảnh và trích dẫn nguồn chính xác.</p>
           </div>
        </div>
      </div>
      
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-cream-200 bg-white">
        © 2024 AI Mentor AI. Xây dựng cho tương lai giáo dục Việt Nam.
      </footer>
    </div>
  );
};