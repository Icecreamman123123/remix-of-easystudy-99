import { useEffect, useState } from "react";
import { getDecks, saveDeck, updateDeck, deleteDeck } from "@/lib/storage-simple";
import { useAuth } from "./useAuth-simple";

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

type StoredDeck = {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  createdAt: string;
  updatedAt: string;
  flashcards: Array<{
    id: string;
    question: string;
    answer: string;
    hint?: string;
    timesCorrect?: number;
    timesIncorrect?: number;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    createdAt?: string;
  }>;
};

function toDeckView(d: StoredDeck): FlashcardDeck {
  return {
    id: d.id,
    title: d.title,
    description: d.description ?? null,
    topic: d.topic ?? null,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    flashcard_count: Array.isArray(d.flashcards) ? d.flashcards.length : 0,
  };
}

function toSavedFlashcard(deckId: string, c: StoredDeck["flashcards"][number]): SavedFlashcard {
  return {
    id: c.id,
    deck_id: deckId,
    question: c.question,
    answer: c.answer,
    hint: c.hint ?? null,
    times_correct: c.timesCorrect ?? 0,
    times_incorrect: c.timesIncorrect ?? 0,
    last_reviewed_at: c.lastReviewedAt ?? null,
    next_review_at: c.nextReviewAt ?? null,
    created_at: c.createdAt ?? new Date().toISOString(),
  };
}

export function useFlashcardDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const all = (getDecks() as unknown as StoredDeck[]) || [];
      const mapped = all.map(toDeckView).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      setDecks(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [user]);

  const createDeck = async (title: string, topic?: string, description?: string) => {
    if (!user) return null;
    if (decks.length >= 10) {
      return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
    }
    const deck = saveDeck({ title, topic, description, flashcards: [] } as any) as unknown as StoredDeck;
    await fetchDecks();
    return toDeckView(deck);
  };

  const saveDeckWithFlashcards = async (title: string, flashcards: Array<{ question: string; answer: string; hint?: string }>, topic?: string) => {
    if (!user) return null;
    if (decks.length >= 10) {
      return { error: "limit_reached", message: "You can only create a maximum of 10 custom decks. Delete a deck to create a new one." } as any;
    }
    const now = new Date().toISOString();
    const storedCards = flashcards.map((fc) => ({
      id: `card_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      question: fc.question,
      answer: fc.answer,
      hint: fc.hint,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      createdAt: now,
    }));
    const deck = saveDeck({ title, topic, flashcards: storedCards } as any) as unknown as StoredDeck;
    await fetchDecks();
    return toDeckView(deck);
  };

  const getDeckFlashcards = async (deckId: string): Promise<SavedFlashcard[]> => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    const deck = all.find((d) => d.id === deckId);
    if (!deck) return [];
    return (deck.flashcards || []).map((c) => toSavedFlashcard(deckId, c)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  };

  const getDueCards = async (deckId: string): Promise<SavedFlashcard[]> => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    const deck = all.find((d) => d.id === deckId);
    if (!deck) return [];
    const now = new Date().toISOString();
    return (deck.flashcards || [])
      .map((c) => toSavedFlashcard(deckId, c))
      .filter((c) => !c.next_review_at || c.next_review_at <= now)
      .sort((a, b) => (a.next_review_at || "").localeCompare(b.next_review_at || ""));
  };

  const deleteDeckById = async (deckId: string) => {
    const ok = deleteDeck(deckId);
    await fetchDecks();
    return ok;
  };

  const updateFlashcardProgress = async (flashcardId: string, correct: boolean, nextReviewAt?: Date) => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    let changed = false;
    for (const deck of all) {
      const idx = (deck.flashcards || []).findIndex((c) => c.id === flashcardId);
      if (idx !== -1) {
        const card = deck.flashcards[idx];
        deck.flashcards[idx] = {
          ...card,
          timesCorrect: (card.timesCorrect ?? 0) + (correct ? 1 : 0),
          timesIncorrect: (card.timesIncorrect ?? 0) + (correct ? 0 : 1),
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: nextReviewAt ? nextReviewAt.toISOString() : null,
        };
        deck.updatedAt = new Date().toISOString();
        changed = true;
        updateDeck(deck.id, deck as any);
        break;
      }
    }
    if (changed) await fetchDecks();
  };

  const updateFlashcard = async (flashcardId: string, updates: { question?: string; answer?: string; hint?: string | null }) => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    for (const deck of all) {
      const idx = (deck.flashcards || []).findIndex((c) => c.id === flashcardId);
      if (idx !== -1) {
        const card = deck.flashcards[idx];
        deck.flashcards[idx] = {
          ...card,
          question: updates.question ?? card.question,
          answer: updates.answer ?? card.answer,
          hint: updates.hint ?? card.hint,
        };
        deck.updatedAt = new Date().toISOString();
        updateDeck(deck.id, deck as any);
        await fetchDecks();
        return true;
      }
    }
    return false;
  };

  const addFlashcard = async (deckId: string, flashcard: { question: string; answer: string; hint?: string }) => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    const deck = all.find((d) => d.id === deckId);
    if (!deck) return false;
    const now = new Date().toISOString();
    deck.flashcards = deck.flashcards || [];
    deck.flashcards.push({
      id: `card_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      question: flashcard.question,
      answer: flashcard.answer,
      hint: flashcard.hint,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      createdAt: now,
    });
    deck.updatedAt = now;
    updateDeck(deck.id, deck as any);
    await fetchDecks();
    return true;
  };

  const deleteFlashcard = async (flashcardId: string) => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    for (const deck of all) {
      const before = deck.flashcards?.length || 0;
      deck.flashcards = (deck.flashcards || []).filter((c) => c.id !== flashcardId);
      if ((deck.flashcards?.length || 0) !== before) {
        deck.updatedAt = new Date().toISOString();
        updateDeck(deck.id, deck as any);
        await fetchDecks();
        return true;
      }
    }
    return false;
  };

  const updateDeckInfo = async (deckId: string, updates: { title?: string; topic?: string; description?: string }) => {
    const all = (getDecks() as unknown as StoredDeck[]) || [];
    const deck = all.find((d) => d.id === deckId);
    if (!deck) return false;
    deck.title = updates.title ?? deck.title;
    deck.topic = updates.topic ?? deck.topic;
    deck.description = updates.description ?? deck.description;
    deck.updatedAt = new Date().toISOString();
    updateDeck(deck.id, deck as any);
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
    deleteDeck: deleteDeckById,
    updateFlashcardProgress,
    updateFlashcard,
    addFlashcard,
    deleteFlashcard,
    updateDeck: updateDeckInfo,
    refetch: fetchDecks,
  };
}
