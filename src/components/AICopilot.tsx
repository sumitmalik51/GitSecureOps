import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Shield,
  Zap,
  Brain,
  ChevronDown,
  Building2,
  GitPullRequest,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { aiService, type ChatMessage } from '@/services/aiService';

/* ------------------------------------------------------------------ */
/*  Typing dots animation                                              */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-400"
            style={{
              animation: `bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-dark-text-muted ml-1">AI is thinking…</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Markdown-lite renderer for AI responses                            */
/* ------------------------------------------------------------------ */
function RenderMarkdown({ text }: { text: string }) {
  // Very lightweight — handles bold, inline code, code blocks, bullets, headings
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="bg-dark-bg/80 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 border border-dark-border/50"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="font-semibold text-dark-text mt-3 mb-1 text-sm">
          {line.slice(4)}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="font-bold text-dark-text mt-3 mb-1">
          {line.slice(3)}
        </h3>
      );
      return;
    }

    // Bullets
    if (line.match(/^[-•*]\s/)) {
      const content = line.replace(/^[-•*]\s/, '');
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5">
          <span className="text-brand-400 mt-1 shrink-0">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      return;
    }

    // Numbered
    if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/)!;
      elements.push(
        <div key={idx} className="flex gap-2 ml-1 my-0.5">
          <span className="text-brand-400 font-medium shrink-0">{match[1]}.</span>
          <span>{renderInline(match[2])}</span>
        </div>
      );
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={idx} className="my-0.5">
        {renderInline(line)}
      </p>
    );
  });

  return <div className="text-sm leading-relaxed">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**, `code`, and remaining text
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-dark-text">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <code
          key={match.index}
          className="bg-dark-bg/60 text-brand-300 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length ? parts : text;
}

/* ------------------------------------------------------------------ */
/*  Suggested prompts                                                  */
/* ------------------------------------------------------------------ */
const SUGGESTIONS = [
  {
    icon: Shield,
    label: 'Security Posture',
    prompt:
      "Analyze my organization's overall security posture and give me a risk score with top recommendations.",
  },
  {
    icon: GitPullRequest,
    label: 'Recent PRs',
    prompt: 'Show me all PRs opened in the last 12 hours across all repos.',
  },
  {
    icon: Search,
    label: 'Find Repo',
    prompt: 'Which repo is related to authentication?',
  },
  {
    icon: Zap,
    label: '2FA Compliance',
    prompt: "Which members in my org don't have 2FA enabled? What's the compliance percentage?",
  },
  {
    icon: Brain,
    label: 'Repo Risks',
    prompt:
      'Identify the top 5 riskiest repositories based on visibility, activity, and security configuration.',
  },
  {
    icon: Sparkles,
    label: 'Quick Wins',
    prompt:
      "Give me 5 quick security wins I can implement today to improve my GitHub org's security.",
  },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AICopilot() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Org selector
  const [orgs, setOrgs] = useState<{ login: string; avatar_url: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [showOrgPicker, setShowOrgPicker] = useState(false);

  // Detect which AI engine is active
  const isAzureAI = Boolean(
    import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && import.meta.env.VITE_AZURE_OPENAI_API_KEY
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch orgs when panel opens
  useEffect(() => {
    if (isOpen && token && orgs.length === 0) {
      aiService.getOrgs(token).then((fetchedOrgs) => {
        setOrgs(fetchedOrgs);
        if (fetchedOrgs.length > 0 && !selectedOrg) {
          setSelectedOrg(fetchedOrgs[0].login);
        }
      });
    }
  }, [isOpen, token, orgs.length, selectedOrg]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Track scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(
        [...messages, userMsg],
        token || undefined,
        selectedOrg || undefined
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error:** ${errorMsg}\n\nPlease check your connection and try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    aiService.clearHistory();
  };

  // Panel dimensions
  const panelWidth = isExpanded ? 'w-[680px]' : 'w-[420px]';
  const panelHeight = isExpanded ? 'h-[85vh]' : 'h-[600px]';

  return (
    <>
      {/* -------- Floating Action Button -------- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 right-6 z-[100] rounded-2xl p-3.5',
          'bg-gradient-to-br from-brand-500 to-indigo-600',
          'text-white shadow-glow hover:shadow-glow-lg',
          'transition-all duration-300 hover:scale-105 active:scale-95',
          'group',
          isOpen && 'rotate-0 scale-0 opacity-0 pointer-events-none'
        )}
        aria-label="Open AI Copilot"
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          {/* Pulse ring */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-400 border-2 border-dark-bg animate-pulse" />
        </div>
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-dark-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-elevated">
          AI Security Copilot
        </span>
      </button>

      {/* -------- Chat Panel -------- */}
      <div
        className={cn(
          'fixed bottom-20 right-6 z-[100]',
          panelWidth,
          panelHeight,
          'bg-dark-card/95 backdrop-blur-2xl',
          'border border-dark-border/60 rounded-2xl',
          'shadow-elevated-lg',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
      >
        {/* -------- Header -------- */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border/50 bg-dark-bg/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-400 border-2 border-dark-card" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-text flex items-center gap-1.5">
                Security Copilot
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider',
                    isAzureAI
                      ? 'bg-success-500/20 text-success-400'
                      : 'bg-brand-500/20 text-brand-300'
                  )}
                >
                  {isAzureAI ? 'GPT' : 'BASIC'}
                </span>
              </h3>
              <p className="text-[11px] text-dark-text-muted">
                {isAzureAI ? 'Azure OpenAI · gpt-5.2-chat' : 'Built-in engine · keyword matching'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-dark-text-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-dark-text-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-dark-text-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* -------- Org Selector -------- */}
        {orgs.length > 0 && (
          <div className="px-3 py-2 border-b border-dark-border/30 bg-dark-bg/20">
            <div className="relative">
              <button
                onClick={() => setShowOrgPicker(!showOrgPicker)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-dark-bg/50 border border-dark-border/40 hover:border-brand-500/30 transition-colors text-left"
              >
                <Building2 className="w-3.5 h-3.5 text-dark-text-muted shrink-0" />
                {selectedOrg ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={orgs.find((o) => o.login === selectedOrg)?.avatar_url}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                    />
                    <span className="text-xs font-medium text-dark-text truncate">
                      {selectedOrg}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-dark-text-muted">Select organization…</span>
                )}
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-dark-text-muted transition-transform shrink-0',
                    showOrgPicker && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown */}
              {showOrgPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-card border border-dark-border rounded-lg shadow-elevated-lg z-10 max-h-[200px] overflow-y-auto">
                  {orgs.map((org) => (
                    <button
                      key={org.login}
                      onClick={() => {
                        setSelectedOrg(org.login);
                        setShowOrgPicker(false);
                        // Clear context when org changes
                        aiService.clearHistory();
                      }}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-dark-hover transition-colors',
                        org.login === selectedOrg && 'bg-brand-500/10'
                      )}
                    >
                      <img src={org.avatar_url} alt="" className="w-5 h-5 rounded-sm" />
                      <span
                        className={cn(
                          'text-xs',
                          org.login === selectedOrg
                            ? 'font-semibold text-brand-400'
                            : 'text-dark-text-secondary'
                        )}
                      >
                        {org.login}
                      </span>
                      {org.login === selectedOrg && (
                        <Check className="w-3 h-3 text-brand-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------- Messages -------- */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            /* ---- Welcome State ---- */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-600/20 border border-brand-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-dark-text mb-1.5">Security Copilot</h3>
              <p className="text-sm text-dark-text-muted mb-6 max-w-[280px]">
                AI-powered analysis of your GitHub organization&apos;s security, access controls,
                and compliance.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[360px]">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.prompt)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-dark-bg/60 border border-dark-border/40 hover:border-brand-500/30 hover:bg-dark-hover text-left transition-all group"
                  >
                    <s.icon className="w-4 h-4 text-brand-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-dark-text-secondary group-hover:text-dark-text transition-colors">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ---- Message Bubbles ---- */
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5',
                    msg.role === 'user'
                      ? 'bg-brand-500/15 text-dark-text border border-brand-500/20 rounded-br-md'
                      : 'bg-dark-bg/60 text-dark-text-secondary border border-dark-border/30 rounded-bl-md'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="relative group">
                      <RenderMarkdown text={msg.content} />
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="absolute -top-1 -right-1 p-1 rounded-md bg-dark-card border border-dark-border text-dark-text-muted hover:text-dark-text opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy response"
                      >
                        {copiedId === idx ? (
                          <Check className="w-3 h-3 text-success-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
              <div className="bg-dark-bg/60 border border-dark-border/30 rounded-2xl rounded-bl-md">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        {/* Scroll-to-bottom */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-dark-card border border-dark-border shadow-elevated hover:bg-dark-hover transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-dark-text-muted" />
          </button>
        )}

        {/* -------- Input -------- */}
        <div className="px-4 py-3 border-t border-dark-border/50 bg-dark-bg/30">
          <div className="flex items-end gap-2 bg-dark-bg/60 rounded-xl border border-dark-border/40 focus-within:border-brand-500/40 transition-colors px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your org's security…"
              className="flex-1 bg-transparent text-sm text-dark-text placeholder:text-dark-text-muted resize-none outline-none max-h-[120px] min-h-[24px] leading-relaxed"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                'p-2 rounded-lg transition-all shrink-0',
                input.trim() && !isLoading
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-glow-sm'
                  : 'text-dark-text-muted cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-dark-text-muted text-center mt-1.5 opacity-60">
            AI responses are generated based on your GitHub data · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* -------- Global bounce keyframes -------- */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
