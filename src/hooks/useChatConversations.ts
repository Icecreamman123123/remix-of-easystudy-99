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

const STORAGE_KEY = "lovable_chat_conversations_v1";

function loadAllConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatConversation[]) : [];
  } catch {
    return [];
  }
}

function saveAllConversations(conversations: ChatConversation[]) {
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
      const all = loadAllConversations();
      setConversations(
        all
          .filter((c) => c.id.startsWith(`${user.id}:`))
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      );
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
      const id = `${user.id}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const all = loadAllConversations();
      const conv: ChatConversation = {
        id,
        topic,
        created_at: now,
        updated_at: now,
        messages: [],
      };
      all.push(conv);
      saveAllConversations(all);
      await fetchConversations();
      return id;
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
      const all = loadAllConversations();
      const idx = all.findIndex((c) => c.id === conversationId && c.id.startsWith(`${user.id}:`));
      if (idx === -1) return;

      const msg: ChatMessage = {
        id: `${conversationId}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        role,
        content,
        created_at: new Date().toISOString(),
      };

      const existing = all[idx];
      const messages = [...(existing.messages || []), msg];
      all[idx] = { ...existing, messages, updated_at: msg.created_at };
      saveAllConversations(all);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const getConversationWithMessages = async (
    conversationId: string
  ): Promise<ChatConversation | null> => {
    if (!user) return null;

    try {
      const all = loadAllConversations();
      const conv = all.find((c) => c.id === conversationId && c.id.startsWith(`${user.id}:`));
      if (!conv) return null;
      return {
        ...conv,
        messages: (conv.messages || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
      };
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const all = loadAllConversations();
      const filtered = all.filter((c) => c.id !== conversationId);
      saveAllConversations(filtered);
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