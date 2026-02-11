 import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, CheckCircle2, XCircle, Loader2, Brain, Lightbulb, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { checkAnswerWithAI } from "@/lib/answer-checker";

interface WhyHowQuestion {
  question: string;
  type: "why" | "how";
  hint: string;
  idealAnswer: string;
}

interface ElaborativeInterrogationProps {
  result: string;
  topic: string;
  onClose: () => void;
}

export function ElaborativeInterrogation({ result, topic, onClose }: ElaborativeInterrogationProps) {
  const [questions, setQuestions] = useState<WhyHowQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQuestions(parsed);
      }
    } catch (error) {
      console.error("Failed to parse questions:", error);
    }
  }, [result]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((answeredQuestions.size) / questions.length) * 100 : 0;

  const checkAnswer = async () => {

    if (!userAnswer.trim() || !currentQuestion) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      const data = await checkAnswerWithAI(
        userAnswer.trim(),
        currentQuestion.idealAnswer,
        currentQuestion.question
      );

      const isCorrect = data.isCorrect;
      setFeedback({
        correct: isCorrect,
        message: data.feedback || (isCorrect 
          ? "Great explanation! You demonstrated good understanding." 
          : `Good attempt! Here's a more complete answer: ${currentQuestion.idealAnswer}`),
      });

      if (isCorrect && !answeredQuestions.has(currentIndex)) {
        setScore((prev) => prev + 1);
      }
      setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    } catch (error) {
      console.error("Error checking answer:", error);
      // Fallback to basic check
      const words = userAnswer.toLowerCase().split(/\s+/);
      const keyWords = currentQuestion.idealAnswer.toLowerCase().split(/\s+/);
      const matchCount = keyWords.filter(kw => words.some(w => w.includes(kw) || kw.includes(w))).length;
      const isCorrect = matchCount >= keyWords.length * 0.3;
      
      setFeedback({
        correct: isCorrect,
        message: isCorrect 
          ? "Good effort! Your explanation shows understanding."
          : `Consider this perspective: ${currentQuestion.idealAnswer}`,
      });
      
      if (isCorrect && !answeredQuestions.has(currentIndex)) {
        setScore((prev) => prev + 1);
      }
      setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    } finally {
      setIsChecking(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setFeedback(null);
      setShowHint(false);
    } else {
      setCompleted(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setShowHint(false);
    setScore(0);
    setCompleted(false);
    setAnsweredQuestions(new Set());
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <CardDescription>
            You've practiced elaborative interrogation on {topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
            <p className="text-muted-foreground">
              {score} of {questions.length} questions answered well
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Why This Works
            </h4>
            <p className="text-sm text-muted-foreground">
              Elaborative interrogation strengthens memory by forcing you to connect new information 
              to what you already know. By answering "why" and "how" questions, you create deeper 
              neural pathways that make recall easier.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={restart} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Practice Again
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={currentQuestion.type === "why" ? "default" : "secondary"}>
            {currentQuestion.type === "why" ? "Why?" : "How?"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-lg mt-4 flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <span>{currentQuestion.question}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Explain your understanding..."
            rows={4}
            disabled={isChecking}
            className="resize-none"
          />
          
          {!showHint && !feedback && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHint(true)}
              className="text-muted-foreground"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Need a hint?
            </Button>
          )}
          
          {showHint && !feedback && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
              <span className="font-medium text-primary">Hint:</span> {currentQuestion.hint}
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={cn(
              "p-4 rounded-lg border",
              feedback.correct
                ? "bg-primary/10 border-primary/30"
                : "bg-secondary border-secondary"
            )}
          >
            <div className="flex items-start gap-2">
              {feedback.correct ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{feedback.message}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!feedback ? (
            <Button 
              onClick={checkAnswer} 
              disabled={!userAnswer.trim() || isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Answer"
              )}
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="flex-1">
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>Score: {score}/{answeredQuestions.size}</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}