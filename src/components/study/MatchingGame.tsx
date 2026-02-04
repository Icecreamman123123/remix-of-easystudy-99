import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shuffle, Trophy, RotateCcw, Clock, Zap } from "lucide-react";
import { Flashcard } from "@/lib/study-api";
import { cn } from "@/lib/utils";

interface MatchingGameProps {
  flashcards: Flashcard[];
  onComplete: (score: number, total: number) => void;
}

interface MatchCard {
  id: string;
  content: string;
  type: "question" | "answer";
  pairId: number;
  matched: boolean;
  selected: boolean;
}

export function MatchingGame({ flashcards, onComplete }: MatchingGameProps) {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [wrongMatch, setWrongMatch] = useState<string[]>([]);

  const totalPairs = Math.min(flashcards.length, 8); // Max 8 pairs for a good game experience

  const initializeGame = useCallback(() => {
    const selectedFlashcards = flashcards.slice(0, totalPairs);
    const gameCards: MatchCard[] = [];

    selectedFlashcards.forEach((fc, index) => {
      gameCards.push({
        id: `q-${index}`,
        content: fc.question,
        type: "question",
        pairId: index,
        matched: false,
        selected: false,
      });
      gameCards.push({
        id: `a-${index}`,
        content: fc.answer,
        type: "answer",
        pairId: index,
        matched: false,
        selected: false,
      });
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setMatchedPairs(0);
    setAttempts(0);
    setTimeElapsed(0);
    setGameComplete(false);
    setWrongMatch([]);
  }, [flashcards, totalPairs]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);

  const handleCardClick = (cardId: string) => {
    if (!gameStarted) setGameStarted(true);

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched || selectedCards.includes(cardId)) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // Update card selection state
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, selected: true } : c))
    );

    if (newSelected.length === 2) {
      setAttempts((prev) => prev + 1);
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find((c) => c.id === firstId)!;
      const secondCard = cards.find((c) => c.id === secondId)!;

      // Check if it's a match (same pair, different types)
      if (
        firstCard.pairId === secondCard.pairId &&
        firstCard.type !== secondCard.type
      ) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.pairId === firstCard.pairId
                ? { ...c, matched: true, selected: false }
                : c
            )
          );
          setMatchedPairs((prev) => {
            const newCount = prev + 1;
            if (newCount === totalPairs) {
              setGameComplete(true);
              onComplete(totalPairs, attempts + 1);
            }
            return newCount;
          });
          setSelectedCards([]);
        }, 300);
      } else {
        // No match
        setWrongMatch([firstId, secondId]);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newSelected.includes(c.id) ? { ...c, selected: false } : c
            )
          );
          setSelectedCards([]);
          setWrongMatch([]);
        }, 800);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const accuracy = attempts > 0 ? Math.round((matchedPairs / attempts) * 100) : 0;

  if (gameComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in-50">
        <div className="text-center space-y-2">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold">Congratulations!</h2>
          <p className="text-muted-foreground">You matched all the pairs!</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{formatTime(timeElapsed)}</p>
            <p className="text-xs text-muted-foreground">Time</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{attempts}</p>
            <p className="text-xs text-muted-foreground">Attempts</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
        </div>

        <Button onClick={initializeGame} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeElapsed)}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {attempts} attempts
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {matchedPairs}/{totalPairs} matched
          </span>
          <Progress value={(matchedPairs / totalPairs) * 100} className="w-24" />
        </div>
        <Button variant="ghost" size="sm" onClick={initializeGame}>
          <Shuffle className="h-4 w-4 mr-1" />
          Restart
        </Button>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || selectedCards.length >= 2}
            className={cn(
              "p-4 min-h-[100px] rounded-lg border-2 text-sm font-medium transition-all duration-300 text-left",
              card.matched && "bg-primary/20 border-primary text-primary cursor-default opacity-60",
              card.selected && !wrongMatch.includes(card.id) && "bg-primary/10 border-primary ring-2 ring-primary/50",
              wrongMatch.includes(card.id) && "bg-destructive/20 border-destructive animate-shake",
              !card.matched && !card.selected && "bg-card hover:bg-muted border-border hover:border-primary/50 cursor-pointer",
              card.type === "question" ? "border-l-4 border-l-primary" : "border-l-4 border-l-accent"
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {card.type === "question" ? "Q" : "A"}
              </span>
              <span className="line-clamp-4">{card.content}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Match each question with its correct answer
      </p>
    </div>
  );
}
