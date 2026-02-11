import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Volume2, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { callStudyAI, AIModel, AIExpertise } from "@/lib/study-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface VocabularyCard {
  word: string;
  pronunciation: string;
  definition: string;
  relatedWords: string[];
  imagePrompt?: string;
}

interface VocabularyCardViewerProps {
  cards: VocabularyCard[];
  topic?: string;
  gradeLevel?: string;
}

export function parseVocabularyCards(response: string): VocabularyCard[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.filter((item: any) =>
        typeof item.word === "string" &&
        typeof item.pronunciation === "string" &&
        typeof item.definition === "string" &&
        Array.isArray(item.relatedWords)
      );
    }
    return [];
  } catch (e) {
    console.error("parseVocabularyCards failed:", e);
    return [];
  }
}

export function VocabularyCardViewer({ cards: initialCards, topic, gradeLevel }: VocabularyCardViewerProps) {
  const [cards, setCards] = useState<VocabularyCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [generatingCard, setGeneratingCard] = useState(false);

  // Sync if parent passes new cards
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  const card = cards[currentIndex];

  useEffect(() => {
    if (!card || imageUrls[currentIndex] || loadingImages[currentIndex]) return;

    const generateImage = async () => {
      setLoadingImages((prev) => ({ ...prev, [currentIndex]: true }));
      try {
        const prompt = card.imagePrompt || `A simple, cute, hand-drawn doodle illustration of "${card.word}". Black ink sketch style on white background, educational vocabulary card illustration, minimalist.`;
        const { data, error } = await supabase.functions.invoke("generate-vocab-image", {
          body: { prompt, word: card.word },
        });
        if (!error && data?.imageUrl) {
          setImageUrls((prev) => ({ ...prev, [currentIndex]: data.imageUrl }));
        }
      } catch (err) {
        console.error("Image generation failed:", err);
      } finally {
        setLoadingImages((prev) => ({ ...prev, [currentIndex]: false }));
      }
    };

    generateImage();
  }, [currentIndex, card]);

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleAddCard = async () => {
    if (!newWord.trim()) return;
    setGeneratingCard(true);
    try {
      const contentWithInstructions = `Topic: ${newWord.trim()}\n\n[Instructions: Generate exactly 1 items.\nDifficulty level: medium.]`;
      const result = await callStudyAI("vocabulary-cards", contentWithInstructions, newWord.trim(), "medium", gradeLevel || "8");
      const newCards = parseVocabularyCards(result);
      if (newCards.length > 0) {
        setCards(prev => [...prev, ...newCards]);
        setCurrentIndex(cards.length); // Jump to newly added card
        setAddDialogOpen(false);
        setNewWord("");
      }
    } catch (err) {
      console.error("Failed to generate vocab card:", err);
    } finally {
      setGeneratingCard(false);
    }
  };

  if (!card) return null;

  return (
    <div className="space-y-4">
      {/* Navigation + Add button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} disabled={generatingCard}>
            <Plus className="h-4 w-4 mr-1" /> Add Word
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex === cards.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Vocabulary Card - notebook paper style matching reference */}
      <div className="rounded-xl border-2 border-border overflow-hidden bg-background shadow-md relative"
        style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, hsl(var(--border) / 0.25) 28px)",
        }}
      >
        {/* Red margin line */}
        <div className="absolute left-16 top-0 bottom-0 w-[2px] bg-destructive/20 z-10" />

        {/* Card number top-right */}
        <div className="absolute top-3 right-4 text-lg font-bold text-muted-foreground/40 z-10">
          #{currentIndex + 1}
        </div>

        {/* Word title bar */}
        <div className="px-6 py-4 border-b-2 border-border bg-primary/10">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black uppercase tracking-wider text-primary">
              {card.word}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => speak(card.word)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground font-mono mt-0.5 block">
            ({card.pronunciation})
          </span>
        </div>

        {/* Main content: drawing left, definition right */}
        <div className="grid grid-cols-2 min-h-[220px]">
          {/* Left: Drawing */}
          <div className="flex items-center justify-center p-6 border-r-2 border-dashed border-border/50">
            {loadingImages[currentIndex] ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <span className="text-xs font-medium">Drawing...</span>
              </div>
            ) : imageUrls[currentIndex] ? (
              <img
                src={imageUrls[currentIndex]}
                alt={`Illustration of ${card.word}`}
                className="max-w-full max-h-[180px] object-contain"
              />
            ) : (
              <div className="text-7xl opacity-20 select-none">🎨</div>
            )}
          </div>

          {/* Right: Definition */}
          <div className="p-6 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Definition
            </p>
            <p className="text-base leading-relaxed font-medium">
              {card.definition}
            </p>
          </div>
        </div>

        {/* Bottom: Related words with dashes */}
        <div className="border-t-2 border-border px-6 py-3 bg-muted/30">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Related Words
          </p>
          <p className="text-sm font-medium">
            {card.relatedWords.join(" — ")}
          </p>
        </div>
      </div>

      {/* Card dots */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-1.5 flex-wrap">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === currentIndex ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Add Word Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Another Word
            </DialogTitle>
            <DialogDescription>
              Enter a word to generate another vocabulary card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-vocab-word">Word</Label>
              <Input
                id="new-vocab-word"
                placeholder="e.g. Mitosis, Democracy, Velocity..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newWord.trim() && !generatingCard) {
                    handleAddCard();
                  }
                }}
                autoFocus
                disabled={generatingCard}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={generatingCard}>
              Cancel
            </Button>
            <Button onClick={handleAddCard} disabled={!newWord.trim() || generatingCard}>
              {generatingCard ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
