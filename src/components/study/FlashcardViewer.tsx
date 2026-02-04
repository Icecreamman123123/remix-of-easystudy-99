import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Check, X } from "lucide-react";
import type { Flashcard } from "@/lib/study-api";

interface ExtendedFlashcard extends Flashcard {
  id?: string;
}

interface FlashcardViewerProps {
  flashcards: ExtendedFlashcard[];
  onComplete?: (results: { correct: number; total: number }) => void;
  onCardResult?: (cardId: string, correct: boolean) => void;
}

export function FlashcardViewer({ flashcards, onComplete, onCardResult }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = (gotIt: boolean) => {
    const newResults = [...results, gotIt];
    setResults(newResults);
    setIsFlipped(false);
    setShowHint(false);

    // Call onCardResult if card has ID (from saved decks)
    if (currentCard.id && onCardResult) {
      onCardResult(currentCard.id, gotIt);
    }

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const correct = newResults.filter(Boolean).length;
      onComplete?.({ correct, total: flashcards.length });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setResults([]);
  };

  if (!currentCard) {
    return (
      <div className="text-center p-8 animate-in fade-in-50 duration-300">
        <p className="text-muted-foreground">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        <div className="flex gap-1">
          {results.map((r, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${r ? 'bg-primary scale-110' : 'bg-destructive'}`}
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      <Card 
        className="min-h-[250px] cursor-pointer transition-all duration-500 hover:shadow-lg group perspective-1000"
        onClick={handleFlip}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px] relative">
          <div 
            className={`text-center transition-all duration-500 ${
              isFlipped 
                ? 'animate-in fade-in-0 zoom-in-95' 
                : 'animate-in fade-in-0 zoom-in-95'
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              {isFlipped ? "Answer" : "Question"}
            </p>
            <p className="text-lg font-medium">
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
            {!isFlipped && showHint && currentCard.hint && (
              <p className="mt-4 text-sm text-muted-foreground italic animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                💡 {currentCard.hint}
              </p>
            )}
          </div>
          <div className="absolute bottom-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Click to flip
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
          className="transition-transform hover:scale-105"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          {!isFlipped && currentCard.hint && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHint(!showHint)}
              className="transition-all duration-200 hover:scale-105"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Hint
            </Button>
          )}
          {isFlipped && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleNext(false)} 
                className="text-destructive transition-all duration-200 hover:scale-105 hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-2" />
                Missed
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleNext(true)}
                className="transition-all duration-200 hover:scale-105"
              >
                <Check className="h-4 w-4 mr-2" />
                Got it!
              </Button>
            </>
          )}
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleReset}
          className="transition-transform hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
