import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth-simple";
import type { Flashcard } from "@/lib/study-api";

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
  flashcard_count?: number;
}

export interface SavedFlashcard {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  hint: string | null;
  times_correct: number;
  times_incorrect: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  created_at: string;
}

export function useFlashcardDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecks = async () => {
    if (!user) {
      setDecks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("flashcard_decks")
      .select("*, flashcards(count)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching decks:", error);
    } else {
      const decksWithCount = data?.map((deck: any) => ({
        ...deck,
        flashcard_count: deck.flashcards?.[0]?.count || 0,
      })) || [];
      setDecks(decksWithCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  const createDeck = async (title: string, topic?: string, description?: string) => {
    if (!user) return null;

    // Check deck limit (max 10 decks)
    if (decks.length >= 10) {
      console.warn("Deck limit reached: maximum 10 decks allowed");
      return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
    }

    const { data, error } = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: user.id,
        title,
        topic,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating deck:", error);
      // Detect database-enforced deck limit
      const msg = (error as any)?.message || (error as any)?.details || "";
      if (msg.includes("deck_limit_exceeded")) {
        return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
      }
      return null;
    }

    await fetchDecks();
    return data;
  };

  const saveDeckWithFlashcards = async (
    title: string,
    flashcards: Flashcard[],
    topic?: string
  ) => {
    if (!user) return null;

    // Check deck limit (max 10 decks)
    if (decks.length >= 10) {
      console.warn("Deck limit reached: maximum 10 decks allowed");
      return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
    }

    // Create the deck
    const { data: deck, error: deckError } = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: user.id,
        title,
        topic,
      })
      .select()
      .single();

    if (deckError || !deck) {
      console.error("Error creating deck:", deckError);
      const msg = (deckError as any)?.message || (deckError as any)?.details || "";
      if (msg.includes("deck_limit_exceeded")) {
        return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
      }
      return null;
    }

    // Insert flashcards
    const flashcardsToInsert = flashcards.map((fc) => ({
      deck_id: deck.id,
      question: fc.question,
      answer: fc.answer,
      hint: fc.hint || null,
    }));

    const { error: cardsError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert);

    if (cardsError) {
      console.error("Error inserting flashcards:", cardsError);
      // Clean up the deck if flashcards failed
      await supabase.from("flashcard_decks").delete().eq("id", deck.id);
      return null;
    }

    await fetchDecks();
    return deck;
  };

  const getDeckFlashcards = async (deckId: string): Promise<SavedFlashcard[]> => {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at");

    if (error) {
      console.error("Error fetching flashcards:", error);
      return [];
    }

    return data || [];
  };

  const deleteDeck = async (deckId: string) => {
    const { error } = await supabase
      .from("flashcard_decks")
      .delete()
      .eq("id", deckId);

    if (error) {
      console.error("Error deleting deck:", error);
      return false;
    }

    await fetchDecks();
    return true;
  };

  const updateFlashcardProgress = async (
    flashcardId: string,
    correct: boolean,
    nextReviewAt?: Date
  ) => {
    // Get current values first
    const { data: current } = await supabase
      .from("flashcards")
      .select("times_correct, times_incorrect")
      .eq("id", flashcardId)
      .single();

    if (current) {
      const updateData = correct
        ? { 
            times_correct: current.times_correct + 1, 
            last_reviewed_at: new Date().toISOString(),
            next_review_at: nextReviewAt?.toISOString() || null,
          }
        : { 
            times_incorrect: current.times_incorrect + 1, 
            last_reviewed_at: new Date().toISOString(),
            next_review_at: nextReviewAt?.toISOString() || null,
          };

      await supabase
        .from("flashcards")
        .update(updateData)
        .eq("id", flashcardId);
    }
  };

  const getDueCards = async (deckId: string): Promise<SavedFlashcard[]> => {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .or(`next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`)
      .order("next_review_at", { ascending: true, nullsFirst: true });

    if (error) {
      console.error("Error fetching due cards:", error);
      return [];
    }

    return data || [];
  };

  const updateFlashcard = async (
    flashcardId: string,
    updates: { question?: string; answer?: string; hint?: string | null }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("flashcards")
      .update(updates)
      .eq("id", flashcardId);

    if (error) {
      console.error("Error updating flashcard:", error);
      return false;
    }
    return true;
  };

  const addFlashcard = async (
    deckId: string,
    flashcard: { question: string; answer: string; hint?: string }
  ): Promise<boolean> => {
    const { error } = await supabase.from("flashcards").insert({
      deck_id: deckId,
      question: flashcard.question,
      answer: flashcard.answer,
      hint: flashcard.hint || null,
    });

    if (error) {
      console.error("Error adding flashcard:", error);
      return false;
    }
    await fetchDecks();
    return true;
  };

  const deleteFlashcard = async (flashcardId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcardId);

    if (error) {
      console.error("Error deleting flashcard:", error);
      return false;
    }
    await fetchDecks();
    return true;
  };

  const updateDeck = async (
    deckId: string,
    updates: { title?: string; topic?: string; description?: string }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("flashcard_decks")
      .update(updates)
      .eq("id", deckId);

    if (error) {
      console.error("Error updating deck:", error);
      return false;
    }
    await fetchDecks();
    return true;
  };

  return {
    decks,
    loading,
    createDeck,
    saveDeckWithFlashcards,
    getDeckFlashcards,
    getDueCards,
    deleteDeck,
    updateFlashcardProgress,
    updateFlashcard,
    addFlashcard,
    deleteFlashcard,
    updateDeck,
    refetch: fetchDecks,
  };
}
