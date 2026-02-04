import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useFlashcardDecks } from "./useFlashcardDecks";
import type { Flashcard } from "@/lib/study-api";

export interface SharedDeck {
  id: string;
  deck_id: string;
  shared_by: string;
  share_code: string;
  is_public: boolean;
  created_at: string;
  expires_at: string | null;
}

export function useDeckSharing() {
  const { user } = useAuth();
  const { saveDeckWithFlashcards } = useFlashcardDecks();
  const [loading, setLoading] = useState(false);

  const createShareLink = async (deckId: string): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      // Check if share already exists
      const { data: existing } = await supabase
        .from("shared_decks")
        .select("share_code")
        .eq("deck_id", deckId)
        .eq("shared_by", user.id)
        .single();

      if (existing) {
        setLoading(false);
        return existing.share_code;
      }

      // Create new share
      const { data, error } = await supabase
        .from("shared_decks")
        .insert({
          deck_id: deckId,
          shared_by: user.id,
          is_public: true,
        })
        .select("share_code")
        .single();

      if (error) {
        console.error("Error creating share:", error);
        setLoading(false);
        return null;
      }

      setLoading(false);
      return data.share_code;
    } catch (error) {
      console.error("Error in createShareLink:", error);
      setLoading(false);
      return null;
    }
  };

  const getSharedDeck = async (shareCode: string) => {
    setLoading(true);

    try {
      // Get the shared deck info
      const { data: shareData, error: shareError } = await supabase
        .from("shared_decks")
        .select("*")
        .eq("share_code", shareCode)
        .eq("is_public", true)
        .single();

      if (shareError || !shareData) {
        console.error("Shared deck not found:", shareError);
        setLoading(false);
        return null;
      }

      // Get the deck details
      const { data: deckData, error: deckError } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("id", shareData.deck_id)
        .single();

      if (deckError || !deckData) {
        console.error("Deck not found:", deckError);
        setLoading(false);
        return null;
      }

      // Get the flashcards
      const { data: flashcards, error: cardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", shareData.deck_id);

      if (cardsError) {
        console.error("Error fetching flashcards:", cardsError);
        setLoading(false);
        return null;
      }

      setLoading(false);
      return {
        deck: deckData,
        flashcards: flashcards || [],
        shareInfo: shareData,
      };
    } catch (error) {
      console.error("Error in getSharedDeck:", error);
      setLoading(false);
      return null;
    }
  };

  const copySharedDeck = async (shareCode: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const sharedData = await getSharedDeck(shareCode);
      if (!sharedData) {
        setLoading(false);
        return false;
      }

      const { deck, flashcards } = sharedData;

      // Create flashcard objects for saving
      const flashcardsToSave: Flashcard[] = flashcards.map((fc) => ({
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint || undefined,
      }));

      // Save as new deck
      const newDeck = await saveDeckWithFlashcards(
        `${deck.title} (Copy)`,
        flashcardsToSave,
        deck.topic || undefined
      );

      if (!newDeck) {
        setLoading(false);
        return false;
      }

      // Record the copy
      await supabase.from("deck_copies").insert({
        original_deck_id: deck.id,
        copied_deck_id: newDeck.id,
        copied_by: user.id,
      });

      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error copying deck:", error);
      setLoading(false);
      return false;
    }
  };

  const deleteShare = async (deckId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("shared_decks")
      .delete()
      .eq("deck_id", deckId)
      .eq("shared_by", user.id);

    return !error;
  };

  return {
    createShareLink,
    getSharedDeck,
    copySharedDeck,
    deleteShare,
    loading,
  };
}
