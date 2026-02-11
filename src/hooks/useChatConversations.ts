 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth-simple";
 import { useToast } from "./use-toast";
 
 export interface ChatMessage {
   id: string;
   role: "user" | "assistant";
   content: string;
   created_at: string;
 }
 
 export interface ChatConversation {
   id: string;
   topic: string;
   created_at: string;
   updated_at: string;
   messages?: ChatMessage[];
 }
 
 export function useChatConversations() {
   const [conversations, setConversations] = useState<ChatConversation[]>([]);
   const [loading, setLoading] = useState(true);
   const { user } = useAuth();
   const { toast } = useToast();
 
   const fetchConversations = async () => {
     if (!user) {
       setConversations([]);
       setLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("chat_conversations")
         .select("*")
         .order("updated_at", { ascending: false });
 
       if (error) throw error;
       setConversations(data || []);
     } catch (error) {
       console.error("Error fetching conversations:", error);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchConversations();
   }, [user]);
 
   const createConversation = async (topic: string): Promise<string | null> => {
     if (!user) return null;
 
     try {
       const { data, error } = await supabase
         .from("chat_conversations")
         .insert({ user_id: user.id, topic })
         .select()
         .single();
 
       if (error) throw error;
       await fetchConversations();
       return data.id;
     } catch (error) {
       console.error("Error creating conversation:", error);
       toast({
         title: "Error",
         description: "Failed to create conversation",
         variant: "destructive",
       });
       return null;
     }
   };
 
   const saveMessage = async (
     conversationId: string,
     role: "user" | "assistant",
     content: string
   ) => {
     if (!user) return;
 
     try {
       const { error } = await supabase
         .from("chat_messages")
         .insert({ conversation_id: conversationId, role, content });
 
       if (error) throw error;
     } catch (error) {
       console.error("Error saving message:", error);
     }
   };
 
   const getConversationWithMessages = async (
     conversationId: string
   ): Promise<ChatConversation | null> => {
     if (!user) return null;
 
     try {
       const { data: conversation, error: convError } = await supabase
         .from("chat_conversations")
         .select("*")
         .eq("id", conversationId)
         .single();
 
       if (convError) throw convError;
 
       const { data: messages, error: msgError } = await supabase
         .from("chat_messages")
         .select("*")
         .eq("conversation_id", conversationId)
         .order("created_at", { ascending: true });
 
       if (msgError) throw msgError;
 
       return {
         ...conversation,
         messages: messages as ChatMessage[],
       };
     } catch (error) {
       console.error("Error fetching conversation:", error);
       return null;
     }
   };
 
   const deleteConversation = async (conversationId: string) => {
     if (!user) return;
 
     try {
       const { error } = await supabase
         .from("chat_conversations")
         .delete()
         .eq("id", conversationId);
 
       if (error) throw error;
       await fetchConversations();
       toast({
         title: "Deleted",
         description: "Conversation deleted successfully",
       });
     } catch (error) {
       console.error("Error deleting conversation:", error);
       toast({
         title: "Error",
         description: "Failed to delete conversation",
         variant: "destructive",
       });
     }
   };
 
   return {
     conversations,
     loading,
     createConversation,
     saveMessage,
     getConversationWithMessages,
     deleteConversation,
     refetch: fetchConversations,
   };
 }