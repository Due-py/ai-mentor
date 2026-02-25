import React, { useMemo } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { Clock, CheckCircle, TrendingUp, Book, Trophy, Target, Zap, Crown } from 'lucide-react';
import { ViewState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export const Dashboard: React.FC = () => {
  const { memory, activePlan, setView } = useMemory();

  // Focus Data
  const focusData = [
    { name: 'Tập trung', value: memory.totalFocusTime || 1 }, 
    { name: 'Nghỉ ngơi', value: Math.max((memory.totalFocusTime || 1) / 5, 1) },
  ];
  const FOCUS_COLORS = ['#1e293b', '#A8DAB5'];

  // Knowledge Accuracy Data
  const accuracy = memory.questionsAnswered > 0 
    ? Math.round((memory.questionsCorrect / memory.questionsAnswered) * 100) 
    : 0;
  
  const accuracyData = [
    { name: 'Chính xác', value: memory.questionsCorrect },
    { name: 'Cần cải thiện', value: memory.questionsAnswered - memory.questionsCorrect }
  ];
  const ACCURACY_COLORS = ['#34A853', '#EEE6D1'];

  // Leveling Calculations
  const nextLevelXp = memory.level * 100;
  const currentLevelBaseXp = (memory.level - 1) * 100;
  const progressXp = memory.xp - currentLevelBaseXp;
  // Cap at 100 for visual bar
  const progressPercent = Math.min(100, Math.max(0, (progressXp / 100) * 100));

  const currentBadge = memory.unlockedBadges && memory.unlockedBadges.length > 0 
    ? memory.unlockedBadges[memory.unlockedBadges.length - 1] 
    : 'Học viên Mới';

  // Active Plan Progress Calculation
  const planProgress = useMemo(() => {
    if (!activePlan) return 0;
    let total = 0;
    let completed = 0;
    
    activePlan.weeks.forEach(week => {
      week.days.forEach(day => {
        day.tasks.forEach(task => {
          total++;
          if (task.completed) completed++;
        });
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [activePlan]);

  // Find next task
  const nextTask = useMemo(() => {
    if (!activePlan) return null;
    for (const week of activePlan.weeks) {
      for (const day of week.days) {
        for (const task of day.tasks) {
          if (!task.completed) return task;
        }
      }
    }
    return null;
  }, [activePlan]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">Xin chào, {memory.name}</h2>
          <p className="text-slate-500">Đây là tổng quan sự tiến bộ của bạn hôm nay.</p>
        </div>
        
        {/* Enhanced Level Card */}
        <div className="w-full md:w-auto bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl shadow-lg text-cream-50 flex items-center gap-4">
           <div className="relative">
             <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border-2 border-yellow-400 text-yellow-400">
               <Crown size={28} />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
               LV.{memory.level}
             </div>
           </div>
           
           <div className="flex-1 min-w-[200px]">
             <div className="flex justify-between items-center mb-1">
               <span className="font-bold text-sm text-yellow-100">{currentBadge}</span>
               <span className="text-xs text-slate-400">{Math.floor(memory.xp)} XP</span>
             </div>
             
             {/* XP Bar */}
             <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
               <div 
                 className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700 ease-out"
                 style={{ width: `${progressPercent}%` }}
               ></div>
             </div>
             <p className="text-[10px] text-slate-400 mt-1 text-right">
               Còn {100 - progressXp} XP để nhận quà tiếp theo
             </p>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Focus Time */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
               <Clock size={24} />
             </div>
             <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{memory.totalFocusTime}</h3>
          <p className="text-sm text-slate-500 font-medium">Phút tập trung</p>
        </div>

        {/* Sessions */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
               <Target size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{memory.pomodoroSessions}</h3>
          <p className="text-sm text-slate-500 font-medium">Phiên Pomodoro</p>
        </div>

        {/* Accuracy */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-sage-50 text-sage-600 rounded-2xl group-hover:bg-sage-600 group-hover:text-white transition-colors">
               <CheckCircle size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{accuracy}%</h3>
          <p className="text-sm text-slate-500 font-medium">Độ chính xác bài tập</p>
        </div>

        {/* Streaks */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
               <Zap size={24} />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{memory.questionsAnswered}</h3>
          <p className="text-sm text-slate-500 font-medium">Câu hỏi đã trả lời</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Plan */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl font-bold text-slate-900">Lộ trình hiện tại</h3>
            <button 
              onClick={() => setView(ViewState.PLANNER)}
              className="text-sm font-bold text-sage-600 hover:text-sage-700 hover:underline"
            >
              Tiếp tục học
            </button>
          </div>
          
          {activePlan ? (
            <div className="space-y-6">
              <div className="p-6 bg-slate-900 rounded-2xl text-cream-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Book size={100} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sage-300 text-xs font-bold uppercase tracking-wider mb-1">Môn học chủ đạo</p>
                      <h4 className="text-2xl font-bold">{activePlan.subject}</h4>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">{activePlan.duration}</span>
                  </div>
                  
                  {/* Real Plan Progress Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-sage-400 h-3 rounded-full shadow-[0_0_10px_rgba(168,218,181,0.5)] transition-all duration-700 ease-out" 
                      style={{ width: `${planProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">Tiến độ tổng quan: {planProgress}%</p>
                </div>
              </div>

              {nextTask ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Nhiệm vụ tiếp theo</h4>
                  <div className="flex items-center gap-4 p-4 bg-cream-50 rounded-xl mb-2 border border-cream-100">
                    <div className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center">
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {nextTask.description}
                    </span>
                  </div>
                </div>
              ) : (
                 <div>
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Hoàn thành</h4>
                   <div className="flex items-center gap-4 p-4 bg-sage-50 rounded-xl mb-2 border border-sage-100 text-sage-700">
                      <CheckCircle size={20} />
                      <span className="font-medium">Bạn đã hoàn thành tất cả nhiệm vụ hiện tại!</span>
                   </div>
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-cream-50 rounded-2xl border border-dashed border-cream-300">
              <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-6 font-medium">Bạn chưa có kế hoạch học tập nào.</p>
              <button 
                onClick={() => setView(ViewState.PLANNER)}
                className="px-8 py-3 bg-slate-800 text-cream-50 rounded-full font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-800/20"
              >
                Tạo lộ trình AI
              </button>
            </div>
          )}
        </div>

        {/* Charts Column */}
        <div className="flex flex-col gap-6">
          {/* Accuracy Chart */}
          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-sm flex-1">
             <h3 className="font-serif text-lg font-bold mb-2">Chất lượng học tập</h3>
             <p className="text-xs text-slate-400 mb-4">Tỷ lệ trả lời đúng câu hỏi ôn tập</p>
             <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memory.questionsAnswered > 0 ? accuracyData : [{name: 'Empty', value: 1}]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {memory.questionsAnswered > 0 
                        ? accuracyData.map((entry, index) => <Cell key={`cell-${index}`} fill={ACCURACY_COLORS[index]} />)
                        : <Cell fill="#f1f5f9" />
                      }
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-800">{accuracy}%</span>
                  </div>
                </div>
             </div>
             <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-sage-500"></div> Đúng
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-cream-200"></div> Sai
                </div>
             </div>
          </div>

          {/* Focus Distribution (Mini) */}
          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-sm flex-1">
             <h3 className="font-serif text-lg font-bold mb-4">Phân bổ</h3>
             <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[{name: 'Time', focus: memory.totalFocusTime, break: memory.totalFocusTime / 5}]}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="focus" name="Tập trung" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="break" name="Nghỉ" fill="#A8DAB5" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};