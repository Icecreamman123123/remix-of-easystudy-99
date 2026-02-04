import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Play, Pause, Heart, Zap, Trophy, Timer } from "lucide-react";
import type { Flashcard } from "@/lib/study-api";

interface SubwaySurferGameProps {
  flashcards: Flashcard[];
  topic?: string;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
}

interface GameQuestion {
  question: string;
  answer: string;
  isTrue: boolean;
  statement: string;
}

type Lane = "left" | "center" | "right";

export function SubwaySurferGame({ 
  flashcards, 
  topic, 
  onClose,
  onComplete 
}: SubwaySurferGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "paused" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [currentLane, setCurrentLane] = useState<Lane>("center");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [obstaclePosition, setObstaclePosition] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [speed, setSpeed] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);
  const gameLoopRef = useRef<number>();
  const timerRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate time limit based on progress (15s at start, 10s at end)
  const getTimeLimit = useCallback(() => {
    const progress = currentQuestionIndex / Math.max(questions.length - 1, 1);
    return Math.round(15 - (5 * progress)); // 15s -> 10s
  }, [currentQuestionIndex, questions.length]);

  // Generate true/false questions from flashcards
  useEffect(() => {
    const generated: GameQuestion[] = flashcards.flatMap((card) => {
      const questions: GameQuestion[] = [];
      
      // True statement
      questions.push({
        question: card.question,
        answer: card.answer,
        isTrue: true,
        statement: `${card.question} → ${card.answer}`
      });
      
      // False statement (swap with another card's answer if possible)
      if (flashcards.length > 1) {
        const otherCards = flashcards.filter(c => c.answer !== card.answer);
        if (otherCards.length > 0) {
          const randomOther = otherCards[Math.floor(Math.random() * otherCards.length)];
          questions.push({
            question: card.question,
            answer: card.answer,
            isTrue: false,
            statement: `${card.question} → ${randomOther.answer}`
          });
        }
      }
      
      return questions;
    });
    
    // Shuffle questions
    setQuestions(generated.sort(() => Math.random() - 0.5));
  }, [flashcards]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = useCallback((answer: boolean) => {
    if (gameState !== "playing" || !currentQuestion) return;
    
    const isCorrect = answer === currentQuestion.isTrue;
    
    if (isCorrect) {
      // Bonus points for answering quickly
      const timeBonus = Math.floor(timeLeft / 3);
      setScore(prev => prev + (10 * (1 + streak * 0.1)) + timeBonus);
      setStreak(prev => prev + 1);
      setShowFeedback("correct");
    } else {
      setLives(prev => prev - 1);
      setStreak(0);
      setShowFeedback("wrong");
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeout(() => {
      setShowFeedback(null);
      // Return to center lane after answering
      setCurrentLane("center");
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setObstaclePosition(0);
        setTimeLeft(getTimeLimit());
      } else {
        endGame();
      }
    }, 500);
  }, [gameState, currentQuestion, streak, currentQuestionIndex, questions.length, timeLeft, getTimeLimit]);

  const moveLane = useCallback((direction: "left" | "right") => {
    if (gameState !== "playing") return;
    
    setCurrentLane(prev => {
      if (direction === "left") {
        if (prev === "right") return "center";
        if (prev === "center") return "left";
        return prev;
      } else {
        if (prev === "left") return "center";
        if (prev === "center") return "right";
        return prev;
      }
    });
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          if (gameState !== "playing") return;
          moveLane("left");
          handleAnswer(true); // Left = True
          break;
        case "ArrowRight":
        case "d":
          if (gameState !== "playing") return;
          moveLane("right");
          handleAnswer(false); // Right = False
          break;
        case " ":
          e.preventDefault();
          // Only allow pause when game is over or not started - no pausing during play
          if (gameState === "paused") {
            setGameState("playing");
          }
          // Cannot pause during gameplay - removed pause functionality
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, moveLane, handleAnswer]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, currentQuestionIndex]);

  // Handle time running out (question hits player)
  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Question hit the player - lose a life
      setLives(prev => prev - 1);
      setStreak(0);
      setShowFeedback("wrong");
      
      setTimeout(() => {
        setShowFeedback(null);
        // Return to center lane
        setCurrentLane("center");
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setObstaclePosition(0);
          setTimeLeft(getTimeLimit());
        } else {
          endGame();
        }
      }, 500);
    }
  }, [timeLeft, gameState, currentQuestionIndex, questions.length, getTimeLimit]);

  // Game loop for obstacle animation (visual only now)
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timeLimit = getTimeLimit();
    const animate = () => {
      // Sync obstacle position with timer
      setObstaclePosition(((timeLimit - timeLeft) / timeLimit) * 85);
      gameLoopRef.current = requestAnimationFrame(animate);
    };
    
    gameLoopRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, timeLeft, getTimeLimit]);


  // Check for game over
  useEffect(() => {
    if (lives <= 0 && gameState === "playing") {
      endGame();
    }
  }, [lives, gameState]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setStreak(0);
    setCurrentQuestionIndex(0);
    setObstaclePosition(0);
    setCurrentLane("center");
    setTimeLeft(15); // Start with 15 seconds
  };

  const endGame = () => {
    setGameState("gameover");
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onComplete?.(score, questions.length);
  };

  const getLanePosition = (lane: Lane) => {
    switch (lane) {
      case "left": return "left-[15%]";
      case "center": return "left-1/2 -translate-x-1/2";
      case "right": return "right-[15%]";
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Study Runner {topic && `- ${topic}`}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            disabled={gameState === "playing"}
            title={gameState === "playing" ? "Cannot exit during game" : "Exit"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Stats bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart 
                  key={i} 
                  className={`h-4 w-4 ${i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} 
                />
              ))}
            </div>
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              {Math.floor(score)}
            </Badge>
            {streak > 1 && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                🔥 {streak}x
              </Badge>
            )}
            {gameState === "playing" && (
              <Badge 
                variant="outline" 
                className={`gap-1 ${timeLeft <= 5 ? "text-red-500 border-red-500 animate-pulse" : "text-primary border-primary"}`}
              >
                <Timer className="h-3 w-3" />
                {timeLeft}s
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        
        <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-1" />
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Game Area */}
        <div 
          ref={containerRef}
          className="relative h-[400px] bg-gradient-to-b from-muted/30 to-muted overflow-hidden"
        >
          {/* Track lines */}
          <div className="absolute inset-0">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute right-1/3 top-0 bottom-0 w-px bg-border/50" />
          </div>
          
          {/* Lane labels */}
          <div className="absolute top-2 left-0 right-0 flex justify-around px-8">
            <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500">
              ← TRUE
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500">
              FALSE →
            </Badge>
          </div>
          
          {gameState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold">Ready to Run?</h3>
              <p className="text-muted-foreground text-center max-w-xs">
                Swipe left for TRUE, right for FALSE. Answer before the question reaches you!
              </p>
              <div className="text-sm text-muted-foreground">
                <p>⬅️ Arrow Left / A = TRUE</p>
                <p>➡️ Arrow Right / D = FALSE</p>
                <p className="text-orange-500">⚠️ No breaks during game!</p>
              </div>
              <Button onClick={startGame} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Start Game
              </Button>
            </div>
          )}
          
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-20">
              <Trophy className="h-12 w-12 text-yellow-500" />
              <h3 className="text-xl font-bold">Game Over!</h3>
              <p className="text-2xl font-bold">{Math.floor(score)} points</p>
              <p className="text-muted-foreground">
                {currentQuestionIndex}/{questions.length} questions answered
              </p>
              <div className="flex gap-2">
                <Button onClick={startGame} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Exit
                </Button>
              </div>
            </div>
          )}
          
          {/* Obstacle/Question coming down */}
          {gameState === "playing" && currentQuestion && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-[80%] transition-all duration-75"
              style={{ top: `${obstaclePosition}%` }}
            >
              <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-lg text-center">
                <p className="font-medium text-sm">{currentQuestion.statement}</p>
              </div>
            </div>
          )}
          
          {/* Player */}
          <div 
            className={`absolute bottom-4 w-12 h-16 transition-all duration-150 ${getLanePosition(currentLane)}`}
          >
            <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏃</span>
            </div>
          </div>
          
          {/* Feedback overlay */}
          {showFeedback && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${
              showFeedback === "correct" ? "bg-green-500/20" : "bg-red-500/20"
            }`}>
              <span className="text-6xl">
                {showFeedback === "correct" ? "✓" : "✗"}
              </span>
            </div>
          )}
          
          {/* Touch controls for mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-24 flex md:hidden">
            <button 
              className="flex-1 flex items-center justify-center active:bg-green-500/20"
              onClick={() => { moveLane("left"); handleAnswer(true); }}
            >
              <span className="text-2xl">👈 TRUE</span>
            </button>
            <button 
              className="flex-1 flex items-center justify-center active:bg-red-500/20"
              onClick={() => { moveLane("right"); handleAnswer(false); }}
            >
              <span className="text-2xl">FALSE 👉</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
