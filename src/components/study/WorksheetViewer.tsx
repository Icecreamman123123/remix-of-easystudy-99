import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  Printer,
  Eye,
  EyeOff
} from "lucide-react";

export interface WorksheetQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "short-answer" | "matching";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

interface WorksheetViewerProps {
  questions: WorksheetQuestion[];
  title: string;
  onComplete?: (score: number, total: number) => void;
}

export function WorksheetViewer({ questions, title, onComplete }: WorksheetViewerProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let earned = 0;
    let total = 0;

    questions.forEach(q => {
      total += q.points;
      const userAnswer = answers[q.id];

      if (Array.isArray(q.correctAnswer)) {
        if (Array.isArray(userAnswer) &&
          q.correctAnswer.length === userAnswer.length &&
          q.correctAnswer.every(a => userAnswer.includes(a))) {
          earned += q.points;
        }
      } else {
        if (typeof userAnswer === "string" &&
          userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          earned += q.points;
        }
      }
    });

    return { earned, total };
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowAnswers(true);
    const { earned, total } = calculateScore();
    onComplete?.(earned, total);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setShowAnswers(false);
    setCurrentPage(0);
  };

  const { earned, total } = calculateScore();
  const percentage = Math.round((earned / total) * 100);
  const answeredCount = Object.keys(answers).length;

  const isCorrect = (question: WorksheetQuestion) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return false;

    if (Array.isArray(question.correctAnswer)) {
      return Array.isArray(userAnswer) &&
        question.correctAnswer.length === userAnswer.length &&
        question.correctAnswer.every(a => userAnswer.includes(a));
    }
    return typeof userAnswer === "string" &&
      userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  };

  const renderQuestion = (question: WorksheetQuestion, index: number) => {
    const globalIndex = currentPage * questionsPerPage + index + 1;
    const userAnswer = answers[question.id];
    const correct = isCorrect(question);

    return (
      <Card
        key={question.id}
        className={`transition-all duration-200 ${(submitted || showAnswers)
            ? correct
              ? "border-green-500/50 bg-green-500/5"
              : userAnswer
                ? "border-red-500/50 bg-red-500/5"
                : "border-yellow-500/50 bg-yellow-500/5"
            : ""
          }`}
      >
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="shrink-0 mt-0.5">
              {globalIndex}
            </Badge>
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{question.question}</p>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {question.points} pts
                </Badge>
              </div>

              {/* Multiple Choice */}
              {question.type === "multiple-choice" && question.options && (
                <RadioGroup
                  value={userAnswer as string || ""}
                  onValueChange={(v) => handleAnswer(question.id, v)}
                  disabled={submitted}
                >
                  {question.options.map((option, i) => (
                    <div key={i} className={`flex items-center space-x-2 p-2 rounded ${submitted && showAnswers
                      ? option === question.correctAnswer
                        ? "bg-green-500/20"
                        : userAnswer === option
                          ? "bg-red-500/20"
                          : ""
                      : ""
                      }`}>
                      <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                      <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                      {submitted && showAnswers && option === question.correctAnswer && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* True/False */}
              {question.type === "true-false" && (
                <RadioGroup
                  value={userAnswer as string || ""}
                  onValueChange={(v) => handleAnswer(question.id, v)}
                  disabled={submitted}
                  className="flex gap-4"
                >
                  {["True", "False"].map((option) => (
                    <div key={option} className={`flex items-center space-x-2 p-2 rounded ${submitted && showAnswers
                      ? option === question.correctAnswer
                        ? "bg-green-500/20"
                        : userAnswer === option
                          ? "bg-red-500/20"
                          : ""
                      : ""
                      }`}>
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Fill in the Blank */}
              {question.type === "fill-blank" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer..."
                    value={userAnswer as string || ""}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    disabled={submitted}
                    className={submitted && showAnswers
                      ? correct ? "border-green-500" : "border-red-500"
                      : ""
                    }
                  />
                  {submitted && showAnswers && !correct && (
                    <p className="text-sm text-green-600">
                      Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Short Answer */}
              {question.type === "short-answer" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your answer..."
                    value={userAnswer as string || ""}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    disabled={submitted}
                    className="min-h-[80px]"
                  />
                  {submitted && showAnswers && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-muted-foreground">Expected answer:</p>
                      <p>{question.correctAnswer}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Matching - simplified as multiple select */}
              {question.type === "matching" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, i) => {
                    const selected = Array.isArray(userAnswer) && userAnswer.includes(option);
                    const isCorrectOption = Array.isArray(question.correctAnswer) &&
                      question.correctAnswer.includes(option);

                    return (
                      <div key={i} className={`flex items-center space-x-2 p-2 rounded ${submitted && showAnswers
                        ? isCorrectOption
                          ? "bg-green-500/20"
                          : selected
                            ? "bg-red-500/20"
                            : ""
                        : ""
                        }`}>
                        <Checkbox
                          id={`${question.id}-${i}`}
                          checked={selected}
                          disabled={submitted}
                          onCheckedChange={(checked) => {
                            const current = Array.isArray(userAnswer) ? userAnswer : [];
                            if (checked) {
                              handleAnswer(question.id, [...current, option]);
                            } else {
                              handleAnswer(question.id, current.filter(a => a !== option));
                            }
                          }}
                        />
                        <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              {submitted && showAnswers && question.explanation && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm mt-2">
                  <p className="font-medium text-primary mb-1">Explanation:</p>
                  <p className="text-muted-foreground">{question.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswers(!showAnswers)}
                disabled={!submitted}
              >
                {showAnswers ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showAnswers ? "Hide" : "Show"} Answers
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <span>{questions.length} questions</span>
            <span>•</span>
            <span>{total} total points</span>
            <span>•</span>
            <span>{answeredCount}/{questions.length} answered</span>
            {submitted && (
              <>
                <span>•</span>
                <Badge variant={percentage >= 70 ? "default" : "destructive"}>
                  Score: {earned}/{total} ({percentage}%)
                </Badge>
              </>
            )}
          </div>
          <Progress value={(answeredCount / questions.length) * 100} className="mt-3" />
        </CardContent>
      </Card>

      {/* Results Card */}
      {submitted && (
        <Card className={percentage >= 70 ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Trophy className={`h-12 w-12 ${percentage >= 70 ? "text-green-500" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className="text-3xl font-bold">{percentage}%</p>
                <p className="text-muted-foreground">
                  {percentage >= 90 ? "Excellent!" :
                    percentage >= 70 ? "Good job!" :
                      percentage >= 50 ? "Keep practicing!" : "Review the material"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {currentQuestions.map((q, i) => renderQuestion(q, i))}
      </div>

      {/* Pagination & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {submitted ? (
            <Button onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowAnswers(prev => !prev)}
                disabled={answeredCount === 0}
              >
                {showAnswers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAnswers ? "Hide" : "Check"} Progress
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={answeredCount === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Submit Worksheet
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
