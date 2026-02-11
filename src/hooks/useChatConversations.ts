 import { useState, useEffect } from "react";
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

const STORAGE_KEY = "easystudy-chat-conversations";

function loadAll(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatConversation[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(conversations: ChatConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
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
      const all = loadAll();
      setConversations(all.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)));
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
      const now = new Date().toISOString();
      const next: ChatConversation = {
        id: `conv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        topic,
        created_at: now,
        updated_at: now,
        messages: [],
      };
      const all = [next, ...loadAll()];
      saveAll(all);
      await fetchConversations();
      return next.id;
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
      const all = loadAll();
      const idx = all.findIndex((c) => c.id === conversationId);
      if (idx === -1) return;
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role,
        content,
        created_at: new Date().toISOString(),
      };
      const existing = all[idx];
      const updated: ChatConversation = {
        ...existing,
        updated_at: new Date().toISOString(),
        messages: [...(existing.messages || []), msg],
      };
      all[idx] = updated;
      saveAll(all);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const getConversationWithMessages = async (
    conversationId: string
  ): Promise<ChatConversation | null> => {
    if (!user) return null;

    try {
      const all = loadAll();
      return all.find((c) => c.id === conversationId) || null;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const all = loadAll().filter((c) => c.id !== conversationId);
      saveAll(all);
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