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

    if (text.includes('file draft') || text.includes('new draft') || text.includes('create draft') || text.includes('draft complaint')) {
      setDraftState({ step: 1, title: '', description: '', category: '' });
      reply = 'Sure, let\'s prepare a draft complaint. What is the title of your issue? (e.g. "Broken Water Pipe near Main St")';
    } else if (text.includes('submit a complaint') || text.includes('file a complaint') || text.includes('how to submit') || text.includes('how to file') || text.includes('register a complaint') || text.includes('report an issue')) {
      reply = 'To file a complaint: 1. Click on "File Complaint" in the sidebar. 2. Enter a descriptive Title and choose a Category. 3. Pinpoint the location on the map. 4. Upload photos/documents if you have them. 5. Click the "File Complaint" button. If you are offline, you can also ask me to "file draft" to queue it locally!';
    } else if (text.includes('how to register') || text.includes('create account') || text.includes('register') || text.includes('sign up') || text.includes('signup') || text.includes('create id')) {
      reply = 'To create an account: 1. Go to the "Sign Up" page. 2. Enter your Full Name, a unique Username, Email address, and Phone Number. 3. Input your Password and confirm it in the "Confirm Password" field. 4. Click "Register" to verify and create your account.';
    } else if (text.includes('how to login') || text.includes('login') || text.includes('sign in') || text.includes('signin') || text.includes('cannot log in') || text.includes('admin login')) {
      reply = 'To sign in: 1. Click the "Sign In" link. 2. Provide either your registered username or email. 3. Enter your password. You can click the eye icon inside the input field to double-check spelling. 4. Click "Sign In". For the Admin Superuser, please use the email "pradeeksha006s@gmail.com" with password "pradeeksha2006".';
    } else if (text.includes('what is this') || text.includes('how does it work') || text.includes('purpose') || text.includes('about') || text.includes('system overview')) {
      reply = 'The Citizen & Government Complaint Management System (CMS) allows residents to submit local infrastructure or public safety issues directly to specific municipal departments. The admin assigns the ticket, officers update the progress, and you get real-time email alerts!';
    } else if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('leak') || text.includes('plumb') || text.includes('pipe')) {
      reply = 'The Water Supply & Sewage Department (WT) handles contaminated water supplies, pipe leakages, sewage blockages, no-water conditions, and billing disputes. Please submit a complaint for immediate action.';
    } else if (text.includes('road') || text.includes('pothole') || text.includes('street') || text.includes('highway') || text.includes('bridge') || text.includes('sidewalk')) {
      reply = 'The Roads & Traffic Infrastructure Department (RD) manages pothole repairs, broken pavements, traffic sign maintenance, road leveling, and water logging on highways.';
    } else if (text.includes('electricity') || text.includes('power') || text.includes('wire') || text.includes('spark') || text.includes('transformer') || text.includes('light')) {
      reply = 'The Electricity & Public Lighting Department (EL) resolves street light malfunctions, electrical wire sparks, load shedding, transformer blowouts, and domestic billing errors.';
    } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('sanitation') || text.includes('cleaning') || text.includes('litter')) {
      reply = 'The Sanitation & Waste Management Department (SN) sweeps public roads, cleans local drainage, clears garbage accumulation bins, and fines open dumping violations.';
    } else if (text.includes('police') || text.includes('security') || text.includes('crime') || text.includes('theft') || text.includes('disturbance') || text.includes('nuisance')) {
      reply = 'The Law & Public Security Department (PL) coordinates with local police to solve public nuisance, late-night noise pollution, local safety patrols, theft, and illegal parking.';
    } else if (text.includes('stray') || text.includes('dog') || text.includes('animal') || text.includes('health') || text.includes('mosquito') || text.includes('pest') || text.includes('hygiene') || text.includes('food')) {
      reply = 'The Public Health & Veterinary Department (HL) conducts pest control/fogging, manages stray animal vaccinations, inspects public food stalls for hygiene, and handles disease control.';
    } else if (text.includes('anonymous') || text.includes('hide my name') || text.includes('private')) {
      reply = 'Yes! You can file complaints anonymously. Simply toggle "Anonymous File" on the filing form. Your personal details will be hidden from public and officers, though the Super Admin retains system auditing logs for security.';
    } else if (text.includes('draft') || text.includes('offline') || text.includes('no internet')) {
      reply = 'Our system supports offline queueing. If you lose internet connection, your complaint is saved locally as an "Offline Draft". Once you are back online, you can sync and submit all drafts in one tap from the dashboard!';
    } else if (text.includes('track') || text.includes('status') || text.includes('id') || text.includes('reference')) {
      reply = 'To track your complaint: 1. Click on "Track Complaint" in the sidebar. 2. Enter your reference ID (e.g. WT-20260704-0001). 3. View the operational timeline. You can also view status logs under "My Complaints" in your dashboard.';
    } else if (text.includes('how long') || text.includes('time') || text.includes('days') || text.includes('duration')) {
      reply = 'Typically, complaints are reviewed and routed by the Admin within 24 hours. Officers aim to resolve standard issues (like garbage cleaning or street light repair) within 2-3 business days. Heavy works (like road laying) may take longer.';
    } else if (text.includes('email') || text.includes('alert') || text.includes('notification')) {
      reply = 'The system sends automatic email alerts to your registered email address (e.g., when you register, when the admin routes your complaint, when an officer begins working on it, or when it is marked as resolved!).';
    } else if (text.includes('contact') || text.includes('support') || text.includes('helpline') || text.includes('phone') || text.includes('number')) {
      reply = 'You can reach our system support center at support@cms.gov or email our lead administrator directly at pradeeksha2006@gmail.com for escalation queries.';
    } else {
      reply = 'I am here to assist! Try asking about: "how to submit a complaint", "how to register", "how to login", "water supply", "road repairs", "offline drafts", or "how to track status".';
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
