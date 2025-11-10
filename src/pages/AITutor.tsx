import { useState, useCallback, useRef, useEffect, memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, MessageSquare, Loader2, Sparkles, BookOpen, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type TutorMode = "socratic" | "stepbystep" | "examcoach";

const AITutor = memo(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<TutorMode>("socratic");
  const [loading, setLoading] = useState(false);

  const modes = useMemo(() => [
    { 
      id: "socratic", 
      label: "Socratic", 
      description: "Guided questions",
      icon: Sparkles
    },
    { 
      id: "stepbystep", 
      label: "Step-by-Step", 
      description: "Detailed explanations",
      icon: BookOpen
    },
    { 
      id: "examcoach", 
      label: "Exam Coach", 
      description: "Quick drills",
      icon: Target
    },
  ], []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const trimmedInput = input.trim();
    const userMessage: Message = { role: "user", content: trimmedInput };
    const newMessages = [...messages, userMessage];
    
    // Update UI immediately for better responsiveness
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: { messages: newMessages, mode },
      });

      if (error) {
        console.error("AI Tutor Error:", error);
        throw error;
      }

      // Trim whitespace from AI response
      const assistantMessage: Message = {
        role: "assistant",
        content: data?.reply?.trim() || "I received your message but couldn't generate a response. Could you try rephrasing that?",
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error communicating with AI:", error);
      
      // More human-friendly error messages
      let errorContent = "Hmm, I couldn't process that — want to try asking in a different way?";
      
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorContent = "Oops! Looks like there's a connection issue. Check your internet and try again?";
      } else if (error.message?.includes("timeout")) {
        errorContent = "That's taking longer than expected. Mind trying again?";
      } else if (error.message?.includes("unauthorized") || error.message?.includes("auth")) {
        errorContent = "I need you to be logged in to help you. Could you check your session?";
      }
      
      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, mode]);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="pt-8 pb-6 text-center fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">AI Tutor</h1>
        <p className="text-muted-foreground text-sm">
          Ask me anything about your studies
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Mode Selection Cards */}
        <div className="grid grid-cols-3 gap-3 fade-in-up">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.id}
                onClick={() => setMode(m.id as TutorMode)}
                className={cn(
                  "glass cursor-pointer flex flex-col items-center p-4 transition-all duration-300 border-border hover:shadow-md",
                  mode === m.id && "bg-primary text-primary-foreground shadow-md border-primary"
                )}
              >
                <Icon className="w-5 h-5 mb-2" />
                <span className="text-xs font-semibold mb-1 text-center">{m.label}</span>
                <span className="text-[10px] opacity-80 text-center">{m.description}</span>
              </Card>
            );
          })}
        </div>

        {/* Chat Interface */}
        <Card className="glass overflow-hidden shadow-md fade-in-up border-border" style={{ animationDelay: '0.1s' }}>
          <ScrollArea className="h-[450px] p-5" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Start a conversation
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    Ask questions, get explanations, or practice with your AI tutor
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex animate-in fade-in-50 slide-in-from-bottom-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "glass border-border"
                      )}
                    >
                      {msg.content.trim()}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-in fade-in-50">
                    <div className="glass rounded-2xl px-4 py-3 border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question..."
                className="glass border-border rounded-2xl px-4 py-6 text-sm focus:ring-2 focus:ring-primary"
                disabled={loading}
                autoComplete="off"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 min-w-[56px] shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

AITutor.displayName = 'AITutor';

export default AITutor;
