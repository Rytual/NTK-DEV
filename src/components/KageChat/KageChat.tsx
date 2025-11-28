/**
 * Ninja Toolkit - Kage AI Chat Component
 * Right sidebar AI assistant with context awareness
 *
 * Features:
 * - IPC 'kage-query' integration with backend
 * - Context tracking (module data, overrides)
 * - Feudal-themed responses and labels
 * - Auto-scroll to latest message
 * - Message history with persistence
 * - Typing indicators and loading states
 * - Performance metrics display
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feudalLabel?: string;
  timestamp: Date;
  latency?: number;
}

interface KageChatProps {
  collapsed: boolean;
  onToggle: () => void;
  context: {
    activeModule: string | null;
    moduleData: any;
    overrides: any;
  };
}

interface KageResponse {
  response: string;
  feudalLabel: string;
  suggestions: string[];
  latency: number;
  metadata: any;
}

/**
 * KageChat Component
 */
const KageChat: React.FC<KageChatProps> = ({ collapsed, onToggle, context }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history from localStorage on mount
  useEffect(() => {
    loadMessageHistory();
  }, []);

  // Save message history to localStorage when it changes
  useEffect(() => {
    if (messages.length > 0) {
      saveMessageHistory();
    }
  }, [messages]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Load message history from localStorage
   */
  const loadMessageHistory = () => {
    try {
      const saved = localStorage.getItem('kage_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restored.slice(-50)); // Keep last 50 messages
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  };

  /**
   * Save message history to localStorage
   */
  const saveMessageHistory = () => {
    try {
      const toSave = messages.slice(-50); // Keep last 50 messages
      localStorage.setItem('kage_chat_history', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save message history:', error);
    }
  };

  /**
   * Send query to Kage via IPC
   */
  const sendQuery = async () => {
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Call Kage via IPC (using canonical channel name)
      const response: KageResponse = await window.electronAPI.invoke('kage:sendMessage', query, {
        ...context,
        sessionId: getSessionId()
      });

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        feudalLabel: response.feudalLabel,
        timestamp: new Date(),
        latency: response.latency
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);

    } catch (error: any) {
      console.error('Kage query failed:', error);

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Failed to reach Kage: ${error.message}\n\n🛡️ The sensei is unreachable. Check your connection and try again.`,
        feudalLabel: '❌ Connection Failed',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  /**
   * Clear message history
   */
  const clearHistory = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      setMessages([]);
      setSuggestions([]);
      localStorage.removeItem('kage_chat_history');
    }
  };

  /**
   * Get or create session ID
   */
  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('kage_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('kage_session_id', sessionId);
    }
    return sessionId;
  };

  /**
   * Handle Enter key (send message)
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 0 : 400 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gray-900 border-l border-shadow-gray flex flex-col h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-shadow-gray">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Kage</h2>
            <p className="text-gray-500 text-xs">AI Sensei</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={clearHistory}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            title="Clear history"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-400 hover:text-emerald-400 transition-colors p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🥷</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Ask Kage</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your AI sensei is ready to assist with commands, scripts, and guidance.
            </p>
            <div className="w-full space-y-2">
              {['Show me PowerShell commands', 'Help with Azure VM', 'Security best practices'].map(
                (suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-emerald-400 px-4 py-2 rounded-lg text-sm transition-colors text-left"
                  >
                    {suggestion}
                  </motion.button>
                )
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  {/* Feudal Label (assistant only) */}
                  {message.role === 'assistant' && message.feudalLabel && (
                    <div className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1">
                      {message.feudalLabel}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* Metadata */}
                  <div
                    className={`flex items-center justify-between mt-2 pt-2 border-t ${
                      message.role === 'user'
                        ? 'border-emerald-500/30'
                        : 'border-gray-700'
                    }`}
                  >
                    <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                    {message.latency && (
                      <span className="text-xs opacity-70 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {message.latency}ms
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4"
                    >
                      <svg viewBox="0 0 16 16" className="w-full h-full text-emerald-400">
                        <path
                          fill="currentColor"
                          d="M8 2 L9 7 L14 6 L10 8 L14 10 L9 9 L8 14 L7 9 L2 10 L6 8 L2 6 L7 7 Z"
                        />
                      </svg>
                    </motion.div>
                    <span className="text-gray-400 text-sm">Kage is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2 space-y-2">
          <p className="text-xs text-gray-500 font-semibold">Suggested:</p>
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-emerald-400 px-3 py-2 rounded-lg text-xs transition-colors text-left"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 border-t border-shadow-gray">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Kage for guidance..."
            disabled={isLoading}
            rows={3}
            className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-3 pr-12 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          <motion.button
            onClick={sendQuery}
            disabled={!inputValue.trim() || isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-3 right-3 w-8 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Shift+Enter for new line • Enter to send
        </p>
      </div>
    </motion.div>
  );
};

export default KageChat;
