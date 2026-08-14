import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { HeroSection } from './components/HeroSection.jsx';
import { ChatInterface } from './components/ChatInterface.jsx';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager.jsx';
import { TicketsManager } from './components/TicketsManager.jsx';
import { OrdersManager } from './components/OrdersManager.jsx';
import { SystemLogs } from './components/SystemLogs.jsx';

const INITIAL_WELCOME_MESSAGE = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: `👋 Hi! Welcome to **ShopAssist**. How can I help you today?

Feel free to ask about:
• **Order Status** (e.g. check status for **ORD-1002**)
• **Returns & Refunds** (30-day policy & process)
• **Shipping & Warranty** details
• **Filing a Support Ticket** for damaged or missing items`,
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

  const fetchData = async () => {
    try {
      const [kRes, tRes, oRes, lRes] = await Promise.all([
        fetch('/api/knowledge'),
        fetch('/api/tickets'),
        fetch('/api/orders'),
        fetch('/api/logs')
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
  }, []);

  const handleSendMessage = async (userQueryText) => {
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: userQueryText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/knowledge/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (res.ok) fetchData();
  };

  const handleCreateTicket = async (ticketData) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    if (res.ok) fetchData();
  };

  const handleUpdateTicketStatus = async (ticketId, status, resolutionNotes) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionNotes })
    });
    if (res.ok) fetchData();
  };

  const handleStartChatWithQuery = (query) => {
    setActiveTab('chat');
    handleSendMessage(query);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/30 via-slate-50 to-slate-100/50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetChat={handleResetChat}
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {activeTab === 'home' && (
          <HeroSection
            onStartChat={() => setActiveTab('chat')}
            onViewKnowledge={() => setActiveTab('knowledge')}
            onStartChatWithQuery={handleStartChatWithQuery}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onResetChat={handleResetChat}
            onNavigateToTickets={() => setActiveTab('tickets')}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseManager
            documents={knowledgeDocs}
            onUpdateDocument={handleUpdateDocument}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsManager
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManager orders={orders} />
        )}

        {activeTab === 'logs' && (
          <SystemLogs logs={logs} onRefreshLogs={fetchData} />
        )}
      </main>
    </div>
  );
}
