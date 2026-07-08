import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, User, HelpCircle } from 'lucide-react';
import api from '../services/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your CMS AI assistant. I can help answer any questions you have about filing complaints, tracking tickets, or department responsibilities. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    // Format history context for backend prompt
    const historyContext = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {
      const res = await api.post('/api/ai/chat', {
        message: currentInput,
        history: historyContext
      });

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.reply || "I'm sorry, I encountered a temporary problem processing that request."
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the AI service right now. Please try again in a moment.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How do I file a complaint?",
    "How can I track my complaint?",
    "Which department handles water complaints?",
    "How do I reopen a complaint?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-110 active:scale-95"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-[360px] flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-blue-600 px-4 py-3.5 rounded-t-2xl dark:border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/10 p-1.5">
                <Sparkles className="h-4.5 w-4.5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">CMS AI Companion</h4>
                <p className="text-[10px] text-blue-200 font-medium">Online • Help Desk Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Queue */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  {m.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed font-medium ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* AI Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3 dark:bg-slate-800 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Analyzing context...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Queries */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Questions</span>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-650 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-850"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input form */}
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about CMS..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default AIChatbot;
