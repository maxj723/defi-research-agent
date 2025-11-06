import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import type { ChatMessage } from '../types';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome! I'm your DeFi Intelligence Agent. I can help you:

- **Monitor profitable wallets** and get real-time trade alerts
- **Analyze projects** for risks and opportunities
- **Detect scams** with multi-layered analysis
- **Find high-potential projects** matching your criteria

Try asking:
- "Find me profitable DeFi traders on Ethereum"
- "Analyze this contract: 0x..."
- "Show me new projects under $1M market cap"`,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.sendMessage(input);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
        toolCalls: response.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your backend connection.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'Find profitable wallets on Ethereum',
    'Check if this contract is safe: 0x...',
    'What are the top opportunities this week?',
    'Explain how to use this agent',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-card rounded-xl border border-border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={18} className="text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-black'
                  : 'bg-darker border border-border'
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 text-xs text-gray-400">
                  🔧 Used tools: {message.toolCalls.map((t) => t.tool).join(', ')}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <User size={18} className="text-secondary" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={18} className="text-primary" />
            </div>
            <div className="bg-darker border border-border rounded-lg p-4">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only show if no messages besides welcome) */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-xs px-3 py-1.5 bg-darker border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about DeFi projects, wallets, or risks..."
            className="flex-1 px-4 py-3 bg-darker border border-border rounded-lg resize-none focus:border-primary focus:outline-none"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
