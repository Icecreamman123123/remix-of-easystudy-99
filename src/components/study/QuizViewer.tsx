import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import type { QuizQuestion } from "@/lib/study-api";
import { useSmartLearning } from "@/hooks/useSmartLearning";
import { SmartLearningInsights } from "./SmartLearningInsights";

interface QuizViewerProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
  topic?: string;
}

export function QuizViewer({ questions, onComplete, topic }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const {
    wrongAnswers,
    insights,
    isAnalyzing,
    recordWrongAnswer,
    clearWrongAnswers,
    analyzeWeaknesses,
  } = useSmartLearning();

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    } else {
      // Record wrong answer for smart learning
      recordWrongAnswer({
        question: currentQuestion.question,
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
        userAnswer: currentQuestion.options[optionIndex],
        topic,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
      onComplete?.(score, questions.length);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCompleted(false);
    clearWrongAnswers();
  };

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
            </div>
            <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
            <p className="text-3xl font-bold text-primary mb-2">
              {score} / {questions.length}
            </p>
            <p className="text-muted-foreground mb-6">
              {percentage >= 80 
                ? "Excellent work! You've mastered this material." 
                : percentage >= 60 
                  ? "Good job! Review the missed questions."
                  : "Keep studying! Try again after reviewing."}
            </p>
          </div>

          {/* Smart Learning Insights */}
          <SmartLearningInsights
            insights={insights}
            wrongAnswers={wrongAnswers}
            isAnalyzing={isAnalyzing}
            onAnalyze={() => analyzeWeaknesses(topic)}
          />

          <Button onClick={handleReset} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            const isSelected = index === selectedAnswer;
            
            let variant: "default" | "outline" | "secondary" | "destructive" = "outline";
            if (showResult) {
              if (isCorrect) variant = "default";
              else if (isSelected) variant = "destructive";
            }

            return (
              <Button
                key={index}
                variant={variant}
                className={`w-full justify-start text-left h-auto py-3 px-4 ${
                  showResult && isCorrect ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                <span className="flex-1">{option}</span>
                {showResult && isCorrect && <CheckCircle2 className="h-5 w-5 ml-2" />}
                {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 ml-2" />}
              </Button>
            );
          })}

          {showResult && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showResult && (
        <Button className="w-full" onClick={handleNext}>
          {currentIndex < questions.length - 1 ? (
            <>
              Next Question
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            "See Results"
          )}
        </Button>
      )}
    </div>
  );
}
