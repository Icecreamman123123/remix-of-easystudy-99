import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Check, X, Keyboard, Loader2, Brain } from "lucide-react";
import type { Flashcard } from "@/lib/study-api";
import { localAnswerCheck, checkAnswerWithAI } from "@/lib/answer-checker";
import { WrongAnswer } from "@/hooks/useSmartLearning";

interface ExtendedFlashcard extends Flashcard {
  id?: string;
}

interface FlashcardViewerProps {
  flashcards: ExtendedFlashcard[];
  onComplete?: (results: { correct: number; total: number }) => void;
  onCardResult?: (cardId: string, correct: boolean) => void;
  onWrongAnswer?: (answer: WrongAnswer) => void;
}

export function FlashcardViewer({ flashcards, onComplete, onCardResult, onWrongAnswer }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // AI marking state
  const [typeMode, setTypeMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    if (!typeMode) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim() || isChecking) return;

    setIsChecking(true);

    // First try local check for instant feedback
    const localResult = localAnswerCheck(userAnswer, currentCard.answer);

    if (localResult.isCorrect) {
      setFeedback({ isCorrect: true, message: "Correct!" });
      setIsChecking(false);
    } else {
      // Verify with AI for potential paraphrasing
      try {
        const aiResult = await checkAnswerWithAI(
          userAnswer,
          currentCard.answer,
          currentCard.question
        );
        setFeedback({
          isCorrect: aiResult.isCorrect,
          message: aiResult.feedback
        });
      } catch {
        setFeedback({
          isCorrect: localResult.isCorrect,
          message: localResult.isCorrect ? "Correct!" : "Not quite right."
        });
      } finally {
        setIsChecking(false);
      }
    }

    setIsFlipped(true);
  };

  const handleNext = (gotIt: boolean) => {
    const newResults = [...results, gotIt];
    setResults(newResults);
    setIsFlipped(false);
    setShowHint(false);
    setUserAnswer("");
    setFeedback(null);

    // Record wrong answer for smart learning
    if (!gotIt && onWrongAnswer) {
      onWrongAnswer({
        question: currentCard.question,
        correctAnswer: currentCard.answer,
        userAnswer: typeMode ? userAnswer : "(self-marked as missed)",
      });
    }

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

  const handleTypeSubmit = () => {
    if (feedback) {
      handleNext(feedback.isCorrect);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
      setUserAnswer("");
      setFeedback(null);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setResults([]);
    setUserAnswer("");
    setFeedback(null);
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
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="type-mode"
            checked={typeMode}
            onCheckedChange={(checked) => {
              setTypeMode(checked);
              setUserAnswer("");
              setFeedback(null);
              setIsFlipped(false);
            }}
          />
          <Label htmlFor="type-mode" className="text-sm flex items-center gap-1 cursor-pointer">
            <Keyboard className="h-4 w-4" />
            Type Answer
          </Label>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center">
        {results.map((r, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${r
                ? 'bg-gradient-to-r from-primary to-blue-500 scale-110 glow-sm'
                : 'bg-destructive'
              }`}
          />
        ))}
      </div>

      <Card
        className={`min-h-[250px] transition-all duration-500 card-hover-glow group ${!typeMode ? 'cursor-pointer' : ''}`}
        onClick={handleFlip}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
          <div
            className={`text-center transition-all duration-500 w-full ${isFlipped
                ? 'animate-in fade-in-0 zoom-in-95'
                : 'animate-in fade-in-0 zoom-in-95'
              }`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              {isFlipped ? "Answer" : "Question"}
            </p>

            {!isFlipped ? (
              <>
                <p className="text-lg font-medium">{currentCard.question}</p>

                {/* Type mode input */}
                {typeMode && (
                  <div className="mt-6 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <Input
                      ref={inputRef}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="text-center"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCheckAnswer();
                        }
                      }}
                      disabled={isChecking || !!feedback}
                    />
                    <Button
                      onClick={handleCheckAnswer}
                      disabled={!userAnswer.trim() || isChecking || !!feedback}
                      className="w-full"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Check Answer
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!isFlipped && showHint && currentCard.hint && (
                  <p className="mt-4 text-sm text-muted-foreground italic animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    💡 {currentCard.hint}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-medium">{currentCard.answer}</p>

                {/* AI Feedback for type mode */}
                {typeMode && feedback && (
                  <div className={`mt-4 p-3 rounded-lg animate-in fade-in-50 ${feedback.isCorrect
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-destructive/10 border border-destructive/30"
                    }`}>
                    <p className="text-sm flex items-center gap-2 justify-center">
                      {feedback.isCorrect ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        {feedback.message}
                      </span>
                    </p>
                    {typeMode && userAnswer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your answer: "{userAnswer}"
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {!typeMode && (
            <div className="absolute bottom-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Click to flip
            </div>
          )}
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
          {!isFlipped && currentCard.hint && !typeMode && (
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
            typeMode && feedback ? (
              <Button
                size="sm"
                onClick={handleTypeSubmit}
                className="transition-all duration-200 hover:scale-105"
              >
                {feedback.isCorrect ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Continue
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Next Card
                  </>
                )}
              </Button>
            ) : (
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
            )
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
