import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, CornerDownLeft } from 'lucide-react';

const ChatbotWidget = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your CMS Virtual Assistant. How can I help you today? You can ask about department responsibilities, how to track a complaint, or say "file draft" to prepare a draft complaint.' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const [draftState, setDraftState] = useState({ step: 0, title: '', description: '', category: '' });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');

    setTimeout(() => {
      processBotResponse(userMessage);
    }, 800);
  };

  const processBotResponse = (msg) => {
    const text = msg.toLowerCase();
    let reply = '';

    // Check draft preparation conversation flow
    if (draftState.step > 0) {
      handleDraftFlow(text);
      return;
    }

    if (text.includes('file draft') || text.includes('new draft') || text.includes('create draft')) {
      setDraftState({ step: 1, title: '', description: '', category: '' });
      reply = 'Sure, let\'s prepare a draft complaint. What is the title of your issue? (e.g. "Broken Water Pipe near Main St")';
    } else if (text.includes('water')) {
      reply = 'The Water Department handles sewage blockage, leakages, and water billing disputes.';
    } else if (text.includes('road') || text.includes('pothole')) {
      reply = 'Road maintenance deals with potholes, road widening, and street repairs.';
    } else if (text.includes('electricity') || text.includes('power')) {
      reply = 'The Electricity Department repairs streetlights, handles live wire hazards, and billing errors.';
    } else if (text.includes('track') || text.includes('status')) {
      reply = 'To track a complaint, click on "Track Complaint" in your sidebar, enter the complaint ID (e.g., WT-20260703-0001), and review the real-time timeline.';
    } else {
      reply = 'I am not sure I understand that fully. You can try asking about: "water leak", "street light", "road repairs", or say "file draft" to prepare a draft ticket.';
    }

    setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  const handleDraftFlow = (text) => {
    let reply = '';
    const step = draftState.step;

    if (step === 1) {
      setDraftState(prev => ({ ...prev, step: 2, title: text }));
      reply = 'Got it. Now please describe the issue in detail.';
    } else if (step === 2) {
      setDraftState(prev => ({ ...prev, step: 3, description: text }));
      reply = 'Understood. What is the category? (e.g. Water Leakage, Pothole, Power Cut)';
    } else if (step === 3) {
      const category = text;
      const newDraft = {
        title: draftState.title,
        description: draftState.description,
        category: category,
        address: 'Drafted via Chatbot'
      };

      // Save to local storage drafts
      const existing = localStorage.getItem('offline_drafts') ? JSON.parse(localStorage.getItem('offline_drafts')) : [];
      existing.push(newDraft);
      localStorage.setItem('offline_drafts', JSON.stringify(existing));

      // Reset flow
      setDraftState({ step: 0, title: '', description: '', category: '' });
      reply = 'Success! Your draft has been prepared and added to your "Offline Drafts" queue on the dashboard. You can review and publish it from there.';
    }

    setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-96 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h4 className="text-sm font-bold">CMS AI Assistant</h4>
            <span className="text-[10px] text-blue-100 font-medium">Online Help Desk</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-blue-700/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 ${
              m.sender === 'user' ? 'bg-slate-500' : 'bg-blue-600'
            }`}>
              {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`rounded-xl px-3.5 py-2 text-sm max-w-[70%%] leading-relaxed ${
              m.sender === 'user'
                ? 'bg-blue-500 text-white rounded-tr-none'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-slate-100 px-4 py-3 dark:border-slate-800 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or say 'file draft'..."
          className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-800 dark:text-white outline-none focus:border-blue-500"
        />
        <button 
          type="submit"
          className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatbotWidget;
