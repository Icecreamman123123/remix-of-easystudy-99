 import { useState, useRef, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { MessageCircle, Send, Loader2, X, Sparkles } from "lucide-react";
 import { cn } from "@/lib/utils";
 import ReactMarkdown from "react-markdown";
 
 interface Message {
   role: "user" | "assistant";
   content: string;
 }
 
 interface StudyChatProps {
   topic: string;
   gradeLevel: string;
   onClose: () => void;
 }
 
 const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`;
 
 export function StudyChat({ topic, gradeLevel, onClose }: StudyChatProps) {
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
   // Auto-scroll to bottom when new messages arrive
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   // Focus input on mount
   useEffect(() => {
     inputRef.current?.focus();
   }, []);
 
   const sendMessage = async () => {
     if (!input.trim() || isLoading) return;
 
     const userMessage: Message = { role: "user", content: input.trim() };
     const newMessages = [...messages, userMessage];
     setMessages(newMessages);
     setInput("");
     setIsLoading(true);
 
     let assistantContent = "";
 
     try {
       const resp = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({
           messages: newMessages,
           topic,
           gradeLevel,
         }),
       });
 
       if (!resp.ok || !resp.body) {
         const errorData = await resp.json().catch(() => ({}));
         throw new Error(errorData.error || "Failed to get response");
       }
 
       const reader = resp.body.getReader();
       const decoder = new TextDecoder();
       let textBuffer = "";
 
       // Add empty assistant message
       setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
 
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
 
         textBuffer += decoder.decode(value, { stream: true });
 
         let newlineIndex: number;
         while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
           let line = textBuffer.slice(0, newlineIndex);
           textBuffer = textBuffer.slice(newlineIndex + 1);
 
           if (line.endsWith("\r")) line = line.slice(0, -1);
           if (line.startsWith(":") || line.trim() === "") continue;
           if (!line.startsWith("data: ")) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === "[DONE]") break;
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) {
               assistantContent += content;
               setMessages((prev) => {
                 const updated = [...prev];
                 updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                 return updated;
               });
             }
           } catch {
             textBuffer = line + "\n" + textBuffer;
             break;
           }
         }
       }
     } catch (error) {
       console.error("Chat error:", error);
       setMessages((prev) => [
         ...prev.slice(0, -1), // Remove empty assistant message if exists
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
 
   return (
     <Card className="h-full flex flex-col">
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
         <CardTitle className="flex items-center gap-2 text-lg">
           <MessageCircle className="h-5 w-5 text-primary" />
           Chat about: {topic || "Your Studies"}
         </CardTitle>
         <Button variant="ghost" size="icon" onClick={onClose}>
           <X className="h-4 w-4" />
         </Button>
       </CardHeader>
       <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
         <ScrollArea className="flex-1 p-4" ref={scrollRef}>
           {messages.length === 0 ? (
             <div className="space-y-4">
               <div className="text-center py-8 space-y-3">
                 <Sparkles className="h-12 w-12 text-primary mx-auto opacity-50" />
                 <p className="text-muted-foreground">
                   Ask me anything about <span className="font-semibold text-foreground">{topic || "your studies"}</span>!
                 </p>
               </div>
               <div className="space-y-2">
                 <p className="text-xs text-muted-foreground text-center">Try asking:</p>
                 <div className="flex flex-wrap gap-2 justify-center">
                   {suggestedQuestions.map((q, i) => (
                     <Button
                       key={i}
                       variant="outline"
                       size="sm"
                       className="text-xs"
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
                 <div
                   key={i}
                   className={cn(
                     "flex",
                     msg.role === "user" ? "justify-end" : "justify-start"
                   )}
                 >
                   <div
                     className={cn(
                       "max-w-[85%] rounded-lg px-4 py-2",
                       msg.role === "user"
                         ? "bg-primary text-primary-foreground"
                         : "bg-muted"
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
               {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                 <div className="flex justify-start">
                   <div className="bg-muted rounded-lg px-4 py-2">
                     <Loader2 className="h-4 w-4 animate-spin" />
                   </div>
                 </div>
               )}
             </div>
           )}
         </ScrollArea>
 
         <div className="p-4 border-t">
           <div className="flex gap-2">
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
               {isLoading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <Send className="h-4 w-4" />
               )}
             </Button>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }