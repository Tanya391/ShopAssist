import React from 'react';
import { Bot, Library, Tag, Ticket, Activity, User, LogOut } from 'lucide-react';

export const Header = ({ activeTab, setActiveTab, onResetChat, auth, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <img src="/assets/logo.png" alt="ShopAssist Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">ShopAssist AI</h1>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Support Portal</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1.5">
          <button onClick={() => { setActiveTab('chat'); onResetChat(); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/assets/logo.png" className="w-4 h-4 object-contain" alt="ShopAssist Logo" /> AI Support
          </button>
          {auth?.user?.role === 'admin' && (
            <>
              <button onClick={() => setActiveTab('knowledge')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'knowledge' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Library className="w-4 h-4" /> Knowledge Base
              </button>
              <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Ticket className="w-4 h-4" /> Tickets
              </button>
              <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Tag className="w-4 h-4" /> Orders
              </button>
              <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Activity className="w-4 h-4" /> Logs
              </button>
            </>
          )}
          <div className="h-6 w-px bg-slate-200 mx-2" />
          {auth ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" /> {auth.user.name || auth.user.email} ({auth.user.role})
              </div>
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setActiveTab('auth')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors">
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
