import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X, Copy } from "lucide-react";

type QuestionType = "multiple-choice" | "true-false" | "fill-blank" | "short-answer";

interface WorksheetEntry {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

interface ManualWorksheetEditorProps {
  onSubmit: (action: "worksheet", result: string, topic: string) => void;
  onCancel: () => void;
}

function createEmptyQuestion(): WorksheetEntry {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "multiple-choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 1,
  };
}

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: string }[] = [
  { value: "multiple-choice", label: "Multiple Choice", icon: "📝" },
  { value: "true-false", label: "True / False", icon: "⚖️" },
  { value: "fill-blank", label: "Fill in the Blank", icon: "✏️" },
  { value: "short-answer", label: "Short Answer", icon: "💬" },
];

export function ManualWorksheetEditor({ onSubmit, onCancel }: ManualWorksheetEditorProps) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<WorksheetEntry[]>([createEmptyQuestion()]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const duplicateQuestion = (index: number) => {
    const q = questions[index];
    const newQ: WorksheetEntry = {
      ...q,
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      options: [...q.options],
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, newQ);
    setQuestions(updated);
  };

  const updateQuestion = (id: string, field: keyof WorksheetEntry, value: string | number | string[]) => {
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

  const changeType = (id: string, type: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          type,
          correctAnswer: type === "true-false" ? "True" : "",
          options: type === "multiple-choice" ? ["", "", "", ""] : [],
        };
      })
    );
  };

  const validQuestions = questions.filter((q) => {
    if (!q.question.trim() || !q.correctAnswer.trim()) return false;
    if (q.type === "multiple-choice" && q.options.filter((o) => o.trim()).length < 2) return false;
    return true;
  });

  const handleSubmit = () => {
    if (validQuestions.length < 1) return;

    const worksheetData = validQuestions.map((q, i) => ({
      id: `q-${i + 1}`,
      type: q.type,
      question: q.question.trim(),
      ...(q.type === "multiple-choice" ? { options: q.options.filter((o) => o.trim()) } : {}),
      ...(q.type === "true-false" ? { options: ["True", "False"] } : {}),
      correctAnswer: q.correctAnswer.trim(),
      explanation: q.explanation.trim() || "No explanation provided.",
      points: q.points,
    }));

    const result = JSON.stringify(worksheetData);
    onSubmit("worksheet", result, title.trim() || "Manual Worksheet");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Create Worksheet</CardTitle>
            <CardDescription>
              Build a worksheet with mixed question types
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ws-title">Title</Label>
          <Input
            id="ws-title"
            placeholder="e.g., Math Unit 4 Worksheet"
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{qIndex + 1}</Badge>
                    <Select
                      value={q.type}
                      onValueChange={(v) => changeType(q.id, v as QuestionType)}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(({ value, label, icon }) => (
                          <SelectItem key={value} value={value}>
                            <span className="flex items-center gap-1">
                              <span>{icon}</span> {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, "points", parseInt(e.target.value) || 1)}
                        className="w-14 h-7 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
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

                {/* Multiple Choice Options */}
                {q.type === "multiple-choice" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Options</Label>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Badge
                          variant={q.correctAnswer === opt && opt.trim() ? "default" : "outline"}
                          className="cursor-pointer shrink-0"
                          onClick={() => opt.trim() && updateQuestion(q.id, "correctAnswer", opt)}
                        >
                          {String.fromCharCode(65 + oIndex)}
                        </Badge>
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          value={opt}
                          onChange={(e) => {
                            // If this was the correct answer, update it
                            if (q.correctAnswer === opt) {
                              updateQuestion(q.id, "correctAnswer", e.target.value);
                            }
                            updateOption(q.id, oIndex, e.target.value);
                          }}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Click a letter badge to mark the correct answer
                    </p>
                  </div>
                )}

                {/* True/False */}
                {q.type === "true-false" && (
                  <div className="flex gap-2">
                    <Button
                      variant={q.correctAnswer === "True" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateQuestion(q.id, "correctAnswer", "True")}
                    >
                      True
                    </Button>
                    <Button
                      variant={q.correctAnswer === "False" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateQuestion(q.id, "correctAnswer", "False")}
                    >
                      False
                    </Button>
                  </div>
                )}

                {/* Fill in the Blank / Short Answer */}
                {(q.type === "fill-blank" || q.type === "short-answer") && (
                  <Input
                    placeholder="Correct answer"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(q.id, "correctAnswer", e.target.value)}
                    className="text-sm"
                  />
                )}

                <Textarea
                  placeholder="Explanation (optional)"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                  className="min-h-[40px] text-sm"
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
            Start Worksheet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
