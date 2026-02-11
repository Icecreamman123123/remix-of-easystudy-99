import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export function VocabularyCardViewer({ cards, topic }: VocabularyCardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

  const card = cards[currentIndex];

  // Generate image for current card
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

  if (!card) return null;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>
        <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex === cards.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Vocabulary Card - styled like the reference image */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-[repeating-linear-gradient(transparent,transparent_27px,hsl(var(--border)/0.3)_28px)] relative">
        {/* Card number */}
        <div className="absolute top-3 right-4 text-lg font-bold text-muted-foreground/50">
          {currentIndex + 1}
        </div>

        <CardContent className="p-0">
          {/* Word Header */}
          <div className="bg-primary/15 px-6 py-3 border-b">
            <h2 className="text-2xl font-extrabold uppercase tracking-wide text-primary">
              {card.word}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground font-mono">
                {card.pronunciation}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => speak(card.word)}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Main content area - two columns like the reference */}
          <div className="grid grid-cols-2 min-h-[250px]">
            {/* Left: Illustration */}
            <div className="border-r border-border/30 flex items-center justify-center p-6">
              {loadingImages[currentIndex] ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs">Drawing...</span>
                </div>
              ) : imageUrls[currentIndex] ? (
                <img
                  src={imageUrls[currentIndex]}
                  alt={`Illustration of ${card.word}`}
                  className="max-w-full max-h-[200px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-6xl opacity-30 select-none">🎨</div>
              )}
            </div>

            {/* Right: Definition */}
            <div className="p-6 flex flex-col justify-center">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Def:</p>
              <p className="text-base leading-relaxed">{card.definition}</p>
            </div>
          </div>

          {/* Related Words - bottom section */}
          <div className="border-t border-border/30 px-6 py-3 bg-muted/20">
            <div className="flex items-center flex-wrap gap-2">
              {card.relatedWords.map((word, i) => (
                <span key={i} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {word}
                  </Badge>
                  {i < card.relatedWords.length - 1 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card dots */}
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
    </div>
  );
}
