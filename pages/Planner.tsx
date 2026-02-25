import React, { useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { generateStudyPlan, generateQuizForTask } from '../services/geminiService';
import { Loader2, Calendar, CheckSquare, Square, RefreshCw, Brain, Check, X, CheckCircle } from 'lucide-react';
import { StudyPlan, Question } from '../types';

export const Planner: React.FC = () => {
  const { memory, activePlan, setActivePlan, updateMemory, apiKey, completeTask } = useMemory();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('1 week');
  const [loading, setLoading] = useState(false);
  
  // Quiz State
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<{
    question: Question, 
    weekIdx: number, 
    dayIdx: number, 
    taskId: string
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) return alert("Vui lòng nhập API Key.");
    setLoading(true);
    const plan = await generateStudyPlan(subject, duration, memory);
    if (plan) {
      const newPlan: StudyPlan = {
        ...plan,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      setActivePlan(newPlan);
      if (!memory.subjectsStudied.includes(subject)) {
        updateMemory({ subjectsStudied: [...memory.subjectsStudied, subject] });
      }
    }
    setLoading(false);
  };

  const handleTaskClick = async (weekIdx: number, dayIdx: number, taskId: string, taskDesc: string, completed: boolean) => {
    if (completed) return; // Already done

    setQuizLoading(true);
    // Generate quiz for this task
    const question = await generateQuizForTask(taskDesc, memory);
    
    setQuizLoading(false);
    
    if (question) {
      setActiveQuiz({ question, weekIdx, dayIdx, taskId });
      setSelectedOption(null);
      setQuizResult(null);
    } else {
      // Fallback if AI fails: just complete the task without quiz
      completeTask(weekIdx, dayIdx, taskId, 10, undefined);
    }
  };

  const submitQuiz = () => {
    if (!activeQuiz || selectedOption === null) return;
    
    const isCorrect = selectedOption === activeQuiz.question.correctAnswer;
    setQuizResult(isCorrect ? 'correct' : 'incorrect');

    // Delay closing to show result
    setTimeout(() => {
      const xp = isCorrect ? 50 : 10; // 50XP for correct, 10XP for effort
      completeTask(activeQuiz.weekIdx, activeQuiz.dayIdx, activeQuiz.taskId, xp, isCorrect);
      setActiveQuiz(null); // Close modal
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Quiz Modal Overlay */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-sage-100 p-2 rounded-xl text-sage-700">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900">Kiểm tra nhanh</h3>
            </div>
            
            <p className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">
              {activeQuiz.question.text}
            </p>

            <div className="space-y-3 mb-8">
              {activeQuiz.question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !quizResult && setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex justify-between items-center
                    ${selectedOption === idx 
                      ? 'border-slate-800 bg-slate-50' 
                      : 'border-cream-200 hover:border-slate-300 bg-white'}
                    ${quizResult === 'correct' && idx === activeQuiz.question.correctAnswer ? '!bg-green-100 !border-green-500 !text-green-800' : ''}
                    ${quizResult === 'incorrect' && selectedOption === idx ? '!bg-red-50 !border-red-200 !text-red-600' : ''}
                  `}
                >
                  <span>{opt}</span>
                  {quizResult === 'correct' && idx === activeQuiz.question.correctAnswer && <Check size={20} />}
                  {quizResult === 'incorrect' && selectedOption === idx && <X size={20} />}
                </button>
              ))}
            </div>

            {quizResult && (
              <div className={`mb-6 p-4 rounded-xl text-sm ${quizResult === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <strong>{quizResult === 'correct' ? 'Chính xác! +50 XP' : 'Chưa chính xác. +10 XP'}</strong>
                <p className="mt-1">{activeQuiz.question.explanation}</p>
              </div>
            )}

            <button
              onClick={submitQuiz}
              disabled={selectedOption === null || quizResult !== null}
              className="w-full py-4 bg-slate-800 text-cream-50 rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50 shadow-lg shadow-slate-800/20"
            >
              {quizResult ? 'Đang hoàn tất...' : 'Trả lời'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {quizLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="bg-white px-8 py-4 rounded-full shadow-xl flex items-center gap-3 border border-cream-200">
            <Loader2 className="animate-spin text-sage-600" />
            <span className="font-medium text-slate-600">AI đang soạn câu hỏi ôn tập...</span>
          </div>
        </div>
      )}

       <div>
        <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">Lộ trình học tập</h2>
        <p className="text-slate-500">Hoàn thành nhiệm vụ để nhận điểm kinh nghiệm (XP).</p>
      </div>

      {/* Input Section */}
      {!activePlan && (
        <div className="bg-white p-8 rounded-3xl border border-cream-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sage-600" />
            Tạo kế hoạch mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Môn học / Chủ đề</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="VD: Toán hình 12, Lịch sử Việt Nam..."
                className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Thời gian</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all appearance-none"
              >
                <option value="3 days">3 Ngày (Cấp tốc)</option>
                <option value="1 week">1 Tuần</option>
                <option value="2 weeks">2 Tuần</option>
                <option value="1 month">1 Tháng</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !subject}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all
                ${loading || !subject 
                  ? 'bg-cream-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-800 text-cream-50 hover:bg-slate-700 shadow-lg shadow-slate-800/20'}
              `}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              {loading ? 'Đang thiết lập...' : 'Tạo lộ trình'}
            </button>
          </div>
        </div>
      )}

      {/* Active Plan Display */}
      {activePlan && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="font-serif text-2xl font-bold text-slate-800">{activePlan.subject}</h3>
            </div>
            <button 
              onClick={() => setActivePlan(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Làm lại
            </button>
          </div>

          {activePlan.weeks.map((week, wIndex) => (
            <div key={week.week} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Tuần {week.week}</h4>
              <div className="grid gap-4">
                {week.days.map((day, dIndex) => (
                  <div key={day.day} className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                    <div className="bg-cream-100/50 px-6 py-3 border-b border-cream-100 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Ngày {day.day}</span>
                      <span className="text-xs text-slate-400 font-medium">{day.tasks.length} Nhiệm vụ</span>
                    </div>
                    <div className="p-2">
                      {day.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          onClick={() => handleTaskClick(wIndex, dIndex, task.id, task.description, task.completed)}
                          className={`group flex items-start gap-4 p-4 hover:bg-cream-50 rounded-xl transition-colors cursor-pointer ${task.completed ? 'opacity-60 bg-cream-50/50' : ''}`}
                        >
                          <button className={`mt-0.5 transition-colors ${task.completed ? 'text-sage-500' : 'text-slate-300 group-hover:text-sage-500'}`}>
                            {task.completed ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                          </button>
                          <div className="flex-1">
                            <p className={`text-slate-800 leading-relaxed ${task.completed ? 'line-through text-slate-400' : ''}`}>
                              {task.description}
                            </p>
                            {task.completed && task.quizTaken && (
                              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-sage-600">
                                <CheckCircle size={12} /> Đã ôn tập
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};