import React, { useState } from 'react';
import {
  Bot,
  Search,
  Package,
  ShieldCheck,
  Ticket,
  MessageSquare,
  ArrowRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const HeroSection = ({ onStartChat, onViewKnowledge, onStartChatWithQuery }) => {
  const [quickQuery, setQuickQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickQuery.trim()) {
      onStartChat();
      return;
    }
    if (onStartChatWithQuery) {
      onStartChatWithQuery(quickQuery.trim());
    } else {
      onStartChat();
    }
  };

  const handleTopicClick = (prompt) => {
    if (onStartChatWithQuery) {
      onStartChatWithQuery(prompt);
    } else {
      onStartChat();
    }
  };

  return (
    <div className="space-y-10 pb-12 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-14 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-12 text-center space-y-6">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            ShopAssist Intelligent Support Hub
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            How can we help you today?
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto">
            Get instant answers regarding orders, returns, shipping policies, or file a support
            ticket in seconds.
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="pt-2 max-w-xl mx-auto flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg"
          >
            <div className="pl-3 text-slate-300">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Ask a question or enter order ID (e.g. ORD-1002)..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-2 py-2"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-violet-500/20"
            >
              <span>Ask AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleTopicClick('Where is my order ORD-1002?')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl cursor-pointer transition-all hover:border-violet-300 shadow-sm hover:shadow-md space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Track Order</h3>
            <p className="text-xs text-slate-500 mt-1">Check status and delivery estimates</p>
          </div>
        </div>

        <div
          onClick={() => handleTopicClick('What is your return policy?')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl cursor-pointer transition-all hover:border-violet-300 shadow-sm hover:shadow-md space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Returns & Refunds</h3>
            <p className="text-xs text-slate-500 mt-1">30-day money-back guarantee</p>
          </div>
        </div>

        <div
          onClick={() => handleTopicClick('I received a damaged item and need help')}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl cursor-pointer transition-all hover:border-violet-300 shadow-sm hover:shadow-md space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Support Tickets</h3>
            <p className="text-xs text-slate-500 mt-1">Report damaged or missing items</p>
          </div>
        </div>

        <div
          onClick={onStartChat}
          className="bg-white hover:bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl cursor-pointer transition-all hover:border-violet-300 shadow-sm hover:shadow-md space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200/80 text-violet-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Chat Assistant</h3>
            <p className="text-xs text-slate-500 mt-1">Talk to our AI for instant support</p>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Need detailed policy documents?</h4>
            <p className="text-xs text-slate-500">
              Explore company FAQs, shipping terms, and warranty guides.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewKnowledge}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap"
          >
            View Knowledge Base
          </button>
          <button
            onClick={onStartChat}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all whitespace-nowrap shadow-md shadow-violet-500/20"
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};
