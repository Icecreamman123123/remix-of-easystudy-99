 import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, X, Sparkles, Mic, MicOff, Save, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useAuth } from "@/hooks/useAuth-simple";
import { useToast } from "@/hooks/use-toast";
import { lovableChatCompletion } from "@/lib/lovable-ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StudyChatProps {
  topic: string;
  gradeLevel: string;
  onClose: () => void;
}

export function StudyChat({ topic, gradeLevel, onClose }: StudyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const {
    conversations,
    createConversation,
    saveMessage,
    getConversationWithMessages,
    deleteConversation,
  } = useChatConversations();

  const { isListening, transcript, isSupported, toggleListening } = useVoiceInput({
    onResult: (text) => {
      setInput((prev) => prev + (prev ? " " : "") + text);
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSaveConversation = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save conversations",
        variant: "destructive",
      });
      return;
    }

    if (messages.length === 0) {
      toast({ title: "Nothing to save", description: "Start a conversation first" });
      return;
    }

    try {
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation(topic);
        if (!convId) throw new Error("Failed to create conversation");
        setCurrentConversationId(convId);
      }

      for (const msg of messages) {
        await saveMessage(convId, msg.role, msg.content);
      }

      setIsSaved(true);
      toast({ title: "Saved!", description: "Conversation saved successfully" });
    } catch (error) {
      console.error("Error saving conversation:", error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    }
  };

  const loadConversation = async (conversationId: string) => {
    const conv = await getConversationWithMessages(conversationId);
    if (conv && conv.messages) {
      setMessages(
        conv.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
      setCurrentConversationId(conversationId);
      setIsSaved(true);
      setShowHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setIsSaved(false);

    try {
      const assistantContent = await lovableChatCompletion(
        [
          {
            role: "system",
            content: `You are an AI study assistant. Topic: ${topic}. Target grade level: ${gradeLevel}. Be accurate and concise.`,
          },
          ...newMessages.map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
          })),
        ],
        { model: "google/gemini-2.5-flash", temperature: 0.6, maxTokens: 2048 }
      );

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    `Explain ${topic} in simple terms`,
    `What are the key concepts in ${topic}?`,
    `Give me an example of ${topic}`,
    `Why is ${topic} important?`,
  ];

  if (showHistory) {
    return (
      <Card className="h-full flex flex-col border-2 border-primary/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Saved Conversations
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No saved conversations yet</p>
                <p className="text-sm">Start chatting and save your conversations!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer group transition-colors"
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{conv.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-2 border-primary/30 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg min-w-0">
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
          <span className="truncate">Chat: {topic || "Your Studies"}</span>
          {isSaved && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Saved
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1 shrink-0">
          {user && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                title="View saved conversations"
                className="h-8 w-8"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveConversation}
                disabled={messages.length === 0 || isSaved}
                title="Save conversation"
                className="h-8 w-8"
              >
                <Save className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">AI Study Assistant</p>
                  <p className="text-muted-foreground text-sm">
                    Ask me anything about{" "}
                    <span className="font-medium text-foreground">{topic || "your studies"}</span>!
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Try asking:</p>
                <div className="flex flex-col gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-2 px-3 whitespace-normal text-left"
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          {isListening && (
            <div className="mb-2 p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-center animate-pulse">
              🎤 Listening... {transcript && <span className="text-muted-foreground">"{transcript}"</span>}
            </div>
          )}
          <div className="flex gap-2">
            {isSupported && (
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleListening}
                className="shrink-0"
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${topic || "anything"}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}