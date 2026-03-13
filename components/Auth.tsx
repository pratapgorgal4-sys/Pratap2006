
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users: User[] = JSON.parse(localStorage.getItem('ai_india_users') || '[]');

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password: _, ...userWithoutPass } = user;
        onLogin(userWithoutPass);
      } else {
        setError('Invalid email or password');
      }
    } else {
      if (users.some(u => u.email === email)) {
        setError('Email already exists');
        return;
      }
      const newUser = { email, password, name };
      users.push(newUser);
      localStorage.setItem('ai_india_users', JSON.stringify(users));
      onLogin({ email, name });
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    const users: User[] = JSON.parse(localStorage.getItem('ai_india_users') || '[]');
    const user = users.find(u => u.email === email);
    if (user) {
      alert(`Recovery Hint: Your secure key is "${user.password}".`);
    } else {
      setError('No account found with this email');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-mesh theme-cosmic absolute inset-0"></div>
      
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-md p-8 md:p-10 rounded-[2rem] border border-gray-200 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 my-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-orange-500 via-gray-200 to-green-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg">
            🇮🇳
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-1">
            {isLogin ? 'Welcome Back' : 'Join AI India'}
          </h2>
          <p className="text-gray-500 text-sm">Access Bharat's Visionary AI Gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl p-3 text-gray-900 outline-none transition-all placeholder:text-gray-400"
                placeholder="Name"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl p-3 text-gray-900 outline-none transition-all placeholder:text-gray-400"
              placeholder="email@address.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Secure Key</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Forgot Key?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl p-3 pr-12 text-gray-900 outline-none transition-all placeholder:text-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-[11px] font-bold text-center animate-pulse">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
          >
            {isLogin ? 'Login to AI India' : 'Create Secure Identity'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            {isLogin ? "Need a new account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
