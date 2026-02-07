import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Timer, Zap, Trophy, RotateCcw, Flame, Target, Star, Loader2, Brain } from "lucide-react";
import { Flashcard } from "@/lib/study-api";
import { cn } from "@/lib/utils";
import { localAnswerCheck, checkAnswerWithAI } from "@/lib/answer-checker";
import { useSmartLearning } from "@/hooks/useSmartLearning";
import { SmartLearningInsights } from "./SmartLearningInsights";

interface SpeedChallengeProps {
  flashcards: Flashcard[];
  onComplete: (score: number, total: number) => void;
  topic?: string;
  disableSmartLearning?: boolean;
}
 
 const GAME_DURATION = 60; // seconds
 const BASE_POINTS = 100;
 const TIME_BONUS_MULTIPLIER = 2;
 
export function SpeedChallenge({ flashcards, onComplete, topic, disableSmartLearning }: SpeedChallengeProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    wrongAnswers,
    insights,
    isAnalyzing,
    recordWrongAnswer,
    clearWrongAnswers,
    analyzeWeaknesses,
  } = useSmartLearning();
 
   // Shuffle cards on mount and game start
   const shuffleCards = useCallback(() => {
     const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
     setShuffledCards(shuffled);
   }, [flashcards]);
 
   useEffect(() => {
     shuffleCards();
   }, [shuffleCards]);
 
   // Timer countdown
   useEffect(() => {
     if (gameState !== "playing") return;
 
     const interval = setInterval(() => {
       setTimeLeft((prev) => {
         if (prev <= 1) {
           setGameState("finished");
           onComplete(correctCount, totalAttempts);
           return 0;
         }
         return prev - 1;
       });
     }, 1000);
 
     return () => clearInterval(interval);
   }, [gameState, correctCount, totalAttempts, onComplete]);
 
   // Focus input when playing
   useEffect(() => {
     if (gameState === "playing" && inputRef.current) {
       inputRef.current.focus();
     }
   }, [gameState, currentIndex]);
 
   const startGame = () => {
     shuffleCards();
     setGameState("playing");
     setTimeLeft(GAME_DURATION);
     setCurrentIndex(0);
     setScore(0);
     setStreak(0);
     setMaxStreak(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setUserAnswer("");
    setShowFeedback(null);
    clearWrongAnswers();
  };
 
   const normalizeAnswer = (text: string) => {
     return text.toLowerCase().trim().replace(/[^\w\s]/g, "");
   };
 
   const checkAnswer = () => {
     if (!userAnswer.trim() || isCheckingAnswer) return;
 
     const currentCard = shuffledCards[currentIndex % shuffledCards.length];
     
     // Use local check for immediate feedback (no time deduction)
     const localResult = localAnswerCheck(userAnswer, currentCard.answer);
 
     setTotalAttempts((prev) => prev + 1);
     setIsCheckingAnswer(true);
 
     if (localResult.isCorrect) {
       // Correct!
       const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;
       const timeBonus = Math.floor((timeLeft / GAME_DURATION) * TIME_BONUS_MULTIPLIER);
       const pointsEarned = Math.floor(BASE_POINTS * streakMultiplier * (1 + timeBonus * 0.1));
 
       setScore((prev) => prev + pointsEarned);
       setStreak((prev) => {
         const newStreak = prev + 1;
         setMaxStreak((max) => Math.max(max, newStreak));
         return newStreak;
       });
       setCorrectCount((prev) => prev + 1);
       setShowFeedback("correct");
       setAiFeedback(null);
       setIsCheckingAnswer(false);
       
       // Move to next question after brief feedback
       setTimeout(() => {
         setCurrentIndex((prev) => prev + 1);
         setUserAnswer("");
         setShowFeedback(null);
         inputRef.current?.focus();
       }, 300);
    } else {
      // Local check says wrong, but let's verify with AI (async, no time deduction)
      setShowFeedback("wrong");
      
      const currentCardRef = currentCard; // Capture for async
      const currentUserAnswer = userAnswer;
      
      // Start AI check in background
      checkAnswerWithAI(userAnswer, currentCard.answer, currentCard.question)
        .then((aiResult) => {
          if (aiResult.isCorrect) {
            // AI says it's correct! Award points retroactively
            const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;
            const pointsEarned = Math.floor(BASE_POINTS * streakMultiplier);
            
            setScore((prev) => prev + pointsEarned);
            setStreak((prev) => {
              const newStreak = prev + 1;
              setMaxStreak((max) => Math.max(max, newStreak));
              return newStreak;
            });
            setCorrectCount((prev) => prev + 1);
            setShowFeedback("correct");
            setAiFeedback(`✨ AI verified: ${aiResult.feedback}`);
          } else {
            setStreak(0);
            setAiFeedback(aiResult.feedback);
            // Record wrong answer for smart learning
            if (!disableSmartLearning) {
              recordWrongAnswer({
                question: currentCardRef.question,
                correctAnswer: currentCardRef.answer,
                userAnswer: currentUserAnswer,
                topic,
              });
            }
          }
        })
        .catch(() => {
          // If AI check fails, stick with local result
          setStreak(0);
          // Record as wrong
          if (!disableSmartLearning) {
            recordWrongAnswer({
              question: currentCardRef.question,
              correctAnswer: currentCardRef.answer,
              userAnswer: currentUserAnswer,
              topic,
            });
          }
        })
         .finally(() => {
           setIsCheckingAnswer(false);
           // Move to next question
           setTimeout(() => {
             setCurrentIndex((prev) => prev + 1);
             setUserAnswer("");
             setShowFeedback(null);
             setAiFeedback(null);
             inputRef.current?.focus();
           }, 1500);
         });
     }
   };
 
   const skipQuestion = () => {
     setStreak(0);
     setTotalAttempts((prev) => prev + 1);
     setCurrentIndex((prev) => prev + 1);
     setUserAnswer("");
     inputRef.current?.focus();
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter") {
       e.preventDefault();
       checkAnswer();
     } else if (e.key === "Escape" && !isCheckingAnswer) {
       skipQuestion();
     }
   };
 
   const getStreakColor = () => {
     if (streak >= 10) return "text-accent-foreground";
     if (streak >= 5) return "text-destructive";
     if (streak >= 3) return "text-primary";
     return "text-muted-foreground";
   };
 
   if (gameState === "ready") {
     return (
       <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in-50">
         <div className="text-center space-y-2">
           <Zap className="h-16 w-16 text-primary mx-auto animate-pulse" />
           <h2 className="text-2xl font-bold">Speed Challenge</h2>
           <p className="text-muted-foreground max-w-md">
             Answer as many questions as you can in {GAME_DURATION} seconds!
             Build streaks for bonus points.
           </p>
         </div>
 
         <div className="grid grid-cols-3 gap-4 text-center">
           <div className="p-4 bg-muted rounded-lg">
             <Timer className="h-6 w-6 text-primary mx-auto mb-1" />
             <p className="text-sm font-medium">{GAME_DURATION}s</p>
             <p className="text-xs text-muted-foreground">Time Limit</p>
           </div>
           <div className="p-4 bg-muted rounded-lg">
             <Target className="h-6 w-6 text-primary mx-auto mb-1" />
             <p className="text-sm font-medium">{shuffledCards.length}</p>
             <p className="text-xs text-muted-foreground">Questions</p>
           </div>
           <div className="p-4 bg-muted rounded-lg">
             <Flame className="h-6 w-6 text-primary mx-auto mb-1" />
             <p className="text-sm font-medium">x2</p>
             <p className="text-xs text-muted-foreground">Max Streak</p>
           </div>
         </div>
 
         <Button onClick={startGame} size="lg" className="gap-2">
           <Zap className="h-5 w-5" />
           Start Challenge
         </Button>
       </div>
     );
   }
 
   if (gameState === "finished") {
     const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
     const avgTimePerQuestion = totalAttempts > 0 ? ((GAME_DURATION - timeLeft) / totalAttempts).toFixed(1) : 0;
 
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in-50">
          <div className="text-center space-y-2">
            <Trophy className="h-16 w-16 text-accent-foreground mx-auto animate-bounce" />
            <h2 className="text-2xl font-bold">Challenge Complete!</h2>
            <p className="text-4xl font-bold text-primary">{score.toLocaleString()} pts</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Attempted</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-5 w-5 text-destructive" />
                <p className="text-2xl font-bold text-primary">{maxStreak}</p>
              </div>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Average: {avgTimePerQuestion}s per question
          </p>

          {/* Smart Learning Insights */}
          {!disableSmartLearning && (
            <div className="w-full max-w-md">
              <SmartLearningInsights
                insights={insights}
                wrongAnswers={wrongAnswers}
                isAnalyzing={isAnalyzing}
                onAnalyze={() => analyzeWeaknesses(topic)}
              />
            </div>
          )}

          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </div>
      );
    }
 
   const currentCard = shuffledCards[currentIndex % shuffledCards.length];
   const timePercent = (timeLeft / GAME_DURATION) * 100;
 
   return (
     <div className="space-y-4">
       {/* Header Stats */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Badge variant="secondary" className="text-lg px-3 py-1">
             <Star className="h-4 w-4 mr-1" />
             {score.toLocaleString()}
           </Badge>
           {streak > 0 && (
             <Badge variant="outline" className={cn("animate-pulse", getStreakColor())}>
               <Flame className="h-3 w-3 mr-1" />
               {streak}x Streak
             </Badge>
           )}
         </div>
         <Badge
           variant={timeLeft <= 10 ? "destructive" : "secondary"}
           className={cn("text-lg px-3 py-1", timeLeft <= 10 && "animate-pulse")}
         >
           <Timer className="h-4 w-4 mr-1" />
           {timeLeft}s
         </Badge>
       </div>
 
       {/* Timer Progress */}
       <Progress
         value={timePercent}
         className={cn("h-2", timeLeft <= 10 && "animate-pulse")}
       />
 
       {/* Question Card */}
       <Card
         className={cn(
           "transition-all duration-200",
           showFeedback === "correct" && "ring-2 ring-primary bg-primary/5",
           showFeedback === "wrong" && "ring-2 ring-destructive bg-destructive/5"
         )}
       >
         <CardContent className="p-6 space-y-4">
           <div className="text-center">
             <p className="text-xs text-muted-foreground mb-2">
               Question #{currentIndex + 1}
             </p>
             <h3 className="text-xl font-semibold">{currentCard.question}</h3>
             {currentCard.hint && (
               <p className="text-sm text-muted-foreground mt-2">
                 💡 Hint: {currentCard.hint}
               </p>
             )}
           </div>
 
           <div className="space-y-2">
             <Input
               ref={inputRef}
               value={userAnswer}
               onChange={(e) => setUserAnswer(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Type your answer and press Enter..."
               className="text-center text-lg"
               autoComplete="off"
               autoCorrect="off"
               autoCapitalize="off"
               spellCheck={false}
             />
             <div className="flex gap-2">
               <Button
                 onClick={checkAnswer}
                 className="flex-1"
                 disabled={!userAnswer.trim() || isCheckingAnswer}
               >
                 {isCheckingAnswer ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Checking...
                   </>
                 ) : (
                   "Submit"
                 )}
               </Button>
               <Button variant="outline" onClick={skipQuestion} disabled={isCheckingAnswer}>
                 Skip
               </Button>
             </div>
           </div>
 
           {aiFeedback && (
             <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
               <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5" />
               <span>{aiFeedback}</span>
             </div>
           )}
 
           <p className="text-xs text-center text-muted-foreground">
             Press <kbd className="px-1 bg-muted rounded">Enter</kbd> to submit,{" "}
             <kbd className="px-1 bg-muted rounded">Esc</kbd> to skip
           </p>
         </CardContent>
       </Card>
 
       {/* Stats Footer */}
       <div className="flex justify-center gap-4 text-sm text-muted-foreground">
         <span>{correctCount} correct</span>
         <span>•</span>
         <span>{totalAttempts} attempted</span>
         {totalAttempts > 0 && (
           <>
             <span>•</span>
             <span>{Math.round((correctCount / totalAttempts) * 100)}% accuracy</span>
           </>
         )}
       </div>
     </div>
   );
 }