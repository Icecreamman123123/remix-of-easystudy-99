import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Play, X, Copy } from "lucide-react";

interface QuizEntry {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ManualQuizEditorProps {
  onSubmit: (action: "generate-quiz", result: string, topic: string) => void;
  onCancel: () => void;
}

function createEmptyQuestion(): QuizEntry {
  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  };
}

export function ManualQuizEditor({ onSubmit, onCancel }: ManualQuizEditorProps) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizEntry[]>([createEmptyQuestion(), createEmptyQuestion()]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const duplicateQuestion = (index: number) => {
    const q = questions[index];
    const newQ: QuizEntry = {
      ...q,
      id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      options: [...q.options],
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, newQ);
    setQuestions(updated);
  };

  const updateQuestion = (id: string, field: keyof QuizEntry, value: string | number | string[]) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || q.options.length >= 6) return q;
        return { ...q, options: [...q.options, ""] };
      })
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        const newCorrect = q.correctAnswer >= newOptions.length ? 0 : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      })
    );
  };

  const validQuestions = questions.filter(
    (q) =>
      q.question.trim() &&
      q.options.filter((o) => o.trim()).length >= 2 &&
      q.options[q.correctAnswer]?.trim()
  );

  const handleSubmit = () => {
    if (validQuestions.length < 1) return;

    const quizData = validQuestions.map((q) => {
      const trimmedOptions = q.options.map(o => o.trim()).filter(Boolean);
      const correctText = q.options[q.correctAnswer]?.trim();
      const newCorrect = correctText ? Math.max(0, trimmedOptions.findIndex(o => o === correctText)) : 0;
      return {
        question: q.question.trim(),
        options: trimmedOptions,
        correctAnswer: newCorrect >= 0 ? newCorrect : 0,
        explanation: q.explanation.trim() || "No explanation provided.",
      };
    });

    const result = JSON.stringify(quizData);
    onSubmit("generate-quiz", result, title.trim() || "Manual Quiz");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Create Quiz</CardTitle>
            <CardDescription>
              Build a multiple-choice quiz manually
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quiz-title">Title</Label>
          <Input
            id="quiz-title"
            placeholder="e.g., History Chapter 3 Quiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="p-3 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Question {qIndex + 1}</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => duplicateQuestion(qIndex)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => removeQuestion(q.id)}
                      disabled={questions.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Input
                  placeholder="Question text"
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Options (select the correct one)
                  </Label>
                  <RadioGroup
                    value={String(q.correctAnswer)}
                    onValueChange={(v) => updateQuestion(q.id, "correctAnswer", parseInt(v))}
                  >
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <RadioGroupItem value={String(oIndex)} id={`${q.id}-opt-${oIndex}`} />
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          value={option}
                          onChange={(e) => updateOption(q.id, oIndex, e.target.value)}
                          className="flex-1"
                        />
                        {q.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 hover:text-destructive"
                            onClick={() => removeOption(q.id, oIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  {q.options.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addOption(q.id)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>

                <Textarea
                  placeholder="Explanation (optional)"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                  className="min-h-[50px] text-sm"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button variant="outline" onClick={addQuestion} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {validQuestions.length} valid question{validQuestions.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={validQuestions.length < 1}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Start Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
