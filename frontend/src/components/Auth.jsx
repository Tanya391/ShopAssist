import React, { useState } from 'react';
import { Bot } from 'lucide-react';

export const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { name, email, password };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/assets/logo.png" alt="ShopAssist Logo" className="w-16 h-16 object-contain drop-shadow-md mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-orange-600 hover:underline">
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
