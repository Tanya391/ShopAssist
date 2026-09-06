import React, { useState } from 'react';
import { Bot, Zap, ShieldCheck, ArrowRight, Library } from 'lucide-react';

export const HeroSection = ({ onStartChat, onViewKnowledge, onStartChatWithQuery, auth }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onStartChatWithQuery(query);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-20 px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/50 border border-orange-200 text-orange-700 text-xs font-semibold mb-8">
        <Zap className="w-3.5 h-3.5" /> Powered by Google Gemini & Pinecone
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mb-6 leading-tight">
        The intelligent support agent for <br className="hidden md:block" />
        <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">your e-commerce store</span>
      </h1>
      
      <p className="text-slate-500 text-lg max-w-2xl mb-10 leading-relaxed">
        ShopAssist AI resolves customer inquiries instantly using a RAG-powered knowledge base.
        It safely accesses order statuses and seamlessly escalates complex issues to human agents.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mx-auto mb-16">
        <button 
          onClick={onStartChat}
          className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2">
          <img src="/assets/logo.png" className="w-5 h-5 object-contain brightness-0 invert" alt="Logo" /> Chat with ShopAssist
        </button>
        {auth?.user?.role === 'admin' && (
          <button 
            onClick={onViewKnowledge}
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all border border-slate-200/80 shadow-sm flex items-center justify-center gap-2">
            <Library className="w-5 h-5 text-orange-600" /> View Knowledge Base
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-2xl relative mb-16 group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="How can we help you today?"
          className="w-full pl-6 pr-14 py-4 rounded-full border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-orange-600 hover:bg-orange-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm">
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-6 rounded-3xl text-left">
          <div className="bg-orange-100/50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-orange-200/50">
            <ShieldCheck className="w-5 h-5 text-orange-700" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Verified RAG</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Grounds all answers in the Pinecone vector database using indexed company policies, preventing hallucinations.</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-6 rounded-3xl text-left">
          <div className="bg-orange-100/50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-orange-200/50">
            <img src="/assets/logo.png" className="w-5 h-5 object-contain" alt="Logo" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">LangGraph Workflow</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Uses a cyclic graph to dynamically route intent, query APIs, and synthesize the final response.</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-6 rounded-3xl text-left">
          <div className="bg-orange-100/50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-orange-200/50">
            <Zap className="w-5 h-5 text-orange-700" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Tool Calling</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Securely reads database records using Gemini 1.5 function calling to answer order-specific questions.</p>
        </div>
      </div>
    </div>
  );
};
