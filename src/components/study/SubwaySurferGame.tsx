import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Play, Heart, Zap, Trophy, Timer, ArrowLeft, ArrowRight } from "lucide-react";
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
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [currentLane, setCurrentLane] = useState<Lane>("center");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [obstaclePosition, setObstaclePosition] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const gameLoopRef = useRef<number>();
  const timerRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scenery Animation State
  const [bgOffset, setBgOffset] = useState(0);

  // Calculate time limit based on progress (15s at start, 8s at end - faster gameplay)
  const getTimeLimit = useCallback(() => {
    const progress = currentQuestionIndex / Math.max(questions.length - 1, 1);
    return Math.round(15 - (7 * progress)); // 15s -> 8s
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

      // False statement
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
      // Bonus points logic
      const timeBonus = Math.floor(timeLeft / 3);
      setScore(prev => prev + (10 * (1 + streak * 0.2)) + timeBonus);
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
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentQuestionIndex]);

  // Handle time running out
  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing") {
      if (timerRef.current) clearInterval(timerRef.current);

      setLives(prev => prev - 1);
      setStreak(0);
      setShowFeedback("wrong");

      setTimeout(() => {
        setShowFeedback(null);
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

  // Game loop 
  useEffect(() => {
    if (gameState !== "playing") return;

    const timeLimit = getTimeLimit();
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Move obstacle
      setObstaclePosition(((timeLimit - timeLeft) / timeLimit) * 85);

      // Animate background speed lines
      setBgOffset(prev => (prev + delta * 0.5) % 100);

      gameLoopRef.current = requestAnimationFrame(animate);
    };

    gameLoopRef.current = requestAnimationFrame(animate);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
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
    setTimeLeft(15);
  };

  const endGame = () => {
    setGameState("gameover");
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    onComplete?.(score, questions.length);
  };

  const getLanePosition = (lane: Lane) => {
    switch (lane) {
      case "left": return "left-[15%] rotate-[-5deg]";
      case "center": return "left-1/2 -translate-x-1/2";
      case "right": return "right-[15%] rotate-[5deg]";
    }
  };

  return (
    <Card className="relative overflow-hidden apple-card border-none shadow-xl h-[600px] flex flex-col">
      <CardHeader className="pb-2 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Study Runner <span className="text-muted-foreground font-normal text-sm ml-2 hidden sm:inline">{topic}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 transition-all ${i < lives ? "text-red-500 fill-red-500 scale-100" : "text-muted-foreground/30 scale-75"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
              <Trophy className="h-3.5 w-3.5" />
              {Math.floor(score)}
            </div>
            {streak > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-200 animate-in zoom-in">
                🔥 {streak}x
              </div>
            )}
            {gameState === "playing" && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${timeLeft <= 5 ? "bg-red-500/10 text-red-600 border-red-200 animate-pulse" : "bg-blue-500/10 text-blue-600 border-blue-200"
                }`}>
                <Timer className="h-3.5 w-3.5" />
                <span className="font-mono font-bold w-6 text-center">{timeLeft}s</span>
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Q {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-1 mt-3" />
      </CardHeader>

      <CardContent className="p-0 flex-1 relative">
        {/* Game Area */}
        <div
          ref={containerRef}
          className="absolute inset-0 bg-slate-950 overflow-hidden flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)"
          }}
        >
          {/* Moving Floor / Grid */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(transparent 95%, #4f46e5 95%), linear-gradient(90deg, transparent 95%, #4f46e5 95%)",
              backgroundSize: "40px 40px",
              transform: "perspective(500px) rotateX(60deg) translateY(0)",
              transformOrigin: "bottom",
              animation: gameState === "playing" ? "gridMove 1s linear infinite" : "none"
            }}
          />
          <style>{`
            @keyframes gridMove {
              0% { background-position: 0 0; }
              100% { background-position: 0 40px; }
            }
            .speed-line {
              position: absolute;
              background: rgba(255,255,255,0.1);
              width: 2px;
              height: 100px;
              animation: rain 0.5s linear infinite;
            }
            @keyframes rain {
              0% { transform: translateY(-100px); opacity: 0; }
              50% { opacity: 0.5; }
              100% { transform: translateY(600px); opacity: 0; }
            }
          `}</style>

          {/* Speed Lines */}
          {gameState === "playing" && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="speed-line" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random()}s`,
              animationDuration: `${0.3 + Math.random() * 0.4}s`
            }} />
          ))}

          {/* Lanes */}
          <div className="absolute inset-0 w-full max-w-md mx-auto h-full">
            <div className="absolute left-[15%] top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute right-[15%] top-0 bottom-0 w-px bg-white/10" />

            {/* Lane Indicators */}
            <div className="absolute bottom-32 left-0 right-0 flex justify-between px-12 opacity-50">
              <div className={`text-center transition-opacity ${currentLane === 'left' ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-16 h-16 rounded-full border-4 border-green-500/50 flex items-center justify-center mb-2">
                  <span className="text-green-500 font-bold text-xl">T</span>
                </div>
              </div>
              <div className={`text-center transition-opacity ${currentLane === 'right' ? 'opacity-100' : 'opacity-30'}`}>
                <div className="w-16 h-16 rounded-full border-4 border-red-500/50 flex items-center justify-center mb-2">
                  <span className="text-red-500 font-bold text-xl">F</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ready Overlay */}
          {gameState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/60 backdrop-blur-sm z-20 animate-in fade-in">
              <div className="p-6 bg-card rounded-2xl shadow-2xl border text-center max-w-sm apple-card">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Ready?</h3>
                <p className="text-muted-foreground mb-6">
                  Swipe left for <span className="text-green-500 font-bold">TRUE</span>, right for <span className="text-red-500 font-bold">FALSE</span>.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-muted rounded-xl border text-sm">
                    <ArrowLeft className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <span className="font-bold">Left</span> = True
                  </div>
                  <div className="p-3 bg-muted rounded-xl border text-sm">
                    <ArrowRight className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    <span className="font-bold">Right</span> = False
                  </div>
                </div>
                <Button onClick={startGame} size="lg" className="w-full hover-scale text-lg h-12 rounded-xl">
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-md z-20 animate-in zoom-in-95">
              <div className="p-8 bg-card rounded-3xl shadow-2xl border apple-card text-center max-w-sm w-full mx-4">
                <div className="mb-4 inline-flex p-4 rounded-full bg-yellow-400/20 ring-8 ring-yellow-400/10">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
                <h3 className="text-3xl font-bold mb-1">Game Over!</h3>
                <div className="text-4xl font-extrabold text-primary my-4 tracking-tight">
                  {Math.floor(score)}
                </div>
                <p className="text-muted-foreground mb-6">
                  You answered {Math.floor(score / 10)} questions correctly!
                </p>

                <div className="grid gap-3">
                  <Button onClick={startGame} size="lg" className="h-12 text-lg rounded-xl hover-scale">
                    Play Again
                  </Button>
                  <Button variant="outline" onClick={onClose} className="h-12 rounded-xl">
                    Exit
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Obstacle/Question */}
          {gameState === "playing" && currentQuestion && (
            <div
              className="absolute left-0 right-0 flex justify-center transition-all duration-75 px-4"
              style={{
                top: `${obstaclePosition}%`,
                opacity: Math.min(1, obstaclePosition / 30),
                transform: `scale(${0.5 + (obstaclePosition / 100) * 0.5}) translateY(${obstaclePosition * 0.5}px)`
              }}
            >
              <div className="bg-card/95 backdrop-blur-md border-2 border-primary/50 text-card-foreground rounded-xl p-4 shadow-[0_0_30px_rgba(var(--primary),0.3)] text-center max-w-xs animate-in zoom-in-50">
                <p className="font-bold text-lg leading-snug">{currentQuestion.statement}</p>
              </div>
            </div>
          )}

          {/* Player Avatar */}
          <div
            className={`absolute bottom-8 w-20 h-24 transition-all duration-200 ease-out-back ${getLanePosition(currentLane)}`}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-x-2 top-0 bottom-0 bg-primary rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-b-4 border-primary-foreground/20 transform transition-transform group-hover:scale-105">
                <span className="text-4xl filter drop-shadow-md">🏃</span>
              </div>
              {/* Shadow blob */}
              <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/40 blur-md rounded-full" />
            </div>
          </div>

          {/* Feedback Splash */}
          {showFeedback && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in zoom-in duration-300 ${showFeedback === "correct" ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
              <div className={`transform scale-150 font-black text-8xl drop-shadow-2xl ${showFeedback === "correct" ? "text-green-500" : "text-red-500"
                }`}>
                {showFeedback === "correct" ? "✓" : "✗"}
              </div>
            </div>
          )}

          {/* Mobile Controls */}
          <div className="absolute bottom-0 left-0 right-0 h-32 flex md:hidden z-30">
            <button
              className="flex-1 flex flex-col items-center justify-center active:bg-green-500/20 active:backdrop-blur-sm transition-colors"
              onClick={() => { moveLane("left"); handleAnswer(true); }}
            >
              <ArrowLeft className="h-8 w-8 text-white/50 mb-1" />
              <span className="text-green-400 font-bold text-sm tracking-wider">TRUE</span>
            </button>
            <div className="w-px bg-white/10 h-full" />
            <button
              className="flex-1 flex flex-col items-center justify-center active:bg-red-500/20 active:backdrop-blur-sm transition-colors"
              onClick={() => { moveLane("right"); handleAnswer(false); }}
            >
              <ArrowRight className="h-8 w-8 text-white/50 mb-1" />
              <span className="text-red-400 font-bold text-sm tracking-wider">FALSE</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
