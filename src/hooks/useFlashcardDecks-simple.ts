import { useState, useEffect } from "react";
import { FlashcardDeck, saveDeck, getDecks, updateDeck, deleteDeck } from "@/lib/storage-simple";
import { useAuth } from "./useAuth-simple";
import { useToast } from "./use-toast";

export function useFlashcardDecks() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDecks = () => {
    setLoading(true);
    try {
      const allDecks = getDecks();
      // Filter by user if logged in (in real app, this would be server-side)
      const userDecks = user ? allDecks : allDecks.slice(0, 3); // Show limited decks for demo
      setDecks(userDecks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      toast({
        title: "Error",
        description: "Failed to load decks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  const createDeck = async (deckData: {
    title: string;
    description?: string;
    topic?: string;
    flashcards: unknown[];
  }) => {
    try {
      const newDeck = saveDeck(deckData);
      await fetchDecks();
      toast({
        title: "Deck Created",
        description: "Your flashcard deck has been saved locally.",
      });
      return newDeck;
    } catch (error) {
      console.error("Error creating deck:", error);
      toast({
        title: "Error",
        description: "Failed to create deck.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateDeckData = async (id: string, updates: Partial<FlashcardDeck>) => {
    try {
      const updated = updateDeck(id, updates);
      if (updated) {
        await fetchDecks();
        return updated;
      }
      throw new Error("Deck not found");
    } catch (error) {
      console.error("Error updating deck:", error);
      toast({
        title: "Error",
        description: "Failed to update deck.",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeDeck = async (id: string) => {
    try {
      const success = deleteDeck(id);
      if (success) {
        await fetchDecks();
        toast({
          title: "Deck Deleted",
          description: "Deck removed successfully.",
        });
        return true;
      }
      throw new Error("Deck not found");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast({
        title: "Error",
        description: "Failed to delete deck.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    decks,
    loading,
    fetchDecks,
    createDeck,
    updateDeck: updateDeckData,
    deleteDeck: removeDeck,
  };
}
