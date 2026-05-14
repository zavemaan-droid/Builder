import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Sparkles } from 'lucide-react';
import { sendMessage, AIMessage } from '@/services/aiService';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    const key = localStorage.getItem('ai_api_key');
    if (key) setApiKey(key);
    const saved = localStorage.getItem('chat_messages');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const saveMessages = (msgs: AIMessage[]) => {
    localStorage.setItem('chat_messages', JSON.stringify(msgs));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      navigate('/settings');
      return;
    }

    const userMessage: AIMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const systemMessage: AIMessage = {
        role: 'system',
        content: 'You are an expert AI coding assistant. Help users build apps, write code, and solve technical problems. Be concise and practical.',
      };

      const response = await sendMessage(
        [systemMessage, ...newMessages],
        { provider: 'openrouter', apiKey }
      );

      const assistantMessage: AIMessage = { role: 'assistant', content: response };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } catch (error) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="chat-page">
      <div className="page-header">
        <Sparkles size={24} color="#3b82f6" />
        <h1>AI Builder</h1>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <Sparkles size={48} color="#3b82f6" />
            <h2>Start Building</h2>
            <p>Ask me to create an app, write code, or help with technical problems</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="message-loading">
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={apiKey ? 'Ask anything...' : 'Configure API key in Settings first'}
          disabled={loading || !apiKey}
          rows={1}
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={!input.trim() || loading || !apiKey}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
