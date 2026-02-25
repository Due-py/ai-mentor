import React, { useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { ViewState } from '../types';
import { CheckCircle, ArrowRight, Brain, BookOpen } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { setView, updateMemory, memory } = useMemory();
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [weaknessesInput, setWeaknessesInput] = useState('');
  const [goalsInput, setGoalsInput] = useState('');

  const grades = [
    'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
    'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'
  ];

  const handleFinish = () => {
    updateMemory({
      grade,
      weaknesses: weaknessesInput.split(',').map(s => s.trim()).filter(s => s),
      goals: goalsInput.split(',').map(s => s.trim()).filter(s => s),
    });
    setView(ViewState.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl border border-cream-200 shadow-xl animate-fade-in">
        
        {/* Progress Bar */}
        <div className="w-full bg-cream-100 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-sage-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block p-3 bg-blue-50 rounded-2xl mb-4 text-blue-600">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">Bạn đang học lớp mấy?</h2>
              <p className="text-slate-500">Giúp AI Mentor điều chỉnh độ khó phù hợp.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`p-3 rounded-xl border font-medium transition-all ${
                    grade === g 
                      ? 'bg-sage-100 border-sage-500 text-sage-700' 
                      : 'bg-white border-cream-200 hover:border-sage-300 text-slate-600'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setStep(2)}
              disabled={!grade}
              className="w-full py-3 bg-slate-800 text-cream-50 rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50 mt-4"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
             <div className="text-center">
              <div className="inline-block p-3 bg-orange-50 rounded-2xl mb-4 text-orange-600">
                <Brain className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">Môn học nào bạn muốn cải thiện?</h2>
              <p className="text-slate-500">AI Mentor sẽ tập trung hỗ trợ bạn các môn này.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nhập tên các môn (cách nhau bởi dấu phẩy)</label>
              <textarea
                value={weaknessesInput}
                onChange={(e) => setWeaknessesInput(e.target.value)}
                placeholder="Ví dụ: Toán Hình, Tiếng Anh, Hóa Học hữu cơ..."
                className="w-full p-4 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 h-32 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-cream-200 text-slate-700 rounded-xl font-bold hover:bg-cream-300 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!weaknessesInput}
                className="w-2/3 py-3 bg-slate-800 text-cream-50 rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
             <div className="text-center">
              <div className="inline-block p-3 bg-sage-50 rounded-2xl mb-4 text-sage-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">Mục tiêu của bạn là gì?</h2>
              <p className="text-slate-500">Để chúng tôi thiết kế lộ trình phù hợp nhất.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Chia sẻ ngắn gọn mục tiêu của bạn</label>
              <textarea
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
                placeholder="Ví dụ: Đậu Đại học Bách Khoa, Đạt 8.0 IELTS, Nắm chắc kiến thức cơ bản..."
                className="w-full p-4 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 h-32 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 bg-cream-200 text-slate-700 rounded-xl font-bold hover:bg-cream-300 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinish}
                className="w-2/3 py-3 bg-sage-500 text-white rounded-xl font-bold hover:bg-sage-600 transition-all shadow-lg shadow-sage-200 flex items-center justify-center gap-2"
              >
                Hoàn tất <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};