import { useCallback, useState } from "react";
import { useAuth } from "./useAuth-simple";
import { useFlashcardDecks } from "./useFlashcardDecks";
import { getDecks, type FlashcardDeck } from "@/lib/storage-simple";

export interface SharedDeck {
  id: string;
  deck_id: string;
  shared_by: string;
  share_code: string;
  is_public: boolean;
  created_at: string;
  expires_at: string | null;
}

interface LocalSharedDeckRecord extends SharedDeck {
  deck_snapshot: FlashcardDeck;
}

const SHARES_KEY = "easystudy-shared-decks";

function loadShares(): LocalSharedDeckRecord[] {
  try {
    const raw = localStorage.getItem(SHARES_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalSharedDeckRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveShares(shares: LocalSharedDeckRecord[]) {
  localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
}

function makeCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useDeckSharing() {
  const { user } = useAuth();
  const { createDeck } = useFlashcardDecks();
  const [loading, setLoading] = useState(false);

  const createShareLink = useCallback(
    async (deckId: string): Promise<string | null> => {
      if (!user) return null;
      setLoading(true);
      try {
        const existing = loadShares().find((s) => s.deck_id === deckId && s.shared_by === user.id);
        if (existing) return existing.share_code;

        const deck = getDecks().find((d) => d.id === deckId);
        if (!deck) return null;

        const rec: LocalSharedDeckRecord = {
          id: `share_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          share_code: makeCode(),
          deck_id: deckId,
          shared_by: user.id,
          is_public: true,
          created_at: new Date().toISOString(),
          expires_at: null,
          deck_snapshot: deck,
        };

        const updated = [rec, ...loadShares()];
        saveShares(updated);
        return rec.share_code;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getSharedDeck = useCallback(async (shareCode: string) => {
    setLoading(true);
    try {
      const rec = loadShares().find((s) => s.share_code === shareCode && s.is_public);
      if (!rec) return null;

      return {
        deck: {
          title: rec.deck_snapshot.title,
          topic: rec.deck_snapshot.topic || null,
          description: rec.deck_snapshot.description || null,
        },
        flashcards: (rec.deck_snapshot.flashcards || []).map((fc) => ({
          question: fc.question,
          answer: fc.answer,
          hint: fc.hint,
        })),
        shareInfo: rec,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const copySharedDeck = useCallback(
    async (shareCode: string): Promise<boolean> => {
      if (!user) return false;
      setLoading(true);
      try {
        const rec = loadShares().find((s) => s.share_code === shareCode && s.is_public);
        if (!rec) return false;

        const deck = rec.deck_snapshot;
        const res = await createDeck({
          title: `${deck.title} (Copy)`,
          description: deck.description,
          topic: deck.topic,
          flashcards: (deck.flashcards || []).map((fc) => ({
            question: fc.question,
            answer: fc.answer,
            hint: fc.hint,
          })),
        });

        return !!res;
      } catch (e) {
        console.error("Error copying deck:", e);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [createDeck, user]
  );

  const deleteShare = useCallback(
    async (deckId: string): Promise<boolean> => {
      if (!user) return false;
      const updated = loadShares().filter((s) => !(s.deck_id === deckId && s.shared_by === user.id));
      saveShares(updated);
      return true;
    },
    [user]
  );

  return {
    createShareLink,
    getSharedDeck,
    copySharedDeck,
    deleteShare,
    loading,
  };
}
