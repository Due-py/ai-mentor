import React, { useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { ViewState } from '../types';
import { GraduationCap, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const { setView, login, signup } = useMemory();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay to simulate network
    setTimeout(async () => {
      if (isLogin) {
        // LOGIN
        const success = await login(email, password);
        if (success) {
          setView(ViewState.DASHBOARD);
        } else {
          setError('Email hoặc mật khẩu không đúng.');
        }
      } else {
        // SIGNUP
        const success = await signup(email, password, name);
        if (success) {
          setView(ViewState.ONBOARDING);
        } else {
          setError('Email này đã được sử dụng.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-cream-200 shadow-xl animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sage-200 p-3 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-slate-800" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 text-center">
            {isLogin ? 'Tiếp tục hành trình chinh phục tri thức.' : 'Bắt đầu hành trình học tập thông minh cùng AI Mentor.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-800 text-cream-50 rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-800/20 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium underline"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};