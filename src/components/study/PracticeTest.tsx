import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
import { type SavedFlashcard } from "@/hooks/useFlashcardDecks";
import { 
  Check, 
  X, 
  ArrowRight, 
  Trophy, 
  RotateCcw,
  HelpCircle,
  Shuffle,
   ClipboardList,
   Loader2,
   Brain
} from "lucide-react";
 import { localAnswerCheck, checkAnswerWithAI } from "@/lib/answer-checker";

interface PracticeTestProps {
  flashcards: SavedFlashcard[];
  onComplete: (results: { correct: number; total: number }) => void;
}

 type QuestionType = "multiple-choice" | "fill-blank" | "true-false" | "short-answer" | "matching";

interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
   aiFeedback?: string;
   matchingPairs?: { left: string; right: string }[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateMultipleChoiceOptions(
  correctAnswer: string,
  allAnswers: string[]
): string[] {
  const wrongAnswers = allAnswers
    .filter((a) => a !== correctAnswer)
    .slice(0, 3);
  
  // If we don't have enough wrong answers, generate some variations
  while (wrongAnswers.length < 3) {
    wrongAnswers.push(`Option ${wrongAnswers.length + 2}`);
  }

  return shuffleArray([correctAnswer, ...wrongAnswers.slice(0, 3)]);
}

export function PracticeTest({ flashcards, onComplete }: PracticeTestProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [inputAnswer, setInputAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
   const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
   const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    generateTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcards.length]);

  const generateTest = () => {
    const allAnswers = flashcards.map((fc) => fc.answer);
     const questionTypes: QuestionType[] = ["multiple-choice", "fill-blank", "true-false", "short-answer"];

    const generatedQuestions: TestQuestion[] = shuffleArray(flashcards).map((fc, i) => {
       // Vary question types
       const type = questionTypes[i % questionTypes.length];

      if (type === "multiple-choice") {
        return {
          id: fc.id,
          type,
          question: fc.question,
          correctAnswer: fc.answer,
          options: generateMultipleChoiceOptions(fc.answer, allAnswers),
        };
      } else if (type === "fill-blank") {
        return {
          id: fc.id,
          type,
          question: `Complete: ${fc.question}`,
          correctAnswer: fc.answer,
        };
       } else if (type === "short-answer") {
         return {
           id: fc.id,
           type,
           question: fc.question,
           correctAnswer: fc.answer,
         };
      } else {
        // True/False - randomly make it true or false
        const isTrue = Math.random() > 0.5;
        const displayAnswer = isTrue ? fc.answer : allAnswers.find((a) => a !== fc.answer) || fc.answer;
        return {
          id: fc.id,
          type,
          question: `"${fc.question}" → "${displayAnswer}"`,
          correctAnswer: isTrue ? "True" : "False",
          options: ["True", "False"],
        };
      }
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setInputAnswer("");
    setShowResult(false);
    setTestComplete(false);
     setMatchingSelections({});
  };

  const currentQuestion = questions[currentIndex];

   const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    let userAnswer = "";
     if (currentQuestion.type === "fill-blank" || currentQuestion.type === "short-answer") {
      userAnswer = inputAnswer.trim();
    } else {
      userAnswer = selectedAnswer;
    }

     setIsCheckingAnswer(true);
     let isCorrect = false;
     let aiFeedback = "";
 
     if (currentQuestion.type === "fill-blank" || currentQuestion.type === "short-answer") {
       // Use AI checking for text answers
       const localResult = localAnswerCheck(userAnswer, currentQuestion.correctAnswer);
       
       if (localResult.isCorrect) {
         isCorrect = true;
         aiFeedback = "Correct!";
       } else {
         // Double-check with AI for potentially correct paraphrasing
         try {
           const aiResult = await checkAnswerWithAI(
             userAnswer,
             currentQuestion.correctAnswer,
             currentQuestion.question
           );
           isCorrect = aiResult.isCorrect;
           aiFeedback = aiResult.feedback;
         } catch {
           isCorrect = localResult.isCorrect;
           aiFeedback = localResult.isCorrect ? "Correct!" : "Not quite right.";
         }
       }
     } else {
       // Multiple choice and true/false are exact matches
       isCorrect = userAnswer === currentQuestion.correctAnswer;
       aiFeedback = isCorrect ? "Correct!" : "Incorrect";
     }

    setQuestions((prev) =>
      prev.map((q, i) =>
         i === currentIndex ? { ...q, userAnswer, isCorrect, aiFeedback } : q
      )
    );

     setIsCheckingAnswer(false);
    setShowResult(true);
  };

  const handleNext = () => {
    setSelectedAnswer("");
    setInputAnswer("");
    setShowResult(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setTestComplete(true);
      const correct = questions.filter((q) => q.isCorrect).length;
      onComplete({ correct, total: questions.length });
    }
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "multiple-choice":
        return "📝";
      case "fill-blank":
        return "✏️";
      case "true-false":
        return "⚖️";
       case "short-answer":
         return "💬";
       case "matching":
         return "🔗";
    }
  };

  const getQuestionTypeName = (type: QuestionType) => {
    switch (type) {
      case "multiple-choice":
        return "Multiple Choice";
      case "fill-blank":
        return "Fill in the Blank";
      case "true-false":
        return "True or False";
       case "short-answer":
         return "Short Answer";
       case "matching":
         return "Matching";
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 animate-in fade-in-50">
        <p className="text-muted-foreground">Generating test...</p>
      </div>
    );
  }

  if (testComplete) {
    const correct = questions.filter((q) => q.isCorrect).length;
    const accuracy = Math.round((correct / questions.length) * 100);

    return (
      <div className="space-y-6 animate-in fade-in-50 zoom-in-95">
        <div className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">Test Complete!</h3>
          <p className="text-3xl font-bold text-primary mb-2">{accuracy}%</p>
          <p className="text-muted-foreground">
            {correct} of {questions.length} correct
          </p>
        </div>

        {/* Results Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Question Breakdown</p>
           <div className="grid grid-cols-4 gap-2 text-center">
             {["multiple-choice", "fill-blank", "true-false", "short-answer"].map((type) => {
              const typeQuestions = questions.filter((q) => q.type === type);
               if (typeQuestions.length === 0) return null;
              const typeCorrect = typeQuestions.filter((q) => q.isCorrect).length;
              return (
                <div key={type} className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg">{getQuestionTypeIcon(type as QuestionType)}</p>
                  <p className="text-sm font-medium">
                    {typeCorrect}/{typeQuestions.length}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {questions.map((q, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg border text-sm ${
                q.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-start gap-2">
                {q.isCorrect ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{q.question}</p>
                  {!q.isCorrect && (
                    <p className="text-xs text-muted-foreground">
                      Correct: {q.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={generateTest} className="w-full">
          <Shuffle className="h-4 w-4 mr-2" />
          Generate New Test
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Badge variant="outline">
            {getQuestionTypeIcon(currentQuestion.type)} {getQuestionTypeName(currentQuestion.type)}
          </Badge>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      {/* Question */}
      <Card className="animate-in fade-in-50 slide-in-from-right-2 duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
         {(currentQuestion.type === "fill-blank" || currentQuestion.type === "short-answer") ? (
           currentQuestion.type === "short-answer" ? (
             <Textarea
               value={inputAnswer}
               onChange={(e) => setInputAnswer(e.target.value)}
               placeholder="Type your answer..."
               disabled={showResult || isCheckingAnswer}
               className="transition-all duration-200 min-h-[80px]"
             />
           ) : (
             <Input
               value={inputAnswer}
               onChange={(e) => setInputAnswer(e.target.value)}
               placeholder="Type your answer..."
               disabled={showResult || isCheckingAnswer}
               className="transition-all duration-200"
               onKeyDown={(e) => {
                 if (e.key === "Enter" && !showResult) handleSubmitAnswer();
               }}
             />
           )
         ) : (
           <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
             disabled={showResult || isCheckingAnswer}
              className="space-y-2"
            >
              {currentQuestion.options?.map((option, i) => (
                <div
                  key={i}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                    showResult
                      ? option === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-500/10"
                        : selectedAnswer === option && !currentQuestion.isCorrect
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                      : selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${i}`} />
                  <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  {showResult && option === currentQuestion.correctAnswer && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {showResult &&
                    selectedAnswer === option &&
                    option !== currentQuestion.correctAnswer && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Result Feedback */}
          {showResult && (
            <div
              className={`p-3 rounded-lg animate-in fade-in-50 zoom-in-95 duration-200 ${
                currentQuestion.isCorrect
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-destructive/10 border border-destructive/30"
              }`}
            >
              <p className="font-medium flex items-center gap-2">
                {currentQuestion.isCorrect ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" /> Correct!
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-destructive" /> Incorrect
                  </>
                )}
              </p>
             {currentQuestion.aiFeedback && (
               <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                 <Brain className="h-3 w-3" />
                 {currentQuestion.aiFeedback}
               </p>
             )}
              {!currentQuestion.isCorrect && (
                <p className="text-sm text-muted-foreground mt-1">
                  The correct answer is: <strong>{currentQuestion.correctAnswer}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={generateTest}
          className="transition-transform hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {!showResult ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={
             isCheckingAnswer ||
             ((currentQuestion.type === "fill-blank" || currentQuestion.type === "short-answer") && !inputAnswer.trim()) ||
             ((currentQuestion.type !== "fill-blank" && currentQuestion.type !== "short-answer") && !selectedAnswer)
            }
            className="transition-all duration-200 hover:scale-105"
          >
           {isCheckingAnswer ? (
             <>
               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               Checking...
             </>
           ) : (
             <>
               <ClipboardList className="h-4 w-4 mr-2" />
               Submit Answer
             </>
           )}
          </Button>
        ) : (
          <Button onClick={handleNext} className="transition-all duration-200 hover:scale-105">
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                See Results
                <Trophy className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
