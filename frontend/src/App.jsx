import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { HeroSection } from './components/HeroSection.jsx';
import { ChatInterface } from './components/ChatInterface.jsx';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager.jsx';
import { TicketsManager } from './components/TicketsManager.jsx';
import { OrdersManager } from './components/OrdersManager.jsx';
import { SystemLogs } from './components/SystemLogs.jsx';
import { Auth } from './components/Auth.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';

const INITIAL_WELCOME_MESSAGE = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: `👋 Hi! Welcome to **ShopAssist**. How can I help you today?`,
  timestamp: new Date().toLocaleTimeString(),
  intent: 'FAQ'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (data) => {
    setAuth(data);
    localStorage.setItem('auth', JSON.stringify(data));
    setActiveTab('chat');
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('auth');
    setActiveTab('home');
  };

  const authHeaders = {
    'Authorization': auth ? `Bearer ${auth.token}` : '',
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    if (!auth || auth.user.role !== 'admin') return;
    try {
      const [kRes, tRes, oRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/knowledge`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/tickets`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/orders`, { headers: authHeaders }),
        fetch(`${API_BASE}/api/logs`, { headers: authHeaders })
      ]);

      if (kRes.ok) setKnowledgeDocs(await kRes.json());
      if (tRes.ok) setTickets(await tRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auth]);

  const handleSendMessage = async (userQueryText) => {
    if (!auth) {
      setActiveTab('auth');
      return;
    }
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: userQueryText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ query: userQueryText, history: messages })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response from support API');
      }

      const data = await res.json();

      const assistantMsg = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString(),
        intent: data.intent,
        retrievedChunks: data.retrievedChunks,
        toolCalls: data.toolCalls,
        createdTicket: data.createdTicket,
        orderData: data.orderData,
        workflowTrace: data.workflowTrace,
        isLowConfidence: data.isLowConfidence
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.createdTicket) {
        fetchData();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Issue:** Unable to process your query at this moment (${err.message}). Please ensure your network connection is active.`,
        timestamp: new Date().toLocaleTimeString(),
        intent: 'UNKNOWN'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const handleUpdateDocument = async (docId, title, content) => {
    const res = await fetch(`${API_BASE}/api/knowledge/${docId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ title, content })
    });
    if (res.ok) fetchData();
  };

  const handleCreateTicket = async (ticketData) => {
    const res = await fetch(`${API_BASE}/api/tickets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(ticketData)
    });
    if (res.ok) fetchData();
  };

  const handleUpdateTicketStatus = async (ticketId, status, resolutionNotes) => {
    const res = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status, resolutionNotes })
    });
    if (res.ok) fetchData();
  };

  const handleStartChatWithQuery = (query) => {
    if (!auth) {
      setActiveTab('auth');
    } else {
      setActiveTab('chat');
      handleSendMessage(query);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/30 via-slate-50 to-slate-100/50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetChat={handleResetChat}
        auth={auth}
        onLogout={handleLogout}
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {activeTab === 'home' && (
          <HeroSection
            onStartChat={() => auth ? setActiveTab('chat') : setActiveTab('auth')}
            onViewKnowledge={() => setActiveTab('knowledge')}
            onStartChatWithQuery={handleStartChatWithQuery}
            auth={auth}
          />
        )}

        {activeTab === 'auth' && (
          <Auth onLogin={handleLogin} />
        )}

        {activeTab === 'chat' && auth && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onResetChat={handleResetChat}
            onNavigateToTickets={() => setActiveTab('tickets')}
          />
        )}

        {activeTab === 'knowledge' && auth?.user?.role === 'admin' && (
          <KnowledgeBaseManager
            documents={knowledgeDocs}
            onUpdateDocument={handleUpdateDocument}
            auth={auth}
          />
        )}

        {activeTab === 'tickets' && auth?.user?.role === 'admin' && (
          <TicketsManager
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
          />
        )}

        {activeTab === 'orders' && auth?.user?.role === 'admin' && (
          <OrdersManager orders={orders} />
        )}

        {activeTab === 'logs' && auth?.user?.role === 'admin' && (
          <SystemLogs logs={logs} onRefreshLogs={fetchData} />
        )}
      </main>
    </div>
  );
}
