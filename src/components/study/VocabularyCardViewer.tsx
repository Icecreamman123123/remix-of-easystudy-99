import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Loader2, Plus, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { callStudyAI } from "@/lib/study-api";
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

const CARD_ACCENTS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

export function VocabularyCardViewer({ cards: initialCards, topic, gradeLevel }: VocabularyCardViewerProps) {
  const [cards, setCards] = useState<VocabularyCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [generatingCard, setGeneratingCard] = useState(false);

  useEffect(() => { setCards(initialCards); }, [initialCards]);

  const card = cards[currentIndex];
  const accent = CARD_ACCENTS[currentIndex % CARD_ACCENTS.length];

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
        setCurrentIndex(cards.length);
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
    <div className="space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {currentIndex + 1} / {cards.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} disabled={generatingCard}>
            <Plus className="h-4 w-4 mr-1" /> Add Word
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex === cards.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Card */}
      <div className={`rounded-2xl border-2 border-border border-l-4 ${accent} bg-card shadow-lg overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className="px-6 py-5 bg-muted/40 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{card.word}</h2>
                <span className="text-sm text-muted-foreground font-mono">/{card.pronunciation}/</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => speak(card.word)}>
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-5 min-h-[200px]">
          {/* Image */}
          <div className="md:col-span-2 flex items-center justify-center p-6 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50">
            {loadingImages[currentIndex] ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <span className="text-xs font-medium">Generating illustration...</span>
              </div>
            ) : imageUrls[currentIndex] ? (
              <img
                src={imageUrls[currentIndex]}
                alt={`Illustration of ${card.word}`}
                className="max-w-full max-h-[180px] object-contain rounded-lg"
              />
            ) : (
              <div className="text-6xl opacity-15 select-none">🎨</div>
            )}
          </div>

          {/* Definition */}
          <div className="md:col-span-3 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Definition</p>
            <p className="text-base leading-relaxed">{card.definition}</p>
          </div>
        </div>

        {/* Related Words */}
        <div className="border-t px-6 py-3 bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Related Words</p>
          <div className="flex flex-wrap gap-2">
            {card.relatedWords.map((w, i) => (
              <Badge key={i} variant="outline" className="text-sm font-medium">
                {w}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
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
                  if (e.key === "Enter" && newWord.trim() && !generatingCard) handleAddCard();
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
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
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
