import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Trash2,
  MoreVertical,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { Avatar, AvatarFallback } from '../ui/Avatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  backgroundStyle?: React.CSSProperties;
}

const panelVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: 400, opacity: 0 },
};

export function ChatPanel({ open, onClose, backgroundStyle }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Ninja Toolkit! I\'m Kage, your AI assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${input.trim()}". As an AI assistant integrated into Ninja Toolkit, I can help you with network analysis, security scans, PowerShell commands, and much more. What specific task would you like help with?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={panelVariants}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-96 h-full border-l border-white/10 flex flex-col relative overflow-hidden"
        >
          {/* Background Image Layer */}
          <div
            className="absolute inset-0 z-0 transition-all duration-1000"
            style={backgroundStyle}
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-xl" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between h-14 px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Kage AI</h2>
                <p className="text-2xs text-foreground-muted">Your AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={clearMessages}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="relative z-10 flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="relative z-10 px-4 py-2 border-t border-white/10">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['Network scan', 'Security check', 'Help with PowerShell'].map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-surface hover:bg-surface-hover rounded-full text-foreground-muted hover:text-foreground transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="relative z-10 p-4 border-t border-white/10">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Kage anything..."
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 pr-12 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                size="icon-sm"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 bottom-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-2 text-2xs text-foreground-muted text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <Avatar size="sm">
        <AvatarFallback
          className={cn(
            isUser ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-surface text-foreground rounded-tl-sm'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={cn(
            'text-2xs mt-2',
            isUser ? 'text-primary-foreground/70' : 'text-foreground-muted'
          )}
        >
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
