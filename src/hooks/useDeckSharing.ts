import { useState } from "react";
import { useAuth } from "./useAuth-simple";
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

type StoredShare = {
  share_code: string;
  created_at: string;
  shared_by: string;
  deck_id: string;
  deck: { title: string; topic: string | null; description: string | null };
  flashcards: Array<{ question: string; answer: string; hint?: string }>;
};

const STORAGE_KEY = "lovable_shared_decks_v1";

function loadShares(): StoredShare[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredShare[]) : [];
  } catch {
    return [];
  }
}

function saveShares(shares: StoredShare[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
}

function genShareCode() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

export function useDeckSharing() {
  const { user } = useAuth();
  const { saveDeckWithFlashcards, getDeckFlashcards, decks } = useFlashcardDecks();
  const [loading, setLoading] = useState(false);

  const getDeckSnapshot = async (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return null;
    const cards = await getDeckFlashcards(deckId);
    return {
      deck: {
        title: deck.title,
        topic: deck.topic ?? null,
        description: deck.description ?? null,
      },
      flashcards: cards.map((c) => ({ question: c.question, answer: c.answer, hint: c.hint || undefined })),
    };
  };

  const createShareLink = async (deckId: string): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      const shares = loadShares();
      const existing = shares.find((s) => s.shared_by === user.id && s.deck_id === deckId);
      if (existing) {
        setLoading(false);
        return existing.share_code;
      }

      const snap = await getDeckSnapshot(deckId);
      if (!snap) {
        setLoading(false);
        return null;
      }

      const share_code = genShareCode();
      const created_at = new Date().toISOString();
      shares.push({
        share_code,
        created_at,
        shared_by: user.id,
        deck_id: deckId,
        deck: snap.deck,
        flashcards: snap.flashcards,
      });
      saveShares(shares);
      setLoading(false);
      return share_code;
    } catch (error) {
      console.error("Error in createShareLink:", error);
      setLoading(false);
      return null;
    }
  };

  const getSharedDeck = async (shareCode: string) => {
    setLoading(true);

    try {
      const shares = loadShares();
      const share = shares.find((s) => s.share_code === shareCode);
      if (!share) {
        setLoading(false);
        return null;
      }

      setLoading(false);
      return {
        deck: share.deck,
        flashcards: share.flashcards,
        shareInfo: { share_code: share.share_code, shared_by: share.shared_by, created_at: share.created_at },
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

    const shares = loadShares();
    const filtered = shares.filter((s) => !(s.shared_by === user.id && s.deck_id === deckId));
    saveShares(filtered);
    return true;
  };

  return {
    createShareLink,
    getSharedDeck,
    copySharedDeck,
    deleteShare,
    loading,
  };
}
